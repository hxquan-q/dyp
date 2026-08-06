//! /api/electron/* 契约面（对齐 server.py `_electron_api`）。
//!
//! P0-2 修复：/server-live-sync 现按主进程期望返回完整 snake_case 契约
//! （synced_orders / decrypted_orders / sync_failures / failed_count / has_more /
//! lock_skipped），与 tests/test-server-order-sync.js 第 7 项固化期望一致。
//!
//! 注意两条弹幕路径的行为差异（契约保真关键）：
//! - danmaku/simulate：所有消息都进 displayItems（未命中 status="processed"），
//!   仅 printItems 要求命中；item 带 index/is_simulated/simulated/lucky_bag_won。
//! - danmaku/process：未命中直接跳过（主进程只回传命中消息）；item 无 index/simulated。

use crate::domain::{as_s, build_deduction_rules, merged_deduction_config};
use crate::engine::DeductionEngine;
use crate::inertia::live_config_payload;
use crate::state::AppState;
use crate::store::{self, log_print_items};
use crate::util::{expire_iso, now_iso};
use serde_json::{Value, json};

/// 解析原始 path 的 query（/api/electron/live-config?shop_id=x）
fn query_param(raw_path: &str, key: &str) -> String {
    if let Some(q) = raw_path.split_once('?').map(|(_, q)| q) {
        for pair in q.split('&') {
            if let Some((k, v)) = pair.split_once('=')
                && k == key
            {
                return crate::util::percent_decode(&v.replace('+', " "));
            }
        }
    }
    String::new()
}

/// 读取店铺扣数配置（对齐 `DEDUCTION_CONFIGS.get(str(shop_id))` 语义）
fn load_deduction_config(state: &AppState, shop_id: &str) -> Value {
    if shop_id.is_empty() {
        return Value::Null;
    }
    store::store_get(state, "deduction_configs")
        .get(shop_id)
        .cloned()
        .unwrap_or(Value::Null)
}

fn rules_for(state: &AppState, shop_id: &str) -> Vec<Value> {
    let cfg = merged_deduction_config(&load_deduction_config(state, shop_id));
    let rules = build_deduction_rules(&cfg);
    rules.as_array().cloned().unwrap_or_default()
}

fn product_relation_for(state: &AppState, content: &str, matched: Option<&str>) -> Value {
    let rel = state
        .find_product_relation(content)
        .or_else(|| matched.and_then(|m| state.find_product_relation(m)));
    match rel {
        Some(r) => json!({"price": r.get("price"), "product_no": r.get("product_no")}),
        None => json!({"price": matched, "product_no": ""}),
    }
}

/// danmaku/simulate：所有消息进 displayItems（未命中 status="processed"），printItems 仅命中
fn simulate_messages(
    state: &AppState,
    shop_id: &str,
    messages: &Value,
) -> (Vec<Value>, Vec<Value>) {
    let rules = rules_for(state, shop_id);
    let mut display_items: Vec<Value> = Vec::new();
    let mut print_items: Vec<Value> = Vec::new();
    let mut seq: i64 = 0;
    let mut engine = DeductionEngine::new();

    let msgs = messages.as_array().cloned().unwrap_or_default();
    for msg in msgs {
        if !msg.is_object() {
            continue;
        }
        seq += 1;
        let content = as_s(msg.get("content").unwrap_or(&Value::Null));
        let nickname = as_s(msg.get("nickname").unwrap_or(&Value::Null));
        let nickname = if nickname.is_empty() {
            format!("模拟用户{seq}")
        } else {
            nickname
        };
        let raw_comment_id = as_s(msg.get("comment_id").unwrap_or(&Value::Null));
        let comment_id = if raw_comment_id.is_empty() {
            format!("sim-{seq}")
        } else {
            raw_comment_id
        };

        let mut matched_content: Option<String> = None;
        let mut grid_no: Option<i64> = None;
        for rule in &rules {
            let (mc, gn) = engine.match_rule(&content, rule);
            if mc.is_some() {
                matched_content = mc;
                grid_no = gn;
                break;
            }
        }
        let matched_ref = matched_content.as_deref();
        let product_relation = product_relation_for(state, &content, matched_ref);
        let batch_no = as_s(
            msg.get("batch_no")
                .or_else(|| msg.get("batchNo"))
                .unwrap_or(&Value::Null),
        );
        let batch_no = if batch_no.is_empty() {
            "MOCKBATCH".to_string()
        } else {
            batch_no
        };
        let status = if matched_content.is_some() {
            "matched"
        } else {
            "processed"
        };
        let item = json!({
            "id": comment_id,
            "comment_id": comment_id,
            "nickname": nickname,
            "content": content,
            "matched_content": matched_content,
            "grid_no": grid_no,
            "batch_no": batch_no,
            "num_index": seq,
            "index": seq,
            "shop_name": "模拟店铺",
            "comment_time": as_s(msg.get("timestamp").unwrap_or(&Value::Null)),
            "item_code": product_relation.get("product_no").and_then(|v| v.as_str()).unwrap_or(""),
            "product_relation": product_relation,
            "status": status,
            "print_status": false,
            "is_simulated": true,
            "simulated": true,
            "lucky_bag_won": false,
        });
        display_items.push(item.clone());
        if matched_ref.is_some() {
            print_items.push(item);
        }
    }
    (display_items, print_items)
}

/// danmaku/process / reprint：未命中跳过，outcomes 即命中消息
fn process_messages(
    state: &AppState,
    sess: &Value,
    shop_id: &str,
    messages: &Value,
) -> (Vec<Value>, Vec<Value>) {
    let rules = rules_for(state, shop_id);
    let mut outcomes: Vec<Value> = Vec::new();
    let mut print_items: Vec<Value> = Vec::new();
    let mut seq: i64 = 1;
    let mut engine = DeductionEngine::new(); // 整批共享：宫格自动入格按批次累计

    let shop_name = sess
        .get("shops")
        .and_then(|v| v.as_array())
        .and_then(|a| a.first())
        .and_then(|s| s.get("shop_name"))
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("")
        .to_string();

    let msgs = messages.as_array().cloned().unwrap_or_default();
    for msg in msgs {
        if !msg.is_object() {
            continue;
        }
        let content = as_s(msg.get("content").unwrap_or(&Value::Null));
        // 只处理 chat 类型（主进程 preMatchRules 只匹配 chat）
        let msg_type = as_s(msg.get("type").unwrap_or(&Value::Null));
        if !(msg_type.is_empty() || msg_type == "chat") {
            continue;
        }
        let mut matched_content: Option<String> = None;
        let mut grid_no: Option<i64> = None;
        for rule in &rules {
            let (mc, gn) = engine.match_rule(&content, rule);
            if mc.is_some() {
                matched_content = mc;
                grid_no = gn;
                break;
            }
        }
        let Some(matched_content) = matched_content else {
            continue;
        };
        let product_relation = product_relation_for(state, &content, Some(&matched_content));
        let batch_no = as_s(
            msg.get("batch_no")
                .or_else(|| msg.get("batchNo"))
                .unwrap_or(&Value::Null),
        );
        let num_index = msg.get("num_index").cloned().unwrap_or_else(|| json!(seq));
        let raw_comment_id = as_s(msg.get("comment_id").unwrap_or(&Value::Null));
        let comment_id = if raw_comment_id.is_empty() {
            format!("proc-{seq}")
        } else {
            raw_comment_id.clone()
        };
        let item = json!({
            "id": comment_id,
            "comment_id": raw_comment_id,
            "comment_time": as_s(msg.get("timestamp").or_else(|| msg.get("comment_time")).unwrap_or(&Value::Null)),
            "uid": as_s(msg.get("uid").unwrap_or(&Value::Null)),
            "nickname": as_s(msg.get("nickname").unwrap_or(&Value::Null)),
            "content": content,
            "matched_content": matched_content,
            "grid_no": grid_no,
            "batch_no": batch_no,
            "lucky_bag_batch_no": msg.get("lucky_bag_batch_no").or_else(|| msg.get("luckyBagBatchNo")).cloned().unwrap_or(Value::Null),
            "num_index": num_index,
            "shop_name": shop_name,
            "buyer_number": "",
            "item_code": product_relation.get("product_no").and_then(|v| v.as_str()).unwrap_or(""),
            "product_relation": product_relation,
            "status": "matched",
            "print_status": false,
            "is_simulated": false,
        });
        outcomes.push(item.clone());
        print_items.push(item);
        seq += 1;
    }
    (outcomes, print_items)
}

/// Python `_electron_api` 移植。raw_path 保留 query（live-config 需解析 shop_id）。
pub fn electron_api(state: &AppState, raw_path: &str, body: &[u8], sess: &mut Value) -> Value {
    let path = raw_path.split('?').next().unwrap_or(raw_path).to_string();
    let payload: Value = serde_json::from_slice(body).unwrap_or_else(|_| json!({}));

    if path.ends_with("/version-check") || path == "/api/electron/version-check" {
        return json!({"success": true, "data": {"update_available": false}});
    }

    if path.contains("orders/sync")
        || path.contains("server-sync")
        || path.contains("server-live-sync")
    {
        // P0-2 修复：snake_case 全字段契约（对齐主进程 liveServerOrderSync 期望）
        let orders = state.mock_order_list(sess, 1, 50);
        let order_list = orders.get("list").cloned().unwrap_or_else(|| json!([]));
        let count = order_list.as_array().map(|a| a.len()).unwrap_or(0);
        return json!({
            "success": true,
            "status": "success",
            "count": count,
            "synced_orders": order_list.clone(),
            "decrypted_orders": order_list,
            "sync_failures": [],
            "failed_count": 0,
            "has_more": false,
            "lock_skipped": false,
            "message": format!("本地mock：同步 {count} 条样例订单"),
        });
    }

    if path.contains("decrypt-result") {
        let order_no = as_s(payload.get("order_no").unwrap_or(&Value::Null));
        if !order_no.is_empty() {
            let mut decrypted = store::store_get(state, "decrypted_orders");
            let entry = json!({
                "order_no": order_no,
                "shop_id": payload.get("shop_id"),
                "user_id": payload.get("user_id"),
                "user_name": payload.get("user_name"),
                "user_info": payload.get("user_info"),
                "decrypted_at": now_iso(),
            });
            if let Some(m) = decrypted.as_object_mut() {
                m.insert(order_no, entry);
            }
            store::store_set(state, "decrypted_orders", decrypted);
        }
        return json!({"success": true, "items": [], "message": "ok"});
    }

    if path.contains("order-remark") {
        return json!({
            "success": true,
            "data": {
                "job": {"status": "success", "total_count": 0, "success_count": 0, "failed_count": 0},
                "items": [],
                "cancelled": false,
            },
        });
    }

    if path.contains("danmaku/simulate") {
        let shop_id = as_s(
            payload
                .get("shop_id")
                .or_else(|| payload.get("shopId"))
                .unwrap_or(&Value::Null),
        );
        let messages = payload
            .get("messages")
            .cloned()
            .unwrap_or_else(|| json!([]));
        let ctx = payload
            .get("simulation_context")
            .cloned()
            .unwrap_or_else(|| json!([]));
        let (mut display_items, print_items) = simulate_messages(state, &shop_id, &messages);
        if display_items.is_empty() {
            // 兜底：无 messages 时用 simulation_context 生成占位
            let mut items = Vec::new();
            if let Some(ctx_rows) = ctx.as_array() {
                for (i, row) in ctx_rows.iter().take(10).enumerate() {
                    items.push(json!({
                        "id": format!("sim-{}", i + 1),
                        "comment_id": format!("sim-{}", i + 1),
                        "nickname": row.get("nickname").and_then(|v| v.as_str()).unwrap_or(&format!("模拟用户{}", i + 1)),
                        "content": row.get("content").and_then(|v| v.as_str()).unwrap_or("模拟弹幕"),
                        "status": "matched",
                        "is_simulated": true,
                        "simulated": true,
                        "shop_name": "模拟店铺",
                        "batch_no": "MOCKBATCH",
                        "num_index": i + 1,
                        "product_relation": {"price": "1", "product_no": ""},
                    }));
                }
            }
            display_items = items;
        }
        log_print_items(state, &print_items);
        return json!({
            "success": true,
            "displayItems": display_items,
            "printItems": print_items,
            "outcomes": display_items,
            "results": display_items,
            "matched": display_items,
            "data": {
                "results": display_items,
                "matched": display_items,
                "displayItems": display_items,
                "printItems": print_items,
            },
            "message": "模拟完成（本地mock；真实打印需打印组件）",
        });
    }

    if path.contains("danmaku/process") || path.contains("danmaku/reprint") {
        let shop_id = as_s(
            payload
                .get("shop_id")
                .or_else(|| payload.get("shopId"))
                .unwrap_or(&Value::Null),
        );
        let messages = payload
            .get("messages")
            .cloned()
            .unwrap_or_else(|| json!([]));
        let (outcomes, print_items) = process_messages(state, sess, &shop_id, &messages);
        log_print_items(state, &print_items);
        return json!({
            "success": true,
            "outcomes": outcomes,
            "printItems": print_items,
            "matched": outcomes,
            "results": outcomes,
        });
    }

    if path.contains("live-config") {
        let shop_id = query_param(raw_path, "shop_id");
        if shop_id.is_empty() {
            let _ = query_param(raw_path, "shopId");
        }
        return live_config_payload(state, sess, &shop_id);
    }

    if path.contains("order-sync-config") {
        return json!({
            "success": true,
            "live_polling_interval_ms": 10000,
            "live_polling_lookback_seconds": 86400,
        });
    }

    if path.contains("runtime-leases") {
        return json!({
            "success": true,
            "data": {
                "lease_id": uuid::Uuid::new_v4().to_string(),
                "status": "acquired",
                "expires_at": expire_iso(1),
                "device_limit": 99,
                "active_devices": 1,
            },
        });
    }

    if path.contains("shops/disconnect") {
        return json!({"success": true});
    }

    if path.contains("log-uploads") {
        return json!({"success": true, "id": uuid::Uuid::new_v4().to_string()});
    }

    if path.contains("device-token") {
        return json!({"success": true, "data": {"api_token": sess.get("api_token")}});
    }

    json!({"success": true, "path": path, "echo": payload})
}
