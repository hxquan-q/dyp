# 架构与数据流（ARCHITECTURE）

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│  Electron 桌面端                                             │
│                                                              │
│  ┌─────────────┐   preload   ┌──────────────────────────┐    │
│  │  渲染进程     │◄──────────►│ 主进程 (main/index.js)      │    │
│  │  Inertia SPA │  electronAPI│  - DanmakuDispatcher 弹幕  │    │
│  │  (18 页面)    │            │  - 平台驱动(抖音/淘宝/…)     │    │
│  └──────┬───────┘            │  - 订单同步/解密/备注         │    │
│         │ HTTP               │  - 打印(electron-print)     │    │
│         ▼                    └──────────────┬─────────────┘    │
│   http://127.0.0.1:8787                     │HTTP                │
└──────────────┬──────────────────────────────┘                    │
               ▼                                                   │
┌─────────────────────────────────────────────┐                    │
│ 本地后端 backend/server.py (mock)            │                    │
│  - 扣数规则 CRUD / 弹幕匹配                  │                    │
│  - 打印数据组装 (product_relation/price)      │                    │
│  - 店铺/模板/黑名单/买家                      │                    │
│  - global-store.json 持久化                  │                    │
└─────────────────────────────────────────────┘                    │
               │                                                  │
               ▼ (真实部署时)                                       │
       官方 SaaS 服务器 kdb.koudanbao.top                          │
       本 mock 复刻其 API 契约                                     │
```

## 关键数据流

### 1. 扣数打印全流程

```
用户设置扣数规则 (前端 Deduction/Index + Config)
  → POST /deduction-rule {shopId, printRule, gridFormats, numberIncludeDecimal...}
  → 后端存 DEDUCTION_CONFIGS → global-store.json

开始直播
  → 前端 electronAPI.startDanmakuSession({shopId})
  → 主进程 loadConfig() → GET /api/electron/live-config?shop_id=X
     响应: { displayFilter, deductionRules[], blacklist, shopInfo }
     deductionRules = _build_deduction_rules(config)
       rule_type: anyNumber|onlyPureNumber|only12|exclude12|letter3Digit1|
                  numberWithSize|numberWithKeyword|onlyKeyword|
                  numberIncludeKeyword|customCombined|grid

弹幕到达 (主进程捕获 / mock 注入)
  → DanmakuDispatcher.handleDanmaku(弹幕)
  → matchSingleRule 匹配 → matchedContent + gridNo
  → 批次结束 flushMatchedBuffer
  → POST /api/electron/danmaku/process
     请求: { shop_id, messages:[{comment_id, content, batch_no...}] }
     响应: { outcomes[], printItems[] }
       printItems[].product_relation = {price, product_no}
         - 命中「弹幕→商品映射」(POST /danmu-product-relations) → 手动价
         - 无映射 → price = 扣数本身（如弹幕 1.9 → 价格 1.9）
  → 主进程 emit('printResults')
  → 前端 _V() 组装打印标签 → electron-print:print-labels
  → 系统打印机输出
```

### 2. 弹幕→商品映射（价格来源）

```
「弹幕配置」页新增: 弹幕内容 + 价格(元) + 货号
  → POST /danmu-product-relations {danmu, price, product_no}
  → 存 global-store.json

弹幕匹配时:
  查映射表 (精确匹配弹幕 → 包含匹配) → product_relation
  打印标签 <%=data.price%> = product_relation.price
  无映射 → price = matched_content (扣数即价格)
```

### 3. 授权店铺流程

```
新增授权 → POST /shops/platform-app/oauth-url → 返回平台登录URL
  → Electron 打开平台登录 (platform:login)
  → 主进程采集平台 cookie/session
  → POST /shops/platform-app/authorization → 后端存店铺
  → GET /shops (shopDisplayRows) → 前端展示
```

## 扣数规则字段 (前端 Config ↔ 后端 ↔ 主进程三方对齐)

| 前端字段 | 后端配置 | 主进程 rule_type | 说明 |
|---|---|---|---|
| 扣数模式=自定义 | printRule=`customCombined` | `customCombined` | 数字/关键词组合 |
| 扣数模式=宫格 | printRule=`grid` | `grid` | 宫格号匹配 |
| 数字模式 | numberMode | — | specified/range |
| 包含小数 | numberIncludeDecimal | — | 控制 `\d+(?:\.\d+)?` |
| 扣数格式 | customFormats | — | includeNumber/fourDigit/... |
| 宫格格式 | gridFormats | — | pureNumber/onlyKeyword/... |
| 宫格数 | gridCount | gridCount | 默认 12 |
| 自动入格 | gridAutoAssign | gridAutoAssign | 自动分配 1~50 |
| 关键词 | customKeywords/gridKeywords | gridKeywords | 逗号分隔 |

## 打印标签模板字段

见 `docs/FRONTEND-GUIDE.md` —— `<%=data.price%>` / `<%=data.productNo%>` 来自 `product_relation`。

## 持久化

`backend/global-store.json`：
- `shops` — 授权店铺（含平台 cookie，敏感）
- `templates` — 打印模板
- `deduction_configs` — 每店铺扣数规则
- `danmu_product_relations` — 弹幕→商品映射

## 已知边界（本地 mock vs 官方）

| 能力 | 本地 mock | 官方 |
|---|---|---|
| 弹幕来源 | 模拟弹幕（danmaku/simulate） | 真实平台弹幕捕获 |
| 订单解密 | 无真实订单 | 抖音订单解密+备注 |
| 打印 | 系统打印机（electron） | 菜鸟组件 / 系统打印机 |
| 账号授权 | 本地存 cookie | 官方服务器授权 |
