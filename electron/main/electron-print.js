/**
 * ElectronPrintService —— Electron 系统打印服务（自研实现）
 * ==================================================================
 * 对齐官方 ElectronPrintService（还原 bundle 6780 模块）行为：
 *   - 打印窗口 + preload 桥（electron-print.html + preload/electron-print.js，逐字节一致）
 *   - 打印队列串行（queueTail）
 *   - webContents.print → 系统打印机（跨平台：Windows/macOS 均可用，用户装好标签打印机驱动即可）
 *   - printer 名含 pdf/xps/onenote/document/virtual → 改出 PDF 预览（printToPDF + saveDialog）
 *   - labels 归一化校验（html 或 data:image/png;base64，尺寸/载荷上限）
 *
 * 依赖（均为逐字节一致文件）：
 *   electron/resources/electron-print.html   —— 打印窗口内容
 *   electron/preload/electron-print.js       —— 打印桥（onLoadContent/contentLoaded/contentFailed）
 *
 * 事件契约：与官方一致。
 * 运行方式：Electron 主进程内实例化后接线 IPC。
 */
const { BrowserWindow, dialog, shell, app } = require('electron')
const path = require('path')
const fs = require('fs')

const MAX_HTML_BYTES = 4 * 1024 * 1024 // 4MB
const MAX_IMAGE_BYTES = 12 * 1024 * 1024 // 12MB
const MAX_LABELS = 100
const PRINT_TIMEOUT_MS = 15000

/** scaleFactor 夹取 100-200（对齐官方 c()） */
function clampScaleFactor(value) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(Math.max(Math.round(n), 100), 200) : 100
}

/** paddingH 夹取 0-300（对齐官方 l()） */
function clampPaddingH(value) {
  const n = Number(value)
  return !Number.isFinite(n) || n <= 0 ? 0 : Math.min(n, 300)
}

/** labels 归一化 + 校验（对齐官方 u()：html 或 png data URL，尺寸/载荷上限） */
function normalizeLabels(labels) {
  if (!Array.isArray(labels) || labels.length === 0) throw new Error('Electron print labels are empty')
  if (labels.length > MAX_LABELS) throw new Error('Electron print label count exceeds 100')
  let htmlBytes = 0
  let imageBytes = 0
  return labels.map((label, index) => {
    const width = Number(label?.width)
    const height = Number(label?.height)
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 10 || width > 300 || height < 10 || height > 300) {
      throw new Error(`Electron print label size is invalid at ${index + 1}`)
    }
    const html = label?.html
    if (
      typeof html === 'string' &&
      html.length > 0 &&
      html.length <= MAX_HTML_BYTES &&
      !/<script[\s>]/i.test(html) &&
      !/\son[a-z]+\s*=/i.test(html) &&
      !/<iframe[\s>]/i.test(html) &&
      !/<object[\s>]/i.test(html) &&
      !/<embed[\s>]/i.test(html)
    ) {
      htmlBytes += Buffer.byteLength(html, 'utf8')
      if (htmlBytes > MAX_HTML_BYTES) throw new Error('Electron print html payload is too large')
      return { html, width, height, paddingH: clampPaddingH(label.paddingH) }
    }
    const image = label?.image
    if (!(typeof image === 'string' && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(image))) {
      throw new Error(`Electron print label html or png image is required at ${index + 1}`)
    }
    imageBytes += Math.ceil((3 * (image.split(',')[1] || '').length) / 4)
    if (imageBytes > MAX_IMAGE_BYTES) throw new Error('Electron print payload is too large')
    return { image, width, height, paddingH: clampPaddingH(label.paddingH) }
  })
}

/** Promise 超时包装（对齐官方 d()） */
function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) }
    )
  })
}

/** 打印 preload 路径（对齐官方 h()） */
function resolvePrintPreload() {
  const candidates = [
    path.join(__dirname, '..', 'preload', 'electron-print.js'),
    path.join(__dirname, '..', '..', 'preload', 'electron-print.js'),
  ]
  return candidates.find((p) => fs.existsSync(p)) || candidates[0]
}

/** 构造打印 HTML（对齐官方 executePrintLabels 内联模板） */
function buildPrintHtml(labels) {
  const first = labels[0]
  const style = `<style>
    * { box-sizing: border-box; }
    @page { size: ${first.width}mm ${first.height}mm; margin: 0; }
    html, body, #print-root { width: ${first.width}mm; margin: 0; padding: 0; overflow: hidden; background: #fff; }
    .print-page { width: ${first.width}mm; height: ${first.height}mm; position: relative; overflow: hidden; background: #fff; contain: strict; }
    .print-label { width: ${first.width}mm; height: ${first.height}mm; position: absolute; left: 0; top: 0; overflow: hidden; background: #fff; contain: strict; }
    .print-content { width: 100%; height: 100%; position: absolute; left: 0; top: 0; overflow: hidden; transform-origin: 0 0; background: #fff; }
    .print-content, .print-content * { page-break-before: auto !important; page-break-after: auto !important; break-before: auto !important; break-after: auto !important; page-break-inside: avoid !important; break-inside: avoid !important; }
    .print-page + .print-page { page-break-before: always; break-before: page; }
    .label { page-break-after: auto !important; break-after: auto !important; overflow: hidden; background: #fff; }
    .print-content > img, .label img { width: 100%; height: 100%; object-fit: fill; display: block; }
    @media print {
      html, body, #print-root { overflow: hidden !important; }
      .print-page { page-break-before: auto; page-break-after: auto; break-before: auto; break-after: auto; }
      .print-page + .print-page { page-break-before: always; break-before: page; }
      .label { page-break-before: auto !important; page-break-after: auto !important; break-before: auto !important; break-after: auto !important; }
    }
  </style>`
  const pages = labels
    .map((label) => {
      const inner = label.html
        ? label.html.replace(/;?\s*(?:page-break-before|page-break-after|page-break-inside|break-before|break-after|break-inside)\s*:\s*[^;"]+;?/gi, ';')
        : `<img src="${label.image}" />`
      return `<section class="print-page"><div class="print-label" style="width:${label.width}mm;height:${label.height}mm"><div class="print-content">${inner}</div></div></section>`
    })
    .join('')
  return `${style}${pages}`
}

class ElectronPrintService {
  constructor(resourcesPath) {
    this.resourcesPath = resourcesPath
    this.printWindow = null
    this.printerDiscoveryWindow = null
    this.printWindowReady = false
    this.queueTail = Promise.resolve()
  }

  /** 系统打印机列表（隐藏探测窗口 getPrintersAsync） */
  async getPrinters() {
    const win = await this.getPrinterDiscoveryWindow()
    return (await win.webContents.getPrintersAsync()).map((p) => ({
      name: p.name,
      isDefault: p.isDefault,
      status: p.status,
    }))
  }

  /** 打印环境诊断（对齐官方 diagnose） */
  async diagnose() {
    try {
      const printers = await this.getPrinters()
      return {
        supported: true,
        available: printers.length > 0,
        printers,
        reason: printers.length > 0 ? 'connected' : 'connected_no_printers',
      }
    } catch (e) {
      return { supported: true, available: false, printers: [], reason: 'unavailable', error: e?.message || String(e) }
    }
  }

  /** 提交打印任务（队列串行） */
  printLabels(payload) {
    const jobId = `electron_print_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const job = this.queueTail
      .catch(() => {})
      .then(() => this.executePrintLabels({ ...payload, jobId }))
    this.queueTail = job.catch(() => {})
    return job
  }

  /** 执行单个打印任务 */
  async executePrintLabels(payload) {
    try {
      const labels = normalizeLabels(payload.labels)
      const requestedName = String(payload.printerName || '').trim()
      const printers = await this.getPrinters()
      const selected = requestedName || printers.find((p) => p.isDefault)?.name || printers[0]?.name || ''
      if (!selected) return { success: false, status: 'submit_failed', jobId: payload.jobId, message: 'No printer available' }
      if (!printers.some((p) => p.name === selected)) {
        return { success: false, status: 'submit_failed', jobId: payload.jobId, message: `Printer not found: ${selected}` }
      }

      const first = labels[0]
      const marginLeft = Math.floor((96 * (payload.paddingH ?? first.paddingH)) / 25.4)
      const win = await this.getPrintWindow()
      await this.loadContent(win, payload.jobId, buildPrintHtml(labels))

      // PDF 类目标 → 走 printToPDF + 保存对话框
      if (/pdf|xps|onenote|document|virtual/i.test(selected)) {
        const previewPath = await this.createCssSizedPdfPreview(win, payload.jobId)
        return previewPath
          ? { success: true, status: 'submitted', jobId: payload.jobId, previewPath, message: `PDF preview generated: ${previewPath}` }
          : { success: false, status: 'submit_failed', jobId: payload.jobId, message: 'PDF preview save canceled' }
      }

      // 系统打印机（跨平台核心路径）
      return await new Promise((resolve) => {
        const timer = setTimeout(
          () => resolve({ success: false, status: 'submit_failed', jobId: payload.jobId, message: 'Electron print timeout' }),
          PRINT_TIMEOUT_MS
        )
        const options = {
          silent: payload.silent !== false,
          deviceName: selected,
          printBackground: true,
          color: true,
          margins: { marginType: 'custom', top: 0, bottom: 0, left: marginLeft, right: 0 },
          landscape: false,
          scaleFactor: clampScaleFactor(payload.scaleFactor),
          pagesPerSheet: 1,
          collate: false,
          copies: 1,
          dpi: { horizontal: 203, vertical: 203 },
          pageSize: { width: Math.round(1000 * first.width), height: Math.round(1000 * first.height) },
        }
        win.webContents.print(options, (success, failureReason) => {
          clearTimeout(timer)
          resolve({ success, status: success ? 'submitted' : 'submit_failed', jobId: payload.jobId, message: success ? undefined : failureReason })
        })
      })
    } catch (e) {
      return { success: false, status: 'submit_failed', jobId: payload.jobId, message: e?.message || String(e) }
    }
  }

  /** 打印机探测窗口（隐藏） */
  async getPrinterDiscoveryWindow() {
    if (this.printerDiscoveryWindow && !this.printerDiscoveryWindow.isDestroyed()) return this.printerDiscoveryWindow
    this.printerDiscoveryWindow = new BrowserWindow({
      width: 300,
      height: 200,
      show: false,
      autoHideMenuBar: true,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
    })
    this.printerDiscoveryWindow.on('closed', () => { this.printerDiscoveryWindow = null })
    await withTimeout(
      this.printerDiscoveryWindow.webContents.loadURL('about:blank'),
      10000,
      'Electron printer discovery window load timeout'
    )
    return this.printerDiscoveryWindow
  }

  /** 打印窗口（加载 electron-print.html） */
  async getPrintWindow() {
    if (this.printWindow && !this.printWindow.isDestroyed()) {
      if (!this.printWindowReady) await this.ensurePrintWindowReady(this.printWindow)
      return this.printWindow
    }
    this.printWindowReady = false
    const preload = resolvePrintPreload()
    this.printWindow = new BrowserWindow({
      width: 400,
      height: 300,
      show: false,
      autoHideMenuBar: true,
      webPreferences: { contextIsolation: true, nodeIntegration: false, preload, sandbox: true },
    })
    this.printWindow.webContents.on('preload-error', (_e, p, err) => {
      console.warn('[ElectronPrint] preload failed', { preloadPath: p, error: err?.message || String(err) })
    })
    this.printWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
      console.warn('[ElectronPrint] page load failed', { errorCode: code, errorDescription: desc, url })
    })
    this.printWindow.on('closed', () => {
      this.printWindowReady = false
      this.printWindow = null
    })
    const htmlPath = this.resolvePrintHtml()
    await withTimeout(this.printWindow.webContents.loadFile(htmlPath), 10000, `Electron print window load timeout: ${htmlPath}`)
    await this.ensurePrintWindowReady(this.printWindow)
    return this.printWindow
  }

  /** electron-print.html 路径解析 */
  resolvePrintHtml() {
    const candidates = [
      path.join(this.resourcesPath, 'electron-print.html'),
      path.join(this.resourcesPath, 'resources', 'electron-print.html'),
      path.join(this.resourcesPath, 'app.asar', 'resources', 'electron-print.html'),
      path.join(__dirname, '..', '..', 'resources', 'electron-print.html'),
    ]
    return candidates.find((p) => fs.existsSync(p)) || candidates[0]
  }

  /** 等待打印桥就绪 */
  async ensurePrintWindowReady(win) {
    if (this.printWindowReady) return
    const ok = await withTimeout(
      win.webContents.executeJavaScript(
        'Boolean(window.electronPrintBridge && window.electronPrintBridge.onLoadContent && window.electronPrintBridge.contentLoaded && window.electronPrintBridge.contentFailed)'
      ),
      10000,
      'Electron print preload not loaded'
    )
    if (!ok) throw new Error(`Electron print preload not loaded: ${resolvePrintPreload()}`)
    this.printWindowReady = true
  }

  /** 向打印窗口注入内容（preload 桥协商） */
  loadContent(win, jobId, html) {
    return new Promise((resolve, reject) => {
      const loadedChannel = `electron-print:content-loaded:${jobId}`
      const failedChannel = `electron-print:content-failed:${jobId}`
      const cleanup = () => {
        clearTimeout(timer)
        ipcMain.removeHandler(loadedChannel)
        ipcMain.removeHandler(failedChannel)
      }
      const timer = setTimeout(() => {
        cleanup()
        reject(new Error('Electron print content load timeout'))
      }, 10000)
      ipcMain.handle(loadedChannel, () => {
        cleanup()
        resolve()
      })
      ipcMain.handle(failedChannel, (_e, message) => {
        cleanup()
        reject(new Error(message || 'Electron print content load failed'))
      })
      win.webContents.send('electron-print:load-content', { jobId, html })
    })
  }

  /** PDF 预览（printToPDF + 保存对话框） */
  async createCssSizedPdfPreview(win, jobId) {
    const result = await dialog.showSaveDialog({
      title: '保存打印预览 PDF',
      defaultPath: path.join(app.getPath('documents'), `${jobId}.pdf`),
      filters: [{ name: 'PDF 文件', extensions: ['pdf'] }],
    })
    if (result.canceled || !result.filePath) return null
    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      margins: { marginType: 'none' },
      landscape: false,
    })
    await fs.promises.writeFile(result.filePath, pdf)
    shell.openPath(result.filePath).catch(() => {})
    return result.filePath
  }
}

module.exports = { ElectronPrintService, normalizeLabels, clampScaleFactor, clampPaddingH }
