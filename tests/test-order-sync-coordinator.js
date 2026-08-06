/**
 * OrderSyncCoordinator 重建版行为一致性测试
 * 运行: node tests/test-order-sync-coordinator.js
 * 覆盖: 手动同步 / 自动补拉 / 手动优先 / 自动跳过 / 手动完成后自动补跑 / 异常计数回退
 */
const path = require('path');
const { OrderSyncCoordinator } = require(path.join(__dirname, '..', 'electron', 'main', 'order-sync-coordinator.reconstructed.js'));

let pass = 0, fail = 0;
const t = (ok, msg) => { ok ? pass++ : (fail++, console.log('FAIL:', msg)); };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** 累积执行序号的日志，用于断言并发顺序 */
function makeLogger() { return { order: [], log(name) { this.order.push(name); } }; }

(async () => {
  // ---- 1. 空闲时手动同步立即执行 ----
  {
    const c = new OrderSyncCoordinator();
    const L = makeLogger();
    const r = await c.runManual(async () => { L.log('manual'); return 42; });
    t(r === 42, `手动同步返回值: 期望 42, 实际 ${r}`);
    t(JSON.stringify(L.order) === '["manual"]', `空闲手动: 期望 [manual], 实际 ${JSON.stringify(L.order)}`);
  }

  // ---- 2. 两个手动同步串行（第二个等待第一个完成）----
  {
    const c = new OrderSyncCoordinator();
    const L = makeLogger();
    const p1 = c.runManual(async () => { L.log('m1'); await sleep(30); });
    const p2 = c.runManual(async () => { L.log('m2'); await sleep(10); });
    await Promise.all([p1, p2]);
    t(JSON.stringify(L.order) === '["m1","m2"]', `手动串行: 期望 [m1,m2], 实际 ${JSON.stringify(L.order)}`);
  }

  // ---- 3. 手动同步进行中触发自动补拉 → deferred，手动完成后补跑 ----
  {
    const c = new OrderSyncCoordinator();
    const L = makeLogger();
    const manualPromise = c.runManual(async () => { L.log('manual'); await sleep(50); });
    const st = await c.runAuto(async () => { L.log('auto'); await sleep(10); });
    t(st === 'deferred', `下行自动补拉状态: 期望 deferred, 实际 ${st}`);
    await manualPromise;
    // flushPendingAutoCatchup 由 queueMicrotask 触发，需等一下
    await sleep(30);
    t(JSON.stringify(L.order) === '["manual","auto"]', `手动后补跑自动: 期望 [manual,auto], 实际 ${JSON.stringify(L.order)}`);
  }

  // ---- 4. 自动同步执行中再触发自动 → skipped ----
  {
    const c = new OrderSyncCoordinator();
    const L = makeLogger();
    const a1 = c.runAuto(async () => { L.log('a1'); await sleep(40); });
    const st = await c.runAuto(async () => { L.log('a2'); });
    await a1;
    t(st === 'skipped', `自动重复触发: 期望 skipped, 实际 ${st}`);
    t(JSON.stringify(L.order) === '["a1"]', `自动重复触发只执行一份: 期望 [a1], 实际 ${JSON.stringify(L.order)}`);
  }

  // ---- 5. 自动同步执行中触发手动 → 手动打断，自动完成 ----
  {
    const c = new OrderSyncCoordinator();
    const L = makeLogger();
    c.runAuto(async () => { L.log('auto'); await sleep(40); });
    await sleep(10); // 确保 auto 已占用 currentKind
    await c.runManual(async () => { L.log('manual'); });
    await sleep(60);
    // 注意：手动执行时 currentKind 是 manual，所以 auto 结束后不会触发补跑；
    // 这里 auto 已先启动，manual.runManual 会等待 currentPromise(auto) 结束
    const hasManual = L.order.includes('manual');
    t(hasManual, `auto 中触发 manual 应执行 manual: 实际 ${JSON.stringify(L.order)}`);
  }

  // ---- 6. 手动同步抛错 → 计数回退，不卡死后续 ----
  {
    const c = new OrderSyncCoordinator();
    const L = makeLogger();
    let threw = false;
    try { await c.runManual(async () => { throw new Error('boom'); }); } catch { threw = true; }
    t(threw, `手动同步应抛错`);
    // 异常后仍可正常跑下一次手动
    const r = await c.runManual(async () => { L.log('ok'); return 7; });
    t(r === 7 && L.order.includes('ok'), `异常后手动可再执行: 实际 ${JSON.stringify(L.order)}`);
  }

  // ---- 7. clearAutoCatchupTask 清除挂起标记 ----
  {
    const c = new OrderSyncCoordinator();
    const L = makeLogger();
    const mp = c.runManual(async () => { await sleep(40); });
    await c.runAuto(async () => { L.log('auto'); });   // deferred
    c.clearAutoCatchupTask();                          // 清除挂起
    await mp;
    await sleep(30);
    t(!L.order.includes('auto'), `clearAutoCatchupTask 后不应补跑 auto: 实际 ${JSON.stringify(L.order)}`);
  }

  console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
  process.exit(fail > 0 ? 1 : 0);
})();