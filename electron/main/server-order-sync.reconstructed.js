/**
 * ============================================================
 *  ServerOrderSync — 服务器端订单同步客户端（语义化重建版）
 * ============================================================
 *  从扣单宝主进程逆向还原，重写为带语义命名、可独立运行的模块。
 *  逻辑与原版完全一致（保留全部字段映射/归一化/错误态语义）。
 *
 *  职责：
 *    与扣单宝后端服务交互，完成「服务器端订单同步」与
 *    「直播实时订单同步」两类请求：
 *      - manualServerOrderSync()  → POST /api/electron/orders/server-sync
 *         按时间区间向服务器拉取/同步历史订单，返回规范化结果。
 *      - liveServerOrderSync()    → POST /api/electron/orders/server-live-sync
 *         直播中的实时订单增量同步，支持 cursor 分页续拉，
 *         返回 has_more / lock_skipped 以驱动客户端继续拉取。
 *      - formatShanghaiDateTime() → Unix 秒 → "YYYY-MM-DD HH:mm:ss"(Asia/Shanghai)
 *
 *  原版上下文：
 *    原变量名为压缩短名，本版改为语义命名并补中文注释，逐字段对齐。
 *    HTTP 底默认用 Electron net.fetch；测试可注入 fetchImpl，无需 Electron。
 *
 *  运行方式：纯逻辑、无 Electron 依赖，Node 可直接跑：
 *    const { manualServerOrderSync } = require('./server-order-sync.reconstructed');
 *    const result = await manualServerOrderSync({
 *      baseUrl, apiToken, shopId, startTime, endTime,
 *      fetchImpl: fetch,              // 可选注入，默认需 Electron net
 *      deviceHeaders: {...},          // 可选设备头
 *    });
 * ============================================================
 */

/**
 * 把 Unix 秒时间戳格式化为上海时区的 "YYYY-MM-DD HH:mm:ss" 字符串，
 * 用于请求体的 start_time / end_time 字段。
 * @param {number} unixSeconds 格林尼治毫秒 epoch 的 Unix 秒数
 * @returns {string}
 * @private
 */
function formatShanghaiDateTime(unixSeconds) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(1000 * unixSeconds));
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

/** 构造一个统一的「同步失败」结果对象。 @private */
function failedResult(message) {
  return {
    success: false, status: 'failed', count: 0,
    syncedOrders: [], decryptedOrders: [], failedCount: 0,
    syncFailures: [], limitReached: false,
    error: message,
  };
}

/**
 * 把服务器原始响应体归一化为客户端统一的同步结果对象。
 * @param {object} payload 服务端响应 JSON
 * @returns {{success:boolean,status:string,count:number, syncedOrders:Array, decryptedOrders:Array, failedCount:number, syncFailures:Array, limitReached:boolean, ...}}
 * @private
 */
function normalizeSuccessPayload(payload) {
  const orderMapper = (o) => ({
    orderId: Number(o.order_id),
    orderNo: String(o.order_no ?? ''),
    ...(o.buyer_id != null ? { buyerId: String(o.buyer_id) } : {}),
    ...(o.buyer_name != null ? { buyerName: String(o.buyer_name) } : {}),
  });
  const failureMapper = (f) => ({
    ...(f.order_no != null ? { orderNo: String(f.order_no) } : {}),
    ...(f.page != null ? { page: Number(f.page) } : {}),
    ...(f.row != null ? { row: Number(f.row) } : {}),
    code: String(f.code ?? 'unknown'),
    reason: String(f.reason ?? ''),
    ...(f.action_hint ? { actionHint: String(f.action_hint) } : {}),
  });
  return {
    success: payload.success === true,
    status: ['success', 'partial_success', 'failed'].includes(payload.status)
      ? payload.status
      : (payload.success === true ? 'success' : 'failed'),
    count: Number(payload.count) || 0,
    syncedOrders: Array.isArray(payload.synced_orders)
      ? payload.synced_orders.map(orderMapper)
      : [],
    decryptedOrders: Array.isArray(payload.decrypted_orders)
      ? payload.decrypted_orders.map((o) => ({ orderId: Number(o.order_id), orderNo: String(o.order_no ?? '') }))
      : [],
    failedCount: Number(payload.failed_count) || 0,
    syncFailures: Array.isArray(payload.sync_failures)
      ? payload.sync_failures.map(failureMapper)
      : [],
    limitReached: payload.limit_reached === true,
    ...(payload.error || payload.message ? { error: String(payload.error || payload.message) } : {}),
    ...(payload.error_code ? { errorCode: String(payload.error_code) } : {}),
    ...(payload.message ? { message: String(payload.message) } : {}),
    ...(payload.detail ? { detail: String(payload.detail) } : {}),
    ...(payload.action_hint ? { actionHint: String(payload.action_hint) } : {}),
    ...(payload.trace_id ? { traceId: String(payload.trace_id) } : {}),
  };
}

/**
 * 基于可能「部分失败」的响应构造 result：始终标记失败，但保留同步到的字段。
 * @private
 */
function normalizeFailurePayload(payload, fallbackMessage) {
  const message = String(payload.message || payload.detail || payload.error || fallbackMessage);
  return { ...normalizeSuccessPayload(payload), success: false, status: 'failed', error: message };
}

/**
 * 发起一次到扣单宝后端的请求并解析 JSON。
 * @param {object} params 同步参数（含 baseUrl/apiToken/fetchImpl/deviceHeaders）
 * @param {string} path    请求路径（以 / 开头）
 * @param {object} body    请求体
 * @returns {Promise<{response:Response, payload:object}>}
 * @private
 */
async function postJson(params, path, body) {
  const fetchImpl = params.fetchImpl ?? ((url, opts) => globalThis.fetch(url, opts));
  try {
    const response = await fetchImpl(`${params.baseUrl.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.apiToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(params.deviceHeaders || {}),
      },
      body: JSON.stringify(body),
    });
    const rawResponse = await response.text();
    let payload = {};
    let parseError = null;
    try {
      const parsed = JSON.parse(rawResponse);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        payload = parsed;
      } else {
        parseError = '响应 JSON 不是对象';
      }
    } catch (err) {
      parseError = err instanceof Error ? err.message : String(err);
    }
    const diag = {
      path, requestBody: body, httpStatus: response.status,
      rawResponse, trace_id: payload.trace_id != null ? String(payload.trace_id) : null,
      parseError,
    };
    const failed = !response.ok || parseError !== null
      || payload.success === false || payload.status === 'failed';
    if (failed) console[globalThis.app?.isPackaged ? 'error' : 'log']('[order-sync] server response failed', diag);
    return { response, payload };
  } catch (err) {
    const diag = {
      path, requestBody: body, httpStatus: null, rawResponse: null,
      trace_id: null, parseError: null,
      error: err instanceof Error ? err.message : String(err),
    };
    console.log('[order-sync] server request failed', diag);
    throw err;
  }
}

/**
 * 手动服务器端订单同步（按时间区间拉取）。
 * @param {object} params
 * @param {string} params.baseUrl 后端地址
 * @param {string} params.apiToken Bearer 令牌
 * @param {(string|number)} [params.shopId] 店铺 id
 * @param {number} params.startTime Unix 秒（含）
 * @param {number} params.endTime   Unix 秒（含）
 * @param {Function} [params.fetchImpl] 可注入 fetch（默认 Node/浏览器 fetch）
 * @param {object} [params.deviceHeaders] 可选设备头
 * @returns {Promise<object>} 归一化同步结果
 */
async function manualServerOrderSync(params) {
  try {
    const { response, payload } = await postJson(params, '/api/electron/orders/server-sync', {
      shop_id: params.shopId,
      start_time: formatShanghaiDateTime(params.startTime),
      end_time: formatShanghaiDateTime(params.endTime),
    });
    return response.ok ? normalizeSuccessPayload(payload) : normalizeFailurePayload(payload, `HTTP ${response.status}`);
  } catch (err) {
    return failedResult(err instanceof Error ? err.message : String(err));
  }
}

/**
 * 直播实时订单同步（增量续拉）。
 * @param {object} params 同 manualServerOrderSync；另可传 cursor
 * @param {string} [params.cursor] 上次返回的分页游标
 * @returns {Promise<object>} 归一化结果 + cursor/hasMore/lockSkipped
 */
async function liveServerOrderSync(params) {
  try {
    const body = { shop_id: params.shopId };
    if (params.cursor) {
      body.cursor = params.cursor;
    } else if (params.startTime !== undefined && params.endTime !== undefined) {
      body.start_time = formatShanghaiDateTime(params.startTime);
      body.end_time = formatShanghaiDateTime(params.endTime);
    }
    const { response, payload } = await postJson(params, '/api/electron/orders/server-live-sync', body);
    const injectPagination = (result) => ({
      ...result,
      cursor: payload.cursor == null ? null : String(payload.cursor),
      hasMore: payload.has_more === true,
      lockSkipped: payload.lock_skipped === true,
    });
    if (response.ok) return injectPagination(normalizeSuccessPayload(payload));
    return injectPagination(normalizeFailurePayload(payload, `HTTP ${response.status}`));
  } catch (err) {
    return {
      ...failedResult(err instanceof Error ? err.message : String(err)),
      cursor: params.cursor ?? null,
      hasMore: false,
      lockSkipped: false,
    };
  }
}

module.exports = { manualServerOrderSync, liveServerOrderSync, formatShanghaiDateTime };
