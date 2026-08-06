/**
 * ============================================================
 *  DanmakuDispatcher — 弹幕调度器（语义化重建版）
 * ============================================================
 *  从扣单宝主进程逆向还原，重写为带语义命名、可独立运行的模块。
 *  逻辑与原版完全一致（保留全部行为：匹配/去重/批次/限购/福袋）。
 *
 *  原版依赖：
 *    - config.baseUrl        → 后端地址（默认 http://127.0.0.1:8787）
 *    - config.batchInterval  → 批次提交间隔 ms
 *    - buildDeviceHeaders()  → 组装 X-Koudanbao-* 设备头
 *  本版通过构造参数注入，默认值可直接跑 mock 后端。
 *
 *  事件（EventEmitter）：
 *    "display"             → 实时弹幕列表（数组）
 *    "resolved"            → 匹配结果更新（normalizeResolvedItems 后）
 *    "printResults"        → 打印数据（含 product_relation.price）
 *    "luckyBagBatchReset"  → 福袋批次重置
 * ============================================================
 */

const { EventEmitter } = require('events');

/** 生成 4 位随机串，用于批次号 */
function random4() {
  return Math.floor(1000 + 9000 * Math.random());
}

/** 转义正则特殊字符 */
function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class DanmakuDispatcher extends EventEmitter {
  // ---------- 状态字段 ----------
  displayFilter = { hiddenTypes: [] };   // 过滤类型（隐藏礼物/关注等）
  deductionRules = [];                   // 扣数规则列表（主进程匹配用）
  blacklist = [];                        // 黑名单昵称
  matchedBuffer = [];                    // 已匹配（待提交/已提交）缓冲
  processBuffer = [];                    // 待提交到后端的缓冲
  delayedMatchedBuffer = [];             // 延迟匹配（亮牌优先未到时间）
  batchTimer = null;                     // 批次定时器
  quickPassTimer = null;                 // 快速过单定时器
  displayTimer = null;                   // 展示冲刷定时器（200ms）
  recentMatchedSignatures = new Map();   // 防重复签名 -> 过期时间戳
  gridMatchedByBatch = new Map();        // 批次|昵称 -> 已匹配格子 Set
  gridMatchedCountInBatch = new Map();   // 批次|格子 -> 匹配次数
  gridAutoAssignedByBatch = new Map();   // 自动入格：批次 -> (数字->格子号)
  matchedCountInBatch = 0;               // 本批已匹配数（限购用）
  displayBuffer = [];                    // 展示缓冲（200ms 冲刷一次）
  currentIndex = 0;                      // 当前序号（打印序号）
  batchNo = '';                          // 当前批次号
  luckyBagBatchNo = '';                  // 当前福袋批次号
  messageCountInLastSecond = 0;          // 速率统计：上一秒消息数
  lastRateCheckTime = Date.now();        // 速率统计：上次检查时间
  currentRate = 0;                       // 速率统计：当前速率（条/秒）
  shopId = '';
  shopName = '';
  apiToken = '';
  platformCode = 'unknown';
  electronDeviceHeaders = {};
  running = false;
  paused = false;

  /**
   * @param {object} cfg  会话配置
   * @param {string} cfg.shopId
   * @param {string} [cfg.shopName]
   * @param {string} [cfg.apiToken]
   * @param {string} [cfg.platformCode]
   * @param {object} [cfg.device]  设备信息（deviceId/deviceName/appVersion/...）
   * @param {object} [options]     运行配置（baseUrl/batchInterval/buildDeviceHeaders）
   */
  constructor(cfg, options = {}) {
    super();
    this.config = {
      baseUrl: options.baseUrl || 'http://127.0.0.1:8787',
      batchInterval: options.batchInterval || 3000,
    };
    this.buildDeviceHeaders =
      typeof options.buildDeviceHeaders === 'function'
        ? options.buildDeviceHeaders
        : (h) => ({ 'X-Koudanbao-Device-Id': h.deviceId, 'X-Koudanbao-Device-Name': h.deviceName });

    this.shopId = cfg.shopId;
    this.shopName = cfg.shopName || '';
    this.apiToken = cfg.apiToken || '';
    this.platformCode = cfg.platformCode || 'unknown';
    this.electronDeviceHeaders = {
      deviceId: cfg.device?.deviceId,
      deviceName: cfg.device?.deviceName,
      appVersion: cfg.device?.appVersion,
      clientPlatform: cfg.device?.clientPlatform,
      runtimeSessionId: cfg.device?.runtimeSessionId,
      liveShopId: cfg.device?.liveShopId ?? cfg.shopId,
    };
    this.batchNo = this.generateBatchNo();
    this.luckyBagBatchNo = this.generateBatchNo();
  }

  // ------------------------------------------------------------------
  // 日志 / 配置
  // ------------------------------------------------------------------

  /** 日志输出（带平台+店铺前缀） */
  log(tag, data) {
    const prefix = `[danmaku-dispatcher:${this.platformCode}:${this.shopId}] ${tag}`;
    data ? console.log(prefix, data) : console.log(prefix);
  }

  /** 加载扣数规则配置：GET /api/electron/live-config?shop_id=X */
  async loadConfig() {
    const url = `${this.config.baseUrl}/api/electron/live-config?shop_id=${this.shopId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        Accept: 'application/json',
        ...this.buildDeviceHeaders(this.electronDeviceHeaders),
      },
    });
    if (!response.ok) throw new Error(`loadConfig failed: ${response.status}`);
    const data = await response.json();

    this.displayFilter = data.displayFilter || { hiddenTypes: [] };
    this.deductionRules = (data.deductionRules || []).map((raw) => {
      // 兼容后端 snake_case 字段
      const rule = {
        ...raw,
        gridCount: raw.gridCount ?? raw.grid_count,
        gridFormats: raw.gridFormats ?? raw.grid_formats,
        gridKeywords: raw.gridKeywords ?? raw.grid_keywords,
        gridAutoAssign: raw.gridAutoAssign ?? raw.grid_auto_assign ?? false,
        gridDedupMode: raw.gridDedupMode ?? raw.grid_dedup_mode,
        enableLuckyBagQuickPass: raw.enableLuckyBagQuickPass ?? raw.enable_lucky_bag_quick_pass,
        luckyBagEnabled: raw.luckyBagEnabled ?? raw.lucky_bag_enabled,
        luckyBagEffectiveCount: raw.luckyBagEffectiveCount ?? raw.lucky_bag_effective_count,
      };
      // 预编译正则（numberWithSize / numberWithKeyword 用）
      try {
        if (raw.rule_type === 'numberWithSize' && raw.size_rules?.length) {
          const pattern = [...raw.size_rules]
            .sort((a, b) => b.length - a.length)
            .map((s) => escapeRegExp(s))
            .join('|');
          rule.dt = new RegExp(`^\\d+(${pattern})$`, 'i');
        } else if (raw.rule_type === 'numberWithKeyword' && raw.keywords?.[1]) {
          const keyword = escapeRegExp(raw.keywords[1]);
          rule.dt = new RegExp(`^\\d+${keyword}\\d*$`, 'i');
        }
      } catch (error) {
        this.log('error:regex-compilation-failed', { rule_id: raw.id, error: String(error) });
      }
      return rule;
    });
    this.blacklist = data.blacklist || [];
    if (data.shopInfo?.name) this.shopName = data.shopInfo.name;
    this.log('config:loaded', {
      rules: this.deductionRules.length,
      blacklist: this.blacklist.length,
      shopName: this.shopName,
    });
  }

  /** 热重载规则（直播中改规则时调用） */
  async reloadConfig() {
    await this.loadConfig();
    if (this.running) this.restartQuickPassTimer();
    this.log('config:reloaded');
  }

  // ------------------------------------------------------------------
  // 生命周期
  // ------------------------------------------------------------------

  /** 启动：开启批次/快速过单/展示定时器 */
  start() {
    if (this.running) return;
    this.running = true;
    this.startBatchTimer();
    this.startQuickPassTimer();
    this.startDisplayTimer();
    this.log('session:started');
  }

  /** 停止：关闭所有定时器，冲刷缓冲 */
  stop() {
    this.running = false;
    this.paused = false;
    if (this.batchTimer) { clearInterval(this.batchTimer); this.batchTimer = null; }
    if (this.quickPassTimer) { clearInterval(this.quickPassTimer); this.quickPassTimer = null; }
    if (this.displayTimer) { clearInterval(this.displayTimer); this.displayTimer = null; }
    this.delayedMatchedBuffer = [];
    this.flushMatchedBuffer().catch(console.error);
    this.flushDisplayBuffer();
    this.log('session:stopped');
  }

  /** 暂停/恢复 */
  setPaused(paused) {
    this.paused = paused;
    this.log(paused ? 'session:paused' : 'session:resumed');
  }

  // ------------------------------------------------------------------
  // 弹幕入口
  // ------------------------------------------------------------------

  /**
   * 【核心】处理单条弹幕
   * 流程：速率限制 → 预匹配 → 状态评估 → 构建展示项 → 入缓冲
   */
  handleDanmaku(danmaku) {
    if (!this.running) return;
    if (this.paused) return;

    // ---- 速率限制：消息速率过高时按概率丢弃非聊天消息 ----
    const now = Date.now();
    if (now - this.lastRateCheckTime > 1000) {
      this.currentRate = this.messageCountInLastSecond;
      this.messageCountInLastSecond = 0;
      this.lastRateCheckTime = now;
    }
    this.messageCountInLastSecond++;
    if (this.currentRate > 100 && danmaku.type !== 'chat') {
      const dropProbability = Math.min(0.9, (this.currentRate - 100) / 400);
      if (Math.random() < dropProbability) return;
    }

    const match = this.preMatchRules(danmaku);
    const primaryRule = this.getPrimaryRule();
    const evaluation = match.matched
      ? this.evaluateMatchedMessage(danmaku, primaryRule, match)
      : { status: 'processed', releaseAt: null };
    const visible = !this.displayFilter.hiddenTypes.includes(danmaku.type);
    if (!visible && !match.matched) return;

    const nextIndex = () => { this.currentIndex += 1; return this.currentIndex; };
    const displayItem = {
      commentId: danmaku.commentId,
      index: null,
      nickname: danmaku.nickname,
      content: danmaku.content,
      matchedContent: match.matchedContent,
      gridNo: match.gridNo ?? null,
      batchNo: this.batchNo,
      luckyBagBatchNo: this.luckyBagBatchNo,
      commentTime: danmaku.timestamp,
      status: match.matched && evaluation.status !== 'processed' ? 'pending' : 'processed',
      shopName: this.shopName,
      messageType: danmaku.type,
      uid: danmaku.uid,
      black: this.blacklist.includes(danmaku.nickname),
      badges: danmaku.badges,
    };

    if (visible) {
      this.displayBuffer.push(displayItem);
      if (this.displayBuffer.length >= 100) this.flushDisplayBuffer();
    }

    // 匹配成功且状态为 matched → 进入匹配缓冲（待提交 + 打印）
    if (match.matched && evaluation.status === 'matched') {
      const displayIndex = nextIndex();
      const entry = {
        ...danmaku,
        preMatch: match,
        displayIndex,
        assignedBatchNo: this.batchNo,
        assignedLuckyBagBatchNo: this.luckyBagBatchNo,
      };
      this.matchedBuffer.push(entry);
      this.processBuffer.push(entry);
    }

    // 聊天消息未匹配（processed）→ 也提交给后端（用于跑单提醒等）
    if (danmaku.type === 'chat' && evaluation.status === 'processed') {
      this.processBuffer.push({
        ...danmaku,
        preMatch: match,
        displayIndex: null,
        assignedBatchNo: this.batchNo,
        assignedLuckyBagBatchNo: this.luckyBagBatchNo,
      });
    }

    // 延迟匹配（亮牌优先，未到释放时间）→ 入延迟缓冲
    if (match.matched && evaluation.status === 'delayed' && evaluation.releaseAt) {
      this.delayedMatchedBuffer.push({
        ...danmaku,
        preMatch: match,
        displayIndex: null,
        assignedBatchNo: this.batchNo,
        assignedLuckyBagBatchNo: this.luckyBagBatchNo,
        releaseAt: evaluation.releaseAt,
      });
    }
  }

  // ------------------------------------------------------------------
  // 规则匹配
  // ------------------------------------------------------------------

  /** 遍历所有扣数规则，返回第一条命中的匹配结果 */
  preMatchRules(danmaku) {
    if (danmaku.type !== 'chat') {
      return { matched: false, matchedContent: null, ruleId: null, ruleType: null, gridNo: null };
    }
    const content = danmaku.content;
    for (const rule of this.deductionRules) {
      const result = this.matchSingleRule(rule, content);
      if (result) {
        return {
          matched: true,
          matchedContent: result.value,
          ruleId: rule.id,
          ruleType: rule.rule_type,
          gridNo: result.gridNo ?? null,
        };
      }
    }
    return { matched: false, matchedContent: null, ruleId: null, ruleType: null, gridNo: null };
  }

  /** 【核心】单规则匹配：11 种规则类型 */
  matchSingleRule(rule, content) {
    const text = content.trim();
    switch (rule.rule_type) {
      case 'anyNumber':           // 含任意数字即匹配（如 "abc12"）
        return text.match(/\d+/) ? { value: text } : null;
      case 'onlyPureNumber':      // 纯数字
        return /^\d+$/.test(text) ? { value: text } : null;
      case 'only12':              // 正好是 1 或 2
        return text === '1' || text === '2' ? { value: text } : null;
      case 'exclude12':           // 纯数字且不是 1/2
        return /^\d+$/.test(text) && text !== '1' && text !== '2' ? { value: text } : null;
      case 'letter3Digit1': {     // 3 字母 + 1 数字，共 4 位
        const letters = text.match(/[A-Za-z]/g) || [];
        const digits = text.match(/\d/g) || [];
        return text.length === 4 && /^[A-Za-z\d]+$/.test(text) && letters.length === 3 && digits.length === 1
          ? { value: text } : null;
      }
      case 'numberWithSize':      // 数字 + 尺码（预编译 dt 正则）
      case 'numberWithKeyword':   // 数字 + 关键词（预编译 dt 正则）
        return rule.dt && rule.dt.test(text) ? { value: text } : null;
      case 'onlyKeyword': {       // 弹幕正好等于关键词[0]
        const keyword = rule.keywords?.[0];
        return keyword && text === keyword ? { value: text } : null;
      }
      case 'numberIncludeKeyword': { // 弹幕含关键词[2] 且含数字
        const keyword = rule.keywords?.[2];
        if (!keyword) return null;
        const containsKeyword = text.toLowerCase().includes(keyword.toLowerCase());
        const containsDigit = /\d/.test(text);
        return containsKeyword && containsDigit ? { value: text } : null;
      }
      case 'customCombined':      // 自定义组合规则
        return this.matchCustomCombinedRule(rule, text);
      case 'grid':                // 宫格规则
        return this.matchGridRule(rule, text);
      default:
        return null;
    }
  }

  /** 拆分关键词（支持中文逗号） */
  splitRuleKeywords(raw = '') {
    return raw
      .replace(/，/g, ',')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /** 规范化格式列表并去重 */
  normalizeRuleFormats(formats, fallback) {
    return formats && formats.length > 0 ? [...new Set(formats)] : fallback;
  }

  /**
   * 【核心】格式级匹配：提取数字串（可含小数）+ 返回 { value, number }
   * numberIncludeDecimal=true 时允许小数，否则弹幕含小数直接不匹配
   */
  matchFormatRule(rule, content, format, keywords = '') {
    const numberPattern = rule.numberIncludeDecimal ? '\\d+(?:\\.\\d+)?' : '\\d+';
    if (!rule.numberIncludeDecimal && /\d+\.\d+/.test(content)) return null;
    switch (format) {
      case 'onlyKeyword':
        return this.splitRuleKeywords(keywords).some((kw) => content === kw)
          ? { value: content, number: '0' } : null;
      case 'exclude12':
        return /^\d+$/.test(content) && content !== '1' && content !== '2'
          ? { value: content, number: content } : null;
      case 'pureNumber': {        // 纯数字
        const m = content.match(new RegExp(`^(${numberPattern})$`));
        return m ? { value: content, number: m[1] } : null;
      }
      case 'numberWithSymbol': {  // 数字 + 符号（如 42¥）
        const m = content.match(new RegExp(`^(${numberPattern})\\s*[^\\p{L}\\p{N}\\s]+$`, 'u'));
        return m ? { value: content, number: m[1] } : null;
      }
      case 'letter3Digit1': {     // 3 字母 1 数字
        const letters = content.match(/[A-Za-z]/g) || [];
        const digits = content.match(/\d/g) || [];
        return content.length === 4 && /^[A-Za-z\d]+$/.test(content) && letters.length === 3 && digits.length === 1
          ? { value: content, number: digits[0] } : null;
      }
      case 'includeNumber': {     // 含数字（取第一个数字串）
        const m = content.match(new RegExp(`(${numberPattern})`));
        return m ? { value: m[1], number: m[1] } : null;
      }
      case 'fourDigit': {         // 4 位数字
        const m = content.match(/^(\d{4})$/);
        return m ? { value: content, number: m[1] } : null;
      }
      case 'numberWithSize': {    // 数字 + 尺码
        const sizes = rule.sizeRules || rule.size_rules || [];
        if (!sizes.length) return null;
        const pattern = [...sizes]
          .sort((a, b) => b.length - a.length)
          .map((s) => escapeRegExp(s))
          .join('|');
        const m = content.match(new RegExp(`^(${numberPattern})\\s*(${pattern})$`, 'i'));
        return m ? { value: content, number: m[1] } : null;
      }
      case 'numberWithKeyword':   // 数字 + 关键词：^数字关键词数字?$
        for (const keyword of this.splitRuleKeywords(keywords)) {
          const escaped = escapeRegExp(keyword);
          const m = content.match(new RegExp(`^(${numberPattern})${escaped}(${numberPattern})?$`, 'iu'));
          if (m) return { value: content, number: `${m[1]}${m[2] || ''}` };
        }
        return null;
      case 'numberIncludeKeyword': // 含数字且含关键词
        for (const keyword of this.splitRuleKeywords(keywords)) {
          const m = content.match(new RegExp(`(${numberPattern})`));
          if (m && content.toLowerCase().includes(keyword.toLowerCase())) {
            return { value: content, number: m[1] };
          }
        }
        return null;
      default:
        return null;
    }
  }

  /** 自定义数字范围/指定值校验 */
  numberPassesCustomCondition(rule, numberString) {
    if (numberString === undefined || numberString === '') return false;
    const value = Number(numberString);
    if (rule.numberMode === 'range') {
      const minOk = rule.numberMin === undefined || value >= Number(rule.numberMin);
      const maxOk = rule.numberMax === undefined || value <= Number(rule.numberMax);
      return minOk && maxOk;
    }
    const specified = this.splitRuleKeywords(rule.numberSpecified || '');
    return specified.length === 0 || specified.includes(numberString);
  }

  /** 自定义组合规则：遍历 customFormats 匹配 */
  matchCustomCombinedRule(rule, content) {
    const formats = this.normalizeRuleFormats(rule.customFormats, ['includeNumber']);
    for (const format of formats) {
      const result = this.matchFormatRule(rule, content, format, rule.customKeywords || '');
      if (result && (format === 'onlyKeyword' || this.numberPassesCustomCondition(rule, result.number))) {
        return { value: result.value };
      }
    }
    return null;
  }

  /** 【核心】宫格匹配：提取数字，校验 1~gridCount 范围或自动入格 */
  matchGridRule(rule, content) {
    const formats = this.normalizeRuleFormats(rule.gridFormats, ['pureNumber']);
    const gridCount = Number(rule.gridCount || 12);
    for (const format of formats) {
      const result = this.matchFormatRule(
        { ...rule, numberIncludeDecimal: false },  // 宫格强制不含小数
        content,
        format,
        rule.gridKeywords || ''
      );
      if (!result?.number || !/^\d+$/.test(result.number)) continue;
      if (rule.gridAutoAssign) {
        // 自动入格：按首次出现顺序分配
        const assigned = this.resolveAutoAssignedGridNo(result.number, gridCount);
        return assigned ? { value: result.value, gridNo: assigned } : null;
      }
      const number = Number(result.number);
      if (number >= 1 && number <= gridCount) {
        return { value: String(number), gridNo: number };
      }
    }
    return null;
  }

  /** 自动入格：本批内按数字首次出现分配格子号（上限 50） */
  resolveAutoAssignedGridNo(numberString, gridCount) {
    const maxGrids = Math.max(1, Math.min(50, Math.floor(Number(gridCount) || 12)));
    const batchMap = this.gridAutoAssignedByBatch.get(this.batchNo) || new Map();
    const existing = batchMap.get(numberString);
    if (existing) return existing;
    if (batchMap.size >= maxGrids) return null;
    const assigned = batchMap.size + 1;
    batchMap.set(numberString, assigned);
    this.gridAutoAssignedByBatch.set(this.batchNo, batchMap);
    return assigned;
  }

  // ------------------------------------------------------------------
  // 定时器
  // ------------------------------------------------------------------

  /** 批次定时器：到点释放延迟匹配并提交 */
  startBatchTimer() {
    this.batchTimer = setInterval(() => {
      this.releaseDelayedMatches();
      this.flushMatchedBuffer().catch(console.error);
    }, this.config.batchInterval);
  }

  /** 展示定时器：每 200ms 冲刷展示缓冲 */
  startDisplayTimer() {
    this.displayTimer = setInterval(() => {
      this.flushDisplayBuffer();
    }, 200);
  }

  /** 冲刷展示缓冲，emit("display") */
  flushDisplayBuffer() {
    if (this.displayBuffer.length === 0) return;
    const items = this.displayBuffer.splice(0);
    this.emit('display', items);
  }

  /** 快速过单定时器：按主规则 quick_pass_seconds 定期重置批次 */
  startQuickPassTimer() {
    const rule = this.getPrimaryRule();
    if (!rule?.quick_pass_enabled || !rule.quick_pass_seconds || rule.quick_pass_seconds <= 0) return;
    this.quickPassTimer = setInterval(() => {
      this.resetBatch();
    }, 1000 * rule.quick_pass_seconds);
  }

  /** 重启快速过单定时器 */
  restartQuickPassTimer() {
    if (this.quickPassTimer) { clearInterval(this.quickPassTimer); this.quickPassTimer = null; }
    this.startQuickPassTimer();
  }

  // ------------------------------------------------------------------
  // 批次提交
  // ------------------------------------------------------------------

  /**
   * 【核心】批次提交：POST /api/electron/danmaku/process
   * 响应 outcomes → emit("resolved")；printItems → emit("printResults")
   */
  async flushMatchedBuffer() {
    if (this.processBuffer.length === 0 && this.matchedBuffer.length === 0) return;
    const batch = this.processBuffer.length > 0
      ? this.processBuffer.splice(0)
      : this.matchedBuffer.splice(0);
    if (this.processBuffer.length === 0) this.matchedBuffer = [];

    try {
      const response = await fetch(`${this.config.baseUrl}/api/electron/danmaku/process`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...this.buildDeviceHeaders(this.electronDeviceHeaders),
        },
        body: JSON.stringify({
          shop_id: this.shopId,
          messages: batch.map((m) => ({
            comment_id: m.commentId,
            uid: m.uid,
            nickname: m.nickname,
            content: m.content,
            timestamp: m.timestamp,
            batch_no: m.assignedBatchNo,
            lucky_bag_batch_no: m.assignedLuckyBagBatchNo,
            num_index: m.displayIndex,
            grid_no: m.preMatch.gridNo ?? null,
            is_light_brand: this.isLightBrand(m),
            badges: m.badges ?? {},
          })),
        }),
      });
      if (!response.ok) {
        const bodyText = await this.readErrorResponseBody(response);
        console.error(
          bodyText
            ? `[Dispatcher] Process API error: ${response.status} body=${bodyText}`
            : `[Dispatcher] Process API error: ${response.status}`
        );
        return;
      }
      const result = await response.json();
      const resolved = this.normalizeResolvedItems(result?.outcomes);
      this.resetBatchWhenLuckyBagEffectiveCountReached(resolved);
      if (resolved.length > 0) this.emit('resolved', resolved);
      if (Array.isArray(result?.printItems) && result.printItems.length > 0) {
        this.emit('printResults', result.printItems);
      }
    } catch (error) {
      console.error('[Dispatcher] flushMatchedBuffer error:', error);
    }
  }

  /** 生成批次号（yyyyMMddHHmmss + 4 位随机） */
  generateBatchNo() {
    const now = new Date();
    const pad = (value, width = 2) => String(value).padStart(width, '0');
    const datePart =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `${datePart}${random4()}`;
  }

  /** 重置批次：序号归零（非流水模式）、清空本批匹配、生成新批次号 */
  resetBatch() {
    if (this.getPrimaryRule()?.serial_mode !== 'flow') this.currentIndex = 0;
    this.batchNo = this.generateBatchNo();
    this.matchedCountInBatch = 0;
    this.gridMatchedCountInBatch.clear();
    this.recentMatchedSignatures.clear();
    this.gridMatchedByBatch.clear();
    this.gridAutoAssignedByBatch.clear();
  }

  /** 重置福袋批次，emit("luckyBagBatchReset") */
  resetLuckyBagBatch() {
    const previousBatchNo = this.luckyBagBatchNo;
    this.luckyBagBatchNo = this.generateBatchNo();
    const payload = { previousBatchNo, batchNo: this.luckyBagBatchNo };
    this.emit('luckyBagBatchReset', payload);
    return payload;
  }

  /** 获取主规则（第一条） */
  getPrimaryRule() {
    return this.deductionRules[0] ?? null;
  }

  /** 福袋有效次数达到后自动重置批次 */
  resetBatchWhenLuckyBagEffectiveCountReached(resolvedItems) {
    const rule = this.getPrimaryRule();
    if (!rule?.luckyBagEnabled || !rule.enableLuckyBagQuickPass) return;
    const effectiveCount = Number(rule.luckyBagEffectiveCount || 0);
    if (effectiveCount <= 0) return;
    const reached = resolvedItems.some(
      (item) =>
        item.luckyBagBatchNo === this.luckyBagBatchNo &&
        item.luckyBagPosition !== null &&
        item.luckyBagPosition >= effectiveCount
    );
    if (reached) this.resetLuckyBagBatch();
  }

  // ------------------------------------------------------------------
  // 工具
  // ------------------------------------------------------------------

  /** 判断是否为亮牌用户 */
  isLightBrand(danmaku) {
    return Boolean(danmaku.badges?.lightBadge && danmaku.badges.lightBadge > 0);
  }

  /** 规范化后端返回的匹配结果字段 */
  normalizeResolvedItems(items) {
    if (!Array.isArray(items)) return [];
    return items
      .map((raw) => ({
        id: Number.isFinite(Number(raw?.id)) ? Number(raw.id) : null,
        commentId: String(raw?.comment_id ?? '').trim(),
        status: raw?.status === 'matched' ? 'matched' : 'processed',
        printStatus: Boolean(raw?.print_status),
        matchedContent:
          typeof raw?.matched_content === 'string' && raw.matched_content !== ''
            ? raw.matched_content
            : null,
        gridNo: Number.isFinite(Number(raw?.grid_no ?? raw?.gridNo))
          ? Number(raw.grid_no ?? raw.gridNo)
          : null,
        batchNo:
          typeof raw?.batch_no === 'string' && raw.batch_no !== '' ? raw.batch_no : null,
        luckyBagBatchNo:
          typeof (raw?.lucky_bag_batch_no ?? raw?.luckyBagBatchNo) === 'string'
            ? (raw.lucky_bag_batch_no ?? raw.luckyBagBatchNo)
            : null,
        index: Number.isFinite(Number(raw?.num_index)) ? Number(raw.num_index) : null,
        luckyBagWon: Boolean(raw?.lucky_bag_won ?? raw?.luckyBagWon),
        luckyBagPosition: Number.isFinite(Number(raw?.lucky_bag_position ?? raw?.luckyBagPosition))
          ? Number(raw.lucky_bag_position ?? raw.luckyBagPosition)
          : null,
      }))
      .filter((item) => item.commentId !== '');
  }

  /** 生成去重签名（昵称|内容） */
  signatureFor(danmaku) {
    return `${danmaku.nickname}|${danmaku.content}`;
  }

  /** 读取错误响应体（截断 1000 字符） */
  async readErrorResponseBody(response) {
    try {
      const text = (await response.text()).trim();
      if (!text) return null;
      const parsed =
        (response.headers.get('content-type') || '').includes('application/json')
          ? JSON.stringify(JSON.parse(text))
          : text;
      return parsed.length > 1000 ? `${parsed.slice(0, 1000)}...` : parsed;
    } catch {
      return null;
    }
  }

  /** 清理过期去重签名 */
  pruneRecentSignatures(now) {
    for (const [signature, expireAt] of this.recentMatchedSignatures.entries()) {
      if (expireAt <= now) this.recentMatchedSignatures.delete(signature);
    }
  }

  /**
   * 评估匹配消息状态：
   *  - matched   正常匹配（进入打印）
   *  - processed 处理过（被去重/限购/非亮牌拦截）
   *  - delayed   延迟（亮牌优先未到时间）
   * 副作用：写入防重复签名、网格去重记录、本批计数
   */
  evaluateMatchedMessage(danmaku, rule, match) {
    if (!rule) return { status: 'matched', releaseAt: null };
    const now = Date.now();
    this.pruneRecentSignatures(now);

    // 仅亮牌规则：非亮牌用户不匹配
    if (rule.only_light_brand && !this.isLightBrand(danmaku)) {
      return { status: 'processed', releaseAt: null };
    }

    const signature = this.signatureFor(danmaku);
    // 防重复窗口（秒）
    const dedupSeconds = rule.anti_duplicate_enabled ? (rule.anti_duplicate_seconds ?? 0) : 0;
    if (dedupSeconds > 0) {
      const existing = this.recentMatchedSignatures.get(signature);
      if (existing && existing > now) return { status: 'processed', releaseAt: null };
    }

    // 限购：非宫格模式，本批匹配数达上限
    if (rule.limit_order_enabled && rule.rule_type !== 'grid') {
      if (this.matchedCountInBatch >= (rule.limit_order_count ?? 0)) {
        return { status: 'processed', releaseAt: null };
      }
    }

    // 宫格去重 / 限购
    if (rule.rule_type === 'grid') {
      const gridKey = match.gridNo ? String(match.gridNo) : null;
      if (gridKey) {
        const batchGridKey = `${this.batchNo}|${gridKey}`;
        // 宫格限购：同一格子达到上限
        if (rule.limit_order_enabled) {
          if ((this.gridMatchedCountInBatch.get(batchGridKey) || 0) >= (rule.limit_order_count ?? 0)) {
            return { status: 'processed', releaseAt: null };
          }
        }
        const buyerKey = `${this.batchNo}|${danmaku.nickname}`;
        const buyerGrids = this.gridMatchedByBatch.get(buyerKey) || new Set();
        const dedupMode = rule.gridDedupMode || 'buyerEachGridOnce';
        // 每买家整批仅一次
        if (dedupMode === 'buyerAllGridOnce' && buyerGrids.size > 0) {
          return { status: 'processed', releaseAt: null };
        }
        // 每买家每格一次
        if (dedupMode === 'buyerEachGridOnce' && buyerGrids.has(gridKey)) {
          return { status: 'processed', releaseAt: null };
        }
        buyerGrids.add(gridKey);
        this.gridMatchedByBatch.set(buyerKey, buyerGrids);
        this.gridMatchedCountInBatch.set(batchGridKey, (this.gridMatchedCountInBatch.get(batchGridKey) || 0) + 1);
      }
    }

    // 记录防重复签名
    if (dedupSeconds > 0) {
      this.recentMatchedSignatures.set(signature, now + 1000 * dedupSeconds);
    }
    this.matchedCountInBatch += 1;

    // 亮牌优先：非亮牌延迟（秒）
    const lightBrandDelay = Number(rule.light_brand_delay ?? 0);
    if (rule.light_brand_first && !this.isLightBrand(danmaku) && lightBrandDelay > 0) {
      return { status: 'delayed', releaseAt: now + 1000 * lightBrandDelay };
    }
    return { status: 'matched', releaseAt: null };
  }

  /** 释放到期的延迟匹配（亮牌优先延迟到期后进入打印） */
  releaseDelayedMatches() {
    if (this.delayedMatchedBuffer.length === 0) return;
    const now = Date.now();
    const ready = [];
    const stillWaiting = [];
    for (const entry of this.delayedMatchedBuffer) {
      entry.releaseAt <= now ? ready.push(entry) : stillWaiting.push(entry);
    }
    this.delayedMatchedBuffer = stillWaiting;
    if (ready.length > 0) {
      const released = ready.map((entry) => ({ ...entry, displayIndex: ++this.currentIndex }));
      this.matchedBuffer.push(...released);
      this.processBuffer.push(...released);
    }
  }
}

module.exports = { DanmakuDispatcher };
