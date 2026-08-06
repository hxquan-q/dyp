/**
 * ServerOrderSync 重建版行为一致性测试
 * 运行: node tests/test-server-order-sync.js
 * 覆盖: manual 成功/失败/HTTP错, live 分页字段注入, 时间格式化, 请求体形状
 */
const path = require('path');
const { manualServerOrderSync, liveServerOrderSync, formatShanghaiDateTime } = require(
  path.join(__dirname, '..', 'electron', 'main', 'server-order-sync.reconstructed.js')
);

let pass = 0, fail = 0;
const t = (ok, msg) => { ok ? pass++ : (fail++, console.log('FAIL:', msg)); };

// ---- 时间格式化（Asia/Shanghai）：用已知 epoch 验证 ----
// 2026-08-01 12:00:00 CST (UTC+8) => epoch 秒。1620000000 = 2021-05-03T08:00:00Z
// 1783000000 = 2026-07-02 13:46:40 UTC = 21:46:40 CST
t(formatShanghaiDateTime(1783000000) === '2026-07-02 21:46:40', `formatShanghaiDateTime(1783000000): ${formatShanghaiDateTime(1783000000)}`);
// 边界：epoch 0 = 1970-01-01 UTC = 1970-01-01 08:00:00 CST
t(formatShanghaiDateTime(0) === '1970-01-01 08:00:00', `formatShanghaiDateTime(0): ${formatShanghaiDateTime(0)}`);

const mkFetch = ({ status, body }) => async () => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});
const baseParams = { baseUrl: 'http://127.0.0.1:8787/', apiToken: 'tok', shopId: '1002', startTime: 1783000000, endTime: 1783003600 };

(async () => {
  // ---- 1. manual 正常响应 → 归一化 ----
  {
    const seen = {};
    const res = await manualServerOrderSync({
      ...baseParams,
      fetchImpl: async (url, opts) => {
        seen.url = url; seen.body = JSON.parse(opts.body); seen.auth = opts.headers.Authorization;
        return mkFetch({ status: 200, body: {
          success: true, status: 'success', count: 2,
          synced_orders: [{ order_id: 1, order_no: 'A1', buyer_id: 'u1', buyer_name: '张三' }],
          decrypted_orders: [{ order_id: 1, order_no: 'A1' }],
          sync_failures: [], failed_count: 0, limit_reached: false,
        } })(url, opts);
      },
    });
    t(res.success === true, `manual成功的 success`);
    t(res.count === 2, `manual成功 count`);
    t(res.syncedOrders[0]?.orderNo === 'A1' && res.syncedOrders[0]?.buyerName === '张三', `syncedOrders 归一化`);
    t(res.decryptedOrders[0]?.orderNo === 'A1', `decryptedOrders 归一化`);
    t(seen.url === 'http://127.0.0.1:8787/api/electron/orders/server-sync', `URL: 期望 server-sync, 实际 ${seen.url}`);
    t(seen.body?.start_time === '2026-07-02 21:46:40', `请求体 start_time: ${seen.body?.start_time}`);
    t(seen.body?.shop_id === '1002', `请求体 shop_id`);
    t(seen.auth === 'Bearer tok', `Authorization 头`);
  }

  // ---- 2. manual 业务失败（success:false）→ failed ----
  {
    const res = await manualServerOrderSync({
      ...baseParams,
      fetchImpl: mkFetch({ status: 200, body: { success: false, status: 'failed', error: '登录已过期', error_code: 'AUTH_EXPIRED' } }),
    });
    t(res.success === false && res.error === '登录已过期', `业务失败 error`);
    t(res.errorCode === 'AUTH_EXPIRED', `业务失败 errorCode: ${res.errorCode}`);
    t(res.status === 'failed', `业务失败 status`);
  }

  // ---- 3. manual HTTP 错误 → failed ----
  {
    const res = await manualServerOrderSync({
      ...baseParams,
      fetchImpl: mkFetch({ status: 500, body: { message: '内部错误' } }),
    });
    t(res.success === false && res.error === '内部错误', `HTTP500 error, 实际 ${res.error}`);
  }

  // ---- 4. manual 网络异常 → failed（不抛出）----
  {
    const res = await manualServerOrderSync({
      ...baseParams,
      fetchImpl: async () => { throw new Error('ECONNREFUSED'); },
    });
    t(res.success === false && res.error === 'ECONNREFUSED', `网络异常 error: ${res.error}`);
  }

  // ---- 5. live 返回 cursor/hasMore/lockSkipped ----
  {
    const res = await liveServerOrderSync({
      ...baseParams,
      fetchImpl: mkFetch({ status: 200, body: {
        success: true, status: 'success', count: 3,
        synced_orders: [], decrypted_orders: [], sync_failures: [], failed_count: 0,
        limit_reached: true, cursor: 'next-cur', has_more: true, lock_skipped: true,
      } }),
    });
    t(res.cursor === 'next-cur', `live cursor`);
    t(res.hasMore === true, `live hasMore`);
    t(res.lockSkipped === true, `live lockSkipped`);
    t(res.limitReached === true, `live limitReached`);
  }

  // ---- 6. live 传入 cursor 时不再带时间区间 ----
  {
    const seen = {};
    await liveServerOrderSync({
      ...baseParams,
      fetchImpl: async (url, opts) => {
        seen.body = JSON.parse(opts.body);
        return mkFetch({ status: 200, body: { success: true, status: 'success', count: 0 } })(url, opts);
      },
      cursor: 'c1',
    });
    t(seen.body?.cursor === 'c1', `live cursor 透传`);
    t(seen.body?.start_time === undefined, `live 带 cursor 时不应有 start_time`);
  }

  // ---- 7. mock 后端契约核查：server-live-sync 响应与主进程期望的 snake_case 契约是否一致 ----
  {
    const fs = require('fs');
    const srv = fs.readFileSync(path.join(__dirname, '..', 'legacy', 'backend-python', 'server.py'), 'utf8');
    t(srv.includes('/api/electron/orders/server-sync'), `mock 后端已实现 server-sync 路由分支`);
    t(srv.includes('server-live-sync'), `mock 后端已提到 server-live-sync`);
    // 主进程 liveServerOrderSync 期望 snake_case（synced_orders/has_more/lock_skipped）
    // 而 mock 后端 _electron_api 该分支拼的是 camelCase（syncedOrders/decryptedOrders），
    // 且不产出 has_more/lock_skipped → 契约缺口
    const camelOnly = srv.includes('"syncedOrders"') && !/synced_orders/.test(srv);
    t(camelOnly, `CONTRACT-GAP(已知): mock 后端 server-live-sync 返回 camelCase，主进程期望 snake_case，二开联调时需对齐`);
  }

  console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
  process.exit(fail > 0 ? 1 : 0);
})();