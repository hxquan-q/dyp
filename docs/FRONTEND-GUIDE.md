# 前端源码导读（Inertia SPA）

> 文件：`frontend/assets/app.beautified.js`（2.1 万行，由官方构建产物 beautify 还原）
> 原始 TSX 源码无 sourcemap 无法恢复；本文件为最小可读版。
> 原始压缩包：`frontend/assets/app-bundle.min.js`（1MB，供对照）
> 样式：`frontend/assets/app.css`
>
> ⚠️ **部署说明**：后端实际投放的前端是官方原始生产包 `app-bundle.min.js`
> （见 `backend/assets/app-Buzwood0.js`，注入 isElectron 补丁）。本文件 + `frontend-src/`
> 是给二开用的可读重建版。

## 架构

- **框架**：React + Inertia.js（服务端渲染的 SPA）
- **数据流**：每个页面由后端渲染 `data-page`（组件名 + props），组件通过 `Xr().props` 读取
- **HTTP 客户端**：axios 实例 `zt`，带 `X-Requested-With: XMLHttpRequest`；Electron 环境自动附加 `X-Koudanbao-Client: electron` + 设备头
- **IPC**：Electron 环境下 `window.electronAPI` 可用（见 preload 源码）

## 页面组件位置图谱

| 行号 | 组件 | 页面 | 核心 props |
|---|---|---|---|
| 8995 | Auth/Login | 登录页 | `apiToken/shops` |
| 10551 | Settings/OrderSubscriptions | 订阅页 | `subscriptionSummary` |
| 11020 | Deduction/Shops | 授权账号管理 | `shops/shopDisplayRows` |
| 11105 | Deduction/Config | **弹幕配置页**（弹幕→商品映射 CRUD） | `configs/tenantId` |
| 11360 | Deduction/EditTemplate | 模板编辑器 | `template/auth` |
| 11678 | Deduction/Index | **扣数打印主页/直播工作台** | `dashboardRows/activeDashboardRowId` |
| 13091 | Deduction/Blacklists | 黑名单 | `items/subscriptionSummary` |
| 13717 | Deduction/Buyers | 买家管理 | `buyers/subscriptionSummary` |
| 14093 | Deduction/Template | 打印模板列表 | `templates/flash` |
| 14220 | Settings/Devices | 登录设备 | `devices/deviceLimit` |
| 14275 | Settings/PaymentConfirm | 支付确认 | `plan/buyer/confirmUrl` |
| 14286 | Settings/WechatNativePay | 微信支付 | `order` |

> Notes（订单备注）、PrintLog（打印日志）组件也在文件后段，可搜索 `订单备注` / `打印日志` 文案定位。

### 重建还原程度（frontend-src）

部署运行的是官方原版 bundle，因此**运行 UI 与原版完全一致**。`frontend-src/` 为可读重建版，全部 17 页面均已重建并可直接运行：

| 档位 | 页面 | 说明 |
|---|---|---|
| 完整转录 | Login / Register / Config / EditTemplate / Notes / PrintLog / Blacklists / Buyers / Template / Shops / OrderSubscriptions / Devices / PaymentConfirm / WechatNativePay / ClientSettings / OrderSyncProgressBoard | JSX 保留原逻辑+布局+className，helper 替换为具名组件 |
| **完整转录（大页面）** | **Index（扣数打印主页，2505 行）** | 由官方 `Index.src.js`（125KB）自动转换还原，含跑单提醒/福袋/快速过款/孤品/灯牌优先/模拟开播/宫格等全部功能 |

运行时兼容层 `src/lib/reverse-runtime.ts`（+120 个压缩名辅助）按官方 bundle 逻辑逐项还原，覆盖：
平台定义 `i0/fl/Sq/Gs/eC`、弹幕会话状态机 `ze/vr/RV/lv/nT`、网格/格式化 `Vl/om/HW/eV`、
列表过滤 `KW/zC/GR`、扣数配置归一化 `UW/PC`、尺码 `bu/iM/lM/MW/OC`、打印渲染 `rV/tw/FR/Xs`、
设备头 `bp/yf/Bm`、普通 axios `kn`、文档标题 `OE`、Inertia Link `So` 等。
`tools/reverse-jsx.js` 可对任意 `_reverse-ref/*.src.js` 重新生成对应 TSX。

## API 端点清单（前端调用）

### 弹幕/扣数
- `GET /deduction-rule` — 读取扣数规则（`{code:0, data}`）
- `POST /deduction-rule` — 保存扣数规则（shopId + 扁平字段）
- `POST /danmu/list` — 弹幕列表
- `POST /danmu/print` / `POST /danmu/rePrint` — 弹幕补打
- `POST /danmu/simulate` — 模拟弹幕（本地 mock 用）
- `GET|POST /danmu/order/match` — 跑单提醒匹配
- `POST /danmu/order/alerts/clear` — 清除跑单提醒
- `GET|POST|PUT|DELETE /danmu-product-relations` — 弹幕→商品映射

### 店铺/授权
- `GET /shops` / `POST /shops/list` — 店铺列表
- `POST /shops/platform-app/oauth-url` — 获取授权 URL
- `POST /shops/platform-app/authorization` — 提交授权
- `POST /shops/finalize-authorization` — 完成授权
- `POST /shops/connect` / `POST /shops/switch` — 连接/切换店铺
- `DELETE /shops/{id}` — 删除授权

### 模板
- `GET /tag-templates/list` — 模板列表
- `POST /tag-templates` — 新建模板
- `PUT /tag-templates/{id}` / `DELETE /tag-templates/{id}` — 改/删

### 其它
- `POST /api/electron/device-token` — 设备令牌（Electron 启动）
- `GET /blacklists` / `POST /blacklists/toggle` — 黑名单
- `POST /buyers/reset` — 买家管理
- `POST /print-log/list` — 打印日志
- `POST /order/list` — 订单列表
- `POST /order/batch-remark/jobs` — 批量备注
- `POST /sms/send*` — 短信验证码（mock 任意 6 位）
- `POST /logout` — 登出
- `POST /payment/plans` / `POST /redeem` — 订阅/兑换

## 打印标签模板字段

标签渲染函数把模板字段映射到打印数据（`rV` 函数）：
- `<%=data.mallName%>` → `shop_name`
- `<%=data.itemCode%>` → `itemCode`
- `<%=data.index%>` → `index/num_index`
- `<%=data.nickname%>` → `nickname`
- `<%=data.permanentNumber%>` → `buyer_number`（买家永久编号）
- `<%=data.content%>` → `content`（弹幕原文）
- `<%=data.matchContent%>` → `matched_content`（扣数内容）
- `<%=data.productNo%>` → `product_relation.product_no`（货号）
- `<%=data.price%>` → `product_relation.price`（价格）
- `<%=data.time%>` → `comment_time`
- `<%=data.luckyBagMark%>` → `luckyBagMark`

> 价格/货号来自后端 `/danmaku/process` 响应中的 `product_relation`（弹幕→商品映射查得，无映射时为扣数本身）。
