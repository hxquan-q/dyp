/**
 * ============================================================
 *  DouyinWsInterceptor — 抖音直播 WebSocket 拦截器（语义化重建版）
 * ============================================================
 *  从扣单宝主进程逆向还原，重写为带语义命名、可独立运行的模块。
 *  逻辑与原版完全一致（保留全部 CDP 事件分支 / 帧解码 / 去重 / 事件语义）。
 *
 *  职责：
 *    通过 Electron CDP(webContents.debugger) 拦截抖音直播页面的
 *    WebSocket 帧，把二进制帧解码为一连串弹幕/礼物/进房等消息，
 *    去重后向外 emit('message', msg)，交给 DanmakuDispatcher 扣数。
 *
 *  解码管线（handleFrame）：
 *    WebSocket 帧二进制
 *      → parseMsg 外层：field7=payloadType字符串, field8=外层payload字节
 *      → 若外层 payload 为 gzip(0x1f,0x8b 头) → node zlib inflate 解压
 *      → 再 parseMsg 解压后：field1 = messages 数组
 *      → 逐条 parseMsg：field1=消息方法名(如 WebcastChatMessage), field2=该方法 payload
 *      → decodeWebcastMessage(method, payload) → 标准化消息 { type, uid, nickname, content, commentId, badges }
 *      → recentMsgIds 去重（保留最近 2000 条）→ emit('message', msg)
 *
 *  事件：
 *    "ws-connected"  抖音 webcast WS 建立（附 roomId/url）
 *    "ws-closed"     webcast WS 关闭
 *    "message"       解码后的一条直播消息（可被扣数）
 *
 *  原版上下文：
 *    原类名压缩为 s（模块 8476:9064），依赖同模块 i(douyin-protobuf) 的
 *    parseMsg/getStr/getBytes/decodeWebcastMessage 与 o 的 inflate(gzip)。
 *    本版复刻为独立文件 require 这些原版导出，语义 + 注释对齐。
 *
 *  运行方式：
 *    纯解码逻辑（handleFrame）无需 Electron，node 可直接测：
 *      const { DouyinWsInterceptor } = require('./douyin-ws-interceptor.reconstructed');
 *      const itc = new DouyinWsInterceptor();
 *      itc.on('message', (msg) => ...);
 *      itc.handleFrame(frameBytes);   // frameBytes 为 Uint8Array
 *    完整 CDP attach 需在 Electron 内对真实 webContents 调用。
 * ============================================================
 */

const { EventEmitter } = require('events');
const zlib = require('zlib');
const {
  parseMsg,
  getStr,
  getBytes,
  decodeWebcastMessage,
} = require('./douyin-protobuf.reconstructed');

/**
 * 抖音直播 WebSocket 拦截器。
 */
class DouyinWsInterceptor extends EventEmitter {
  /** 关联的 webContents（attach 后） */
  webContents = null;

  /** 已跟踪的 webcast WebSocket 请求 id 集合 */
  activeRequestIds = new Set();

  /** 请求 id → CDP 子会话 id 映射 */
  activeRequestSessionIds = new Map();

  /** 是否已 attach */
  attached = false;

  /** 已解码消息计数 */
  messageCount = 0;

  /** 已处理帧计数 */
  frameCount = 0;

  /** raw webSocketCreated 计数（仅诊断） */
  rawCreatedCount = 0;

  /** raw webSocketFrameReceived 计数（仅诊断） */
  rawFrameCount = 0;

  /** CDP message 事件监听器 */
  cdpHandler = null;

  /** debugger detach 监听器 */
  detachHandler = null;

  /** 最近解码消息 commentId 去重集 */
  recentMsgIds = new Set();

  /** 未支持消息方法日志计数（每个方法最多打 3 次） */
  unknownMethodLogCounts = new Map();

  /** 已跟踪的 CDP 子会话（targetId/targetType/url） */
  childSessions = new Map();

  /** CDP 方法采样日志计数 */
  cdpMethodLogCounts = new Map();

  /**
   * 通过 CDP 拦截指定 webContents 的网络，等待抖音 webcast WebSocket。
   * 全部字段/分支与原版一致。
   * @param {Electron.WebContents} webContents
   */
  async attach(webContents) {
    this.detach();
    if (webContents.isDestroyed()) {
      console.warn('[ws-interceptor] attach skipped: webContents destroyed');
      return;
    }
    this.webContents = webContents;
    this.cdpHandler = (method, params, sessionId) => {
      this.handleCdpEvent(method, params, sessionId);
    };
    this.detachHandler = (event, reason) => {
      console.warn('[ws-interceptor] debugger detached', { webContentsId: webContents.id, reason, currentUrl: webContents.getURL() || '' });
      this.attached = false;
    };
    try {
      webContents.debugger.attach('1.3');
      this.attached = true;
    } catch (err) {
      const msg = String(err?.message || '');
      if (!/already attached/i.test(msg)) {
        console.error('[ws-interceptor] attach failed:', msg);
        return;
      }
      this.attached = true; // 已附则视为成功
    }
    if (webContents.isDestroyed()) {
      this.attached = false;
      this.webContents = null;
      return;
    }
    try {
      webContents.debugger.on('message', this.cdpHandler);
      webContents.debugger.on('detach', this.detachHandler);
    } catch (err) {
      if (!/Object has been destroyed/i.test(String(err?.message || err))) throw err;
      console.warn('[ws-interceptor] listener attach skipped: webContents destroyed');
      this.attached = false;
      this.webContents = null;
      return;
    }
    try {
      await webContents.debugger.sendCommand('Network.enable');
      await webContents.debugger.sendCommand('Target.setDiscoverTargets', { discover: true });
      await webContents.debugger.sendCommand('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
    } catch (err) {
      console.error('[ws-interceptor] debugger bootstrap failed:', err.message);
      return;
    }
    console.log('[ws-interceptor] attached, waiting for webcast WebSocket...', {
      debuggerAttached: webContents.debugger.isAttached(), webContentsId: webContents.id, currentUrl: webContents.getURL() || '',
    });
  }

  /** 解除拦截并清空全部状态。 */
  detach() {
    if (this.webContents && !this.webContents.isDestroyed()) {
      if (this.cdpHandler) {
        try { this.webContents.debugger.removeListener('message', this.cdpHandler); } catch (err) { console.warn('[ws-interceptor] remove message listener failed:', err?.message || String(err)); }
      }
      if (this.detachHandler) {
        try { this.webContents.debugger.removeListener('detach', this.detachHandler); } catch (err) { console.warn('[ws-interceptor] remove detach listener failed:', err?.message || String(err)); }
      }
    }
    this.cdpHandler = null;
    this.detachHandler = null;
    this.attached = false;
    this.activeRequestIds.clear();
    this.activeRequestSessionIds.clear();
    this.childSessions.clear();
    this.recentMsgIds.clear();
    this.unknownMethodLogCounts.clear();
    this.cdpMethodLogCounts.clear();
    this.webContents = null;
    this.messageCount = 0;
    this.frameCount = 0;
    this.rawCreatedCount = 0;
    this.rawFrameCount = 0;
  }

  isAttached() { return this.attached; }
  getMessageCount() { return this.messageCount; }
  getAttachedWebContents() { return this.webContents; }

  /** 判断是否为抖音 webcast WebSocket 目标 URL。 */
  isTargetWebcastUrl(url) {
    return url.includes('webcast') && (url.includes('.douyin.com') || url.includes('room_id') || url.includes('anchor_dashboard'));
  }

  /**
   * 处理一条 CDP 事件；只关注 target 生命期与 webcast WS 帧。
   * @param {string} method CDP 方法名
   * @param {object} parameters CDP 参数
   * @param {string|null} sessionId 会话 id
   */
  handleCdpEvent(method, parameters, sessionId) {
    this.logCdpMethodSample(method, parameters, sessionId);
    if (method === 'Target.attachedToTarget') {
      const childSessionId = typeof parameters?.sessionId === 'string' ? parameters.sessionId : '';
      const targetInfo = parameters?.targetInfo || {};
      const targetType = String(targetInfo.type || '');
      const url = String(targetInfo.url || '');
      this.childSessions.set(childSessionId, { targetId: String(targetInfo.targetId || ''), targetType, url });
      console.log('[ws-interceptor] target attached', { parentSessionId: sessionId ?? null, sessionId: childSessionId, targetType, url });
      this.enableChildTargetNetwork(childSessionId, targetType, url);
      return;
    }
    if (method === 'Target.detachedFromTarget') {
      const childSessionId = typeof parameters?.sessionId === 'string' ? parameters.sessionId : '';
      const tracked = this.childSessions.get(childSessionId);
      this.childSessions.delete(childSessionId);
      console.log('[ws-interceptor] target detached', { parentSessionId: sessionId ?? null, sessionId: childSessionId || null, targetType: tracked?.targetType ?? null, url: tracked?.url ?? null });
      return;
    }
    if (method === 'Target.targetCreated') {
      const info = parameters?.targetInfo || {};
      console.log('[ws-interceptor] target created', { sessionId: sessionId ?? null, targetId: String(info.targetId || ''), targetType: String(info.type || ''), url: String(info.url || '') });
      return;
    }
    if (method === 'Network.webSocketCreated') {
      const url = parameters?.url || '';
      this.rawCreatedCount++;
      console.log('[ws-interceptor] raw webSocketCreated', { count: this.rawCreatedCount, sessionId: sessionId ?? null, requestId: parameters.requestId, matchesTarget: this.isTargetWebcastUrl(url), url });
      if (this.isTargetWebcastUrl(url)) {
        this.activeRequestIds.add(parameters.requestId);
        this.activeRequestSessionIds.set(parameters.requestId, sessionId ?? null);
        const match = /room_id=(\d+)/.exec(url);
        const roomId = match?.[1] || 'unknown';
        console.log('[ws-interceptor] webcast WS active details', { roomId, requestId: parameters.requestId, sessionId: sessionId ?? 'root' });
        console.log(`[ws-interceptor] ✅ webcast WS active: room_id=${roomId}, requestId=${parameters.requestId}, url=${url}`);
        this.emit('ws-connected', { roomId, url });
      } else {
        console.log(`[ws-interceptor] skipped non-webcast WS: ${url}`);
      }
    }
    if (method === 'Network.webSocketWillSendHandshakeRequest') {
      const url = parameters?.request?.url || '';
      console.log('[ws-interceptor] raw handshake request', { sessionId: sessionId ?? null, requestId: parameters.requestId, matchesTarget: this.isTargetWebcastUrl(url), url });
    }
    if (method === 'Network.webSocketHandshakeResponseReceived') {
      const url = parameters?.response?.url || '';
      console.log('[ws-interceptor] raw handshake response', { sessionId: sessionId ?? null, requestId: parameters.requestId, matchesTarget: this.isTargetWebcastUrl(url), status: parameters?.response?.status ?? null, statusText: parameters?.response?.statusText || null, url });
    }
    if (method === 'Network.webSocketClosed') {
      console.log('[ws-interceptor] raw webSocketClosed', { sessionId: sessionId ?? null, requestId: parameters.requestId, wasTracked: this.activeRequestIds.has(parameters.requestId) });
      if (this.activeRequestIds.delete(parameters.requestId)) {
        if (this.activeRequestIds.size === 0) {
          this.activeRequestSessionIds.delete(parameters.requestId);
          console.log('[ws-interceptor] webcast WS closed');
          this.emit('ws-closed');
        } else {
          this.activeRequestSessionIds.delete(parameters.requestId);
        }
      } else {
        this.activeRequestSessionIds.delete(parameters.requestId);
      }
    }
    if (method === 'Network.webSocketFrameReceived') {
      this.rawFrameCount++;
      const opcode = parameters?.response?.opcode;
      const payloadData = parameters?.response?.payloadData; // base64 字符串
      const tracked = this.activeRequestIds.has(parameters.requestId);
      console.log('[ws-interceptor] raw frame event', {
        count: this.rawFrameCount, sessionId: sessionId ?? null, requestId: parameters.requestId,
        tracked, trackedSessionId: this.activeRequestSessionIds.get(parameters.requestId) ?? null,
        opcode, payloadLength: typeof payloadData === 'string' ? payloadData.length : 0,
        payloadPreview: typeof payloadData === 'string' ? payloadData.slice(0, 96) : null,
      });
      if (!tracked) return;
      if (!payloadData) return;
      try {
        const frameBytes = Buffer.from(payloadData, 'base64');
        this.frameCount++;
        console.log('[ws-interceptor] frame received', { requestId: parameters.requestId, sessionId: sessionId ?? null, opcode, frameCount: this.frameCount, byteLength: frameBytes.length, base64Preview: payloadData.slice(0, 96) });
        this.handleFrame(new Uint8Array(frameBytes), parameters.requestId);
      } catch { /* 解析失败忽略 */ }
    }
  }

  /**
   * 解码一个 WebSocket 帧为若干直播消息并去重播发。
   * 这是抖音弹幕解码的核心管线，纯逻辑、可独立测试。
   * @param {Uint8Array} frameBytes 外层帧字节
   * @param {string} [requestId] 请求 id（诊断用）
   */
  handleFrame(frameBytes, requestId = null) {
    const outer = parseMsg(frameBytes, 0, frameBytes.length);
    const payloadType = getStr(outer, 7);
    const payload = getBytes(outer, 8);
    if (!payload) {
      console.log('[ws-interceptor] frame missing outer payload', { requestId, byteLength: frameBytes.length, hexPreview: this.toHexPreview(frameBytes) });
      return;
    }
    // gzip 头判断：0x1f 0x8b（真实抖音 webcast 内层 payload 为 gzip 包装）
    // 注意：gzip 头必须用 gunzipSync 解；inflateSync 只解 zlib 头(0x78 0x9c)，
    // 对 gzip 数据会抛 Z_DATA_ERROR。修正自原版(原版误用 inflateSync 导致
    // 真 gzip 帧解压失败被 catch 吞掉、退回不解压)。
    const isGzip = payload.length >= 2 && payload[0] === 0x1f && payload[1] === 0x8b;
    let decompressed;
    try {
      decompressed = isGzip ? zlib.gunzipSync(payload) : payload;
    } catch {
      decompressed = payload;
    }
    const inside = parseMsg(decompressed, 0, decompressed.length)[1] || [];
    console.log('[ws-interceptor] frame parsed', {
      requestId, payloadType: payloadType || '(empty)',
      outerPayloadLength: payload.length, decompressedLength: decompressed.length,
      isGzip, messageCount: inside.length,
    });
    for (const msgBytes of inside) {
      if (!(msgBytes instanceof Uint8Array)) continue;
      const msg = parseMsg(msgBytes, 0, msgBytes.length);
      const method = getStr(msg, 1);
      const payloadBytes = getBytes(msg, 2);
      if (!method || !payloadBytes) continue;
      const decoded = decodeWebcastMessage(method, payloadBytes);
      if (decoded) {
        console.log('[douyin ws decoded full]', decoded);
        console.log('[ws-interceptor] decoded message', { requestId, method, type: decoded.type, commentId: decoded.commentId, nickname: decoded.nickname, contentPreview: decoded.content.slice(0, 80) });
        if (this.recentMsgIds.has(decoded.commentId)) continue; // 去重
        this.recentMsgIds.add(decoded.commentId);
        if (this.recentMsgIds.size > 2000) {
          const first = this.recentMsgIds.values().next().value;
          if (first) this.recentMsgIds.delete(first);
        }
        this.messageCount++;
        this.emit('message', decoded);
      } else {
        this.logUnknownMethod(method, payloadBytes, requestId);
      }
    }
  }

  /** 对未支持的消息方法限频打日志。 @private */
  logUnknownMethod(method, payload, requestId) {
    const count = this.unknownMethodLogCounts.get(method) ?? 0;
    if (count >= 3) return;
    this.unknownMethodLogCounts.set(method, count + 1);
    console.warn('[ws-interceptor] unsupported message method', { requestId, method, occurrence: count + 1, payloadLength: payload.length, hexPreview: this.toHexPreview(payload), utf8Preview: this.toUtf8Preview(payload) });
  }

  /** 十六进制前 N 字节预览。 @private */
  toHexPreview(bytes, length = 48) {
    return Array.from(bytes.slice(0, length)).map((b) => b.toString(16).padStart(2, '0')).join(' ');
  }
  /** utf8 前 N 字节预览。 @private */
  toUtf8Preview(bytes, length = 96) {
    return Buffer.from(bytes.slice(0, length)).toString('utf8').replace(/\s+/g, ' ');
  }

  /** CDP 方法采样限频日志。 @private */
  logCdpMethodSample(method, parameters, sessionId) {
    const count = this.cdpMethodLogCounts.get(method) ?? 0;
    if (count >= 3) return;
    this.cdpMethodLogCounts.set(method, count + 1);
    console.log('[ws-interceptor] cdp method sample', {
      occurrence: count + 1, method, sessionId: sessionId ?? null,
      requestId: typeof parameters?.requestId === 'string' ? parameters.requestId : null,
      url: String(parameters?.url || parameters?.request?.url || parameters?.response?.url || parameters?.targetInfo?.url || ''),
    });
  }

  /** 对子会话启用 Runtime/Network（诊断 + 子目标 WS 拦截）。 @private */
  async enableChildTargetNetwork(sessionId, targetType, url) {
    if (this.webContents && !this.webContents.isDestroyed()) {
      try { await this.webContents.debugger.sendCommand('Runtime.enable', {}, sessionId); } catch (err) {
        console.warn('[ws-interceptor] Runtime.enable failed for child target', { sessionId, targetType, url, message: err?.message || String(err) });
      }
      try { await this.webContents.debugger.sendCommand('Network.enable', {}, sessionId); } catch (err) {
        console.warn('[ws-interceptor] Network.enable failed for child target', { sessionId, targetType, url, message: err?.message || String(err) });
      }
    }
  }
}

module.exports = { DouyinWsInterceptor };
