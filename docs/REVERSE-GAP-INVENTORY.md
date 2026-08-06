# 逆向缺口清单（Reverse Gap Inventory）

> 生成：2026-08-02
> 来源：对 `electron/main/index.js`（17079 行，30 个 webpack 模块）逐模块扫描 + preload sourcemap 检查。
> 状态：动态维护，重建一项划掉一项。

## 架构事实

官方主进程为 **webpack 母模块（大范围）包裹多个子模块** 的结构。README 原标注的
"6 平台驱动 `class extends BasePlatform`" 是过度简化：真实平台是 **7 个平台模块**
（douyin / douyin_talent / douyin_talent_ecosystem / taobao / xiaohongshu / channels /
wxstore），且每个平台再拆成 认证 + 直播拦截 + 订单同步 + 打印 等多个子模块。
生成的 `electron/main.js` 运行壳当前把 live 弹幕与订单主体同步 mock 掉了，真正的
业务实现仍沉睡在 bundle 里。

## 已重建（划掉）

| 模块 | 产物 | 状态 |
|---|---|---|
| DanmakuDispatcher | `danmaku-dispatcher.reconstructed.js` + `.explained.js` + 测试 | ✅ |
| OrderDecryptService（抖店） | `order-decrypt.src.js` | ✅ |
| Electron 壳 | `main.js` | ✅ |
| preload 注入 | `preload/index.js` + `xhs-*` 三件 | ✅ |
| **OrderSyncCoordinator** | `order-sync-coordinator.reconstructed.js` + 测试 | ✅ 本轮 |
| **ServerOrderSync**(9339, 全量) | `server-order-sync.reconstructed.js` + 测试（manual/live/formatShanghaiDateTime） | ✅ 本轮 |
| **Douyin ProtoBuf**(8476, 底层) | `douyin-protobuf.reconstructed.js` + 测试（6 类消息解码闭环，编码→解码验证） | ✅ 本轮 |

> **契约缺口（本轮实测发现）**：主进程 `liveServerOrderSync` 期望后端返回 **snake_case**
> 契约（`synced_orders`/`decrypted_orders`/`sync_failures`/`failed_count`/`has_more`/
> `lock_skipped`），但本地 mock 后端 `server.py` 的 `_electron_api` 对 `/server-live-sync`
> 分支返回的是 **camelCase**（`syncedOrders`/`decryptedOrders`）且不产出 `has_more`/
> `lock_skipped`。URL 存在、字段契约不对齐 → 二开做直播实时订单同步时需对齐 backend 响应。
> 已被 `tests/test-server-order-sync.js` 第 7 项固化。

## 未重建的业务子模块（按优先级）

### P0 — 订单同步全链（衔接 OrderSyncCoordinator）
| 子模块 | 类/职责 | 位置 |
|---|---|---|
| 5126 | `getRemarkExecutionPlan` 备注执行计划分发 | 3246 |
| 69/5565/7121 | `registerRuntimeOrderHandlers` / `RuntimeOrderSupport` / `RuntimeSessionHandlers` | 3257/3468/3667 |
| 8284 | `OrderSyncService` 服务器端订单同步 service | ~15597 |
| 9339 | `manualServerOrderSync` / `liveServerOrderSync` / `formatShanghaiDateTime` | ~15974 |

### P0 — 抖音全家桶（最活跃业务面）
| 子模块 | 类/职责 | 位置 |
|---|---|---|
| 6095…8686 | `runDouyinTalentAuthorization` / 主播卡抓取 / `DouyinLogin` | 6367→8940 |
| 6418 | `DouyinTalentLiveInterceptor`（CDP 弹幕拦截：fetch/XHR 覆写 + Network 响应解析） | 6420 |
| 6846 | `DouyinTalentPlatform` | 6849 |
| 8035 | `DouyinPlatform` | 8048 |
| protobuf | 抖音电商直播 protobuf 解码 von 8476 | 8940 |

### P1 — 打印 / 更新 / 服务
| 子模块 | 类/职责 | 位置 |
|---|---|---|
| 6780 | `ElectronPrintService` 打印服务 + 打印机 agent 诊断 | ~15119 |
| 6675 | `OrderRemarkService` 订单备注执行 | ~15459 |
| 437 | `RuntimeLeaseManager` 运行时租约 | ~15901 |
| 2889/7042 | `UpdateDialogController` / `VersionChecker` | ~16026/16726 |
| 3155/5601/9349/3202/5455 | `AutoUpdater` / `ClientSettingsService` / `CookieManager` / 日志上传 | 8571 |

### P1 — 各平台 OrderSyncService
`TaobaoLiveOrderSyncService`(4041) / `WxstoreOrderSyncService`(4979) / `XhsLiveOrderSyncService`(6137)

### P2 — 平台拦截 / 注册
`DouyinWsInterceptor`+`FxgFetchInterceptor`(8476) / `PlatformTabManager`(97) / 视频号 `ChannelsLivePageRuntime`(348)

## vendor（无需重建，合计 ~40KB）
5622(is-*) / 5051,6407(JSZip) / 8476 varint/protobuf 底层 / 2404(auth tab 清理) /
382,1844(live URL 工具) / 1909(淘宝字段归一) / 5108(微信小店 URL 工具) / 433(app quit) /
2959(窗口聚焦) / 2294(platform-key 工具)

## 协议解码缺口

- **protobuf 8476 可剥离**：抖音电商直播编解码器为手写 varint 步行解析（非 generated .pb.js），
  字段号直接按 tag 索引，无 schema 缺失问题。可独立成 `douyin-protobuf.reconstructed.js` +
  字段表注释。`DouyinWsInterceptor`(8476:7763) 为其上层 WS 封装，一并重建。

## preload sourcemap

`electron-original/dist/preload/*.map` 指向 `../../src/preload/*.ts`，但 **`sourcesContent` 全缺失**，
无法零成本还原全文。仅能按 VLQ mapping 反推原始行结构（结构性还原），需结合已提取的三份 preload 反推。

## 推荐重建顺序

1. `OrderSyncService`(8284) + `manualServerOrderSync`(9339) + `getRemarkExecutionPlan`(5126)
   —— 与已建的 OrderSyncCoordinator 同链，收益直接、相互印证。
2. `DouyinTalentLiveInterceptor` + `DouyinPlatform`(427) —— 最大最活跃业务面，独立闭环。
3. `ElectronPrintService`(6780) —— 打印核心，变现链路，独立性强。
4. 三个平台订单 service(Taobao/Wxstore/Xhs) —— 同步协议合集。
5. protobuf 8476 → 可复用解码层 —— 剥离通用瓦片解析库后，抖音模块可复用。