//! 店铺域逻辑（对齐 server.py 的 make_shop_record / upsert_shop /
//! shop_display_row / build_shop_rows / extract_shop_fields_from_payload / shop_api_payload）。

use crate::domain::{as_s, platform_name};
use crate::state::AppState;
use crate::store;
use crate::util::{now_iso, now_ms};
use serde_json::{json, Value};
use std::collections::HashMap;

pub fn next_shop_id(sess: &mut Value) -> i64 {
    let seq = sess.get("shop_seq").and_then(|v| v.as_i64()).unwrap_or(1000) + 1;
    sess.as_object_mut().map(|o| o.insert("shop_seq".into(), json!(seq)));
    seq
}

/// Python `_shop_has_live_cap`
fn shop_has_live_cap(shop: &Value) -> bool {
    if let Some(scope) = shop.get("authorization_scope") {
        if let Some(step_keys) = scope.get("stepKeys").and_then(|v| v.as_array()) {
            if !step_keys.is_empty() {
                return step_keys.iter().any(|k| k.as_str() == Some("live"));
            }
        }
    }
    matches!(shop.get("platform_code").and_then(|v| v.as_str()), Some("douyin") | Some("douyin_talent"))
}

/// Python `_shop_has_store_cap`
fn shop_has_store_cap(shop: &Value) -> bool {
    if let Some(scope) = shop.get("authorization_scope") {
        if let Some(step_keys) = scope.get("stepKeys").and_then(|v| v.as_array()) {
            if !step_keys.is_empty() {
                return step_keys.iter().any(|k| k.as_str() == Some("store"));
            }
        }
    }
    true
}

/// Python `make_shop_record`
#[allow(clippy::too_many_arguments)]
pub fn make_shop_record(
    sess: &mut Value,
    platform_code: &str,
    shop_name: Option<String>,
    platform_shop_id: Option<String>,
    live_id: Option<String>,
    live_room_name: Option<String>,
    live_avatar_url: Option<String>,
    avatar_url: Option<String>,
    shop_curl: Option<Value>,
    auth_subject: Option<String>,
    authorization_scope: Option<Value>,
    raw_data: Option<Value>,
    existing_id: Option<i64>,
) -> Value {
    let sid = existing_id.unwrap_or_else(|| next_shop_id(sess));
    let code = platform_code.trim().to_string();
    let code = if code.is_empty() { "douyin".to_string() } else { code };
    let name = shop_name
        .filter(|s| !s.is_empty())
        .or_else(|| live_room_name.clone().filter(|s| !s.is_empty()))
        .unwrap_or_else(|| format!("{}店铺", platform_name(&code)));
    let psid = platform_shop_id
        .filter(|s| !s.is_empty())
        .or_else(|| live_id.clone().filter(|s| !s.is_empty()))
        .unwrap_or_else(|| format!("mock-{code}-{sid}"));

    let mut auth_subj = auth_subject.unwrap_or_else(|| "shop".to_string());
    if !matches!(auth_subj.as_str(), "live_room" | "order_shop" | "legacy") {
        let has_live_id = live_id.as_deref().map(|s| !s.is_empty()).unwrap_or(false);
        if has_live_id {
            auth_subj = "live_room".to_string();
        } else if let Some(scope) = &authorization_scope {
            if let Some(step_keys) = scope.get("stepKeys").and_then(|v| v.as_array()) {
                let steps: Vec<&str> = step_keys.iter().filter_map(|k| k.as_str()).collect();
                if steps.contains(&"live") && !steps.contains(&"store") {
                    auth_subj = "live_room".to_string();
                }
            }
        }
    }
    let scope = authorization_scope.unwrap_or_else(|| match auth_subj.as_str() {
        "order_shop" => json!({"stepKeys": ["store"]}),
        "live_room" => json!({"stepKeys": ["live"]}),
        _ => json!({"stepKeys": ["store", "live"]}),
    });
    let raw = match raw_data {
        Some(Value::Object(_)) => raw_data,
        Some(other) if !other.is_null() => Some(other),
        _ => Some(json!({})),
    };
    let avatar = avatar_url.clone().or_else(|| live_avatar_url.clone());
    let live_avatar = live_avatar_url.or(avatar_url);

    json!({
        "id": sid,
        "shop_id": sid,
        "tenant_id": sess.get("tenant").and_then(|t| t.get("id")).and_then(|v| v.as_i64()).unwrap_or(1),
        "platform_code": code,
        "platform_shop_id": psid,
        "shop_name": name,
        "name": name,
        "account_name": name,
        "avatar_url": avatar,
        "live_id": live_id,
        "live_room_name": live_room_name.filter(|s| !s.is_empty()).unwrap_or_else(|| name.clone()),
        "live_avatar_url": live_avatar,
        "shop_curl": shop_curl.unwrap_or(Value::Null),
        "auth_subject": auth_subj,
        "authorization_scope": scope,
        "status": "connected",
        "connected": true,
        "is_active": true,
        "is_connected": true,
        "platform_name": platform_name(&code),
        "raw_data": raw.unwrap_or_else(|| json!({})),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    })
}

/// Python `upsert_shop`：按 id 或 platform+platform_shop_id 合并；持久化全局 store
pub fn upsert_shop(state: &AppState, sess: &mut Value, shop: Value) -> Value {
    let shops = sess
        .get("shops")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
    let shop_id = shop.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let mut new_shops = shops;
    let mut result = shop.clone();
    let mut found = false;
    for (i, s) in new_shops.iter_mut().enumerate() {
        let s_id = s.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
        if s_id == shop_id {
            let mut merged = s.clone();
            if let (Some(a), Some(b)) = (merged.as_object_mut(), shop.as_object()) {
                for (k, v) in b {
                    a.insert(k.clone(), v.clone());
                }
                a.insert("updated_at".into(), json!(now_iso()));
            }
            new_shops[i] = merged.clone();
            result = merged;
            found = true;
            break;
        }
        // same platform + platform_shop_id → merge
        let same_platform = s.get("platform_code").and_then(|v| v.as_str()) == shop.get("platform_code").and_then(|v| v.as_str());
        let s_psid = as_s(s.get("platform_shop_id").unwrap_or(&Value::Null));
        let shop_psid = as_s(shop.get("platform_shop_id").unwrap_or(&Value::Null));
        if same_platform && !s_psid.is_empty() && s_psid == shop_psid {
            let mut merged = s.clone();
            if let (Some(a), Some(b)) = (merged.as_object_mut(), shop.as_object()) {
                for (k, v) in b {
                    a.insert(k.clone(), v.clone());
                }
                a.insert("id".into(), json!(s_id));
                a.insert("shop_id".into(), json!(s_id));
                a.insert("updated_at".into(), json!(now_iso()));
            }
            new_shops[i] = merged.clone();
            result = merged;
            found = true;
            break;
        }
    }
    if !found {
        new_shops.push(shop);
    }
    sess.as_object_mut().map(|o| o.insert("shops".into(), json!(new_shops)));
    let shop_seq = sess.get("shop_seq").cloned().unwrap_or(json!(1000));
    // 持久化（store_set 内部加锁 + 落盘）
    store::store_set(state, "shops", sess.get("shops").cloned().unwrap_or_else(|| json!([])));
    store::store_set(state, "shop_seq", shop_seq);
    result
}

/// Python `shop_display_row`
pub fn shop_display_row(shop: &Value) -> Value {
    let cap_live = if shop_has_live_cap(shop) { "ready" } else { "pending" };
    let cap_order = if shop_has_store_cap(shop) { "ready" } else { "pending" };
    let cap_remark = cap_order;
    let sid = shop.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let code = as_s(shop.get("platform_code").unwrap_or(&Value::Null));
    let auth_subj = as_s(shop.get("auth_subject").unwrap_or(&Value::Null));
    let auth_subj = if auth_subj.is_empty() { "live_room".to_string() } else { auth_subj };
    let is_order = auth_subj == "order_shop";
    let plabel = if code.is_empty() { "-".to_string() } else { platform_name(&code) };
    let live_name = shop
        .get("live_room_name")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .unwrap_or_else(|| as_s(shop.get("shop_name").unwrap_or(&Value::Null)));
    let connection = if code.is_empty() {
        json!({})
    } else {
        json!({code.clone(): "ready"})
    };

    json!({
        "row_id": format!("{code}-{sid}"),
        "row_type": "single",
        "platform_label": plabel,
        "platform_name": plabel,
        "store_shop_id": if is_order { json!(sid) } else { Value::Null },
        "live_shop_id": if is_order { Value::Null } else { json!(sid) },
        "binding_id": Value::Null,
        "live_name": live_name,
        "connection": connection,
        "actions": {"delete": true},
        "notes": Value::Null,
        "id": sid,
        "shop_id": sid,
        "platform_code": code,
        "platform_shop_id": shop.get("platform_shop_id"),
        "shop_name": shop.get("shop_name"),
        "name": shop.get("shop_name"),
        "avatar_url": shop.get("avatar_url"),
        "live_id": shop.get("live_id"),
        "live_room_name": shop.get("live_room_name"),
        "live_avatar_url": shop.get("live_avatar_url"),
        "status": shop.get("status").and_then(|v| v.as_str()).filter(|s| !s.is_empty()).unwrap_or("connected"),
        "auth_subject": auth_subj,
        "authorization_scope": shop.get("authorization_scope"),
        "connected": true,
        "is_connected": true,
        "capabilities": {
            "live": {"state": cap_live},
            "order": {"state": cap_order},
            "remark": {"state": cap_remark},
            "storeAccess": {"state": "ready"},
            "identity": {"state": "ready"},
        },
        "authorization": {
            "credential": {
                "state": "present",
                "hasStoredSnapshot": true,
                "hasPersistedCookie": true,
                "hasRuntimeSession": true,
            },
            "metadata": {
                "state": "verified",
                "platformShopId": shop.get("platform_shop_id"),
                "shopName": shop.get("shop_name"),
                "avatarUrl": shop.get("live_avatar_url").or_else(|| shop.get("avatar_url")),
                "liveId": shop.get("live_id"),
                "liveAvatarUrl": shop.get("live_avatar_url"),
                "source": "bootstrap",
            },
            "runtime": {
                "state": "ready",
                "connectionStatus": "connected",
                "roomId": shop.get("live_id"),
                "nickname": shop.get("live_room_name").or_else(|| shop.get("shop_name")),
                "reason": Value::Null,
            },
            "displayState": "connected",
            "reason": "authorization_safety_period",
            "updatedAt": now_ms(),
            "capabilities": {
                "storeAccess": {"state": "ready"},
                "live": {"state": cap_live},
                "order": {"state": cap_order},
                "remark": {"state": cap_remark},
                "identity": {"state": "ready"},
            },
        },
    })
}

/// Python `build_shop_rows`：注入 store_options
pub fn build_shop_rows(shops: &[Value]) -> Value {
    let rows: Vec<Value> = shops.iter().map(shop_display_row).collect();
    let order_rows: Vec<Value> = rows
        .iter()
        .filter(|r| r.get("auth_subject").and_then(|v| v.as_str()) == Some("order_shop"))
        .cloned()
        .collect();
    let mut out = Vec::new();
    for r in rows {
        let mut row = r;
        let is_order = row.get("auth_subject").and_then(|v| v.as_str()) == Some("order_shop");
        let options = if is_order { json!([]) } else { json!(order_rows) };
        if let Some(obj) = row.as_object_mut() {
            obj.insert("store_options".into(), options);
        }
        out.push(row);
    }
    json!(out)
}

/// Python `extract_shop_fields_from_payload`
pub fn extract_shop_fields_from_payload(payload: &Value) -> Value {
    if !payload.is_object() {
        return json!({});
    }
    let meta = payload
        .get("metadata")
        .or_else(|| payload.get("shopMetadata"))
        .or_else(|| payload.get("shop_metadata"))
        .cloned()
        .unwrap_or_else(|| json!({}));
    let meta = if meta.is_object() { meta } else { json!({}) };
    let raw = meta
        .get("rawData")
        .or_else(|| meta.get("raw_data"))
        .or_else(|| payload.get("rawData"))
        .or_else(|| payload.get("raw_data"))
        .cloned()
        .unwrap_or_else(|| json!({}));
    let raw = if raw.is_object() { raw } else { json!({}) };
    let auth_payload = payload
        .get("authPayload")
        .or_else(|| payload.get("auth_payload"))
        .or_else(|| meta.get("authPayload"))
        .cloned()
        .unwrap_or_else(|| json!({}));
    let auth_payload = if auth_payload.is_object() { auth_payload } else { json!({}) };

    let first_non_null = |candidates: &[Option<&Value>]| -> Option<Value> {
        for c in candidates {
            if let Some(v) = c {
                let s = as_s(v);
                if !s.is_empty() {
                    return Some(Value::String(s));
                }
            }
        }
        None
    };

    let live_id = first_non_null(&[
        meta.get("liveId"),
        meta.get("live_id"),
        raw.get("liveId"),
        raw.get("live_id"),
        auth_payload.get("liveId"),
        payload.get("liveId"),
        payload.get("live_id"),
    ]);
    let live_room = first_non_null(&[
        meta.get("liveRoomName"),
        meta.get("live_room_name"),
        meta.get("shopName"),
        meta.get("shop_name"),
        raw.get("liveRoomName"),
        raw.get("live_room_name"),
        auth_payload.get("liveRoomName"),
        payload.get("shop_name"),
        payload.get("shopName"),
    ]);
    let live_avatar = first_non_null(&[
        meta.get("liveAvatarUrl"),
        meta.get("live_avatar_url"),
        meta.get("avatarUrl"),
        raw.get("liveAvatarUrl"),
        auth_payload.get("liveAvatarUrl"),
    ]);
    let shop_curl = first_non_null(&[
        meta.get("shopCurl"),
        meta.get("shop_curl"),
        payload.get("shop_curl"),
        payload.get("shopCurl"),
        auth_payload.get("shopCurl"),
    ]);
    let platform_shop_id = first_non_null(&[
        meta.get("platformShopId"),
        meta.get("platform_shop_id"),
        raw.get("platformShopId"),
        payload.get("platform_shop_id"),
        live_id.as_ref(),
    ]);
    let auth_subject = first_non_null(&[
        payload.get("auth_subject"),
        payload.get("authSubject"),
        meta.get("auth_subject"),
    ])
    .map(|v| as_s(&v))
    .unwrap_or_else(|| "shop".to_string());
    let scope = payload
        .get("authorization_scope")
        .or_else(|| payload.get("authorizationScope"))
        .or_else(|| meta.get("authorization_scope"))
        .or_else(|| meta.get("authorizationScope"))
        .cloned();

    let live_room_s = live_room.map(|v| as_s(&v));
    let live_avatar_s = live_avatar.map(|v| as_s(&v));

    json!({
        "live_id": live_id.map(|v| as_s(&v)),
        "live_room_name": live_room_s.clone(),
        "live_avatar_url": live_avatar_s.clone(),
        "shop_curl": shop_curl.map(|v| as_s(&v)),
        "platform_shop_id": platform_shop_id.map(|v| as_s(&v)),
        "auth_subject": auth_subject,
        "authorization_scope": scope.unwrap_or(Value::Null),
        "raw_data": raw,
        "shop_name": live_room_s,
        "avatar_url": live_avatar_s,
    })
}

/// Python `shop_api_payload`
pub fn shop_api_payload(state: &AppState, shop: &Value, sess: Option<&Value>) -> Value {
    let display = shop_display_row(shop);
    let shop_id = shop.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let mut out = json!({
        "success": true,
        "shop_id": shop_id,
        "data": {
            "success": true,
            "shop_id": shop_id,
            "shop": display,
        },
        "message": "ok",
    });
    if let Some(sess) = sess {
        let shops = sess.get("shops").and_then(|v| v.as_array()).cloned().unwrap_or_default();
        let rows = build_shop_rows(&shops);
        if let Some(data) = out.get_mut("data").and_then(|d| d.as_object_mut()) {
            data.insert("shops".into(), rows);
        }
    }
    let _ = state;
    out
}

/// Python `/shops` GET JSON 响应（dashboard io）
pub fn shops_dashboard_payload(sess: &Value) -> Value {
    let shops = sess.get("shops").and_then(|v| v.as_array()).cloned().unwrap_or_default();
    let rows = build_shop_rows(&shops);
    let rows_arr = rows.as_array().cloned().unwrap_or_default();
    let dash_rows: Vec<Value> = rows_arr
        .iter()
        .filter(|r| r.get("auth_subject").and_then(|v| v.as_str()) != Some("order_shop"))
        .cloned()
        .collect();
    let active_row_id = dash_rows
        .first()
        .and_then(|r| r.get("id").cloned())
        .unwrap_or(Value::Null);
    json!({
        "success": true,
        "data": {
            "shops": shops,
            "shop_display_rows": rows,
            "dashboard_rows": dash_rows,
            "active_dashboard_row_id": active_row_id,
            "count": shops.len(),
        },
    })
}

/// 供 handlers 使用的 /shops/list 响应
pub fn shops_list_payload(sess: &Value) -> Value {
    let shops = sess.get("shops").and_then(|v| v.as_array()).cloned().unwrap_or_default();
    let rows = build_shop_rows(&shops);
    json!({
        "success": true,
        "data": {"shops": rows, "count": shops.len()},
    })
}

/// 删除店铺（DELETE /shops/{id}）——返回 (新 shops, 是否找到)
pub fn remove_shop(sess: &mut Value, shop_id: i64) -> bool {
    let shops = sess
        .get("shops")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
    let before = shops.len();
    let kept: Vec<Value> = shops
        .into_iter()
        .filter(|s| s.get("id").and_then(|v| v.as_i64()).unwrap_or(0) != shop_id)
        .collect();
    let removed = kept.len() != before;
    sess.as_object_mut().map(|o| o.insert("shops".into(), json!(kept)));
    removed
}

/// 供 shops handler 使用的 oauth_states 便捷方法
pub fn oauth_state(sess: &Value, state: &str) -> Value {
    sess.get("oauth_states")
        .and_then(|m| m.get(state))
        .cloned()
        .unwrap_or_else(|| json!({}))
}

pub fn set_oauth_state(sess: &mut Value, state: &str, value: Value) {
    let states = sess
        .get("oauth_states")
        .and_then(|v| v.as_object())
        .map(|m| {
            let mut m2 = m.clone();
            m2.insert(state.to_string(), value.clone());
            Value::Object(m2)
        })
        .unwrap_or_else(|| json!({state: value}));
    sess.as_object_mut().map(|o| o.insert("oauth_states".into(), states));
}

pub fn pop_oauth_state(sess: &mut Value, state: &str) {
    if let Some(states) = sess.get_mut("oauth_states").and_then(|v| v.as_object_mut()) {
        states.remove(state);
    }
}

/// 从 payload 提取字段并按 fields 键过滤（对齐调用处 `{k: fields[k] for k in (...)}`）
pub fn pick_fields(fields: &Value, keys: &[&str]) -> HashMap<String, Value> {
    let mut out = HashMap::new();
    if let Some(obj) = fields.as_object() {
        for k in keys {
            if let Some(v) = obj.get(*k) {
                out.insert(k.to_string(), v.clone());
            }
        }
    }
    out
}
