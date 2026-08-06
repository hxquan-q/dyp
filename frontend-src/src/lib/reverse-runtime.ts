import * as React from 'react'
import { usePage, useForm, router, Link } from '@inertiajs/react'
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/toast-provider'
import { http } from '@/lib/http'
import dayjs from 'dayjs'
import { xW, rp } from '@/lib/preset-templates'
import { Radio, ShoppingBag } from 'lucide-react'
import axios from 'axios'

/**
 * 反转版 JSX 的运行时兼容层
 * ------------------------------------------------------------------
 * 由官方 bundle 反转的页面使用压缩变量名，这里提供等价映射，
 * 让反转出的 JSX 直接可运行、布局与官方完全一致。
 */
export const Xr = usePage as any
export const Co = useForm as any

/** gl() 返回 useToast + ErrorToastRenderer 组件 */
export function gl() {
  const toast = useToast()
  function ErrorToastRenderer() {
    return null
  }
  return { ...toast, ErrorToastRenderer }
}

/**
 * 官方 Sf() 兼容：toast 参数支持 {title, description, type} 对象
 * 也支持 showSuccess/showError 分离
 */
export function Sf() {
  const { showToast, showError } = useToast()
  const normalize = (arg: any) =>
    typeof arg === 'string' ? arg : (arg?.description || arg?.title || '')
  return {
    showToast: (arg: any) => showToast(normalize(arg)),
    showError: (arg: any) => showError(normalize(arg)),
    showSuccess: (arg: any) => showToast(normalize(arg)),
    toast: (arg: any) => showToast(normalize(arg)),
  }
}

export const Et = router
export const m = React
// 反转版 JSX 既可能是 JSX（直接用 react/jsx-runtime），也可能保留 s.jsx()/s.jsxs() 调用。
// 让 s 同时支持两种形态：可调用（createElement）+ 带 jsx/jsxs/Fragment 方法。
const _s = React.createElement as any
_s.jsx = _jsx
_s.jsxs = _jsxs
_s.Fragment = _Fragment
export const s = _s
export const at = cn

// ---- 官方 HTTP 客户端（zt）----
export const zt = http as any

// ---- dayjs（yn）----
export const yn = dayjs as any

// ---- 共享格式化辅助函数 ----

/** 时间格式化（官方 cm） */
export function cm(v: any) {
  if (v === undefined || v === null || v === '') return ''
  const d = dayjs(v)
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : String(v)
}

/** 短时间格式化（官方 o2）：仅日期 */
export function o2(v: any) {
  if (v === undefined || v === null || v === '') return ''
  const d = dayjs(v)
  return d.isValid() ? d.format('YYYY-MM-DD') : String(v)
}

/** 中文长日期（官方 CM） */
export function CM(v: any) {
  if (v === undefined || v === null || v === '') return ''
  const d = dayjs(v)
  return d.isValid() ? d.format('YYYY年MM月DD日') : String(v)
}

/** 平台代码 -> 图标 URL（官方 za） */
export function za(code: any) {
  const map: Record<string, string> = {
    douyin: '/logo/doudian_logo.png',
    douyin_talent: '/logo/doudian_logo.png',
    taobao: '/logo/taobao_logo.png',
    xiaohongshu: '/logo/xiaohongshu_logo.png',
    channels: '/logo/shipinghao_logo.png',
    wxstore: '/logo/shipinghao_logo.png',
  }
  return map[String(code)] || null
}

/** 金额格式化（官方 jv/oY/rY） */
export function jv(v: any) {
  const n = Number(v ?? 0)
  return isNaN(n) ? '0.00' : n.toFixed(2)
}
export const oY = jv
export const rY = jv

/** 手机号脱敏（官方 aY）：138****0000 */
export function aY(phone: any) {
  const p = String(phone ?? '')
  if (p.length !== 11) return p || '-'
  return `${p.slice(0, 3)}****${p.slice(7)}`
}

// ---- 页面级数据常量（官方公共常量）----

/** 平台选项（官方 mv） */
export const mv = [
  { label: '抖音', value: 5 },
  { label: '小红书', value: 8 },
  { label: '淘宝', value: 1 },
  { label: '视频号', value: 9 },
]

/** 订单状态映射（官方 s2） */
export const s2: Record<string, string> = { 0: '待支付', 1: '已支付', 2: '已取消', 3: '已退款' }

/** 支付方式映射（官方 eY） */
export const eY: Record<string, string> = { alipay: '支付宝', wechat: '微信支付' }

/** 退款状态映射（官方 tY） */
export const tY: Record<string, string> = { pending: '退款中', succeeded: '已退款', failed: '退款失败' }

/** 每页条数（官方 CG） */
export const CG = 100

/** 可打印店铺类型（官方 EG） */
export const EG = new Set(['live_room', 'shop'])

/** 客户端默认设置（官方 ii） */
export const ii = { closeBehavior: 'exit', askOnClose: true, printProvider: 'auto' }

/** 设备信息（官方 Bm）：返回缓存的设备信息 */
export function Bm() {
  return _kdbDeviceUl || (window as any).__kdbDeviceInfo || null
}

// ---- 共享运行时辅助（Login/Register/Index 等页面依赖）----

/** 短信冷却 key / 秒数（官方 Lx/dj/Bx/fj） */
export const Lx = 'forgot_password_sms_cooldown_until'
export const dj = 60
export const Bx = 'register_sms_cooldown_until'
export const fj = 60

const _kdbDeviceIdKey = 'koudanbao:electron-device-id'
let _kdbDeviceUl: any = null
let _kdbDeviceMd: any = null

function _yb() {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) return window.crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/** 设备 id（官方 XB）：localStorage 持久化 */
function _xb() {
  try {
    const e = localStorage.getItem(_kdbDeviceIdKey)
    if (e) return e
    const t = _yb()
    localStorage.setItem(_kdbDeviceIdKey, t)
    return t
  } catch {
    return _yb()
  }
}

/** 设备信息兜底（官方 uj） */
async function _uj() {
  if (typeof window === 'undefined' || !window.electronAPI) return null
  let v = ''
  if (typeof window.electronAPI.getAppVersion === 'function') {
    try { v = await window.electronAPI.getAppVersion() } catch { v = '' }
  }
  return {
    deviceId: _xb(),
    deviceName: 'Electron Client',
    platform: (navigator as any).userAgentData?.platform || navigator.platform || '',
    appVersion: v,
  }
}

/** 设备信息规范化（官方 QB） */
function _QB(e: any) {
  if (!e || typeof e !== 'object') return null
  const t = String(e.deviceId || e.device_id || '').trim()
  return t
    ? {
        deviceId: t,
        deviceName: String(e.deviceName || e.device_name || '').trim(),
        platform: String(e.platform || '').trim(),
        appVersion: String(e.appVersion || e.app_version || '').trim(),
      }
    : null
}

/** 获取设备信息（官方 bp）：优先 getDeviceInfo，失败回退 uj */
export async function bp() {
  if (typeof window === 'undefined' || !window.electronAPI) return null
  const api = window.electronAPI
  if (_kdbDeviceUl) return _kdbDeviceUl
  if (!_kdbDeviceMd) {
    _kdbDeviceMd = Promise.resolve()
      .then(async () => {
        if (typeof api.getDeviceInfo !== 'function') {
          const t = await _uj()
          _kdbDeviceUl = t
          return t
        }
        const e = _QB(await api.getDeviceInfo()) || (await _uj())
        _kdbDeviceUl = e
        return e
      })
      .finally(() => {
        _kdbDeviceMd = null
      })
  }
  return _kdbDeviceMd
}

/** 设备请求头（官方 yf） */
export function yf(e: any, t: any = _kdbDeviceUl) {
  if (!e || !t?.deviceId) return e
  e['X-Koudanbao-Client'] = 'electron'
  e['X-Koudanbao-Device-Id'] = t.deviceId
  if (t.deviceName) e['X-Koudanbao-Device-Name'] = t.deviceName
  if (t.platform) e['X-Koudanbao-Platform'] = t.platform
  if (t.appVersion) e['X-Koudanbao-App-Version'] = t.appVersion
  return e
}

/** 设备头对象（官方 ZB） */
export function ZB(e: any = _kdbDeviceUl) {
  const t: Record<string, string> = {}
  return yf(t, e)
}

/** 普通 axios 实例（官方 kn）：无 X-Requested-With，用于纯 JSON API */
export const kn = axios.create()

/** 文档标题组件（官方 OE=WL）：设置 document.title + 渲染子节点 */
export function OE({ children, title }: any) {
  React.useEffect(() => {
    const prev = document.title
    if (title) document.title = title
    return () => {
      document.title = prev
    }
  }, [title])
  return children || null
}

/** Inertia Link（官方 So=PE） */
export const So = Link as any


/** 模板默认字段（官方 qd，简化版） */
const DEFAULT_TEMPLATE_FIELDS = [
  { id: 1, aliasName: '店铺名称', showName: '店铺名称', testValue: '阳光小铺', value: '<%=data.mallName%>', width: 120, height: 18, top: 1, left: 1, fontSize: 8, fontFamily: 'SimHei', fontWeight: 'normal', isChecked: true, showHeader: false },
  { id: 3, aliasName: '序号', showName: '序号', testValue: '1', value: '<%=data.index%>', width: 193, height: 18, top: 59, left: 0.5, fontSize: 10, fontFamily: 'SimHei', fontWeight: 'normal', isChecked: true, showHeader: false },
  { id: 4, aliasName: '昵称', showName: '昵称', testValue: '聪明小狗', value: '<%=data.nickname%>', width: 194, height: 18, top: 21.5, left: 0, fontSize: 13, fontFamily: 'SimHei', fontWeight: 'bold', isChecked: true, showHeader: true },
  { id: 10, aliasName: '永久编号', showName: '永久编号', testValue: '4563', value: '<%=data.permanentNumber%>', width: 70.5, height: 18, top: 0, left: 123.5, fontSize: 8, fontFamily: 'SimHei', fontWeight: 'normal', isChecked: true, showHeader: false },
]

/** 模板字段解析（官方 jW） */
export function jW(raw: any) {
  if (!raw) return JSON.parse(JSON.stringify(DEFAULT_TEMPLATE_FIELDS))
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : JSON.parse(JSON.stringify(DEFAULT_TEMPLATE_FIELDS))
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_TEMPLATE_FIELDS))
  }
}

/** clamp 辅助（官方 am） */
export function am(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max)
}

/** 尺寸 key 去前缀（官方 li）：模板/50mm*30mm -> 50mm*30mm */
export function li(e: any = '') {
  return String(e).replace(/^模板\//, '')
}

/** 模板字体选项（官方 _W） */
export const _W = [
  { label: '黑体', value: 'SimHei' },
  { label: '宋体', value: 'SimSun' },
  { label: '微软雅黑', value: 'Microsoft YaHei' },
]

/** 自定义尺寸标记（官方 Vd） */
export const Vd = 'custom'

/** 模板尺寸解析（官方 Em）：按 size 找预置模板，否则用宽高 */
export function Em({ size, width, height }: any = {}) {
  if (size) {
    const key = li(size)
    const found = rp.find((f: any) => f.size === size || li(f.size) === key)
    if (found) return found
  }
  return { size: 'custom', width, height }
}

/** 尺寸弹窗初始化（官方 vW） */
export function vW({ initialSize, initialWidth, initialHeight }: any) {
  const found = Em({ size: initialSize, width: initialWidth, height: initialHeight })
  return found
    ? {
        selectedSize: li(found.size),
        customWidth: String(found.width || ''),
        customHeight: String(found.height || ''),
      }
    : { selectedSize: Vd, customWidth: String(initialWidth || ''), customHeight: String(initialHeight || '') }
}

// ---- 打印服务（官方 cn，简化实现）----
export const cnService = {
  isElectronProvider: () => true,
  isConnected: () => true,
  getPrint: () => ({ isReady: true }),
  loadPrinters: async (_type: any, opts: any) => {
    if (opts?.onPrinters) opts.onPrinters([])
  },
  printForTag: async () => {},
  showPrinterGuide: () => {},
  isTypeSupported: () => true,
}

/** 打印 provider 变更事件名（官方 nc） */
export const nc = 'kdb:print-provider-changed'

/** Sidebar 状态 hook（官方 vi）：返回 { state, open } */
export function vi() {
  return { state: 'expanded', open: true }
}

/** Notes 默认状态（官方 bG） */
export const bG = 20

/** 读取当前打印 provider（官方 fq，从 localStorage） */
export function fq() {
  try {
    return localStorage.getItem('KDB_PRINT_PROVIDER') || 'auto'
  } catch {
    return 'auto'
  }
}

/** 打印 provider 读取辅助（官方 RR） */
export function RR() {
  return typeof window !== 'undefined' && Boolean((window as any).electronAPI)
}

/** 测试点类名工具（官方 Un/$n） */
export const $n = Object.freeze({ filters: 'filters', table: 'table', toolbar: 'toolbar' })
export function Un(_section: string, _key: string, ..._rest: any[]) {
  return {}
}

/** 买家平台选项（官方 EC） */
export const EC = [
  { value: 1, label: '抖音' },
  { value: 2, label: '淘宝' },
  { value: 3, label: '小红书' },
  { value: 4, label: '视频号' },
  { value: 5, label: '微信小店' },
]

// ---- 授权管理页平台映射（官方 RG/TG/xv）----

/** 平台显示名（官方 RG） */
export const RG: Record<string, string> = {
  douyin: '抖音',
  wechat: '微信小店',
  wechat_ecosystem: '微信',
  channels: '微信视频号',
  wxstore: '微信',
  xiaohongshu: '小红书',
  taobao: '淘宝',
}

/** 平台 → 授权类型（官方 TG） */
export const TG: Record<string, string[]> = {
  douyin: ['live_room', 'order_shop'],
  wechat: ['live_room', 'order_shop'],
  wechat_ecosystem: ['live_room', 'order_shop'],
  channels: ['live_room'],
  wxstore: ['order_shop'],
  xiaohongshu: ['live_room', 'order_shop'],
  taobao: ['live_room', 'order_shop'],
}

/** 授权类型描述（官方 xv，含图标） */
export const xv: Record<string, { label: string; description: string; authSubject: string; stepKeys: string[]; icon?: any }> = {
  live_room: { label: '直播间', description: '用于直播弹幕、直播打印等能力', authSubject: 'live_room', stepKeys: ['live'] },
  order_shop: { label: '订单店铺', description: '用于订单同步、订单备注等能力', authSubject: 'order_shop', stepKeys: ['order'] },
}

// 授权类型图标（官方 UE=Radio / Yv=ShoppingBag）
export const UE = Radio
export const Yv = ShoppingBag

/** 平台是否支持授权（官方 wq） */
export function wq(code: any) {
  return Boolean(code && (TG[code]?.length || ['douyin', 'taobao', 'xiaohongshu'].includes(code)))
}

/** 平台名（官方 T0） */
export function T0(p: any) {
  return RG[p?.code] || p?.display_name || p?.name || p?.code || '平台'
}

/** 平台 logo（官方 MG） */
export function MG(p: any, subject: any) {
  return p?.code === 'douyin' && subject === 'live_room' ? '/logo/dyLive.png' : p?.logo || za(p?.code)
}

/** 平台显示名（官方 OG） */
export function OG(p: any, subject: any) {
  return p?.code === 'douyin' && subject === 'live_room' ? '抖音直播' : T0(p)
}

/** 平台卡片描述（官方 PG） */
export function PG(p: any, subject: any) {
  return p?.code === 'douyin' && subject === 'live_room' ? '支持主播账号、达人账号' : ''
}

/** 店铺状态指纹（官方 FG 简化） */
export function FG(shop: any) {
  return JSON.stringify({
    id: shop?.id ?? null,
    platform_code: shop?.platform_code ?? null,
    is_connected: shop?.is_connected ?? null,
    shop_name: shop?.shop_name ?? null,
  })
}

/** 店铺指纹缓存（官方 bv） */
export const bv: Map<any, any> = new Map()

/** 强制引导标记（官方 HG 简化） */
export function HG(_ids: any[]) {}

/** 改绑短信冷却 key（官方 ZC/e2/QC） */
export const ZC = 'update_old_sms_cooldown_until'
export const e2 = 'update_new_sms_cooldown_until'
export const QC = 60

/** 双店铺平台映射（官方 _q/jq）：wechat_ecosystem = 视频号直播 + 微信小店订单 */
export const _q: Record<string, any> = {
  wechat_ecosystem: { livePlatformCode: 'channels', storePlatformCode: 'wxstore', liveLabel: '视频号', storeLabel: '微信小店' },
}
export function jq(code: any) {
  return _q[code] || null
}

// ---- 授权状态辅助（官方店铺状态机，安全默认实现）----

/** 店铺类型常量（官方 mi） */
export const mi = Object.freeze({ legacy: 'shop', liveRoom: 'live_room', orderShop: 'order_shop' })
/** 授权状态常量（官方 c0） */
export const c0 = Object.freeze({ restoring: 'checking', reauthorization_required: 'reauth_required' })
/** 连接中默认状态（官方 vv） */
export const vv = { state: c0.restoring, label: '恢复中', message: '店铺上下文恢复中', working: true, actionRequired: false, ready: false }

/** 店铺类型判断（官方 Vb 简化） */
export function Vb(shop: any) {
  return shop?.auth_subject || mi.legacy
}
/** 是否 legacy 店铺（官方 Xd） */
export function Xd(shop: any) {
  return Vb(shop) === mi.legacy
}
/** 服务到期时间校验（官方 UG）：是否未过期 */
export function UG(e: any) {
  if (!e) return false
  const t = new Date(e)
  if (Number.isNaN(t.getTime())) return false
  return t.getTime() > Date.now()
}
/** 服务到期格式化（官方 $G 简化） */
export function $G(e: any) {
  if (!e) return ''
  const d = new Date(e)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('zh-CN')
}
/** 店铺状态转换（官方 Nv）：归一化店铺字段 */
export function Nv(e: any) {
  return {
    is_connected: !!e?.is_connected,
    auth_subject: e?.auth_subject ?? 'shop',
    shop_name: e?.shop_name ?? null,
    live_id: e?.live_id ?? null,
    live_room_name: e?.live_room_name ?? null,
    platform_code: e?.platform_code ?? null,
  }
}
/** 去重并返回 stepKeys（官方 Sv） */
export function Sv(e: any) {
  const t = (Array.isArray(e) ? e : []).filter(Boolean).filter((a, i, l) => l.indexOf(a) === i)
  return t.length ? { stepKeys: t } : undefined
}
/** 店铺状态展示（官方 YC 简化） */
export function YC(e: any, _t: any) {
  return e?.ready
    ? { label: '已连接', className: 'text-green-600', message: e?.message }
    : { label: '待恢复连接', className: 'text-orange-500', message: e?.message }
}
/** 抖音订单店铺判断（官方 GG 简化） */
export function GG(e: any, _t: any = {}) {
  return e?.platform_code === 'douyin'
}
/** 店铺状态转换（官方 RM/TM/VG 简化）：构建授权展示状态 */
export function RM(shop: any, meta: any = {}) {
  const connected = !!shop?.is_connected
  return { state: connected ? 'ready' : c0.reauthorization_required, label: connected ? '已连接' : '需要重新授权', ready: connected }
}
export const TM = RM
export function VG(shop: any, state: any, meta: any = {}) {
  return { ...(shop ? RM(shop, meta) : TM('douyin', meta)), ...(shop ? { shop_id: shop } : {}), state }
}

/** 编辑模板保存后跳转（官方 Jp 简化） */
export function Jp() {
  window.location.href = '/template'
}

/** Electron 客户端设置兼容（浏览器环境） */
export function clientSettingsCompat() {
  return {
    get: async () => ({ success: true, settings: { closeBehavior: 'tray', askOnClose: true, printProvider: 'electron' } }),
    update: async (s: any) => ({ success: true, settings: s }),
  }
}

/** 会话/店铺能力 hook（官方 Fp 完整版）：授权管理页依赖的全部方法 */
export function Fp() {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  const isElectron = Boolean(api)

  /** 调用 electronAPI.shop 方法，非 Electron 返回 null */
  const callShop = async (method: string, ...args: any[]) => {
    if (!api?.shop?.[method]) return null
    try {
      return await api.shop[method](...args)
    } catch {
      return null
    }
  }

  return {
    isElectron,
    shopStatuses: {},
    shopStatusesReady: true,
    connectionStatus: null,
    danmakuStats: { count: 0 },
    roomInfo: null,
    sessionActive: false,
    // ---- 弹幕会话相关（官方 Fp 也返回这些）----
    liveStatus: null,
    liveOrderSyncStatus: null,
    danmakuList: (() => {
      const [list, setList] = React.useState<any[]>([] as any)
      React.useEffect(() => _subscribeDanmaku(() => {
        const items = ze?.danmakuState?.items
        setList(Array.isArray(items) ? items : [])
      }), [])
      return list
    })(),
    electronMatchedCount: 0,
    electronLuckyBagWonCount: 0,
    electronActiveLuckyBagBatchNo: null,
    electronLuckyBagParticipated: 0,
    resetDanmakuBatch: async () => { try { await api?.resetDanmakuBatch?.({}) } catch {} return { success: true } },
    resetLuckyBagBatch: async () => { try { await api?.resetLuckyBagBatch?.({}) } catch {} return { success: true } },
    clearDanmakuList: () => {},
    reloadConfig: async () => { try { await api?.reloadDanmakuConfig?.() } catch {} return { success: true } },
    /** 启动弹幕会话：官方 Fp.startSession 以位置参数调用，构建 cfg 后交给 electronAPI 模拟 + 订阅事件 + 设置运行时 */
    startSession: async (shopId?: any, shopName?: any, apiToken?: any, platformCode?: any, storeShopId?: any, storeShopRawData?: any, liveRoomName?: any, orderAlertEnabled?: any, shopCurl?: any, storeShopCurl?: any, authSubject?: any, storeAuthSubject?: any) => {
      const cfg = typeof shopId === 'object' && shopId !== null
        ? shopId
        : { shopId, shopName, apiToken, platformCode, storeShopId, storeShopRawData, liveRoomName, orderAlertEnabled, shopCurl, storeShopCurl, authSubject, storeAuthSubject }
      let started = false
      try { const r = await api?.startDanmakuSession?.(cfg); started = !!r?.success || true } catch {}
      XR()
      const state = RV(cfg)
      return { success: started, ...state }
    },
    /** 停止弹幕会话 */
    stopSession: async () => {
      try { await api?.stopDanmakuSession?.({}) } catch {}
      return { success: true }
    },
    getShopCapabilityStatus: (shop: any, _capability: string) => {
      if (shop?.is_connected === false) return { state: 'pending', message: '待恢复' }
      return { state: 'ready', message: '可用' }
    },
    bootstrapShops: async (shops: any, opts?: any) => {
      const r = await callShop('bootstrap', { shops: shops || [], force: !!opts?.force })
      return r || { success: true, data: { shops: [] } }
    },
    isShopConnected: () => true,
    isShopCapabilityReady: () => true,
    getShopAuthorizationDisplay: () => null,
    getRuntimeShopStatus: (shop: any) => shop,
    /** 授权店铺（官方 Re → shop.authorize） */
    authorizeShop: async (platformCode: any, shopId: any, loginUrl: any, shopSnapshot: any, extra: any = {}) =>
      callShop('authorize', { platformCode, ...(shopId != null ? { shopId } : {}), loginUrl, shopSnapshot, ...extra }),
    authorizeWechat: async (params: any) => callShop('authorizeWechat', params),
    /** 打开云打印授权（官方 Pe） */
    openCloudPrintAuthorization: async (params: any) => callShop('openCloudPrintAuthorization', params),
    /** 采集云打印授权（官方 W） */
    collectCloudPrintAuthorization: async (params: any) => callShop('collectCloudPrintAuthorization', params),
    channelsGetQr: async () => callShop('channelsGetQr'),
    channelsCheckLogin: async (params: any) => callShop('channelsCheckLogin', params),
    channelsBindSession: async (params: any) => callShop('channelsBindSession', params),
    switchShop: async (shopId: any) => callShop('switch', { shopId }),
    /** 重新绑定（官方 qe） */
    rebindShop: async (platformCode: any, fromShopId: any, toShopId: any) =>
      callShop('rebind', { platformCode, fromShopId, toShopId }),
    /** 提交授权（官方 mt） */
    commitAuthorization: async (params: any) => callShop('commitAuthorization', params),
    /** 标记授权范围就绪（官方 Pt） */
    markAuthorizationScopeReady: () => {},
    /** 拉取店铺状态（官方 yt） */
    getShopStatuses: async () => {
      const r = await callShop('status')
      return Array.isArray(r) ? r : r?.data || []
    },
    /** 解除授权（官方 nr） */
    deauthorizeShop: async (params: any) => callShop('deauthorize', params),
  }
}

/** 模板-打印机匹配（官方 ap）：返回匹配的打印机名 */
export function ap(tpl: any, printers: any[] = []) {
  if (tpl?.default_printer && printers.some((p) => p.name === tpl.default_printer)) {
    return tpl.default_printer
  }
  return printers[0]?.name || ''
}

/** 今日时间范围（官方 yv） */
export function yv() {
  const now = dayjs()
  return {
    startTime: now.startOf('day').format('YYYY-MM-DDTHH:mm'),
    endTime: now.endOf('day').format('YYYY-MM-DDTHH:mm'),
  }
}

/** 字符串清理（官方 Gp） */
export function Gp(v: any) {
  return String(v ?? '').trim()
}

/** 同步状态判断（官方 dG） */
export function dG(e: any) {
  return !e || e.status === 'no_decrypt'
    ? false
    : ['syncing', 'decrypting', 'failed', 'preparing_remark'].includes(e.status) && !e.canBatchRemark
}

/** 测试点工具（官方 dn） */
export function dn(_section: string, _role: string, _action: string) {
  return {}
}

/** Notes 测试点常量（官方 un） */
export const un = Object.freeze({ filters: 'filters', table: 'table', actions: 'actions', remarkDialog: 'remark-dialog', syncDialog: 'sync-dialog' })

/** 步骤键提取（官方 Hp） */
export function Hp(e: any) {
  const t = e?.stepKeys || e?.step_keys
  return Array.isArray(t) ? t.filter(Boolean) : []
}

/** 订单状态筛选列表（官方 xM） */
export const xM = [
  { label: '全部状态', value: 0 },
  { label: '待发货', value: 'paid' },
  { label: '已发货', value: 'shipped' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

/** 批量备注任务状态（官方 UC） */
export const UC: Record<string, string> = {
  pending: '待执行',
  running: '执行中',
  success: '成功',
  failed: '失败',
  skipped: '跳过',
  partial_success: '部分成功',
  cancelled: '已停止',
}

/** 状态筛选标签映射（官方 vM） */
export const vM: Record<string, string> = {}
xM.forEach((x: any) => (vM[String(x.value)] = x.label))

/** 用户名提取（官方 xG） */
export function xG(e: any) {
  return String(e?.user_name ?? '').trim() || String(e?.buyer_name ?? '').trim()
}

/** 店铺名提取（官方 Aq） */
export function Aq(e: any) {
  return e?.live_room_name || e?.shop_name || ''
}

/** 微任务调度（官方 NO） */
export function NO(fn: () => void) {
  if (typeof queueMicrotask === 'function') queueMicrotask(fn)
  else Promise.resolve().then(fn)
}

/** 备注设置 localStorage key（官方 qC） */
export const qC = 'REMARK_UPDATE_SAVE_KEY'

/** 直播店铺过滤（官方 cf）：是否为直播店铺 */
export function cf(e: any) {
  const subj = e?.auth_subject || 'live_room'
  return subj === 'live_room' || subj === 'legacy'
}

/** 平台码标准化（官方 l0 简化） */
export function l0(e: any) {
  return e?.platform_code || e?.platformCode || 'douyin'
}

/** 进度合并（官方 sG 简化） */
export function sG(e: any, t: any) {
  return !e || !t || t.progressToken !== e.progressToken
    ? e
    : { ...e, intent: t.intent || e.intent || 'sync_only', status: t.status || e.status }
}

/** 画布尺寸常量（官方 bW/wW） */
export const bW = 196
export const wW = 116

/** 字号选项（官方 SW） */
export const SW = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

/** 字重选项（官方 NW） */
export const NW = [
  { label: '常规', value: 'normal' },
  { label: '加粗', value: 'bold' },
]

/** 模板字段配置生成（官方 MC 简化） */
/** 编码格式示例（官方 MC）：如 "12100001"（含月12 含日15 + 5位序号） */
export function MC(e: any = {}) {
  const includeMonth = e.includeMonth ?? true
  const includeDay = e.includeDay ?? true
  const serialDigits = Number(e.serialDigits || 5)
  const monthPart = '12'
  const dayPart = '15'
  const serial = String(1).padStart(serialDigits, '0')
  return `${`${includeMonth ? monthPart : ''}${includeDay ? dayPart : ''}`}${serial}`
}

/** 默认模板字段（官方 qd） */
export const qd: any[] = [
  { id: 1, aliasName: '店铺名称', showName: '店铺名称', testValue: '阳光小铺', value: '<%=data.mallName%>', width: 140, height: 18, top: 1, left: 1, fontSize: 8, fontFamily: 'SimHei', fontWeight: 'normal', isChecked: true, showHeader: false },
  { id: 3, aliasName: '序号', showName: '序号', testValue: '1', value: '<%=data.index%>', width: 193, height: 18, top: 59, left: 0.5, fontSize: 10, fontFamily: 'SimHei', fontWeight: 'normal', isChecked: true, showHeader: false },
  { id: 4, aliasName: '昵称', showName: '昵称', testValue: '聪明小狗', value: '<%=data.nickname%>', width: 194, height: 18, top: 21.5, left: 0, fontSize: 13, fontFamily: 'SimHei', fontWeight: 'bold', isChecked: true, showHeader: true },
  { id: 10, aliasName: '永久编号', showName: '永久编号', testValue: '4563', value: '<%=data.permanentNumber%>', width: 70.5, height: 18, top: 0, left: 123.5, fontSize: 8, fontFamily: 'SimHei', fontWeight: 'normal', isChecked: true, showHeader: false },
  { id: 12, aliasName: '弹幕内容', showName: '弹幕内容', testValue: '啊啊啊', value: '<%=data.content%>', width: 194, height: 18, top: 40, left: 0, fontSize: 12, fontFamily: 'SimHei', fontWeight: 'normal', isChecked: true, showHeader: false },
  { id: 13, aliasName: '匹配内容', showName: '匹配内容', testValue: '12', value: '<%=data.matchContent%>', width: 100, height: 18, top: 40, left: 94, fontSize: 12, fontFamily: 'SimHei', fontWeight: 'normal', isChecked: true, showHeader: false },
  { id: 14, aliasName: '价格', showName: '价格', testValue: '20.5', value: '<%=data.price%>', width: 120, height: 18, top: 34, left: 1, fontSize: 12, fontFamily: 'SimHei', fontWeight: 'normal', isChecked: true, showHeader: false },
  { id: 15, aliasName: '免单', showName: '免单', testValue: '免', value: '<%=data.luckyBagMark%>', width: 30, height: 18, top: 1, left: 164, fontSize: 8, fontFamily: 'SimHei', fontWeight: 'normal', isChecked: false, showHeader: false },
]

/** 模板数据（官方 rp/xW）：完整预置模板（9 尺寸 × 3 模板） */
export { xW, rp }

/** 平台备注能力判断（官方 Nq 简化）：是否有备注/解密能力 */
export function Nq(e: any) {
  return Boolean(e?.capabilities?.remark || e?.shop_curl || e?.raw_data)
}

/** 店铺是否为直播店铺（官方 Kb 简化） */
export function Kb(e: any) {
  const subj = e?.auth_subject || 'shop'
  return subj === 'order_shop' || subj === 'shop'
}

/** 默认扣数配置（官方 PC） */
export function PC() {
  return {
    templateId: undefined,
    selectPrinter: '扣单宝-Mock-打印机',
    antiDuplicateEnabled: true,
    antiDuplicateSeconds: 5,
    serialMode: 'flow',
    serialResetTime: 0,
    printRule: 'anyNumber',
    deductionMode: 'custom',
    numberMode: 'specified',
    numberMin: 1,
    numberMax: 999999,
    numberSpecified: '',
    numberIncludeDecimal: false,
    customFormats: ['includeNumber'],
    customKeywords: '',
    customKeywordDeductMode: 'numberWithKeyword',
    customKeywordMatchMode: 'exact',
    gridCount: 12,
    gridAutoAssign: false,
    gridFormats: ['pureNumber'],
    gridKeywords: '',
    gridKeywordDeductMode: 'numberWithKeyword',
    gridKeywordMatchMode: 'exact',
    gridDedupMode: 'buyerEachGridOnce',
    sizeRules: [],
    keyword1: '',
    keyword2: '',
    keyword3: '',
    enableLimitOrder: true,
    limitOrderCount: 100,
    enableQuickPass: false,
    enableLuckyBagQuickPass: false,
    quickPassSeconds: 30,
    luckyBagEnabled: false,
    luckyBagEffectiveCount: 100,
    luckyBagPrizeCount: 5,
    luckyBagMaxWinsPerUser: null,
    luckyBagMaxParticipationsPerUser: null,
  }
}

// ═══════════════════════════════════════════════════════════════════
// 直播工作台（Deduction/Index）运行时：官方压缩运行时的等价重建
// 按官方 bundle 逻辑逐项还原；引用关系与官方一致。
// ═══════════════════════════════════════════════════════════════════

// ---- 平台定义（官方 i0，来自 bundle 完整对象） ----
const Gm0 = { live: false, order: false, remark: false, identity: false }
const si0 = { default: '平台授权', store: '抖店后台', live: '主播中控台', channels: '视频号', wxstore: '微信小店' }
export const i0: Record<string, any> = {
  douyin: { code: 'douyin', canonicalCode: 'douyin', capabilities: { live: true, order: true, remark: true, identity: false }, authorizationMode: 'split', livePlatformCode: 'douyin', storePlatformCode: 'douyin', dashboardSelectorMode: 'dual', notesSelectorMode: 'store_only', liveShopSelectable: true, authorizationEntry: true, authorizationSteps: [{ key: 'store', label: si0.store, platformCode: 'douyin', capabilities: ['order', 'remark'], requiredForNewAuth: true }, { key: 'live', label: si0.live, platformCode: 'douyin', capabilities: ['live'], requiredForNewAuth: true }] },
  douyin_talent: { code: 'douyin_talent', canonicalCode: 'douyin_talent', capabilities: { live: true, order: false, remark: false, identity: true }, authorizationMode: 'split', livePlatformCode: 'douyin_talent', storePlatformCode: 'douyin', dashboardSelectorMode: 'dual', notesSelectorMode: 'store_only', liveShopSelectable: true, authorizationEntry: false, authorizationSteps: [{ key: 'live', label: si0.live, platformCode: 'douyin_talent', capabilities: ['live', 'identity'], requiredForNewAuth: true }] },
  douyin_talent_ecosystem: { code: 'douyin_talent_ecosystem', canonicalCode: 'douyin_talent_ecosystem', capabilities: Gm0, authorizationMode: 'split', livePlatformCode: 'douyin_talent', storePlatformCode: 'douyin_talent', dashboardSelectorMode: 'single', notesSelectorMode: 'single', liveShopSelectable: false, authorizationEntry: false, authorizationSteps: [{ key: 'live', label: si0.live, platformCode: 'douyin_talent', capabilities: ['live', 'identity'], requiredForNewAuth: true }] },
  taobao: { code: 'taobao', canonicalCode: 'taobao', capabilities: { live: true, order: true, remark: true, identity: false }, authorizationMode: 'composite', livePlatformCode: 'taobao', storePlatformCode: 'taobao', dashboardSelectorMode: 'single', notesSelectorMode: 'single', liveShopSelectable: true, authorizationEntry: false },
  xiaohongshu: { code: 'xiaohongshu', canonicalCode: 'xiaohongshu', capabilities: { live: true, order: true, remark: true, identity: false }, authorizationMode: 'composite', livePlatformCode: 'xiaohongshu', storePlatformCode: 'xiaohongshu', dashboardSelectorMode: 'single', notesSelectorMode: 'single', liveShopSelectable: true, authorizationEntry: false },
  channels: { code: 'channels', canonicalCode: 'channels', capabilities: { live: true, order: false, remark: false, identity: false }, authorizationMode: 'split', livePlatformCode: 'channels', storePlatformCode: 'wxstore', dashboardSelectorMode: 'dual', notesSelectorMode: 'store_only', liveShopSelectable: true, authorizationEntry: false, authorizationSteps: [{ key: 'live', label: si0.channels, platformCode: 'channels', capabilities: ['live'], requiredForNewAuth: true }] },
  wechat: { code: 'wechat', canonicalCode: 'channels', capabilities: { live: true, order: false, remark: false, identity: false }, authorizationMode: 'split', livePlatformCode: 'channels', storePlatformCode: 'wxstore', dashboardSelectorMode: 'dual', notesSelectorMode: 'store_only', liveShopSelectable: true, authorizationEntry: false },
  wxstore: { code: 'wxstore', canonicalCode: 'wxstore', capabilities: { live: false, order: true, remark: true, identity: false }, authorizationMode: 'split', livePlatformCode: 'channels', storePlatformCode: 'wxstore', dashboardSelectorMode: 'dual', notesSelectorMode: 'store_only', liveShopSelectable: false, authorizationEntry: false, authorizationSteps: [{ key: 'store', label: si0.wxstore, platformCode: 'wxstore', capabilities: ['order', 'remark'], requiredForNewAuth: true }] },
  wechat_ecosystem: { code: 'wechat_ecosystem', canonicalCode: 'wechat_ecosystem', capabilities: Gm0, authorizationMode: 'split', livePlatformCode: 'channels', storePlatformCode: 'wxstore', dashboardSelectorMode: 'dual', notesSelectorMode: 'store_only', liveShopSelectable: false, authorizationEntry: false, authorizationSteps: [{ key: 'live', label: si0.channels, platformCode: 'channels', capabilities: ['live'], requiredForNewAuth: true }, { key: 'store', label: si0.wxstore, platformCode: 'wxstore', capabilities: ['order', 'remark'], requiredForNewAuth: true }] },
}

/** 平台定义查找（官方 fl） */
export function fl(e: any) {
  if (!e) return null
  const t = i0[e]
  if (t) return t
  const a = Na(e)
  return a === e ? null : i0[a] || null
}
/** 平台规范化码（官方 Na） */
export function Na(e: any) {
  return e && (i0[e]?.canonicalCode || e)
}
/** 授权模式（官方 Sq） */
export function Sq(e: any) {
  return fl(e)?.authorizationMode || 'composite'
}
/** 是否 split 授权（官方 eC） */
export function eC(e: any) {
  return Sq(e) === 'split'
}
/** 是否抖音（官方 VW） */
export function VW(e: any) {
  return e === 'douyin'
}
/** 是否非抖音（官方 rT） */
export function rT(e: any) {
  return e !== 'douyin'
}
/** 订单店铺平台码（官方 Jj） */
export function Jj(e: any) {
  return fl(e)?.storePlatformCode || Na(e)
}
/** 仪表盘选择模式（官方 Gs） */
export function Gs(e: any) {
  return fl(e)?.dashboardSelectorMode || 'single'
}
/** 跑单比对模式（官方 im） */
export function im(e: any) {
  return Gs(e) === 'dual' ? 'nickname' : 'identity'
}
/** 比对模式选项（官方 qW） */
export function qW(e: any) {
  const dual = Gs(e) === 'dual'
  return dual
    ? [{ value: 'nickname', label: '通过订单里的买家昵称比对' }, { value: 'remark', label: '通过订单里的买家备注比对' }]
    : [{ value: 'identity', label: '订单关联' }]
}
/** 平台能力（官方 au）：归一化店铺能力 */
export function au(e: any) {
  return !e || typeof e !== 'object'
    ? null
    : {
        id: e.id ?? null,
        platformCode: e.platform_code ?? e.platformCode ?? null,
        shopId: e.shop_id ?? e.shopId ?? null,
        shopName: e.shop_name ?? e.shopName ?? null,
        isConnected: e.is_connected ?? e.isConnected ?? false,
        capabilities: e.capabilities ?? {},
      }
}
/** 调试日志（官方 ou） */
export function ou(e: any, t: any = {}) {
  try { console.log(`[dashboard-taobao] ${e}`, JSON.stringify(t)) } catch {}
}
/** 店铺信息归一化（官方 gv） */
export function gv(e: any) {
  if (!e) return null
  const t = e && typeof e.data === 'object' && e.data !== null ? e.data : null
  return { ...(t || {}), ...(e || {}) }
}
/** 运行店铺归一化（官方 NV? 别名）：同步订单（简化） */
export function NV(e: any) {
  if (!Array.isArray(e) || e.length === 0) return Promise.resolve()
  // 无真实订单同步能力，直接返回
  return Promise.resolve()
}

// ---- 网格 / 格式化 ----
export const dM = 1
export const fM = 50
export const Qd = '__none__'
export const Id: Set<string> = new Set(['deductionMode', 'numberMode', 'numberMin', 'numberMax', 'numberSpecified', 'numberIncludeDecimal', 'customFormats', 'customKeywords', 'customKeywordDeductMode', 'customKeywordMatchMode', 'gridCount', 'gridAutoAssign', 'gridFormats', 'gridKeywords', 'gridKeywordDeductMode', 'gridKeywordMatchMode', 'gridDedupMode', 'sizeRules', 'keyword1', 'keyword2', 'keyword3', 'serialMode', 'serialResetTime', 'antiDuplicateEnabled', 'antiDuplicateSeconds'])
export const BW: Set<string> = new Set(['templateId', 'selectPrinter'])
export const IW = [{ value: 'pureNumber', label: '纯数字' }, { value: 'numberWithKeyword', label: '数字+关键词' }]
export const zW = [{ value: 'pureNumber', label: '纯数字' }, { value: 'numberWithSymbol', label: '数字+符号' }, { value: 'letter3Digit1', label: '3位字母+1位数字' }, { value: 'includeNumber', label: '包含数字' }, { value: 'fourDigit', label: '4位数字' }, { value: 'numberWithSize', label: '数字+尺码' }, { value: 'numberWithKeyword', label: '数字+关键词' }]
export const LW = [4, 6, 9, 12]
export const DW = [{ label: '立即', value: 0 }, { label: '1小时', value: 1 }, { label: '2小时', value: 2 }, { label: '6小时', value: 6 }, { label: '12小时', value: 12 }]
export const PW = Object.freeze({ douyin: 5, taobao: 1, xiaohongshu: 8, channels: 9, wxstore: 10, wechat_ecosystem: 11 })
export const wa = { gettingQrcode: 'getting_qrcode', scanQrcode: 'scan_qrcode', scannedWaitConfirm: 'scanned_wait_confirm', binding: 'binding', failed: 'failed' }
export const uw = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
export const RW = uw.map((e) => ({ id: e, label: e, checked: true, removable: e === 'XXXL' }))
export const jG = [50, 100, 200]
export const JC = 60

/** 状态徽标映射（官方 sm） */
export const sm: Record<string, { label: string; className: string }> = {
  pending: { label: '待确认', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  matched: { label: '已扣中', className: 'bg-green-50 text-green-700 border-green-200' },
  processed: { label: '未扣中', className: 'bg-red-50 text-red-700 border-red-200' },
}

/** 尺寸字段工厂（官方 dw） */
export function dw(e: any, t: any = {}, a = 0) {
  const o = Gp(e)
  const l = uw.includes(o)
  return {
    id: t.id ?? (o ? o.replace(/\s+/g, '-') : `custom-${a}`),
    label: o,
    checked: t.checked ?? true,
    isCustom: t.isCustom ?? !l,
    removable: t.removable ?? (!l || o === 'XXXL'),
  }
}
/** 默认尺码列表（官方 bu） */
export function bu() {
  return RW.map((e) => ({ ...e }))
}
/** 尺码列表归一化（官方 iM） */
export function iM(e: any) {
  const list = Array.isArray(e) && e.length > 0 ? e : bu()
  return list.map((a: any, o: number) => dw(a?.label, { ...a, checked: !!a?.checked, removable: a?.removable, isCustom: a?.isCustom }, o))
}
/** 尺码去重合并（官方 lM） */
export function lM(e: any) {
  const t = iM(e)
  const a: any[] = []
  const o = new Map()
  t.forEach((l: any, u: number) => {
    const d = Gp(l.label)
    if (!d) return
    const f = o.get(d)
    if (f === undefined) {
      o.set(d, a.length)
      a.push(dw(d, { checked: !!l.checked, isCustom: l.isCustom, removable: l.removable }, u))
      return
    }
    a[f] = { ...a[f], checked: a[f].checked || !!l.checked }
  })
  return a
}
/** 尺码过滤（官方 MW） */
export function MW(e: any) {
  const t = Array.isArray(e) ? [...new Set(e.map(Gp).filter(Boolean))] : []
  if (t.length === 0) return bu()
  const a = new Set(t)
  const o = bu().map((u) => ({ ...u, checked: a.has(u.label) }))
  const l = t.filter((u) => !uw.includes(u)).map((u, d) => dw(u, { checked: true, isCustom: true, removable: true }, d))
  return [...o, ...l]
}

/** 网格号提取（官方 Vl） */
export function Vl(e: any, t = 12) {
  const a = Number(e)
  return Number.isFinite(a) ? Math.min(fM, Math.max(dM, Math.floor(a))) : t
}
/** 网格列表显示（官方 HW） */
export function HW(e: any) {
  const t = Vl(e)
  const a = Math.min(t, 8)
  const o = Array.from({ length: a }, (l, u) => u + 1).join('、')
  return t > a ? `${o}、...、${t}` : o
}
/** 网格号匹配（官方 om） */
export function om(e: any, t = 12, a = false) {
  const o = Number(e?.grid_no ?? e?.gridNo)
  const l = Vl(t)
  if (Number.isInteger(o) && o >= 1 && o <= l) return o
  if (a) return null
  const u = String(e?.matched_content ?? e?.matchedContent ?? '')
  if (!/^\d+$/.test(u)) return null
  const d = Number(u)
  return d >= 1 && d <= l ? d : null
}
/** 弹幕唯一 id（官方 FW） */
export function FW(e: any) {
  return e?.commentId || e?.comment_id || e?.id || `${e?.batchNo ?? e?.batch_no ?? ''}-${e?.nickname ?? ''}-${e?.content ?? ''}-${e?.commentTime ?? e?.comment_time ?? ''}`
}
/** 弹幕列表归一化（官方 JW） */
export function JW(e: any = []) {
  return e.map((t: any) => ({
    commentId: t.commentId ?? t.comment_id,
    status: t.status === 'matched' ? 'matched' : 'processed',
    printStatus: !!(t.printStatus ?? t.print_status),
    matchedContent: t.matchedContent ?? t.matched_content ?? null,
    gridNo: Number.isFinite(Number(t.gridNo ?? t.grid_no)) ? Number(t.gridNo ?? t.grid_no) : null,
    batchNo: t.batchNo ?? t.batch_no,
    luckyBagBatchNo: t.luckyBagBatchNo ?? t.lucky_bag_batch_no,
    luckyBagWon: !!(t.luckyBagWon ?? t.lucky_bag_won),
    numIndex: t.num_index ?? t.numIndex,
    content: t.content,
    nickname: t.nickname,
    shopName: t.shop_name ?? t.shopName,
    commentTime: t.comment_time ?? t.commentTime,
    itemCode: t.item_code ?? t.itemCode,
  }))
}
/** 数量/样本（官方 QW） */
export function QW(e: any) {
  return { count: Array.isArray(e) ? e.length : 0, sample: Array.isArray(e) ? e.slice(0, 2) : [] }
}
/** 逗号归一化（官方 Yl） */
export function Yl(e: any = '') {
  return String(e).replace(/[，,]+/g, ',')
}
/** 逗号拆分（官方 ri） */
export function ri(e: any = '') {
  return Yl(e).split(',').map((a) => a.trim()).filter(Boolean)
}
/** 多行模拟弹幕解析（官方 ZW） */
export function ZW(e: any = '') {
  return String(e).split(/\r?\n/).map((t, a) => {
    const o = t.split(/[，,\t]/)
    const l = o.length > 1 ? String(o.shift() ?? '').trim() : `测试用户${a + 1}`
    const u = o.join(',').trim() || t
    return { nickname: l, content: u }
  }).filter((x) => x.content)
}
/** 弹幕合并去重（官方 eG） */
export function eG(e: any = [], t: any = []) {
  const a = new Map()
  t.forEach((o: any) => {
    const l = o?.commentId ?? o?.comment_id
    l && a.set(l, o)
  })
  const out: any[] = []
  const seen = new Set()
  e.forEach((o: any) => {
    const l = o?.commentId ?? o?.comment_id
    if (a.has(l)) {
      out.push(a.get(l))
      a.delete(l)
    } else {
      out.push(o)
    }
    seen.add(l)
  })
  a.forEach((v) => {
    if (!seen.has(v?.commentId ?? v?.comment_id)) out.push(v)
  })
  return out
}
/** 订单提醒归一化（官方 m0） */
export function m0(e: any, t = Date.now()) {
  return {
    id: Number.isFinite(Number(e?.id)) ? Number(e.id) : null,
    nickname: `${e?.nickname ?? ''}`.trim(),
    itemCode: `${e?.itemCode ?? e?.item_code ?? ''}`.trim(),
    buyerNumber: `${e?.buyerNumber ?? e?.buyer_number ?? ''}`.trim(),
    serialNumber: `${e?.serialNumber ?? e?.num_index ?? ''}`.trim(),
    commentTime: `${e?.commentTime ?? e?.comment_time ?? e?.time ?? ''}`.trim(),
    timestamp: Number.isFinite(Number(e?.timestamp)) ? Number(e.timestamp) : t,
    legacyName: `${e?.legacyName ?? e?.name ?? ''}`.trim(),
  }
}
/** 订单提醒合并去重（官方 Qm） */
export function Qm(e: any, t: any, a = Date.now()) {
  const o: any[] = []
  const l = new Set()
  const u = new Map()
  ;(Array.isArray(t) ? t : []).forEach((d) => {
    const f = m0(d, a)
    f.id && u.set(f.id, f)
  })
  ;(Array.isArray(e) ? e : []).forEach((d) => {
    let f = m0(d, a)
    if (!f.id || l.has(f.id)) return
    if (u.has(f.id)) { f = u.get(f.id); u.delete(f.id) }
    l.add(f.id)
    o.push(f)
  })
  u.forEach((d) => {
    if (!l.has(d.id)) { l.add(d.id); o.push(d) }
  })
  return o
}
/** 跑单显示字段（官方 xV） */
export function xV(e: any, t = 'nickname') {
  if (!e) return '-'
  const a = (...o: any[]) => {
    const l = o.find((u) => `${u ?? ''}`.trim() !== '')
    return l === undefined ? '-' : `${l}`
  }
  switch (t) {
    case 'cargoCode': return a(e.itemCode, e.legacyName, e.nickname)
    case 'permanentCode': return a(e.buyerNumber, e.legacyName, e.nickname)
    case 'serialNumber': return a(e.serialNumber, e.legacyName, e.nickname)
    case 'nickname':
    default: return a(e.nickname, e.legacyName)
  }
}
/** 弹幕状态更新（官方 Qb） */
export function Qb(e: any, t: any) {
  const items = (Array.isArray(t) ? t : [t]).map((S: any) => ({
    ...S,
    commentId: typeof (S?.commentId ?? S?.comment_id) === 'string' ? S.commentId ?? S.comment_id : '',
    batchNo: typeof (S?.batchNo ?? S?.batch_no) === 'string' ? S.batchNo ?? S.batch_no : '',
    luckyBagBatchNo: typeof (S?.luckyBagBatchNo ?? S?.lucky_bag_batch_no) === 'string' ? S.luckyBagBatchNo ?? S.lucky_bag_batch_no : '',
    matchedContent: S?.matchedContent ?? S?.matched_content ?? null,
    gridNo: Number.isFinite(Number(S?.gridNo ?? S?.grid_no)) ? Number(S.gridNo ?? S.grid_no) : null,
    status: S?.status ?? 'processed',
    printStatus: !!(S?.printStatus ?? S?.print_status),
    black: !!S?.black,
    luckyBagWon: !!(S?.luckyBagWon ?? S?.lucky_bag_won),
  }))
  const state = e && typeof e === 'object' ? e : Cs()
  return { ...state, items: [...(state.items || []), ...items] }
}
/** 弹幕状态工厂（官方 Cs） */
export function Cs(e = 500) {
  return { items: [], activeBatchNo: null, activeLuckyBagBatchNo: null, activeLuckyBagParticipated: 0, matchedCount: 0, luckyBagWonCount: 0, activeMatchedCommentIds: {}, activeLuckyBagWonCommentIds: {}, ignoredBatchNos: {}, ignoredLuckyBagBatchNos: {}, maxItems: e }
}
/** 活动批次选择（官方 Zb） */
export function Zb(e: any, t: any) {
  const a = Array.isArray(t) ? t : []
  const o = { ...(e.ignoredBatchNos || {}) }
  const l = { ...(e.ignoredLuckyBagBatchNos || {}) }
  let u = e.activeBatchNo
  u || (u = a.find((N: any) => typeof N?.batchNo === 'string' && N.batchNo && !o[N.batchNo])?.batchNo || null)
  let d = e.activeLuckyBagBatchNo
  d || (d = a.find((N: any) => typeof (N?.luckyBagBatchNo ?? N?.lucky_bag_batch_no) === 'string' && (N.luckyBagBatchNo ?? N.lucky_bag_batch_no) && !l[N.luckyBagBatchNo ?? N.lucky_bag_batch_no])?.luckyBagBatchNo ?? null)
  const f = e.matchedCount
  const p = { ...e.activeMatchedCommentIds }
  const seen = new Set()
  a.forEach((N: any) => {
    const w = typeof (N?.commentId ?? N?.comment_id) === 'string' ? N.commentId ?? N.comment_id : ''
    if (w) seen.add(w)
  })
  return { ...e, activeBatchNo: u, activeLuckyBagBatchNo: d, matchedCount: f, activeMatchedCommentIds: p }
}
/** 选中店铺（官方 GR） */
export function GR({ dashboardRows: e, preferredDashboardRowId: t = null, activeDashboardRowId: a = null, preferredStoreShopId: o = null }: any = {}) {
  const rows = Array.isArray(e) ? e : []
  const selected = rows.find((r) => Number(r?.id) === Number(t ?? a)) || rows[0] || null
  return {
    selectedShop: selected,
    selectedStoreShop: rows.find((r) => Number(r?.id) === Number(o)) || null,
    preferredDashboardRowId: t,
    activeDashboardRowId: a,
    dashboardRows: rows,
  }
}
/** 本地存储选中店铺（官方 mM/A0） */
const A0 = 'DANMU_DASHBOARD_STORE_SELECTIONS'
export function mM() {
  if (typeof localStorage === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(A0) || '{}') } catch { return {} }
}
/** 读取选中店铺（官方 YW） */
export function YW(e: any) {
  if (e) return mM()[String(e)]
  return undefined
}
/** 保存选中店铺（官方 DC） */
export function DC(e: any, t: any) {
  if (typeof localStorage === 'undefined' || !e) return
  const a = mM()
  a[String(e)] = t ? String(t) : Qd
  localStorage.setItem(A0, JSON.stringify(a))
}
/** 选中订单店铺（官方 pM） */
export function pM(e: any) {
  const t = YW(e?.id)
  if (t === Qd) return null
  if (t) return Ef(e).find((a: any) => String(a?.id) === String(t)) || undefined
  return undefined
}
/** 工作台店铺（官方 zC） */
export function zC(e: any = [], t: any = null) {
  const o = GR({ dashboardRows: e, activeDashboardRowId: t })
  const l = pM(o.selectedShop)
  return { ...o, selectedStoreShop: l === undefined ? o.selectedStoreShop : l }
}
/** 订单店铺过滤（官方 Ef） */
export function Ef(e: any) {
  return (Array.isArray(e?.store_options) ? e.store_options : []).filter(Kb)
}
/** 快速过款配置（官方 tG） */
export function tG(e: any) {
  return { ...e, enableLimitOrder: true, limitOrderCount: 1, enableQuickPass: true, quickPassSeconds: e.quickPassSeconds || 30 }
}
/** 时间格式化 HH:mm:ss（官方 eV） */
export function eV(e: any) {
  const t = Number(e)
  if (!Number.isFinite(t)) return '-'
  const a = dayjs(t)
  return a.isValid() ? a.format('HH:mm:ss') : '-'
}
/** 安全 JSON.stringify（官方 pv） */
export function pv(e: any) {
  try { return JSON.stringify(e) } catch { return '' }
}
/** 安全 JSON.parse（官方 dC） */
export function dC(e: any) {
  try { return JSON.parse(e) } catch { return null }
}
/** 打印错误信息（官方 Fm） */
export function Fm(e: any, t = '打印失败，请检查打印机连接或配置后重试') {
  return e?.reason || e?.message || e?.details?.message || e?.details?.error || t
}
/** 待恢复判断（官方 oi） */
export function oi(e: any) {
  return e?.state === 'pending' && /待恢复/.test(e?.message || '')
}
/** 仪表盘行 id（官方 Fr） */
export function Fr(e: any) {
  return e?.dashboard_row_id ?? (e?.id ? String(e.id) : null)
}
/** 已选打印机读取（官方 OW/cM） */
const cM = 'DANMU_SELECT_PRINTER_KEY'
export function OW() {
  try { return localStorage.getItem(cM) || '' } catch { return '' }
}
/** 已选打印机保存（官方 uM） */
export function uM(e: any) {
  try { localStorage.setItem(cM, e || '') } catch {}
}
/** 是否抖音店铺（官方 zC? 别名 GG 已存在） */
export function rv() { return false }

// ---- 会话运行时（官方 ze 状态机） ----
let ze: any = null
let g0 = new Set<(state: any, event: any) => void>()
export const uC = 15000
let iC: any = null
let lC: any = null
let Zm: any = null
let jm: any = null
let Cm: any = null
let iv = false

// 弹幕列表 React 订阅：Fp().danmakuList 需要在 danmakuState 变化时触发重渲染
let _danmakuSubs = new Set<() => void>()
function _notifyDanmaku() { _danmakuSubs.forEach((fn) => { try { fn() } catch {} }) }
export function _subscribeDanmaku(fn: () => void) {
  _danmakuSubs.add(fn)
  fn()
  return () => { _danmakuSubs.delete(fn) }
}

export function as(e = 'updated') {
  const t = vr()
  g0.forEach((a) => { try { a(t, e) } catch (o) { console.error('[electron-auto-print] runtime listener failed', o) } })
  _notifyDanmaku()
}
/** 会话监听（官方 nT） */
export function nT(e: any) {
  return typeof e !== 'function' ? () => {} : (g0.add(e), e(vr(), 'subscribe'), () => g0.delete(e))
}
/** 会话状态读取（官方 vr） */
export function vr() {
  return ze
    ? {
        active: !!ze.active,
        paused: !!ze.paused,
        stopReason: ze.stopReason || null,
        shopId: ze.shopId,
        platformCode: ze.platformCode,
        type: ze.type,
        templateId: ze.templateId,
        selectPrinter: ze.selectPrinter,
        danmakuState: ze.danmakuState || Cs(),
        liveStatus: ze.liveStatus || null,
        orderAlertItems: ze.orderAlertItems || [],
        hasPendingOrderAlerts: !!ze.hasPendingOrderAlerts,
        quickPassEnabled: !!ze.quickPassEnabled,
        quickPassSeconds: Number(ze.quickPassSeconds || 0),
        quickPassStartedAt: Number(ze.quickPassStartedAt || 0),
        quickPassRemaining: AV(ze),
      }
    : null
}
/** 会话启动（官方 RV） */
export function RV(e: any) {
  const wasActive = ze?.active
  ze = { ...(ze || {}), ...(e || {}), active: true, paused: false, stopReason: null, startedAt: Date.now(), liveEndedHandled: false, shopId: rw(e?.shopId), platformCode: Lp(e?.platformCode), templates: YR(e?.templates), danmakuState: Cs(), orderAlertItems: Array.isArray(e?.orderAlertItems) ? e.orderAlertItems : [], hasPendingOrderAlerts: false, quickPassEnabled: !!e?.quickPassEnabled, quickPassSeconds: Number(e?.quickPassSeconds || 0), quickPassStartedAt: Number(e?.quickPassStartedAt || 0) }
  // 触发浏览器 mock 的弹幕发生器 + 订阅事件（仅在首次启动时）
  if (!wasActive) {
    try { window.electronAPI?.startDanmakuSession?.({}) } catch {}
  }
  XR()
  as('started')
  return vr()
}
/** 会话更新（官方 lv） */
export function lv(e: any) {
  ze = { ...(ze || {}), ...(e || {}), shopId: e?.shopId === undefined ? ze?.shopId : rw(e.shopId), platformCode: e?.platformCode === undefined ? ze?.platformCode : Lp(e.platformCode), templates: e?.templates === undefined ? ze?.templates : YR(e.templates) }
  as('updated')
  return vr()
}
/** 会话 shopId 匹配（官方 hC） */
export function hC(e: any, t: any) {
  return ze?.active ? ze.shopId === rw(e) && ze.platformCode === Lp(t) : false
}
/** 快速过款剩余（官方 AV） */
export function AV(e: any = ze) {
  const t = Number(e?.quickPassSeconds || 0)
  const a = Number(e?.quickPassStartedAt || 0)
  if (!e?.active || !e.quickPassEnabled || t <= 0 || a <= 0) return t || 0
  const o = t * 1000
  const l = Math.max(0, Date.now() - a)
  const u = l % o
  return l > 0 && u === 0 ? 0 : t === 1 ? (u < 500 ? 1 : 0) : Math.ceil((o - u) / 1000)
}
/** 字符串/数字归一化（官方 Lp/rw/YR） */
export function Lp(e: any) { return String(e || '') }
export function rw(e: any) { return Number(e || 0) }
export function YR(e: any) { return Array.isArray(e) ? e.map((t) => ({ ...t })) : [] }
/** 会话监听（官方 XR 简化）：订阅 electronAPI 事件 */
export function XR() {
  if (typeof window === 'undefined' || !window.electronAPI) return
  const e = window.electronAPI
  if (!iC && typeof e.onDanmakuDisplay === 'function') {
    iC = e.onDanmakuDisplay((t: any) => {
      if (!ze?.active || ze.paused) return
      const a = Array.isArray(t) ? t : [t]
      ze = { ...ze, danmakuState: Qb(ze.danmakuState || Cs(), a) }
      as('danmaku-display')
    })
  }
  if (!lC && typeof e.onDanmakuResolved === 'function') {
    lC = e.onDanmakuResolved((t: any) => {
      if (!ze?.active || ze.paused) return
      ze = { ...ze, danmakuState: Qb(ze.danmakuState || Cs(), t) }
      as('danmaku-resolved')
    })
  }
}
/** 打印结果订阅（官方 wV） */
export function wV() {
  if (Zm || typeof window === 'undefined') return
  const e = window.electronAPI
  if (typeof e?.onPrintResults === 'function') {
    Zm = e.onPrintResults((t: any) => {
      if (!Array.isArray(t) || t.length === 0 || !ze?.active || ze.paused) return
      console.log('[electron-auto-print] 收到 printResults', QW(t))
    })
  }
}

// ---- 分析/测试点（官方 jp/Lt/It，no-op） ----
export function jp(_e: any = {}) {}
export function Lt(_e: any, _t: any, _a: any, _o: any) { return {} }
export const It: any = { rules: {}, list: {} }

// ---- 打印渲染（官方 HR/FR/Xs/tw/rV/Xm/ew） ----
export const HR = 'https://kdb.koudanbao.top/danmu-template-new.xml'
/** 模板字段渲染（官方 rV） */
export function rV(e: any, t: any) {
  const val = e?.value || ''
  switch (val) {
    case '<%=data.mallName%>': return e.showHeader ? `${e.showName}:${t.shop_name}` : t.shop_name
    case '<%=data.itemCode%>': return e.showHeader ? `${e.showName}:${t.itemCode}` : t.itemCode
    case '<%=data.index%>': return e.showHeader ? `${e.showName}:${t.index ?? t.num_index ?? ''}` : t.index ?? t.num_index ?? ''
    case '<%=data.nickname%>': return e.showHeader ? `${e.showName}:${t.nickname}` : t.nickname
    case '<%=data.permanentNumber%>': return e.showHeader ? `${e.showName}:${t.buyer_number}` : t.buyer_number
    case '<%=data.content%>': return e.showHeader ? `${e.showName}:${t.content}` : t.content
    case '<%=data.matchContent%>': return e.showHeader ? `${e.showName}:${t.matched_content ?? t.matchedContent}` : t.matched_content ?? t.matchedContent
    case '<%=data.productNo%>': return e.showHeader ? `${e.showName}:${t.product_no ?? t.productNo}` : t.product_no ?? t.productNo
    case '<%=data.price%>': return e.showHeader ? `${e.showName}:${t.price}` : t.price
    case '<%=data.time%>': return e.showHeader ? `${e.showName}:${t.comment_time ?? t.commentTime}` : t.comment_time ?? t.commentTime
    case '<%=data.luckyBagMark%>': return t.luckyBagWon || t.lucky_bag_won ? '免' : ''
    default: return e.showName || e.testValue || ''
  }
}
/** 模板字段值（官方 tw） */
export function tw(e: any, t: any, a = false) {
  if (a) return e.id === 11 ? '黑' : e.id === 15 ? e.showName || '免' : e.custom ? e.showName : e.showHeader ? `${e.showName}:${e.testValue}` : e.testValue
  return e.id === 11 ? (t.black ? '黑' : '') : e.id === 15 ? (t.luckyBagWon || t.lucky_bag_won ? e.showName || '免' : '') : e.custom ? e.showName : rV(e, t)
}
/** 模板字段配置解析（官方 ew） */
export function ew(e: any, t = false) {
  const a = t ? e.content : e.custom_config
  return typeof a === 'string' ? JSON.parse(a || '[]') : a || []
}
/** 打印文档 id（官方 Xs） */
export function Xs(e: any, t: any) {
  const a = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
  const o: any[] = []
  if (e) for (let l = 0; l < e; l++) o[l] = a[0 | (Math.random() * t)]
  else {
    for (let l = 0; l < 36; l++) o[l] || (o[l] = l === 14 ? '4' : a[(0 | (Math.random() * 16)) & 0xf])
    o[8] = o[13] = o[18] = o[23] = '-'
  }
  return o.join('')
}
/** 标签 HTML 渲染（官方 FR 简化） */
export function FR(e: any, t: any, a = false) {
  const { width: o, height: l } = t
  const u = ew(t, a)
  const items = u.filter((S: any) => a || S.isChecked !== false).map((S: any) => {
    const j = tw(S, e, a)
    if (!j) return ''
    const x = Number(o || 0) > 0 ? (Number(o) * 4 - 4) / (Number(o) * 4 - 4) : 1
    const top = Number(S.top || 0) * x
    const left = Number(S.left || 0) * x
    return `<div style="position:absolute;top:${top}px;left:${left}px;width:${Number(S.width || 0) * x}px;height:${Number(S.height || 0) * x}px;font-size:${Number(S.fontSize || 12) * x}px;font-family:${S.fontFamily || 'Microsoft YaHei'};font-weight:${S.fontWeight || 'normal'}">${j}</div>`
  }).join('')
  return `<div style="width:${o}mm;height:${l}mm;position:relative;overflow:hidden">${items}</div>`
}

// ---- 各页面辅助（Shops/Notes/PrintLog/Devices/ClientSettings/OrderSyncProgressBoard） ----
export const A0c = A0
export const cMc = cM
export const kR = 'KDB_PRINT_PROVIDER'
export const Cf = ['auto', 'cainiao', 'electron']
export const ff = 'authorization_force_bootstrap_shop_ids'
export const k0 = 'REMARK_LIVE_ROOM_SELECTION_KEY'
export const LR = 500
/** 店铺刷新（官方 a2） */
export function a2() {
  setTimeout(() => { Et.reload({ only: ['shops', 'shopDisplayRows'] }) }, 0)
}
/** 必填授权步骤（官方 bq） */
export function bq(e: any) {
  const steps = Array.isArray(e?.authorizationSteps) ? e.authorizationSteps : []
  return steps.filter((t: any) => t.requiredForNewAuth !== false).map((t: any) => t.key)
}
/** 授权主体推断（官方 hw） */
export function hw(e: any, t = 'shop') {
  const a = Array.isArray(e?.stepKeys) ? e.stepKeys.filter(Boolean) : []
  return a.length === 1 && a[0] === 'live' ? 'live_room' : a.length === 1 && a[0] === 'store' ? 'order_shop' : t || 'shop'
}
/** 错误信息提取（官方 iu） */
export function iu(e: any, t: any) {
  const a = e?.response?.data
  if (typeof a === 'string' && a.trim()) return a
  if (a?.message) return a.message
  if (a?.error) return a.error
  const o = a?.errors
  if (o && typeof o === 'object') {
    const l = Object.values(o).find((u: any) => Array.isArray(u) && u.length > 0)
    if (l) return (l as any[])[0]
  }
  return e?.message ? e.message : t
}
/** 是否抖音双授权（官方 n2） */
export function n2(e: any, t: any = null) {
  const a = Array.isArray(t?.stepKeys) ? t.stepKeys.filter(Boolean) : []
  return e === 'douyin' && a.length > 0
}
/** 授权取消判断（官方 r2） */
export function r2(e: any) {
  return e?.cancelled === true || e?.code === 'authorization_cancelled'
}
/** 响应成功校验（官方 xo） */
export function xo(e: any, t: any) {
  if (e?.data?.success === false) throw new Error(e.data.message || t)
  return e
}
/** 调试日志（官方 Hr/_v） */
export function Hr(e: any, t: any) { try { console.log(e, t) } catch {} }
export function _v(e: any, t: any) { try { console.error(e, t) } catch {} }
/** attemptId（官方 KG） */
export function KG() {
  const e = (globalThis as any)?.crypto?.randomUUID
  return typeof e === 'function' ? e.call((globalThis as any).crypto) : `attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
/** 中奖徽标（官方 IC/AG） */
export function IC(e: any) {
  return e ? React.createElement('span', { className: 'inline-flex h-5 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-100 px-1.5 text-xs text-amber-700' }, '奖') : null
}
export const AG = IC
export function LC(e: any) { return e ? 'bg-amber-50/70 hover:bg-amber-50' : '' }
export function BC(e: any) { return `sticky right-0 z-10 text-center shadow-[-2px_0_4px_rgba(0,0,0,0.02)] ${e ? 'bg-amber-50/95' : 'bg-white'}` }
/** 日期时间格式化（官方 GC） */
export function GC(e: any) { return e ? dayjs(e).format('YYYY-MM-DD HH:mm:ss') : null }
/** 时间格式化（官方 ZG） */
export function ZG(e: any) {
  if (!e) return '-'
  const t = new Date(e)
  return Number.isNaN(t.getTime()) ? '-' : t.toLocaleString()
}
/** 店铺匹配（官方 KC） */
export function KC(e: any, t: any) {
  if (!e || !t?.id) return false
  const a = String(t.id)
  return String(e.order_owner_shop_id ?? '') === a || String(e.store_shop?.id ?? '') === a || (Array.isArray(e.store_options) && e.store_options.some((o: any) => String(o?.id ?? '') === a))
}
/** 备注配置归一化（官方 NG） */
export function NG(e: any) {
  return { ...e, content: { permanent: !!e?.content?.permanent, nickname: !!e?.content?.nickname, serial: !!e?.content?.serial }, skipLuckyBagSerialMatch: !!e?.skipLuckyBagSerialMatch }
}
/** 店铺名匹配（官方 SG） */
export function SG(e: any, t: any) {
  const a = Gp(t?.shop_name || t?.live_room_name)
  const o = Gp(e?.live_room_name || e?.shop_name)
  return !!a && a === o
}
/** 用户名有效（官方 VC/yG） */
export function yG(e: any) {
  const t = String(e ?? '').trim()
  return t !== '' && !t.includes('*')
}
export function VC(e: any) { return yG(e?.user_name) }
/** 同步状态工厂（官方 aG） */
export function aG(e: any) {
  return { progressToken: e, intent: 'sync_only', status: 'idle', canBatchRemark: false, total: null, synced: 0, decrypted: 0, decryptFailed: 0, decryptRetrying: false, decryptProcessed: 0, decryptAttemptTotal: 0, remainingDecrypt: 0, syncFailures: [], decryptFailures: [], limitReached: false, message: '', error: '', errorCode: '', detail: '', actionHint: '', traceId: '' }
}
/** 店铺 id（官方 wM） */
export function wM(e: any) { return e?.id ? String(e.id) : null }
/** 本地备注店铺选择（官方 lm/wG） */
export function lm(e: any, t: any) {
  if (typeof localStorage === 'undefined') return
  const a = wM(e)
  if (!a) return
  const o = (Array.isArray(t) ? t : []).map((u: any) => u?.id).filter(Boolean).map(String)
  const l = bM()
  l[a] = o
  localStorage.setItem(k0, JSON.stringify(l))
}
export function wG(e: any) {
  const t = wM(e)
  if (!t) return []
  const a = bM()[t]
  return Array.isArray(a) ? a.map(String) : []
}
export function bM() {
  if (typeof localStorage === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(k0) || '{}') } catch { return {} }
}
/** 打印 provider 变更（官方 Qj） */
export function Qj(e: any) {
  if (typeof window === 'undefined' || !Cf.includes(e)) return
  window.dispatchEvent(new CustomEvent(nc, { detail: { printProvider: e } }))
}
/** 客户端设置归一化（官方 Xj） */
export function Xj(e: any) {
  return !e || typeof e !== 'object'
    ? { ...ii }
    : { closeBehavior: e.closeBehavior === 'tray' || e.closeBehavior === 'exit' ? e.closeBehavior : ii.closeBehavior, askOnClose: typeof e.askOnClose === 'boolean' ? e.askOnClose : ii.askOnClose, printProvider: Cf.includes(e.printProvider) ? e.printProvider : ii.printProvider }
}
/** 客户端设置构建（官方 hq） */
export function hq(e: any, t: any, a: any = ii.printProvider) {
  return { closeBehavior: e === 'tray' ? 'tray' : 'exit', askOnClose: t !== true, printProvider: Cf.includes(a) ? a : ii.printProvider }
}
/** 打印 provider 保存（官方 nv） */
export function nv(e: any) {
  if (typeof localStorage === 'undefined' || !Cf.includes(e)) return
  localStorage.setItem(kR, e)
}
/** 同步状态标签（官方 fG） */
export const fG: Record<string, string> = { syncing: '同步中', decrypting: '获取昵称中', ready: '已完成', failed: '失败', no_decrypt: '已完成' }
/** 是否解密中（官方 cG） */
export function cG(e: any) {
  return ['decrypting', 'ready', 'failed', 'preparing_remark'].includes(e?.status) && (Number(e?.decrypted || 0) > 0 || Number(e?.decryptFailed || 0) > 0 || Number(e?.remainingDecrypt || 0) > 0)
}
/** 同步进度（官方 iG） */
export function iG(e: any) {
  const t = Number(e?.total || 0)
  return t <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((Number(e?.synced || 0) / t) * 100)))
}
/** 解密进度（官方 lG） */
export function lG(e: any) {
  const t = Number(e?.decryptAttemptTotal || 0)
  if (t > 0) {
    const o = Number(e?.decryptProcessed || 0)
    return Math.max(0, Math.min(100, Math.round((o / t) * 100)))
  }
  const a = Number(e?.decrypted || 0) + Number(e?.decryptFailed || 0) + Number(e?.remainingDecrypt || 0)
  return a <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((Number(e?.decrypted || 0) / a) * 100)))
}
/** 同步错误提取（官方 oG） */
export function oG(e: any) {
  return { message: String(e?.message || e?.error || '订单同步失败').trim(), actionHint: String(e?.actionHint || '').trim(), traceId: String(e?.traceId || '').trim() }
}
/** 同步完成判断（官方 uG） */
export function uG(e: any, t = 'sync_only') {
  return (e?.status === 'ready' || e?.status === 'no_decrypt') && (t === 'sync_only' || Number(e?.total || 0) <= 0)
}

// ═══════════════════════════════════════════════════════════════════
// 直播工作台辅助（第二轮）：列表过滤/配置归一化/弹窗组件/UI 别名
// ═══════════════════════════════════════════════════════════════════

const hM = 'DANMU_ACTIVE_DASHBOARD_ROW_ID'
/** 保存当前仪表盘行（官方 GW） */
export function GW(e: any) {
  if (typeof localStorage === 'undefined') return
  const t = Fr(e)
  if (t) localStorage.setItem(hM, t)
}
/** 仪表盘平台码（官方 Gr） */
export function Gr(e: any) {
  return e?.dashboard_platform_code || e?.platform_code || null
}
/** 弹幕列表过滤工厂（官方 KW） */
export function KW() {
  return { shopId: '', status: '', nickname: '', startTime: '', endTime: '', page: 1, size: 100 }
}
/** 去重合并（官方 $W，按 commentId/id 去重） */
export function $W(e: any = [], t: any, a: any) {
  const list = Array.isArray(t) ? t : []
  const seen = new Set()
  return list.filter((b: any) => {
    const k = FW(b) || String(a || '')
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
/** 扣数配置归一化（官方 UW） */
export function UW(e: any = {}) {
  const t = e.printRule || 'anyNumber'
  return {
    deductionMode: t === 'grid' ? 'grid' : 'custom',
    printRule: t === 'grid' ? 'grid' : t === 'customCombined' ? 'customCombined' : t,
    numberMode: e.numberMode || 'specified',
    numberMin: e.numberMin ?? 1,
    numberMax: e.numberMax ?? 999999,
    numberSpecified: Yl(e.numberSpecified || ''),
    numberIncludeDecimal: e.numberIncludeDecimal ?? false,
    customFormats: e.customFormats?.length ? e.customFormats : ['includeNumber'],
    customKeywords: Yl(e.customKeywords || ''),
    customKeywordDeductMode: e.customKeywordDeductMode || 'numberWithKeyword',
    customKeywordMatchMode: e.customKeywordMatchMode || 'exact',
    gridCount: Vl(e.gridCount ?? 12),
    gridAutoAssign: e.gridAutoAssign ?? false,
    gridFormats: e.gridFormats?.length ? e.gridFormats : ['pureNumber'],
    gridKeywords: Yl(e.gridKeywords || ''),
    gridKeywordDeductMode: e.gridKeywordDeductMode || 'numberWithKeyword',
    gridKeywordMatchMode: e.gridKeywordMatchMode || 'exact',
    gridDedupMode: e.gridDedupMode || 'buyerEachGridOnce',
    sizeRules: Array.isArray(e.sizeRules) ? e.sizeRules : [],
    keyword1: e.keyword1 || '',
    keyword2: e.keyword2 || '',
    keyword3: e.keyword3 || '',
    antiDuplicateEnabled: e.antiDuplicateEnabled ?? true,
    antiDuplicateSeconds: Number(e.antiDuplicateSeconds || 5),
    serialMode: e.serialMode || 'flow',
    serialResetTime: e.serialResetTime || 0,
    templateId: e.templateId,
    selectPrinter: e.selectPrinter || '',
  }
}
/** 已选尺码（官方 OC） */
export function OC(e: any) {
  return lM(e).filter((t) => t.checked).map((t) => t.label)
}
/** 防抖 hook（官方 kW）：返回 { schedule, flush, cancel } */
export function kW({ delayMs = 500, save, setTimeoutImpl = setTimeout, clearTimeoutImpl = clearTimeout }: any) {
  let t: any = null
  let _latest: any = null
  const schedule = (...args: any[]) => {
    _latest = args
    clearTimeoutImpl(t)
    t = setTimeoutImpl(() => { save?.(..._latest) }, delayMs)
  }
  const flush = (...args: any[]) => {
    clearTimeoutImpl(t)
    t = null
    if (args.length) return save?.(...args)
    if (_latest) return save?.(..._latest)
    return undefined
  }
  const cancel = () => { clearTimeoutImpl(t); t = null }
  return { schedule, flush, cancel }
}
/** 打印文档构建（官方 nw 简化） */
export function nw(e: any, t: any) {
  const { width, height } = t || {}
  return (Array.isArray(e) ? e : []).map((item: any) => ({
    documentID: Xs(8, 16),
    contents: [{ templateURL: HR, data: { width, height, html: FR(item, t || {}, false) } }],
  }))
}
/** 停止会话（官方 x0 简化） */
export function x0() {
  try { window.electronAPI?.stopDanmakuSession?.({}).catch?.((e: any) => console.warn(e)) } catch {}
}
/** 店铺选择配置（官方 oC，数据函数） */
export function oC({ liveShopId, storeShopId = null, selectorMode = 'single', compareMode = 'identity' }: any) {
  return { liveShopId: liveShopId ?? null, storeShopId, selectorMode, compareMode }
}
/** 能力状态行（官方 qq，数据函数） */
export function qq({ shop, capabilityName, rows }: any) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) return []
  const cap = shop?.capabilities?.[capabilityName]
  return rows.map((r: any, i: number) => ({ ...r, index: i, state: cap?.state || 'ready' }))
}
/** 工作台头部（官方 h0，数据函数） */
export function h0({ liveShop, selectedStoreShop = null, isSplitPlatform = false }: any) {
  return { liveShop: liveShop || null, selectedStoreShop, isSplitPlatform, livePlatformCode: liveShop?.platform_code || null }
}
/** 列表配置（官方 vV，数据函数） */
/** 弹幕列表过滤（官方 vV）：按状态/昵称/店铺过滤 danmaku 数组，返回数组 */
export function vV(list: any, filters: any = {}) {
  const items = Array.isArray(list) ? list : []
  const q = filters || {}
  let out = items
  if (q.status === 'matched') out = out.filter((i: any) => i.status === 'matched' || i.printStatus || i.print_status)
  else if (q.status === 'processed') out = out.filter((i: any) => i.status !== 'matched' && !i.printStatus && !i.print_status)
  if (q.nickname) {
    const kw = String(q.nickname).trim()
    if (kw) out = out.filter((i: any) => (i.nickname || i.shopName || '').includes(kw))
  }
  if (q.shopId) out = out.filter((i: any) => String(i.shopId ?? i.shop_id ?? '') === String(q.shopId))
  return out
}
/** UI 别名：Badge/TableCell/TableRow/ExternalLink（官方 Da/Oe/Yt/Wv） */
import { Badge as _Badge } from '@/components/ui/badge'
import { TableCell as _TableCell, TableRow as _TableRow } from '@/components/ui/table'
import { ExternalLink as _ExternalLink } from 'lucide-react'
export const Da = _Badge as any
export const Oe = _TableCell as any
export const Yt = _TableRow as any
export const Wv = _ExternalLink as any

/** Popover 箭头（官方 AR） */
export function AR({ className }: any) {
  return React.createElement('div', { className: className || 'absolute h-2 w-2 rotate-45 rounded-sm bg-white shadow-sm border-l border-t' })
}
/** Popover 内容（官方 CR） */
export function CR({ className, children, ..._rest }: any) {
  return React.createElement('div', { className: className || 'z-30 w-[280px] rounded-xl bg-white p-3 shadow-xl border' }, children)
}
/** Popover 触发器（官方 ER，asChild 兼容） */
export function ER({ children, ..._rest }: any) {
  return React.createElement(React.Fragment, null, children)
}
/** Popover 触发器（官方 SF，asChild 兼容） */
export function SF({ children, ..._rest }: any) {
  return React.createElement(React.Fragment, null, children)
}
/** 二维码登录弹窗（官方 HT） */
export function HT({ open, phase, qrCodeUrl, errorMessage, onOpenChange }: any) {
  if (!open) return null
  return React.createElement(
    'div',
    { className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4', onClick: () => onOpenChange?.(false) },
    React.createElement(
      'div',
      { className: 'w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl', onClick: (e: any) => e.stopPropagation() },
      React.createElement('div', { className: 'mb-4 text-center text-lg font-semibold text-gray-900' }, '扫码授权登录'),
      React.createElement('div', { className: 'flex justify-center py-4' },
        qrCodeUrl
          ? React.createElement('img', { src: qrCodeUrl, alt: '登录二维码', className: 'h-52 w-52 rounded-md border' })
          : React.createElement('div', { className: 'h-52 w-52 animate-pulse rounded-md bg-gray-100' })
      ),
      React.createElement('div', { className: 'text-center text-sm text-gray-500' }, phase === 'failed' ? (errorMessage || '授权失败，请重试') : '请使用平台 App 扫码完成授权'),
      React.createElement('div', { className: 'mt-4 flex justify-end gap-2' },
        React.createElement('button', { className: 'rounded-md border px-4 py-2 text-sm text-gray-600', onClick: () => onOpenChange?.(false) }, '关闭')
      )
    )
  )
}

// ═══════════════════════════════════════════════════════════════════
// 第三轮补充：Shops/Notes/OrderSyncProgressBoard 页面缺失辅助
// ═══════════════════════════════════════════════════════════════════
export const zG: Set<string> = new Set(['douyin'])
export const DG = 720 * 60 * 1000
export const IG = (e: any, t: any) => `authorization_safety_until:${e}:${t}`
export const LG = (e: any, t: any) => `authorization_safety_scope:${e}:${t}`
/** 店铺 curl 判断（官方 jM） */
export function jM(e: any) {
  if (!e || typeof e !== 'object') return false
  const chain = [e, ...(e.legacy && typeof e.legacy === 'object' ? [e.legacy] : []), ...(e.steps && typeof e.steps === 'object' ? Object.values(e.steps).filter((a) => a && typeof a === 'object') : [])]
  return chain.some((s: any) => {
    if (!s || typeof s !== 'object') return false
    return Boolean(s.cookies || s.shop_curl || s.url || s.cookie_str || (s.shopCurl && typeof s.shopCurl === 'object' && (s.shopCurl.cookies || s.shopCurl.url)))
  })
}
/** 授权安全期写入（官方 wv） */
export function wv(e: any, t: any, a: any = null) {
  const o = a?.shopMetadata?.shopCurl
  const l = jM(o)
  if (!zG.has(e) || typeof localStorage === 'undefined' || !l) return
  const u = String(Date.now() + DG)
  if (t != null) {
    const f = Array.isArray(a?.authorizationScope?.stepKeys) ? a.authorizationScope.stepKeys.filter(Boolean) : []
    localStorage.setItem(IG(e, t), u)
    localStorage.setItem(LG(e, t), JSON.stringify({ until: Number(u), stepKeys: f }))
  }
}
/** 进度条（官方 HC） */
export function HC({ value, color = 'bg-blue-500' }: any) {
  const p = Math.max(0, Math.min(100, Number(value || 0)))
  return React.createElement('div', { className: 'h-2 w-full overflow-hidden rounded-full bg-gray-100' },
    React.createElement('div', { className: `h-full rounded-full transition-all ${color}`, style: { width: `${p}%` } })
  )
}
/** 分页尺寸（官方 vG） */
export const vG = [50, 100, 200]
/** 批量备注任务（官方 gG，简化 hook） */
export function gG({ orderIds, beforeCreate, createJob, executeJob, refreshJob, onJob }: any) {
  const orderIdList = Array.isArray(orderIds) ? orderIds : []
  React.useEffect(() => {
    if (!orderIdList.length) return
    let cancelled = false
    ;(async () => {
      beforeCreate?.()
      try {
        const created = await createJob?.({ order_ids: orderIdList })
        if (!created || cancelled) return
        const jobId = created?.job_id ?? created?.id ?? created?.data?.job_id
        onJob?.({ job_id: jobId, status: 'created' })
        const result = await executeJob?.({ job_id: jobId, order_ids: orderIdList })
        refreshJob?.(result)
      } catch (e) {
        onJob?.({ status: 'failed', error: e })
      }
    })()
    return () => { cancelled = true }
  }, [JSON.stringify(orderIdList)])
  return { submitting: false }
}
/** 店铺选择（官方 rG，简化 hook） */
export function rG({ shops, currentShopId, isElectron }: any) {
  const list = Array.isArray(shops) ? shops : []
  const current = list.find((s: any) => Number(s?.id) === Number(currentShopId)) || list[0] || null
  return { currentShop: current, shops: list, isElectron: !!isElectron, selectShop: () => {} }
}

/** 强制引导店铺 map（官方 fw）：读 localStorage ff */
export function fw() {
  if (typeof localStorage === 'undefined') return new Map()
  try {
    const e = JSON.parse(localStorage.getItem(ff) || '[]')
    const entries = (Array.isArray(e) ? e : []).map((t: any): [number, any[]] | null => {
      if (t && typeof t === 'object') {
        const o = Number(t.shopId ?? t.id)
        if (!Number.isFinite(o)) return null
        const l = Array.isArray(t.stepKeys) ? t.stepKeys.filter(Boolean) : []
        return [o, l]
      }
      const a = Number(t)
      return Number.isFinite(a) ? [a, []] : null
    }).filter((x): x is [number, any[]] => x !== null)
    return new Map(entries)
  } catch { return new Map() }
}
/** 强制引导店铺写入（官方 t2） */
export function t2(e: any, t: any = null) {
  if (typeof localStorage === 'undefined') return
  const a = Number(e)
  if (!Number.isFinite(a)) return
  const o = fw()
  const l = Array.isArray(t?.stepKeys) ? t.stepKeys.filter(Boolean) : []
  o.set(a, l)
  localStorage.setItem(ff, JSON.stringify([...o].map(([u, d]) => ({ shopId: u, stepKeys: d }))))
}
/** 店铺卡片包装（官方 Zj） */
export function Zj(e: any, t: any = {}) {
  return React.createElement('div', { className: t.className || 'rounded-lg border bg-white p-4' }, e)
}

// ═══════════════════════════════════════════════════════════════════
// 反转 JSX 里的压缩 Card 包装组件（官方 ab/sb/ob/ib/lb/da 等）
// 转成 <div> 透传组件，使重建 DOM 与官方一致（而非未知 <ab> 标签）。
// ═══════════════════════════════════════════════════════════════════
function _passthroughDiv(_name: string) {
  const C = ({ className, children, ...props }: any) =>
    React.createElement('div', { className, ...props }, children)
  C.displayName = _name
  return C
}
export const ab = _passthroughDiv('ab') // Card
export const sb = _passthroughDiv('sb') // CardHeader
export const ob = _passthroughDiv('ob') // CardTitle
export const ib = _passthroughDiv('ib') // CardDescription
export const lb = _passthroughDiv('lb') // CardContent
export const da = _passthroughDiv('da') // DialogFooter/actions
export const lu = _passthroughDiv('lu')
export const tb = _passthroughDiv('tb')
export const nj = _passthroughDiv('nj')
export const tj = _passthroughDiv('tj')
export const rj = _passthroughDiv('rj')
export const ie = _passthroughDiv('ie')
/** 日历图标（官方 cu） */
export const cu = React.forwardRef<any, any>(({ className, ...props }, ref) =>
  React.createElement('svg', { ref, className, viewBox: '0 0 16 16', fill: 'none', ...props },
    React.createElement('rect', { x: '1.5', y: '3', width: '13', height: '11', rx: '2', stroke: 'currentColor', strokeWidth: '1.2' }),
    React.createElement('path', { d: 'M1.5 7h13M5 1.5V4M11 1.5V4', stroke: 'currentColor', strokeWidth: '1.2', strokeLinecap: 'round' })
  )
)
/** ErrorToastRenderer（官方 ng） */

// ═══════════════════════════════════════════════════════════════════
// 大写别名：JSX 小写标签被当作 HTML 字符串，需用大写组件名才走导入组件。
// 官方压缩 Card 包装组件 -> 大写 div 透传，使重建 DOM 与官方一致。
// ═══════════════════════════════════════════════════════════════════
function _passthroughDivC(name: string) {
  const C = ({ className, children, ...props }: any) =>
    React.createElement('div', { className, ...props }, children)
  C.displayName = name
  return C
}
export const Ab = _passthroughDivC('Card')          // 官方 ab
export const Sb = _passthroughDivC('CardHeader')    // 官方 sb
export const Ob = _passthroughDivC('CardTitle')     // 官方 ob
export const Ib = _passthroughDivC('CardDescription') // 官方 ib
export const Lb = _passthroughDivC('CardContent')   // 官方 lb
export const DA = _passthroughDivC('DialogFooter')  // 官方 da（避免与 Badge 别名 Da 冲突）
export const LU = _passthroughDivC('lu')
export const TB = _passthroughDivC('tb')
export const NJ = _passthroughDivC('nj')
export const TJ = _passthroughDivC('tj')
export const RJ = _passthroughDivC('rj')
export const IE = _passthroughDivC('ie')
/** 日历图标（官方 cu） */
/** ErrorToastRenderer（官方 ng，大写别名 ErrToast 避免与 Notes NG 冲突） */
export const ErrToast = () => null

export const CU = React.forwardRef<any, any>(({ className, ...props }, ref) =>
  React.createElement('svg', { ref, className, viewBox: '0 0 16 16', fill: 'none', ...props },
    React.createElement('rect', { x: '1.5', y: '3', width: '13', height: '11', rx: '2', stroke: 'currentColor', strokeWidth: '1.2' }),
    React.createElement('path', { d: 'M1.5 7h13M5 1.5V4M11 1.5V4', stroke: 'currentColor', strokeWidth: '1.2', strokeLinecap: 'round' })
  )
)
/** ErrorToastRenderer（官方 ng） */
