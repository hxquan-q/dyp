# 扣单宝 本地重建工程（二开基础）

> 本工程由官方桌面客户端（扣单宝 v1.1.2）逆向还原整理，目标是为二次开发提供完整可读的前后端源码基础。
>
> ⚠️ 说明：官方前端/主进程为无 sourcemap 的生产构建，原始 TS/TSX 无法恢复。本工程提供的是**逻辑完整、可运行、可读的最小化源码**，配合文档可二开。

## 独立落地入口

本目录现在可以作为单独项目使用，根目录提供统一脚本：

```powershell
# 安装依赖（首次或 package-lock 变更后）
npm install
npm --prefix frontend-src install
npm --prefix electron install

# 一键验证：前端类型检查 + 后端协议 + 扣数引擎 + JS 集成/runtime 测试
npm test

# 构建前端
npm run build

# 打包内置后端，再生成 Electron 安装包/便携包
npm run package
# 仅生成 unpacked 目录，便于快速验收
npm run package:dir
```

运行期数据目录规则：

- 开发模式默认继续使用 `backend/global-store.json`，兼容原有调试数据；
- 设置 `KDB_DATA_DIR=<目录>` 可显式隔离数据；
- PyInstaller 打包后的后端默认使用 `%APPDATA%\Koudanbao`；
- Electron 若未设置 `KOUDANBAO_URL`，会自动拉起内置/本地 Python 后端，并用动态端口加载页面。

## 部署说明（重要）

- **已部署前端 = 重建工程构建**：`backend/assets/app-Buzwood0.js` 即 `frontend-src` 的 `npm run build` 产物
  （17 页面全部可运行，含 2505 行完整转录的直播工作台）。主服务实测全部页面 + 弹幕模拟开播 +
  订单备注等核心流程正常。
- **官方原版 bundle 保留**：`frontend/assets/app-bundle.min.js` 与 `backend/assets/app-Buzwood0.js.original-deployed.bak`
  为官方生产包（1MB），供逐字节对照。
- **本地后端 = 完整 API 契约复刻**：`backend/server.py` 实现了官方 SaaS（kdb.koudanbao.top）的全部业务端点，
  浏览器模式自动注入完整 `electronAPI` mock + 菜鸟打印组件 mock（ws://127.0.0.1:13528）。
- **本地后端 = 完整 API 契约复刻**：`backend/server.py` 实现了官方 SaaS（kdb.koudanbao.top）的全部业务端点，浏览器模式自动注入完整 `electronAPI` mock。

## 架构总览

```
Electron 桌面端 (electron/)
  ├── main.js               可运行的壳（真实平台登录 + 抖店解密 + 全 IPC 面）
  ├── main/index.js         主进程还原源码（弹幕匹配/订单同步/打印/IPC，1MB）
  └── preload/index.js      preload 桥（暴露 electronAPI 给前端）—— 与官方逐字节一致
        │
        │ HTTP (http://127.0.0.1:8787)
        ▼
Inertia SPA 前端 (backend/assets/app-Buzwood0.js = 官方原版)
        │
        │ HTTP + Inertia data-page
        ▼
本地后端 (backend/server.py)   —— 完整 Python 实现（本工程自研 mock，即服务端逻辑的参考实现）
  ├── 扣数规则 CRUD / 弹幕匹配 / 打印数据组装
  ├── 店铺授权 / 模板 / 黑名单 / 买家
  ├── 订购支付流程（/order/confirm → /payment/create → /payment/wechat → /payment/status）
  └── 数据存 global-store.json
```

## 目录结构

```
print/
├── README.md
├── backend/                    # 本地后端（Python，完整实现，参考实现/回退）
│   ├── server.py               #   全部 API：扣数规则/弹幕/店铺/模板/黑名单...
│   └── deduction_engine.py     # ★★ 扣数匹配引擎（语义化 Python 版，与 JS 重建版对齐）
├── backend-rs/                 # ★★ 本地后端（Rust/axum 版，当前主力实现）
│   ├── src/
│   │   ├── main.rs             #   CLI/资源解析/启动
│   │   ├── handlers.rs         #   HTTP 分发（对齐 Python do_GET/do_POST 分支）
│   │   ├── electron.rs         #   /api/electron/*（含 snake_case 契约修复）
│   │   ├── engine.rs           #   扣数引擎 Rust 移植（与 Python/JS 版差分对齐）
│   │   ├── inertia.rs          #   Inertia 页面层（page/base_props/build_page_for）
│   │   ├── shops.rs / templates.rs / store.rs / state.rs / cainiao_ws.rs
│   │   └── assets/shell.html   #   Inertia 壳模板（AST 从 server.py 精确抽取）
│   ├── build-backend.ps1 → backend-dist/koudanbao-backend.exe（4.7MB 单文件）
├── electron/                   # Electron 桌面端
│   ├── main/
│   │   ├── index.js                    #   主进程（utf8 还原 + 中文注释 + 模块标注）
│   │   ├── index.beautified-esc.js     #   \u 转义对照版
│   │   ├── danmaku-dispatcher.explained.js     # ★ 弹幕调度器逐行中文注释版（扣数匹配核心）
│   │   └── danmaku-dispatcher.reconstructed.js # ★★ 弹幕调度器语义化重建版（带语义命名，可独立运行/二开）
│   ├── preload/
│   │   ├── index.js            #   主桥接（近原始源码，含注释）
│   │   ├── electron-print.js   #   打印桥
│   │   ├── xhs-live-capture.js #   小红书直播采集
│   │   └── xhs-order-sync-capture.js
│   ├── resources/              # 打印 HTML / 图标
│   ├── platform-tabs/          # 平台后台 Tab 页
│   └── package.json
├── frontend/
│   └── assets/
│       ├── app.beautified.js   #   前端 utf8 还原 + 组件区块标记（2.1 万行，中文可读）
│       ├── app.beautified-esc.js  # \u 转义对照版
│       ├── app-bundle.min.js   #   官方原始压缩包（对照用）
│       └── app.css
├── frontend-src/               # ★★ 重建的 React 源码工程（Vite + React + TS + Inertia）
│   ├── src/
│   │   ├── app.tsx             #   Inertia 入口
│   │   ├── Pages/              #   16 个页面组件（全部重建）
│   │   │   ├── Auth/           #     Login / Register
│   │   │   ├── Deduction/      #     Index扣数打印 / Config弹幕配置 / Shops授权
│   │   │   │                   #     Template / EditTemplate / PrintLog / Notes
│   │   │   │                   #     Blacklists / Buyers
│   │   │   └── Settings/       #     Devices / ClientSettings / OrderSubscriptions
│   │   │                       #     PaymentConfirm / WechatNativePay
│   │   ├── hooks/use-danmaku-session.ts  # 弹幕会话 hook（事件订阅/会话控制）
│   │   ├── lib/danmaku-state.ts          # 弹幕状态机（对齐官方 Cs/Zb/Qb/Jb）
│   │   ├── components/         #   shadcn/ui 风格组件 + Provider
│   │   ├── layouts/            #   AppLayout 侧边栏
│   │   ├── lib/                #   axios/http/router 封装
│   │   └── _reverse-ref/       #   原始提取源码对照（15 页面 + Fp hook）
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│   └── dist/                   #   构建产物（与 mock 文件名一致，可部署）
├── tools/                      # 逆向还原工具脚本
│   ├── utf8-regen.js           #   esbuild charset=utf8 中文解码
│   ├── annotate-danmaku.py     #   DanmakuDispatcher 逐行注释生成
│   ├── annotate-cases.py       #   case/格式 注释增强
│   └── annotate-modules.py     #   主进程依赖模块标注
├── tests/                      # 行为一致性测试
│   ├── test-danmaku-dispatcher.js  # JS 36 项：规则匹配/去重/限购/宫格/延迟
│   └── test_deduction_engine.py    # Python 38 项：与 JS 版逐条对齐
└── docs/
    ├── MAIN-PROCESS-GUIDE.md   # 主进程源码导读（IPC/弹幕匹配/订单）
    ├── FRONTEND-GUIDE.md       # 前端组件图谱 + API 端点清单
    └── ARCHITECTURE.md         # 架构与数据流
```

## 快速启动（本地 mock 模式）

```bash
# 1. 启动后端 —— Rust 版（推荐，backend-dist 构建后）：
backend-dist\koudanbao-backend.exe --host 127.0.0.1 --port 8787
#    —— 或 Python 版（源码直跑）：
python backend/server.py --host 127.0.0.1 --port 8787

# 2. 浏览器访问 http://127.0.0.1:8787 即可用 SPA
#    （自动登录企业版，无需手机号/验证码；前端为官方原版 bundle）

# 3. 桌面端（可选）：在 electron/ 目录
KOUDANBAO_URL=http://127.0.0.1:8787 npx electron .
#    真实平台登录窗口（抖音/淘宝/小红书/视频号）+ 抖店订单解密 + 弹幕模拟
```

> 后端构建：`npm run build:backend`（scripts/build-backend.ps1）→ cargo release +
> 资源打包 → `backend-dist/koudanbao-backend.exe`（Electron 打包时随 extraResources 分发）。
> 开发模式可用 `$env:KDB_BACKEND_EXE=...` 让 Electron 直接拉起 Rust 版。

> 浏览器模式：后端自动注入完整 `electronAPI` mock（店铺授权/弹幕会话/订单/打印），
> 因此无需 Electron 也能体验全部页面与交互。注入的 mock 检测到真实 preload 时自动跳过，
> 桌面端走真实 IPC。

## 已完成的协议修复（2026-08-01）

- **弹幕配置 CRUD**：`/danmu-product-relations` POST/PUT/DELETE 现按 Inertia 契约返回页面响应
  （增删改后列表即时刷新；重复弹幕返回 409 并在前端显示「已配置过」）。
- **订购支付全流程**：`/order/confirm?plan_code=` → 支付确认页 → `POST /payment/create`
  → `/payment/wechat` 微信扫码页（轮询 `/payment/status`）→ 支付成功 → 订购记录。
  `POST /redeem` 校验 8 位兑换码。
- **订购记录字段对齐**：`subscriptions` 使用官方 `status(0待支付/1已支付/2已取消/3退款中)`
  与 `pay_method(1支付宝/2兑换码/3系统试用/4直冲/5微信支付)` 数值枚举。
- **Electron mock 全量**：浏览器 mock 补齐 `shop.authorize/authorizeWechat/rebind/commitAuthorization/
  channelsGetQr/CheckLogin/BindSession`、`orders.*`、`printer.diagnose`、`electronPrint.*`、
  `getAppVersion`（返回纯版本串）等全部 electronAPI 方法。
- **桌面端 IPC 全量**：`electron/main.js` 补齐官方 preload 暴露的全部 channel
  （弹幕会话模拟/订单 mock/店铺管理/打印/日志/客户端设置/应用更新），
  并保留真实平台登录（`platform:login`）与抖店订单解密（pigeon 搜索）。
- **菜鸟打印组件 mock**：`backend/mock_cainiao_ws.py` 在 `ws://127.0.0.1:13528` 启动
  最小 WebSocket 服务（官方 bundle 的菜鸟打印通道），使浏览器环境打印初始化成功、
  打印机下拉出现 mock 打印机、`connected_no_printers` 连接报错消失。
- **弹幕实时会话**：浏览器 mock 的 `startDanmakuSession` 每 1.5s 生成弹幕，「开启自动打印 → 实时表格出现已扣中/未扣中记录（含打印/重新打印/拉黑操作）」全链路可用（已实测 24 条）。
- **弹幕模拟开播**：`POST /api/electron/danmaku/simulate` 现按官方契约返回
  `displayItems/printItems`（经扣数引擎匹配），浏览器里「模拟开播测试 → 发送弹幕 →
  实时表格出现已扣中记录」全链路可用。
- **订单备注页**：`GET|POST /order/list` 返回样例订单（含 `products`），
  Notes 页订单列表/商品信息/金额正常展示；`/api/electron/orders/*` 同步端点返回样例订单
  （修复 `products.map` 崩溃）。
- **实时会话守卫**：`ensure_session` 注入 api_token、默认扣数配置预选 mock 打印机
  （`扣单宝-Mock-打印机`），使「开启自动打印」可直接启动。

> 浏览器 vs Electron 边界：真实平台弹幕/订单由 Electron 主进程捕获；
> 浏览器 mock 提供实时弹幕会话 + 模拟开播 + 样例订单作为等价演示（已实测）。

## 二开指南

见 `docs/ARCHITECTURE.md`。常见二开场景：

| 想做什么 | 改哪里 |
|---|---|
| 改扣数规则 / 弹幕匹配逻辑 | `backend-rs/src/engine.rs`（Rust 主实现）；Python 参考实现 `backend/server.py` + `deduction_engine.py` |
| 改后端 API / 契约 | `backend-rs/src/handlers.rs` + `electron.rs`（改后跑 `npm run test:backend` 69 项协议测试） |
| 改页面 UI / 加页面 | `frontend-src/`（重建 React 工程，构建后替换 `backend/assets/app-Buzwood0.js`） |
| 改打印标签字段 | 前端 `rV` 渲染函数 + 后端 `/danmaku/process` 的 `product_relation` |
| 改弹幕调度 / IPC | `electron/main/index.js`（DanmakuDispatcher） |
| 加新的平台接入 | `electron/main/index.js` 按现有平台驱动结构新增 |

## 数据存储

- 后端数据：`backend/global-store.json`（店铺/模板/扣数规则/弹幕映射）
- 删除该文件即恢复出厂
