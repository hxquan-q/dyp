/**
 * DouyinLiveDriver —— 抖音直播弹幕捕获驱动（精简自研）
 * ==================================================================
 * 对齐官方 DouyinPlatform 的弹幕链路最小可运行子集：
 *   startCapture → 直播间窗口（partition persist:douyin-<shopId>）
 *                 → DouyinWsInterceptor.attach（CDP 拦截 webcast WS）
 *   startDanmakuSession → DanmakuDispatcher 装配（loadConfig + start）
 *   interceptor 'message' → dispatcher.handleDanmaku
 *   dispatcher 事件 → display / resolved / printResults / luckyBagBatchReset
 *
 * 依赖（生产位置 electron/main/，语义化重建版）：
 *   douyin-ws-interceptor.reconstructed.js
 *   douyin-protobuf.reconstructed.js
 *   danmaku-dispatcher.reconstructed.js
 *
 * 事件（EventEmitter）：
 *   "display" / "resolved" / "printResults" / "luckyBagBatchReset"
 *   "ws-connected" / "ws-closed" / "live-status" / "live-window-closed"
 */
const { EventEmitter } = require('events')
const { BrowserWindow } = require('electron')
const { DouyinWsInterceptor } = require('./douyin-ws-interceptor.reconstructed')
const { DanmakuDispatcher } = require('./danmaku-dispatcher.reconstructed')

class DouyinLiveDriver extends EventEmitter {
  constructor(options = {}) {
    super()
    this.baseUrl = options.baseUrl || 'http://127.0.0.1:8787'
    this.liveWindow = null
    this.wsInterceptor = null
    this.dispatcher = null
    this.shopId = null
    this.platformCode = 'douyin'
  }

  // ------------------------------------------------------------------
  // 直播窗口 + WS 拦截
  // ------------------------------------------------------------------

  /** 打开抖音直播间窗口并 attach 拦截器 */
  async startCapture({ shopId, roomUrl }) {
    this.stopCapture()
    if (!roomUrl) throw new Error('缺少直播间地址（roomUrl）')
    this.shopId = String(shopId)
    const partition = `persist:douyin-${this.shopId}`

    this.liveWindow = new BrowserWindow({
      width: 1100,
      height: 800,
      show: true,
      webPreferences: { partition, sandbox: false, nodeIntegration: false },
    })
    this.liveWindow.on('closed', () => {
      this.liveWindow = null
      this.emit('live-window-closed')
    })
    await this.liveWindow.loadURL(roomUrl)

    this.wsInterceptor = new DouyinWsInterceptor()
    this.wsInterceptor.on('message', (msg) => {
      if (this.dispatcher && this.dispatcher.running) this.dispatcher.handleDanmaku(msg)
    })
    this.wsInterceptor.on('ws-connected', (info) => this.emit('ws-connected', info))
    this.wsInterceptor.on('ws-closed', () => this.emit('ws-closed'))
    this.wsInterceptor.attach(this.liveWindow.webContents)
    return { success: true, url: roomUrl }
  }

  /** 解除 WS 拦截并关闭直播窗口 */
  stopCapture() {
    if (this.wsInterceptor) {
      try { this.wsInterceptor.detach() } catch (e) { console.warn('[douyin-driver] interceptor detach failed:', e?.message || String(e)) }
      this.wsInterceptor = null
    }
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      try { this.liveWindow.destroy() } catch { /* ignore */ }
    }
    this.liveWindow = null
  }

  // ------------------------------------------------------------------
  // 弹幕会话（DanmakuDispatcher 装配）
  // ------------------------------------------------------------------

  /**
   * @param {object} cfg 会话配置（对齐前端 startDanmakuSession 参数）
   * @param {string|number} cfg.shopId
   * @param {string} [cfg.shopName]
   * @param {string} [cfg.apiToken]
   * @param {object} [cfg.device] deviceId/deviceName/appVersion/clientPlatform
   */
  async startDanmakuSession(cfg) {
    this.stopDanmakuSession()
    this.dispatcher = new DanmakuDispatcher(
      {
        shopId: cfg.shopId,
        shopName: cfg.shopName || '',
        apiToken: cfg.apiToken || '',
        platformCode: 'douyin',
        device: cfg.device || {},
      },
      { baseUrl: this.baseUrl }
    )
    this.dispatcher.on('display', (items) => this.emit('display', items))
    this.dispatcher.on('resolved', (items) => this.emit('resolved', items))
    this.dispatcher.on('printResults', (items) => this.emit('printResults', items))
    this.dispatcher.on('luckyBagBatchReset', (payload) => this.emit('luckyBagBatchReset', payload))
    await this.dispatcher.loadConfig()
    this.dispatcher.start()
    this.emit('live-status', { active: true })
    return { success: true }
  }

  async stopDanmakuSession() {
    if (this.dispatcher) {
      try { this.dispatcher.stop() } catch (e) { console.warn('[douyin-driver] dispatcher stop failed:', e?.message || String(e)) }
      this.dispatcher = null
    }
    this.emit('live-status', { active: false })
  }

  /** 暂停/恢复弹幕处理 */
  setPaused(paused) {
    if (this.dispatcher) this.dispatcher.setPaused(Boolean(paused))
  }

  /** 热重载扣数配置（直播中改规则） */
  async reloadConfig() {
    if (this.dispatcher) await this.dispatcher.reloadConfig()
  }

  /** 全停（窗口 + 拦截 + 会话） */
  stop() {
    this.stopDanmakuSession()
    this.stopCapture()
  }

  get isLive() {
    return Boolean(this.liveWindow && !this.liveWindow.isDestroyed())
  }
}

module.exports = { DouyinLiveDriver }
