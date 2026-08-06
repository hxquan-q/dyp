# 扣单宝 本地重建工程（二开基础）

> 本工程由官方桌面客户端（扣单宝 v1.1.2）逆向还原整理，目标是提供**可读、可二开、可构建**的源码工程。
>
> 当前定位：**完全本地使用**（零门槛、无服务器依赖），支持 **Windows + macOS** 双平台；
> 架构上预留未来商业化接入（云登录/注册/授权 + 业务数据上云），本地引擎（弹幕捕获/扣数/打印）永不消失。

## 技术栈

| 层 | 技术 | 状态 |
|---|---|---|
| 桌面壳 | Electron ^43 + electron-builder ^26 | Windows/macOS 双平台（mac 打包配置见 `electron/package.json`） |
| 前端 | React 19 + TypeScript + Vite + **Inertia.js 3** + Tailwind 4 + Radix/shadcn 风格 | 17 页面全部可运行（重建工程，`frontend-src/`） |
| **后端（主力）** | **Rust (axum 0.8)** — `backend-rs/` | ✅ 已迁移完成，契约逐字节等价 |
| 后端（参考） | Python 纯标准库 — `legacy/backend-python/` | 已归档，仅作契约参考/差分对照 |

## 快速启动（本地模式）

```powershell
# 1. 构建后端（cargo release + 资源打包 → backend-dist/koudanbao-backend.exe）
npm run build:backend

# 2. 启动后端
backend-dist\koudanbao-backend.exe --host 127.0.0.1 --port 8787

# 3. 浏览器访问 http://127.0.0.1:8787 即可用 SPA
#    （本地版零门槛：无需登录，界面显示"本地版"标识）
```

桌面端（可选）：在 `electron/` 目录运行 `npx electron .`——自动拉起本地后端，
提供真实平台登录窗口（抖音/淘宝/小红书/视频号）+ 抖店订单解密 + 弹幕会话。

## 架构总览

```
Electron 桌面端 (electron/main.js)
  ├── 真实平台登录 (platform:login) + HttpOnly cookie 采集
  ├── 69 个 IPC handler（mock；真实能力逐步落地：打印/抖音弹幕）
  └── 自动拉起本地后端（backend-dist/koudanbao-backend.exe --print-json-ready）
        │ HTTP (127.0.0.1:8787, 动态端口)
Inertia SPA (frontend-src/, React)        ← 统一投放重建工程（M4 完成前保留双前端开关）
        │ HTTP + Inertia data-page
Rust 后端 (backend-rs/, axum)             ← 本地引擎，永不消失
  ├── Inertia 页面渲染（shell.html + data-page 注入）
  ├── JSON API：shops/templates/deduction/payment/order/logs
  ├── /api/electron/* 契约面（snake_case）
  ├── 扣数引擎（engine.rs，11 规则，21 项单测）
  ├── 数据层（当前 LocalStore=global-store.json；未来可切换 CloudProvider）
  └── auth.mode 下发（local/cloud；当前 local=零门槛）
菜鸟打印 WS mock：127.0.0.1:13528（浏览器环境打印初始化）
```

未来商业化形态：同一本地 Rust 后端，数据层切换到云 API（店铺/模板/弹幕配置/订单/订阅上云），
认证切换为云账号（JWT）——前端/引擎/打印零改动。

## 目录结构

```
E:\dyp\
├── backend-rs/              # ★★ Rust 后端（主力实现）
│   ├── src/                 #   handlers/electron/engine/inertia/shops/templates/store/state...
│   ├── assets/              #   运行资源：前端部署产物 + shell.html（Inertia 壳模板）
│   ├── static/              #   静态图片/图标
│   └── default_custom_config.json
├── frontend-src/            # ★★ 重建 React 工程（构建产物名硬对齐 app-Buzwood0.js）
│   └── src/Pages/           #   17 页面：Auth(Login/Register)/Deduction(10)/Settings(5)
├── electron/                # 桌面壳
│   ├── main.js              #   可运行壳（平台登录/弹幕 mock/打印 mock/抖店解密）
│   ├── preload/             #   preload 桥（与官方逐字节一致，勿改）
│   ├── platform-tabs/       #   平台后台 Tab 页（与官方逐字节一致，勿改）
│   └── resources/           #   打印 HTML/图标（与官方逐字节一致，勿改）
├── backend-dist/            # 构建产物（gitignore）：koudanbao-backend.exe + 资源
├── tests/                   # 协议测试(69)/引擎差分(432)/JS 逻辑测试
├── docs/                    # 架构/前端/主进程导读 + 逆向缺口清单
├── scripts/                 # build-backend.mjs / test-backend-protocol.ps1
├── tools/                   # 生产工具（patch-bundle.js/verify-reconstruction.py/extract-shell.py）
└── legacy/                  # ★ 逆向归档（gitignore，不进版本库）
    ├── backend-python/      #   Python 参考后端（完整可运行，差分对照用）
    ├── official-bundle/     #   官方原版前端 bundle（版权产物）
    ├── official-electron/   #   官方原版 dist（版权产物）
    ├── main-process-reverse/#   主进程 17079 行还原 + reconstructed/explained 模块
    ├── frontend-reverse-ref/#  前端逆向参考源码
    └── reverse-tools/       #   逆向脚本（annotate/extract/reverse-jsx/utf8-regen）
```

## 构建与测试（E:\dyp 根目录）

```powershell
npm install                     # 三处依赖（root/frontend-src/electron）
npm test                        # 全量：typecheck + 后端协议 + 引擎 + JS 逻辑
npm run build:frontend          # vite build → frontend-src/dist
npm run build:backend           # cargo release + 资源打包 → backend-dist
npm run package                 # 前端 + 后端 + electron-builder 打包（当前 --win）
cd backend-rs; cargo test       # Rust 21 项单测
python tests/test_backend_protocol.py http://127.0.0.1:8787   # 69 项协议测试（语言无关）
python tests/test-engine-parity.py <py_url> <rust_url>        # 引擎差分 432 项
# 注：Python 后端已归档 legacy/backend-python，`cd legacy/backend-python; python server.py ...` 可启动
```

## 约定红线（改动前必读）

1. **文件名硬对齐**：前端构建产物必须是 `assets/app-Buzwood0.js` / `assets/app-CVK6h-fN.css`（`vite.config.ts` 已配置，勿改）。
2. **逐字节一致文件**：`electron/preload/*` ×4、`electron/platform-tabs/*` ×3、`electron/resources/*` ×5——与官方一致，勿"优化"。改动前跑 `tools/verify-reconstruction.py`。
3. **主进程还原 bundle 只读**：`legacy/main-process-reverse/index.js` 是证据与参考；业务改动走独立重建模块。
4. **契约以 HTTP 层测试为准**：改后端任何响应先跑 `test_backend_protocol.py`（69 项）。
5. **数据目录**：`KDB_DATA_DIR` 可隔离；打包后默认 `%APPDATA%\Koudanbao`；开发默认 backend-rs 同级。
6. **Rust 后端不做运行时字节补丁**（P2-9）：isElectron 补丁在构建期由 `tools/patch-bundle.js` 处理（幂等）。

## 二开指南

| 想做什么 | 改哪里 |
|---|---|
| 改扣数规则 / 弹幕匹配逻辑 | `backend-rs/src/engine.rs`（Rust 主实现）；参考 `legacy/backend-python/deduction_engine.py` |
| 改后端 API / 契约 | `backend-rs/src/handlers.rs` + `electron.rs`（改后跑 `npm run test:backend`） |
| 改页面 UI / 加页面 | `frontend-src/`（构建后产物替换 `backend-rs/assets/app-Buzwood0.js`） |
| 改打印标签字段 | 前端渲染函数 + 后端 `/danmaku/process` 的 `product_relation` |
| 改弹幕调度 / IPC | `electron/main.js`（可运行壳）；官方逻辑参考 `legacy/main-process-reverse/` |
| 加新的平台接入 | `electron/main.js` 按现有平台驱动结构新增 |

## 重构里程碑（2026-08-06 启动）

- **M1 仓库基建** ✅ git 初始化 + 逆向产物归档 legacy + 资源收拢 backend-rs
- **M2 主进程真实能力**：ElectronPrint 系统打印 + 抖音真实弹幕（CDP 拦截→扣数→打印）
- **M3 跨平台构建**：electron-builder 双平台 + Rust mac 编译 + GitHub Actions CI
- **M4 前端收敛+工程化**：统一重建前端投放 + 拆 2503 行 Index.tsx / 1855 行 reverse-runtime / preset JSON / zustand / Vitest
- **M5 契约固化**：B1 契约源 + TS 类型生成 + store schema 版本化 + auth.mode 下发 + /api/auth/* 契约
- **M6 测试收尾**：引擎差分 golden 基线 + 跨平台测试 + mac 真机冒烟

详细决策记录见 `docs/ARCHITECTURE.md` 与 `AGENTS.md`。
