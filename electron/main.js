/**
 * 扣单宝 Electron 壳（真实平台接入版）
 * ==================================================================
 * 官方 preload 桥 + 本地 mock 后端。支持真实登录平台账号：
 *   platform:login → 打开平台登录窗口 → 用户登录 → 采集会话 cookie
 *   → 回传 mock 后端绑定店铺
 *
 * 平台登录窗口加载真实平台地址（抖音/淘宝/小红书/视频号），
 * 用户用自己账号扫码/密码登录后，主进程采集该会话的全部 cookie
 * （含 HttpOnly），作为 shop_curl/raw_data 存入本地 mock。
 */
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const { ElectronPrintService } = require('./main/electron-print')
const { DouyinLiveDriver } = require('./main/douyin-live-driver')

let MOCK_BASE = process.env.KOUDANBAO_URL || ''
const DEVTOOLS = process.env.KOUDANBAO_DEVTOOLS === '1'
let backendProcess = null

// M2：真实能力服务（Electron 系统打印 + 抖音弹幕驱动）
const printService = new ElectronPrintService(path.join(__dirname, 'resources'))
const douyinDriver = new DouyinLiveDriver()

function authDoneUrl() { return MOCK_BASE + '/__kdb_auth_done' }

const PLATFORM_LOGIN_URLS = {
  // 抖音直播/主播账号（live）→ 抖音主播中控台；抖店/订单店铺 → 巨量百应/抖店后台
  douyin: 'https://anchor.douyin.com/login',
  douyin_store: 'https://buyin.jinritemai.com/mpa/account/login',
  douyin_talent: 'https://anchor.douyin.com/login',
  taobao: 'https://liveplatform.taobao.com/live/liveAdmin.htm',
  xiaohongshu: 'https://creator.xiaohongshu.com/login',
  channels: 'https://channels.weixin.qq.com/platform',
  wxstore: 'https://channels.weixin.qq.com/platform',
}

let mainWindow = null
let platformSessions = {}

function resolvePackagedBackendPath() {
  const exeName = process.platform === 'win32' ? 'koudanbao-backend.exe' : 'koudanbao-backend'
  const candidates = [
    path.join(process.resourcesPath || '', 'backend', exeName),
    path.join(process.resourcesPath || '', exeName),
  ]
  return candidates.find((p) => p && fs.existsSync(p)) || candidates[0]
}

function stopBackend() {
  if (!backendProcess) return
  const child = backendProcess
  backendProcess = null
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' })
    } else {
      child.kill('SIGTERM')
    }
  } catch {
    try { child.kill() } catch {}
  }
}

function ensureBackend() {
  if (MOCK_BASE) return Promise.resolve(MOCK_BASE)
  if (backendProcess) return Promise.resolve(MOCK_BASE)

  const host = process.env.KDB_BACKEND_HOST || '127.0.0.1'
  const port = process.env.KDB_BACKEND_PORT || '0'
  const dataDir = process.env.KDB_DATA_DIR || path.join(app.getPath('userData'), 'data')
  const commonArgs = ['--host', host, '--port', port, '--print-json-ready']
  let command
  let args
  let cwd

  if (app.isPackaged) {
    command = resolvePackagedBackendPath()
    args = commonArgs
    cwd = path.dirname(command)
  } else {
    // dev：可用 KDB_BACKEND_EXE 指定 Rust 版后端（如 backend-dist/koudanbao-backend.exe），
    // 否则回退 backend-dist 构建产物；都没有则报错提示
    const rustExe = process.env.KDB_BACKEND_EXE
    const backendName = process.platform === 'win32' ? 'koudanbao-backend.exe' : 'koudanbao-backend'
    const fallbackExe = path.join(__dirname, '..', 'backend-dist', backendName)
    command = rustExe || (fs.existsSync(fallbackExe) ? fallbackExe : '')
    args = commonArgs
    cwd = command ? path.dirname(command) : process.cwd()
  }

  return new Promise((resolve, reject) => {
    let settled = false
    if (!command) {
      reject(new Error('未找到本地后端。请先运行 npm run build:backend 生成 backend-dist/koudanbao-backend.exe，或通过 KDB_BACKEND_EXE 指定后端路径'))
      return
    }
    let buffer = ''
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      stopBackend()
      reject(new Error('后端启动超时'))
    }, Number(process.env.KDB_BACKEND_READY_TIMEOUT_MS || 20000))

    const finish = (err, url) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (err) {
        stopBackend()
        reject(err)
      } else {
        MOCK_BASE = url
        console.log('[backend] ready:', MOCK_BASE, 'dataDir=', dataDir)
        resolve(MOCK_BASE)
      }
    }

    try {
      backendProcess = spawn(command, args, {
        cwd,
        env: { ...process.env, KDB_DATA_DIR: dataDir },
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (e) {
      finish(e)
      return
    }

    backendProcess.stdout.on('data', (chunk) => {
      buffer += chunk.toString('utf8')
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.trim()) console.log('[backend]', line)
        const trimmed = line.trim()
        if (trimmed.startsWith('{')) {
          try {
            const msg = JSON.parse(trimmed)
            if (msg && msg.event === 'ready' && msg.url) finish(null, msg.url)
          } catch {}
        }
      }
    })
    backendProcess.stderr.on('data', (chunk) => {
      const text = chunk.toString('utf8').trim()
      if (text) console.error('[backend]', text)
    })
    backendProcess.on('error', (err) => finish(err))
    backendProcess.on('exit', (code, signal) => {
      if (!settled) finish(new Error(`后端提前退出：code=${code} signal=${signal}`))
    })
  })
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    title: '扣单宝',
    webPreferences: {
      preload: path.join(__dirname, 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })
  if (DEVTOOLS) mainWindow.webContents.openDevTools()
  mainWindow.loadURL(MOCK_BASE)
  mainWindow.on('closed', () => (mainWindow = null))
}

/** 采集 WebContents 会话的全部 cookie（含 HttpOnly） */
async function collectCookies(webContents) {
  const cookies = await webContents.session.cookies.get({})
  return cookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    secure: c.secure,
    httpOnly: c.httpOnly,
    hostOnly: c.hostOnly,
    sameSite: c.sameSite,
  }))
}

/** 从已登录的平台页面快速提取当前账号资料（昵称/UID/头像）——有界，绝不卡死 */
async function extractAccountProfile(webContents) {
  try {
    // 只搜已知/常见全局键，且限深 4 层，避免在大页面上深度递归卡死
    const raw = await webContents.executeJavaScript(`
      (function() {
        var KEYS = ['__INITIAL_STATE__', '__NUXT__', '__PRELOADED_STATE__', '__ROOT_STATE__',
                    '__NEXT_DATA__', '__APP__', '__STORE__', 'globalData', 'userInfo', 'user',
                    '__REACT_DEVTOOLS_GLOBAL_HOOK__', 'appUser', 'loginUser', 'accountInfo',
                    'UserInfo', 'userInfo_', '_USER_INFO', '__USER__', 'state'];
        var COUNT = 0;
        function findUser(obj, depth) {
          if (!obj || depth > 4 || typeof obj !== 'object' || (++COUNT) > 200000) return null;
          try {
            var nick = obj.nickname || obj.nick_name || obj.nickName || obj.user_name || obj.account_name;
            var uid = obj.uid || obj.user_id || obj.userId || obj.sec_uid || obj.secUid || obj.sec_user_id;
            var avatar = obj.avatar || obj.avatar_url || obj.avatarUrl || obj.avatar_thumb ||
                         (obj.user_info && obj.user_info.avatar_url);
            if (typeof nick === 'string' && nick && nick.indexOf('*') === -1 &&
                (typeof uid === 'string' || typeof uid === 'number') && String(uid)) {
              return { nickname: nick, uid: String(uid), avatar: avatar || '' };
            }
          } catch (e) {}
          var keys = Object.keys(obj);
          if (keys.length > 200) return null;
          for (var i = 0; i < keys.length; i++) {
            try { var r = findUser(obj[keys[i]], depth + 1); if (r) return r; } catch (e) {}
          }
          return null;
        }
        try {
          for (var i = 0; i < KEYS.length; i++) {
            try {
              var root = window[KEYS[i]];
              if (!root) continue;
              var r = findUser(root, 0);
              if (r) return JSON.stringify(r);
            } catch (e) {}
          }
        } catch (e) {}
        // 兜底：页面标题里可能含昵称（如 "XXX - 抖音直播"）
        try { return JSON.stringify({ nickname: document.title.replace(/\s*[-_|]\s*.*$/, ''), uid: '', avatar: '' }); } catch (e) {}
        return '';
      })()
    `, true)
    if (raw) {
      const p = JSON.parse(raw)
      if (p && p.nickname) return { nickname: p.nickname, uid: p.uid || '', avatar: p.avatar || '' }
    }
  } catch (e) {
    console.log('[auth] 提取账号资料失败:', String(e).slice(0, 100))
  }
  return null
}

/** 注入悬浮「完成授权」按钮；点击后跳转到本地标记 URL 触发主进程采集 */
function injectFinishButton(win) {
  win.webContents.executeJavaScript(`
    (function () {
      if (document.getElementById('__kdb_finish')) return;
      var b = document.createElement('button');
      b.id = '__kdb_finish';
      b.textContent = '✅ 已登录，完成授权';
      b.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:999999;' +
        'padding:10px 18px;background:#4f46e5;color:#fff;border:none;' +
        'border-radius:8px;font-size:14px;cursor:pointer;' +
        'box-shadow:0 2px 12px rgba(0,0,0,.3);';
      b.onclick = function () { window.location.href = ${JSON.stringify(authDoneUrl())}; };
      document.body.appendChild(b);
    })();
  `).catch(() => {})
}

function openPlatformLogin(platformCode, shopId, loginUrl, subject) {
  return new Promise((resolve) => {
    // mock 假 URL（含 mock_oauth 标记）→ 用真实平台登录地址
    const isMockUrl = typeof loginUrl === 'string' && loginUrl.includes('mock_oauth')
    let fallback = PLATFORM_LOGIN_URLS[platformCode]
    if (platformCode === 'douyin' && subject !== 'order_shop') fallback = PLATFORM_LOGIN_URLS.douyin
    if (platformCode === 'douyin' && subject === 'order_shop') fallback = PLATFORM_LOGIN_URLS.douyin_store
    const url = isMockUrl || !loginUrl
      ? fallback || PLATFORM_LOGIN_URLS.douyin
      : loginUrl
    const win = new BrowserWindow({
      width: 1000,
      height: 760,
      title: `${platformCode} 授权登录`,
      webPreferences: { sandbox: false, nodeIntegration: false },
    })
    let finished = false
    let autoFinishTimer = null
    let loginUrlHost = ''
    try { loginUrlHost = new URL(url).hostname } catch {}

    const doFinish = async () => {
      if (finished) return
      finished = true
      if (autoFinishTimer) { clearTimeout(autoFinishTimer); autoFinishTimer = null }
      // 超时兜底：任何一步卡住 5s 内也返回（避免授权窗口永久卡死）
      const timer = setTimeout(() => { try { win.destroy() } catch {} }, 5000)
      try {
        const cookies = await collectCookies(win.webContents)
        const profile = await Promise.race([
          extractAccountProfile(win.webContents),
          new Promise((r) => setTimeout(() => r(null), 3000)),
        ])
        const currentUrl = win.webContents.getURL()
        if (profile) console.log(`[auth] 已提取真实账号: ${profile.nickname} (uid=${profile.uid})`)
        win.destroy()
        clearTimeout(timer)
        resolve({ success: true, cookies, url: currentUrl, profile })
      } catch (e) {
        try { win.destroy() } catch {}
        clearTimeout(timer)
        resolve({ success: false, error: String(e) })
      }
    }

    // 检测到标记 URL → 用户点了「完成授权」
    win.webContents.on('will-navigate', (_event, targetUrl) => {
      if (targetUrl.startsWith(authDoneUrl())) {
        _event.preventDefault()
        doFinish()
      }
    })
    // 登录成功后（URL 离开登录页，跳到平台域内）→ 自动完成授权
    const checkLoggedIn = (targetUrl) => {
      if (targetUrl.startsWith(authDoneUrl())) return doFinish()
      if (finished) return
      if (!loginUrlHost) return
      let host = ''
      try { host = new URL(targetUrl).hostname } catch {}
      const isLoginPath = /\/login(\/|$|\?)/.test(targetUrl) || targetUrl.includes('login/common') || targetUrl.includes('qrlogin')
      const onPlatformDomain = host === loginUrlHost || host.endsWith(loginUrlHost) || loginUrlHost.endsWith(host)
      if (onPlatformDomain && !isLoginPath && !autoFinishTimer) {
        console.log(`[auth] 检测到登录成功（${targetUrl}），自动完成授权`)
        autoFinishTimer = setTimeout(() => { if (!finished) doFinish() }, 2500) // 等 cookie 落定
      }
    }
    win.webContents.on('did-navigate', (_e, targetUrl) => checkLoggedIn(targetUrl))
    win.webContents.on('did-navigate-in-page', (_e, _isMainFrame, targetUrl) => checkLoggedIn(targetUrl))
    win.webContents.on('did-finish-load', () => injectFinishButton(win))
    // 窗口关闭兜底：若已登录则采集保存
    win.on('close', () => {
      if (!finished && autoFinishTimer) {
        // 登录成功但用户关了窗口 → 仍采集 cookie 保存
        collectCookies(win.webContents).then((cookies) => {
          finished = true
          resolve({ success: true, cookies, url: win.webContents.getURL() })
        }).catch(() => {
          finished = true
          resolve({ success: false, error: '授权窗口已关闭' })
        })
      }
    })
    win.on('closed', () => {
      if (!finished) {
        finished = true
        if (autoFinishTimer) { clearTimeout(autoFinishTimer); autoFinishTimer = null }
        resolve({ success: false, error: '授权窗口已关闭' })
      }
    })

    win.loadURL(url)
  })
}

ipcMain.handle('platform:login', async (_evt, platformCode, shopId, loginUrl) => {
  const result = await openPlatformLogin(platformCode, shopId, loginUrl)
  if (!result.success) return result
  platformSessions[platformCode] = result
  // 回传 mock 后端绑定店铺（cookie 作为 raw_data/shop_curl）
  try {
    const resp = await fetch(`${MOCK_BASE}/shops/platform-app/authorization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({
        platform_code: platformCode,
        shop_name: `${platformCode} 授权店铺`,
        auth_subject: 'live_room',
        raw_data: { session: result.cookies, url: result.url, captured_at: new Date().toISOString() },
        shop_curl: { cookies: result.cookies, url: result.url },
      }),
    })
    const data = await resp.json()
    return { success: true, data, session: result }
  } catch (e) {
    return { success: false, error: String(e) }
  }
})

// 兼容官方 preload 的其他 IPC
ipcMain.handle('platform:disconnect', async () => ({ success: true }))
ipcMain.handle('app:version', () => app.getVersion())
ipcMain.handle('app:device-info', () => ({ deviceId: 'kdb-local-device', platform: process.platform }))
ipcMain.handle('app:quit', () => app.quit())

// ==================================================================
// 完整 IPC 面（对齐官方 preload 暴露的全部 channel）
// 无真实主进程能力的 channel 返回 mock 值；弹幕/连接事件走模拟发生器。
// ==================================================================
const MOCK_NICKNAMES = ['小明', '小红', '小黑', '阿强', '静静', '老王', '小龙', '燕子']
let danmakuTimer = null
let danmakuSeq = 0
let danmakuActive = false
let gridNo = 0

function emit(channel, payload) {
  const w = BrowserWindow.getAllWindows()[0]
  if (w && !w.isDestroyed()) w.webContents.send(channel, payload)
}

function spawnMockDanmaku() {
  danmakuSeq += 1
  const nickname = MOCK_NICKNAMES[danmakuSeq % MOCK_NICKNAMES.length]
  const commentId = 'mock-' + Date.now() + '-' + danmakuSeq
  emit('danmaku:display', [{
    commentId, nickname, content: '来了来了', type: 'chat',
    timestamp: new Date().toISOString(),
  }])
  gridNo = (gridNo % 12) + 1
  emit('danmaku:resolved', [{
    commentId, nickname, content: '来了来了',
    matched_content: String(gridNo), grid_no: gridNo,
    batch_no: 'MOCKBATCH', status: 'matched', num_index: danmakuSeq,
    product_relation: { price: String(gridNo), product_no: 'A' + String(gridNo).padStart(3, '0') },
  }])
  emit('danmaku:stats', { viewerCount: 0, likeCount: 0 })
}

function startDanmakuMock() {
  if (danmakuTimer) return
  danmakuActive = true
  emit('live:status', { active: true })
  emit('connection:status', { type: 'connection', status: 'connected' })
  danmakuTimer = setInterval(spawnMockDanmaku, 1500)
}

function stopDanmakuMock() {
  if (danmakuTimer) { clearInterval(danmakuTimer); danmakuTimer = null }
  danmakuActive = false
  emit('live:status', { active: false })
}

// --- 弹幕会话（M2：抖音真实弹幕优先，无直播间地址时回退 mock） ---

/** 抖音直播间地址解析：roomUrl > roomId > storeShopRawData 兜底 */
function resolveDouyinRoomUrl(params) {
  const p = params || {}
  if (typeof p.roomUrl === 'string' && p.roomUrl.trim()) return p.roomUrl.trim()
  if (typeof p.roomId === 'string' && p.roomId.trim()) return `https://live.douyin.com/${p.roomId.trim()}`
  if (typeof p.roomId === 'number' && p.roomId > 0) return `https://live.douyin.com/${p.roomId}`
  const raw = p.storeShopRawData
  if (raw && typeof raw === 'object') {
    if (typeof raw.url === 'string' && /live\.douyin\.com/.test(raw.url)) return raw.url
    if (typeof raw.roomUrl === 'string' && raw.roomUrl.trim()) return raw.roomUrl.trim()
    if (raw.roomId) return `https://live.douyin.com/${raw.roomId}`
  }
  return ''
}

let douyinDriverWired = false
function wireDouyinDriverEvents() {
  if (douyinDriverWired) return
  douyinDriverWired = true
  douyinDriver.on('display', (items) => emit('danmaku:display', items))
  douyinDriver.on('resolved', (items) => emit('danmaku:resolved', items))
  douyinDriver.on('printResults', (items) => emit('print:results', items))
  douyinDriver.on('luckyBagBatchReset', (payload) => emit('danmaku:lucky-bag-batch-reset', payload))
  douyinDriver.on('live-status', (status) => emit('live:status', { platformCode: 'douyin', reportedAt: Date.now(), ...status }))
  douyinDriver.on('ws-connected', (info) => emit('connection:status', { type: 'connection', status: 'connected', ...info }))
  douyinDriver.on('ws-closed', () => emit('connection:status', { type: 'connection', status: 'disconnected' }))
}

// --- 直播间地址记忆 + 弹窗收集（不依赖前端改动） ---
function roomUrlStorePath() {
  return path.join(app.getPath('userData'), 'douyin-room-urls.json')
}
function loadRoomUrlMap() {
  try { return JSON.parse(fs.readFileSync(roomUrlStorePath(), 'utf8')) } catch { return {} }
}
function saveRoomUrl(shopId, url) {
  try {
    const map = loadRoomUrlMap()
    map[String(shopId)] = url
    fs.writeFileSync(roomUrlStorePath(), JSON.stringify(map, null, 2), 'utf8')
  } catch (e) { console.warn('[douyin-driver] 保存直播间地址失败:', e?.message || String(e)) }
}

/** 弹窗收集抖音直播间地址（data URL 页面 + will-navigate 传值） */
function promptRoomUrl(shopName) {
  return new Promise((resolve) => {
    let settled = false
    const finish = (url) => {
      if (settled) return
      settled = true
      try { win.destroy() } catch { /* ignore */ }
      resolve(url || '')
    }
    const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>抖音直播间地址</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 24px; }
        h3 { margin: 0 0 12px; font-size: 15px; }
        p { margin: 0 0 12px; color: #666; font-size: 12px; line-height: 1.6; }
        input { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
        .row { display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end; }
        button { padding: 6px 16px; border-radius: 6px; font-size: 13px; cursor: pointer; border: 1px solid #d1d5db; background: #fff; }
        button.primary { background: #4f46e5; color: #fff; border-color: #4f46e5; }
      </style></head><body>
      <h3>接入抖音真实弹幕</h3>
      <p>请输入要监听弹幕的抖音直播间地址（形如 https://live.douyin.com/123456789），<br/>或直播间房间号。本地址仅保存在本机。</p>
      <input id="url" placeholder="https://live.douyin.com/ 或 房间号" autofocus />
      <div class="row"><button onclick="location.href='kdb-room-url://cancel'">取消</button>
      <button class="primary" onclick="submit()">确定</button></div>
      <script>
        function submit() {
          var v = document.getElementById('url').value.trim();
          if (!v) return;
          if (!/^https?:\\/\\//.test(v)) v = 'https://live.douyin.com/' + v;
          location.href = 'kdb-room-url://' + encodeURIComponent(v);
        }
        document.getElementById('url').addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      </script></body></html>`
    const win = new BrowserWindow({
      width: 520,
      height: 300,
      title: `抖音直播间地址（${shopName || '扣单宝'}）`,
      resizable: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    })
    win.webContents.on('will-navigate', (_event, targetUrl) => {
      if (targetUrl.startsWith('kdb-room-url://')) {
        _event.preventDefault()
        const raw = targetUrl.slice('kdb-room-url://'.length)
        finish(raw === 'cancel' ? '' : decodeURIComponent(raw))
      }
    })
    win.on('closed', () => finish(''))
    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
  })
}

ipcMain.handle('danmaku:startSession', async (_e, params) => {
  const p = params || {}
  const isDouyin = !p.platformCode || p.platformCode === 'douyin'
  if (isDouyin) {
    let roomUrl = resolveDouyinRoomUrl(p)
    if (!roomUrl) {
      const remembered = loadRoomUrlMap()[String(p.shopId)] || loadRoomUrlMap().default
      if (remembered) roomUrl = remembered
    }
    if (!roomUrl) {
      // 首次使用：弹窗收集直播间地址并记忆（不依赖前端改动）
      roomUrl = await promptRoomUrl(p.shopName || '抖音直播间')
      if (roomUrl) saveRoomUrl(p.shopId, roomUrl)
    }
    if (roomUrl) {
      try {
        wireDouyinDriverEvents()
        await douyinDriver.startCapture({ shopId: p.shopId, roomUrl })
        await douyinDriver.startDanmakuSession({
          shopId: p.shopId,
          shopName: p.shopName || '',
          apiToken: p.apiToken || '',
          device: {
            deviceId: p.deviceId,
            deviceName: p.deviceName,
            appVersion: p.appVersion,
            clientPlatform: p.clientPlatform,
          },
        })
        emit('live:status', { active: true, platformCode: 'douyin', shopId: p.shopId })
        emit('connection:status', { type: 'connection', status: 'connected' })
        return { success: true, real: true }
      } catch (err) {
        return { success: false, error: err?.message || String(err) }
      }
    }
    // 用户取消输入 → 回退 mock 并提示
    startDanmakuMock()
    emit('live:status', { active: true })
    return { success: true, mock: true, warning: '未提供直播间地址，已使用模拟弹幕。' }
  }
  // 非抖音平台（淘宝/小红书/视频号）暂用 mock
  startDanmakuMock()
  emit('live:status', { active: true })
  return { success: true, mock: true }
})
ipcMain.handle('danmaku:stopSession', async () => {
  douyinDriver.stop()
  stopDanmakuMock()
  emit('live:status', { active: false })
  return { success: true }
})
ipcMain.handle('danmaku:resetBatch', async () => ({ success: true }))
ipcMain.handle('danmaku:resetLuckyBagBatch', async () => {
  emit('danmaku:lucky-bag-batch-reset', { success: true })
  return { success: true }
})
ipcMain.handle('danmaku:setPaused', async (_e, p) => {
  const paused = !!(p && p.paused)
  douyinDriver.setPaused(paused)
  if (paused) stopDanmakuMock(); else startDanmakuMock()
  return { success: true }
})
ipcMain.handle('danmaku:reloadConfig', async () => {
  await douyinDriver.reloadConfig().catch(() => {})
  return { success: true }
})

// --- 订单同步 / 备注 / 身份解析 ---
ipcMain.handle('orders:sync', async () => ({ success: true, status: 'success', count: 0, syncedOrders: [], message: '本地mock：无真实订单' }))
ipcMain.handle('orders:retry-decrypt-and-remark', async () => ({ success: true, data: { job: { status: 'success', total_count: 0, success_count: 0, failed_count: 0 } } }))
ipcMain.handle('orders:batch-remark', async () => ({ success: true, data: { job: { status: 'success', total_count: 0, success_count: 0, failed_count: 0 } } }))
ipcMain.handle('orders:resolve-identity', async (_e, p) => ({ success: true, data: { nickname: (p && p.nickname) || '', identity: null } }))
ipcMain.handle('orders:get-nickname', async (_e, p) => ({ success: true, data: { nickname: (p && p.nickname) || '' } }))
ipcMain.handle('orders:decrypt-nickname', async (_e, p) => ({ success: true, data: { nickname: (p && p.nickname) || '' } }))

// --- 店铺管理（授权走真实平台登录窗口；其余 mock） ---
ipcMain.handle('shop:authorize', async (_e, params) => {
  const code = (params && params.platformCode) || 'douyin'
  const result = await openPlatformLogin(code, params && params.shopId, params && params.loginUrl, params && params.authSubject)
  if (!result.success) return result
  const profile = result.profile || {}
  const accountName = profile.nickname || `${code} 直播间`
  try {
    const resp = await fetch(`${MOCK_BASE}/shops/platform-app/authorization`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({
        platform_code: code, shop_name: accountName, live_room_name: accountName,
        live_id: profile.uid || ('live-' + Date.now()), platform_shop_id: profile.uid || null,
        live_avatar_url: profile.avatar || null, avatar_url: profile.avatar || null,
        auth_subject: 'live_room',
        raw_data: { session: result.cookies, url: result.url, profile, captured_at: new Date().toISOString() },
        shop_curl: { cookies: result.cookies, url: result.url },
      }),
    })
    const data = await resp.json()
    return { success: true, data, session: result, profile }
  } catch (e) { return { success: false, error: String(e) } }
})
ipcMain.handle('shop:authorizeWechat', async (_e, params) => ({ success: true, data: { status: 'connected' } }))
ipcMain.handle('shop:rebind', async () => ({ success: true, data: { status: 'connected' } }))
ipcMain.handle('shop:commitAuthorization', async () => ({ success: true, data: { status: 'connected' } }))
ipcMain.handle('shop:channelsGetQr', async () => ({ success: true, data: { qrCodeUrl: 'mock://qr', token: 'mock-channels-token', expiresAt: Date.now() + 120000 } }))
ipcMain.handle('shop:channelsCheckLogin', async () => ({ success: true, data: { loggedIn: false, status: 'waiting' } }))
ipcMain.handle('shop:channelsBindSession', async () => ({ success: true, data: { bound: true } }))
ipcMain.handle('shop:switch', async () => ({ success: true }))
ipcMain.handle('shop:status', async (_e, p) => ({ success: true, data: { status: 'connected', shopId: p && p.shopId } }))
ipcMain.handle('shop:bootstrap', async () => ({ success: true, data: {} }))
ipcMain.handle('shop:deauthorize', async () => { emit('shop:status-changed', { success: true }); return { success: true } })

// --- 打印（M2：真实 Electron 系统打印服务） ---
ipcMain.handle('printer:diagnose', async () => {
  const d = await printService.diagnose()
  return { success: d.available, data: d }
})
ipcMain.handle('electron-print:get-printers', async () => {
  const printers = await printService.getPrinters()
  return { success: true, printers, data: printers }
})
ipcMain.handle('electron-print:print-labels', async (_e, payload) => printService.printLabels(payload || {}))
ipcMain.handle('electron-print:diagnose', async () => printService.diagnose())
ipcMain.handle('electron-print:get-settings', async () => ({ success: true, settings: { closeBehavior: 'tray', askOnClose: true, printProvider: 'electron' } }))
ipcMain.handle('electron-print:update-settings', async (_e, s) => ({ success: true, settings: s }))

// --- 日志 / 客户端设置 / 应用更新 ---
ipcMain.handle('logs:upload', async () => ({ success: true, id: 'mock-log-' + Date.now() }))
ipcMain.handle('client-settings:get', async () => ({ success: true, settings: { closeBehavior: 'tray', askOnClose: true, printProvider: 'electron' } }))
ipcMain.handle('client-settings:update', async (_e, s) => ({ success: true, settings: s }))
ipcMain.handle('app:download-update', async () => ({ success: true }))
ipcMain.handle('app:quit-and-install', async () => ({ success: true }))
ipcMain.handle('app:open-desktop-download-page', async () => ({ success: true }))
ipcMain.handle('app:set-always-on-top', async (_e, enabled) => {
  mainWindow && !mainWindow.isDestroyed() && mainWindow.setAlwaysOnTop(!!enabled)
  return { success: true }
})

// 授权过期事件（前端监听；mock 下不主动触发）
setInterval(() => {
  // no-op heartbeat 保持进程活跃
}, 60000).unref()

app.whenReady().then(async () => {
  await ensureBackend()
  if (process.env.KDB_SMOKE_TEST === '1') {
    // 冒烟自检：打印服务诊断 + 页面加载（验证主进程真实能力装配）
    const diagnose = await printService.diagnose()
    const printers = await printService.getPrinters().catch(() => [])
    createMainWindow()
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('[smoke] page loaded:', mainWindow.webContents.getURL())
      console.log('[smoke] print diagnose:', JSON.stringify(diagnose))
      console.log('[smoke] printers:', JSON.stringify(printers.map((p) => p.name)))
      console.log('[smoke] douyin driver api:', JSON.stringify({
        startCapture: typeof douyinDriver.startCapture,
        startDanmakuSession: typeof douyinDriver.startDanmakuSession,
        stop: typeof douyinDriver.stop,
        wired: douyinDriverWired,
      }))
      app.exit(0)
    })
    mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
      console.error('[smoke] page load failed:', code, desc)
      app.exit(1)
    })
    setTimeout(() => {
      console.error('[smoke] timeout')
      app.exit(1)
    }, 30000)
    return
  }
  createMainWindow()
  // 自测模式（环境变量触发）：打开平台登录窗口并截图，验证登录驱动可用
  if (process.env.KDB_TEST_LOGIN) {
    const platform = process.env.KDB_TEST_LOGIN || 'douyin'
    console.log('[screenshot-login] opening', platform, new Date().toISOString())
    const win = new BrowserWindow({
      width: 1000,
      height: 760,
      title: `${platform} 授权登录`,
      webPreferences: { sandbox: false, nodeIntegration: false },
      show: true,
    })
    win.webContents.on('did-finish-load', () => {
      console.log('[screenshot-login] did-finish-load', win.webContents.getURL())
      setTimeout(async () => {
        try {
          const image = await win.webContents.capturePage()
          require('fs').writeFileSync(path.join(__dirname, 'login-window.png'), image.toPNG())
          console.log('[screenshot-login] captured', new Date().toISOString())
          const cookies = await collectCookies(win.webContents)
          console.log('[screenshot-login] cookies:', cookies.length)
          app.exit(0)
        } catch (e) {
          console.error('[screenshot-login] error', e)
          app.exit(1)
        }
      }, 8000)
    })
    win.loadURL(PLATFORM_LOGIN_URLS[platform] || PLATFORM_LOGIN_URLS.douyin)
  }
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('before-quit', () => {
  douyinDriver.stop()
  stopBackend()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ==================================================================
// 抖音订单解密服务（复刻官方 OrderDecryptService 真实逻辑）
// ==================================================================
// 官方解密不是本地算法，而是：
//   1. 保持一个已登录的抖店后台 tab（持有 csrf_session_id / s_v_web_id / secsdk token）
//   2. 对每个订单号，在该 tab 上下文执行 JS，调用
//      pigeon.jinritemai.com/backstage/conversation_search/user_fuzzy_search
//      用订单号搜索买家
//   3. 从响应提取 user_id / user_name / user_info（真实买家信息）
//   4. POST /api/electron/orders/decrypt-result 回传后端
// ==================================================================

let douyinTab = null // 已登录的抖店后台 tab（解密依赖其会话）

/** 创建/复用抖店后台 tab */
function ensureDouyinTab() {
  if (douyinTab && !douyinTab.isDestroyed()) return douyinTab
  douyinTab = new BrowserWindow({
    width: 1100,
    height: 800,
    show: false, // 后台运行，不打扰用户
    webPreferences: { sandbox: false, nodeIntegration: false },
  })
  douyinTab.on('closed', () => (douyinTab = null))
  return douyinTab
}

/**
 * 在抖店 tab 上下文执行 pigeon 买家搜索（官方 executePigeonSearch 完整逻辑）
 * @param {string} orderNo 订单号
 */
async function pigeonSearchOrder(orderNo) {
  const tab = ensureDouyinTab()
  // 确保抖店已登录（有 csrf 会话）
  const script = `
    new Promise((resolve, reject) => {
      try {
        const w = window;
        const secsdkToken =
          w.secsdk?.csrf?.tokenMap?.['fxg.jinritemai.com']?.value ||
          w.secsdk?.csrf?.tokenMap?.['pigeon.jinritemai.com']?.value ||
          w.secsdk?.csrf?.tokenMap?.['im.jinritemai.com']?.value || '';
        const getCookie = (name) => {
          const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
          return m ? m[2] : '';
        };
        const verifyFp = getCookie('s_v_web_id');
        const csrfSessionId = getCookie('csrf_session_id');
        const fullCsrfHeader = secsdkToken
          ? secsdkToken + ',' + csrfSessionId
          : 'DOWNGRADE,' + csrfSessionId;
        const baseUrl = 'https://pigeon.jinritemai.com/backstage/conversation_search/user_fuzzy_search';
        const queryParams = new URLSearchParams({
          biz_type: '4',
          PIGEON_BIZ_TYPE: '2',
          _ts: Date.now().toString(),
          _pms: '1',
          FUSION: 'true',
          verifyFp: verifyFp
        });
        const requestUrl = baseUrl + '?' + queryParams.toString();
        const bodyData = {
          keyword: ${JSON.stringify(String(orderNo).replace(/\\/g, '\\\\').replace(/'/g, "\\'"))},
          user_search_type: 3,
          online_after_key: '',
          offline_after_key: ''
        };
        const xhr = new XMLHttpRequest();
        xhr.open('POST', requestUrl);
        xhr.withCredentials = true;
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xhr.setRequestHeader('x-secsdk-csrf-token', fullCsrfHeader);
        xhr.timeout = 30000;
        xhr.onloadend = function () {
          resolve({ status: xhr.status, body: xhr.responseText, pageUrl: location.href });
        };
        xhr.onerror = function () { reject(new Error('XHR request failed')); };
        xhr.ontimeout = function () { reject(new Error('XHR request timeout')); };
        xhr.send(JSON.stringify(bodyData).replace(/\\s/g, ''));
      } catch (e) { reject(e); }
    })
  `
  return tab.webContents.executeJavaScript(script, true)
}

/**
 * 从 pigeon 响应提取买家信息（官方 extractUserInfo 完整逻辑）
 */
function extractUserInfo(payload) {
  try {
    const data = payload?.data
    if (!data) return null
    const list =
      data.contact_search_result?.user_search_data_list ||
      data.conversation_search_result?.user_search_data_list ||
      data.search_result ||
      data.users ||
      data.list ||
      data.result ||
      data.items
    if (!list || (Array.isArray(list) && list.length === 0)) return null
    const first = Array.isArray(list) ? list[0] : list
    const info = first.user_search_info || first
    const userId = info.user_id || ''
    const userName = info.nick_name || info.nickname || info.nick || info.user_name || info.name || info.display_name || ''
    // 官方：昵称含 * 视为脱敏失败
    if (!userName || userName.includes('*')) return null
    return { user_id: userId, user_name: userName, user_info: first }
  } catch {
    return null
  }
}

/**
 * 解密单个订单号（在抖店 tab 上下文搜索 + 提取 + 回传）
 */
async function decryptOrder(orderNo, shopId) {
  try {
    const resp = await pigeonSearchOrder(orderNo)
    if (resp.status !== 200) {
      return { success: false, error: `pigeon search failed: HTTP ${resp.status}` }
    }
    const payload = JSON.parse(resp.body)
    const user = extractUserInfo(payload)
    if (!user) {
      return { success: false, error: '未查到买家信息' }
    }
    // 回传后端
    const push = await fetch(`${MOCK_BASE}/api/electron/orders/decrypt-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        order_no: orderNo,
        shop_id: shopId,
        user_id: user.user_id,
        user_name: user.user_name,
        user_info: user.user_info,
      }),
    })
    return { success: push.ok, order_no: orderNo, user_name: user.user_name }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

/** 批量解密订单 */
async function decryptOrders(orders, shopId, onProgress) {
  const results = []
  for (let i = 0; i < orders.length; i++) {
    const orderNo = orders[i]?.shop_order_id || orders[i]?.order_no
    if (!orderNo) continue
    const r = await decryptOrder(orderNo, shopId)
    results.push(r)
    onProgress?.({ total: orders.length, success: results.filter((x) => x.success).length, failed: results.filter((x) => !x.success).length, remaining: orders.length - i - 1, orderNo })
    // 官方节奏：每条之间延迟 1.5s
    await new Promise((res) => setTimeout(res, 1500))
  }
  return { total: orders.length, success: results.filter((x) => x.success).length, failed: results.filter((x) => !x.success).length }
}

// IPC：打开抖店后台 tab（供解密使用）
ipcMain.handle('orders:open-douyin-tab', async (_evt, shopId) => {
  const tab = ensureDouyinTab()
  tab.show()
  await tab.loadURL(PLATFORM_LOGIN_URLS.douyin)
  return { success: true }
})

// IPC：解密订单列表
ipcMain.handle('orders:decrypt', async (_evt, { orders, shopId, onProgress }) => {
  if (!douyinTab || douyinTab.isDestroyed() || !douyinTab.webContents.getURL().includes('jinritemai.com')) {
    return { success: false, error: '抖店后台未登录。请先打开抖店后台完成登录（订单备注页 → 打开抖店后台）' }
  }
  return decryptOrders(orders || [], shopId, onProgress)
})
