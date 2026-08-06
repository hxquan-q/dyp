# 主进程源码导读（Electron Main Process）

> 文件：`electron/main/index.js` — 由官方构建产物 beautify 还原，逻辑完整可运行。
> 原始 TS 源码因无 sourcemap 无法恢复；本文件为最小可读版（压缩变量名），全部结构/IPC/业务逻辑保留。

## 模块结构（按文件中行号定位）

| 行号 | 模块 | 说明 |
|---|---|---|
| 2900 | `d extends Error` | 自定义错误类型 |
| ~3300 | 设备头构建 `buildElectronDeviceRequestHeaders` | 组装 `X-Koudanbao-*` 设备头 |
| ~4700 | 会话管理器 | 加载平台登录页 / 注入弹幕采集 |
| 5665 | 微信视频号平台驱动 | 登录、弹幕捕获、订单同步 |
| 6836 | 抖店达人平台驱动 | 同上 |
| 8035 | 抖音平台驱动 | 同上（核心平台） |
| 11660 | 淘宝平台驱动 | 同上 |
| 12865 | 微信小店平台驱动 | 同上 |
| 14140 | 小红书平台驱动 | 同上 |
| **14660** | **DanmakuDispatcher** | **弹幕调度器：扣数匹配/批次/去重/打印分发** |
| ~15800 | 订单同步/上报服务 | 服务端 API 客户端 |
| ~16000 | 订单备注处理器 | 批量打备注 |
| ~17000 | 主窗口 Tab 管理器 | 平台后台多 Tab 管理 |

## DanmakuDispatcher（弹幕调度器核心）

扣数匹配的完整链路（与 mock 后端 `server.py` 的 `_match_deduction` 一一对应）：

```
loadConfig()  GET /api/electron/live-config?shop_id=X
              → displayFilter / deductionRules / blacklist / shopInfo
handleDanmaku(弹幕)
  → 类型过滤（只处理 chat）
  → 按 signature(nickname|content) 查 recentMatchedSignatures 去重
  → preMatchRules → matchSingleRule(每条规则)
      - anyNumber / onlyPureNumber / only12 / exclude12 / letter3Digit1
      - numberWithSize / numberWithKeyword（预编译 dt 正则）
      - onlyKeyword / numberIncludeKeyword / customCombined / grid
  → 匹配成功 → matchedBuffer
flushMatchedBuffer()
  → POST /api/electron/danmaku/process（提交本批弹幕+匹配结果）
  → 响应 outcomes（前端列表）+ printItems（打印数据）
  → emit('display') 实时列表 / emit('printResults') 触发打印
```

宫格（grid）逻辑：
- `matchGridRule`：遍历 gridFormats，用 matchFormatRule 提取数字
- `gridAutoAssign=false`：数字须在 `1~gridCount`
- `gridAutoAssign=true`：按出现顺序自动分配 1~50 号（本批去重）
- `gridDedupMode`：买家每格去重

## 全部 IPC 通道（preload 完整暴露）

### 平台操作
- `platform:login(platform, shopId, loginUrl)` — 打开平台登录
- `platform:disconnect(params)` — 断开授权

### 弹幕会话
- `danmaku:startSession(cfg)` — 开始弹幕会话（内部 loadConfig + start）
- `danmaku:stopSession(params)`
- `danmaku:resetBatch(params)` — 清空本批（下一轮）
- `danmaku:resetLuckyBagBatch(params)` — 清空福袋批次
- `danmaku:setPaused(params)` — 暂停/恢复
- `danmaku:reloadConfig()` — 热重载扣数规则

### 弹幕事件（主进程 → 渲染进程）
- `danmaku:display` — 实时弹幕列表
- `danmaku:resolved` — 匹配结果更新
- `danmaku:lucky-bag-batch-reset` — 福袋批次重置
- `print:results` — 打印结果（触发标签打印）

### 订单同步
- `orders:sync(params)` — 同步订单
- `orders:sync-progress` — 同步进度事件
- `orders:live-synced` / `orders:live-sync-status` — 直播期间订单同步
- `orders:retry-decrypt-and-remark(params)` — 重试解密+备注
- `orders:batch-remark(params)` — 批量备注
- `orders:resolve-identity(params)` — 解析昵称/身份（新）
- `orders:get-nickname(params)` / `orders:decrypt-nickname(params)` — 旧兼容接口

### 打印
- `electron-print:get-printers()` — 系统打印机列表
- `electron-print:print-labels(payload)` — 打印标签（HTML 渲染）
- `electron-print:diagnose()` — 打印诊断
- `electron-print:get-settings/update-settings` — 打印设置

### 店铺授权
- `shop:authorize` / `shop:authorizeWechat` — 平台授权
- `shop:openCloudPrintAuthorization` / `shop:collectCloudPrintAuthorization` — 云打印授权
- `shop:channelsGetQr` / `shop:channelsCheckLogin` / `shop:channelsBindSession` — 视频号扫码登录
- `shop:switch` / `shop:rebind` / `shop:commitAuthorization` / `shop:status` / `shop:bootstrap` / `shop:deauthorize`
- `shop:status-changed` / `authorization:expired` — 事件

### 应用
- `app:version` / `app:device-info` / `app:quit` / `app:set-always-on-top`
- `app:update-available` / `app:update-download-progress` / `app:update-downloaded` / `app:update-error`
- `app:download-update` / `app:quit-and-install` / `app:open-desktop-download-page`
- `client-settings:get/update` — 客户端设置
- `logs:upload` — 上传日志

## 平台弹幕采集（抖音）

抖音平台驱动通过注入脚本捕获 WebSocket/网络弹幕：
- 登录页：`https://buyin.jinritemai.com/mpa/account/login` 等
- 弹幕接口：`https://anchor.douyin.com/webcast/anchor_platform/api/v1/anchor_detail/get_anchor_card`
- 通过 `xhs-live-capture.js` / `xhs-order-sync-capture.js`（preload）注入页面采集

> 二开提示：本地 mock 环境下弹幕来自 mock 生成的假弹幕，不真正连平台。接入真实平台时，主进程会捕获真实弹幕。
