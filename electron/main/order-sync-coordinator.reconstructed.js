/**
 * ============================================================
 *  OrderSyncCoordinator — 订单同步协调器（语义化重建版）
 * ============================================================
 *  从扣单宝主进程逆向还原，重写为带语义命名、可独立运行的模块。
 *  逻辑与原版完全一致（保留全部并发/延迟语义）。
 *
 *  职责：
 *    协调「手动同步」与「自动同步」两类订单同步任务的并发，
 *    保证同一时刻最多只有一种同步在执行，避免重复抓取/覆盖。
 *      - 手动同步（用户在设置页点"同步订单"）优先执行；
 *      - 自动补拉（定时/进入直播间后的历史订单补单）若在手动
 *        同步进行中触发，则延迟到手动同步结束后再补跑；
 *      - 手动同步进行中再次触发手动 → 排队等待上一轮完成。
 *
 *  原版上下文：
 *     原版字段均为压缩短名实字段（currentKind / currentPromise /
 *     pendingAutoCatchup / waitingManualCount / autoCatchupTask），
 *    本版原样保留语义并补中文注释。
 *
 *  运行方式：纯逻辑、无 Node 依赖，可被任意调用方实例化：
 *    const coordinator = new OrderSyncCoordinator();
 *    await coordinator.runManual(async () => task);
 *    coordinator.runAuto(async () => task);  // 返回 'executed' | 'deferred' | 'skipped'
 * ============================================================
 */

/**
 * 订单同步任务协调器。
 *
 * 并发模型：
 *  - 用 currentKind 记录当前正在执行的任务类型（'manual' | 'auto' |
 *    null）；
 *  - 用 currentPromise 记录当前执行中任务的后台 Promise，任何新任务
 *    必须先等待它结束，避免并发；
 *  - 手动同步是"用户主动操作"，永远优先；自动同步只是"后台补拉"，
 *    可被手动同步打断并延迟。
 */
class OrderSyncCoordinator {
  /** 当前正在执行的任务类型：'manual' | 'auto' | null */
  currentKind = null;

  /** 当前执行中任务的后台 Promise（用于让新任务串行等待） */
  currentPromise = null;

  /** 是否有自动补拉任务因手动同步进行中而被挂起待补跑 */
  pendingAutoCatchup = false;

  /** 正在排队等待执行的手动同步次数 */
  waitingManualCount = 0;

  /** 挂起的自动补拉任务本身（可执行函数） */
  autoCatchupTask = null;

  /**
   * 运行一次手动同步。
   * 手动同步之间串行：如果已有同步（无论手动或自动）在进行，
   * 则等待其完成后再执行本次手动同步。
   * @param {() => Promise<*>} task 手动同步主体
   * @returns {Promise<*>} task 的返回值
   */
  async runManual(task) {
    this.waitingManualCount += 1;
    try {
      // 串行屏障：等待当前正在执行的任何同步结束（吞掉其错误，只等完成）
      // 注意：手动同步之间不应该相互打断，所以即使已有手动在跑也要等。
      while (this.currentPromise) {
        await this.currentPromise.catch(() => {});
      }
      let result;
      this.waitingManualCount = Math.max(0, this.waitingManualCount - 1);
      await this.execute('manual', async () => {
        result = await task();
      });
      return result;
    } catch (err) {
      // 异常也要把排队计数降回去，避免累计成阻塞
      this.waitingManualCount = Math.max(0, this.waitingManualCount - 1);
      throw err;
    }
  }

  /**
   * 触发一次自动补拉同步。
   * @param {() => Promise<*>} task 自动补拉主体
   * @returns {Promise<'executed'|'deferred'|'skipped'>}
   *   - 'executed'：立即执行了本次补拉
   *   - 'deferred'：当前正有手动同步在执行，本次补拉记为待补跑，
   *     等手动完成后自动补跑
   *   - 'skipped'：已经有一次自动补拉在执行，本次直接忽略
   */
  async runAuto(task) {
    this.autoCatchupTask = task;
    if (this.currentKind === 'manual') {
      // 手动同步进行中：把本次补拉挂起，标记待补跑，稍后手动完成后补跑
      this.pendingAutoCatchup = true;
      return 'deferred';
    }
    if (this.currentKind === 'auto') {
      // 已有自动补拉在执行：本次忽略（不排队多份）
      return 'skipped';
    }
    // 空闲：立即执行
    await this.execute('auto', task);
    return 'executed';
  }

  /**
   * 清除挂起的自动补拉任务与标记（通常在手动同步完成/失败后被调用）。
   */
  clearAutoCatchupTask() {
    this.pendingAutoCatchup = false;
    this.autoCatchupTask = null;
  }

  /**
   * 真正执行一个任务并登记后台 Promise。
   * 执行完成后清空执行状态；若刚跑完的是手动同步，则在微任务里
   * 检查是否有待补跑的自动补拉，有则补跑。
   * @param {'manual'|'auto'} kind 任务类型
   * @param {() => Promise<*>} task 要执行的任务
   * @returns {Promise<*>} task 的结果 Promise
   * @private
   */
  async execute(kind, task) {
    this.currentKind = kind;
    const execution = (async () => {
      try {
        return await task();
      } finally {
        this.currentKind = null;
        this.currentPromise = null;
        // 手动同步结束后，若期间挂起了自动补拉，则在当前调用栈 unwind
        // 之后（微任务）再补跑，避免在任务自身的 finally 里递归执行
        if (kind === 'manual') {
          queueMicrotask(() => {
            this.flushPendingAutoCatchup();
          });
        }
      }
    })();

    // currentPromise 是一个"吞掉结果"的后台句柄，供后续 runManual
    // 用 await 等待串行；实际可等待/捕获用 execution 本体。
    this.currentPromise = execution.then(() => {}, () => {});
    return execution;
  }

  /**
   * 检查并补跑挂起的自动补拉任务。
   * 只有在挂起标记存在、有补拉任务、且没有手动同步在排队时，才真正补跑。
   * @private
   */
  async flushPendingAutoCatchup() {
    if (this.pendingAutoCatchup && this.autoCatchupTask) {
      if (this.waitingManualCount > 0) {
        // 还有手动同步在排队，不补跑，留给下一轮
        return;
      }
      this.pendingAutoCatchup = false;
      await this.execute('auto', this.autoCatchupTask);
    }
  }
}

module.exports = { OrderSyncCoordinator };
