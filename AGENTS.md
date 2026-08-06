# 扣单宝本地重建工程 — 项目记忆（AGENTS.md）

> 本文件是项目的权威记忆：技术栈、架构、约定红线、构建/测试命令、重构状态与已知坑。
> 从 `C:\Users\xquan\Desktop\Projects\扣数宝\portable\print` 迁移至 `E:\dyp`（2026-08-06）。
> 深挖细节见 `docs/ARCHITECTURE.md`、`docs/FRONTEND-GUIDE.md`、`docs/MAIN-PROCESS-GUIDE.md`、
> `docs/REVERSE-GAP-INVENTORY.md`。

## 一、项目定位

**扣单宝 (Koudanbao) v1.1.2** —— 电商直播扣数/弹幕打印桌面客户端（本地重建工程）。
业务核心：捕获抖音/淘宝/小红书/视频号直播弹幕 → 按扣数规则匹配 → 触发菜鸟打印。
工程由官方客户端逆向还原而来，目标是**可读、可二开、可构建**的源码工程（不是破解产物）。

## 二、技术栈（现状，2026-08）

| 层 | 技术 | 状态 |
|---|---|---|
| 桌面壳 | Electron ^43 + electron-builder ^26 + electron-updater | 可用（真实平台登录窗口 + cookie 采集） |
| 前端 | React 19 + TypeScript 7 + Vite 8 + **Inertia.js 3** + Tailwind 4 + Radix/shadcn 风格 | 17 页面全部可运行 |
| **后端（主力）** | **Rust (axum 0.8) — `backend-rs/`** | ✅ 已迁移完成（2026-08-06） |
| 后端（参考） | Python 3.14 纯标准库 — `backend/`（http.server） | 保留为契约参考/回退 |
| 主进程还原 | `electron/main/index.js`（17079 行 webpack 还原，**只读参考**） | 7 平台驱动/弹幕调度/订单解密 |

## 三、架构与数据流

```
Electron 壳 (electron/main.js)
  ├─ 真实平台登录 (platform:login) + HttpOnly cookie 采集
  ├─ 69 个 IPC handler（mock）
  └─ 自动拉起后端：打包后 backend-dist/koudanbao-backend.exe（--host --port --print-json-ready）
        │ HTTP (127.0.0.1:8787, 动态端口)
Inertia SPA (frontend-src/, React)
        │ HTTP + Inertia data-page
Rust 后端 (backend-rs/, axum)
  ├─ Inertia 页面渲染（shell.html 模板 + data-page 注入）
  ├─ JSON API：shops/templates/deduction/payment/order/logs
  ├─ /api/electron/* 契约面（snake_case）
  ├─ 扣数引擎（engine.rs，与 Python/JS 版差分对齐）
  └─ 持久化 global-store.json（Mutex 串行 + 原子写）
菜鸟打印 WS mock：127.0.0.1:13528（浏览器环境打印初始化）
```

关键契约：**Inertia `data-page` 属性**（HTML 转义 + `script[data-page="app"]` 双通道注入）、
snake_case 的 `/api/electron/*` 契约、`global-store.json` 持久化结构。

## 四、目录职责（E:\dyp 下）

```
E:\dyp\
├── backend-rs/          # ★★ Rust 后端（主力实现，14 模块）
│   ├── src/handlers.rs  #   HTTP 分发（对齐 Python do_GET/do_POST 分支顺序）
│   ├── src/electron.rs  #   /api/electron/*（含 P0-2 snake_case 修复）
│   ├── src/engine.rs    #   扣数引擎（11 规则，21 项单测）
│   ├── src/inertia.rs   #   Inertia 页面层（page/base_props/build_page_for）
│   ├── src/{shops,templates,store,state,cainiao_ws,util,domain,log}.rs
│   └── assets/shell.html #  Inertia 壳模板（AST 从 server.py 精确抽取，勿手改 JS 内容）
├── backend/             # Python 参考实现（server.py 2716 行 + deduction_engine.py + mock_cainiao_ws.py）
├── backend-dist/        # 构建产物：koudanbao-backend.exe (4.7MB) + assets/static/shell.html
├── frontend-src/        # ★★ 重建 React 工程（构建产物文件名硬对齐 app-Buzwood0.js）
├── electron/            # 桌面壳（main.js）+ 主进程还原（main/index.js 只读）
├── electron-original/   # 官方原版对照（preload 逐字节一致）
├── frontend/            # 官方原版 bundle 对照（app-bundle.min.js）
├── docs/                # 架构/前端/主进程导读 + REVERSE-GAP-INVENTORY.md
├── tests/               # 协议测试/引擎差分/JS 逻辑测试
├── tools/               # 逆向工具 + extract-shell.py + patch-bundle.js
└── scripts/             # build-backend.ps1 / test-backend-protocol.ps1
```

## 五、构建与测试命令（全部在 E:\dyp 根目录执行）

```powershell
npm install                     # 三处依赖（root/frontend-src/electron）
npm test                        # 全量：typecheck + 后端协议 + 引擎 + JS 逻辑
npm run build:frontend          # vite build → frontend-src/dist
npm run build:backend           # scripts/build-backend.ps1 → cargo release + 资源打包
npm run package                 # 前端 + 后端 + electron-builder 打包
cd backend-rs; cargo test       # Rust 21 项单测
python tests/test_backend_protocol.py http://127.0.0.1:8787   # 69 项协议测试（语言无关）
python tests/test-engine-parity.py <py_url> <rust_url>        # 引擎差分 432 项
```

后端启动：
```powershell
backend-dist\koudanbao-backend.exe --host 127.0.0.1 --port 8787   # Rust 版
# 或 python backend/server.py --host 127.0.0.1 --port 8787        # Python 参考版
```

## 六、约定红线（改动前必读，改后必跑验证）

1. **文件名硬对齐**：前端构建产物必须是 `assets/app-Buzwood0.js` / `assets/app-CVK6h-fN.css`
   （`frontend-src/vite.config.ts` 已配置，勿改）。
2. **逐字节一致文件**：`electron/preload/*` ×4、`electron/platform-tabs/*` ×3、
   `electron/resources/*` ×5 —— 与官方一致，勿"优化"。改动前跑 `tools/verify-reconstruction.py`。
3. **17079 行还原 bundle 只读**：`electron/main/index.js` 是证据与参考，不是修改对象；
   业务改动走独立重建模块（见 REVERSE-GAP-INVENTORY.md 的 P0 顺序）。
4. **契约以 HTTP 层测试为准**：改后端任何响应先跑 `test_backend_protocol.py`（69 项）。
5. **双前端投放**：`KOUDANBAO_FRONTEND=recon` 切重建构建；默认投放 backend/assets 部署版。
6. **数据目录**：`KDB_DATA_DIR` 可隔离；打包后默认 `%APPDATA%\Koudanbao`；开发默认 backend/。
7. **Rust 后端不做运行时字节补丁**（P2-9）：isElectron 补丁在构建期由 `tools/patch-bundle.js`
   处理（幂等，重建构建自动跳过）。

## 七、重构状态（2026-08-06 迁移时点）

### ✅ 已完成
- **后端 Python → Rust 迁移**：契约逐字节等价。验证：69/69 协议测试、引擎差分 432 项 0 差异、
  21 项 Rust 单测、Inertia 渲染保真。
- **P0-1** 持久化并发安全（Mutex + 原子写，消除读-改-写竞态）。
- **P0-2** `/server-live-sync` snake_case 契约对齐（synced_orders/decrypted_orders/
  sync_failures/failed_count/has_more/lock_skipped）。
- **P2-9** 运行时字节补丁 → 构建期 `tools/patch-bundle.js`。
- **P1-3** 后端模块化（handlers/electron/engine/shops/templates/store...）。
- 新增 `tests/test-engine-parity.py`（双后端差分）与 `tools/extract-shell.py`（shell 模板抽取）。

### ⏳ 待办（按依赖序）
1. **B1** 契约源 + TS 类型生成（P2-7，根治字段漂移；P0-2 为验证用例）。
2. **C1-C3** 前端工程化：拆 `frontend-src/src/Pages/Deduction/Index.tsx`（2503 行）、
   `lib/reverse-runtime.ts`（1855 行）→ 命名模块、`lib/preset-templates.ts`（114KB 单行）→ JSON、
   zustand 弹幕会话状态、Vitest + Testing Library 组件测试。
3. **D1** Electron 拉起 Rust 后端端到端验证 + order-sync 链路（可用 `$env:KDB_BACKEND_EXE` 指
   向 backend-dist exe 在 dev 模式测试）。
4. **E1** Python backend 归档切换、verify-reconstruction.py 更新。

## 八、已知坑（踩过）

- **Python 版 `numberWithSymbol` 格式会崩溃**：`backend/deduction_engine.py` 用 `\p{L}`
  语法但 Python `re` 不支持（`re.PatternError: bad escape \p`）→ 收到含符号数字弹幕时后端崩。
  **Rust 版已用 regex crate 正确修复**；差分测试因此排除该规则。
- **端口 13528 被占用**：菜鸟 WS mock 绑定失败时仅打日志、不影响主服务（Python/Rust 同行为）。
- **Electron 主进程期望 snake_case**（liveServerOrderSync），浏览器 mock 读 camelCase 兜底——
  改 `/api/electron/orders/*` 时两者都要照顾。
- **`cargo run` 的 ready 行是紧凑 JSON**（Python 版带空格），脚本解析用 `ConvertFrom-Json` 均兼容。
- **Windows 上 Start-Process 起的后端进程随父 shell 退出**——长驻测试用本工具的后台任务模式。
