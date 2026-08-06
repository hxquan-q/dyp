//! Inertia 页面层（对齐 server.py 的 page() / base_props() / build_page_for() /
//! only_props() / shell_html()）。

use crate::domain::{
    build_deduction_rules, component_for_path, merged_deduction_config, plans, subscription_summary,
};
use crate::shops::build_shop_rows;
use crate::state::AppState;
use crate::store;
use crate::templates;
use crate::util::{compact_json, expire_iso, html_escape, now_iso, script_data};
use serde_json::{json, Value};
use std::collections::HashMap;

/// Python `page()`
pub fn page(component: &str, url: &str, props: Value, version: &str) -> Value {
    json!({
        "component": component,
        "props": props,
        "url": url,
        "version": version,
        "clearHistory": false,
        "encryptHistory": false,
    })
}

/// Python `base_props()`（注意：会消费 session 的 flash）
pub fn base_props(state: &AppState, sess: &mut Value) -> Value {
    let authed = sess.get("user").map(|u| !u.is_null()).unwrap_or(false);
    let props = json!({
        "errors": {},
        "flash": {
            "success": if authed { sess.get("flash_success").cloned().unwrap_or(Value::Null) } else { Value::Null },
            "error": if authed { sess.get("flash_error").cloned().unwrap_or(Value::Null) } else { Value::Null },
        },
        "csrfToken": sess.get("csrf").cloned().unwrap_or_else(|| json!(crate::util::token_urlsafe(32))),
        "auth": {
            "user": if authed { sess.get("user").cloned() } else { None },
            "tenant": if authed { sess.get("tenant").cloned() } else { None },
        },
        "shops": if authed { sess.get("shops").cloned().unwrap_or_else(|| json!([])) } else { json!([]) },
        "platforms": crate::domain::platforms(),
        "subscriptionSummary": if authed { subscription_summary() } else { Value::Null },
        "electronDevice": if authed { sess.get("electron_device").cloned().unwrap_or_else(|| json!({"status": "guest"})) } else { json!({"status": "guest"}) },
        "apiToken": if authed { sess.get("api_token").cloned().unwrap_or(Value::Null) } else { Value::Null },
        "appUpdate": Value::Null,
    });
    // 消费 flash
    if let Some(o) = sess.as_object_mut() {
        o.insert("flash_success".into(), Value::Null);
        o.insert("flash_error".into(), Value::Null);
    }
    let _ = state;
    props
}

/// Python `build_page_for()`：按 path 决定 component 与 props
pub fn build_page_for(
    state: &AppState,
    path: &str,
    sess: &mut Value,
    query: Option<&HashMap<String, Vec<String>>>,
) -> Value {
    let authed = sess.get("user").map(|u| !u.is_null()).unwrap_or(false);
    let mut path = path.to_string();
    // force login gate only when AUTO_LOGIN is off
    if state.auto_login {
        if (path == "/login" || path == "/register") && authed {
            path = "/dashboard".to_string();
        }
        if path != "/login" && path != "/register" && path != "/password/reset" && !authed {
            path = "/login".to_string();
        }
    } else {
        if (path == "/login" || path == "/register") && authed {
            path = "/dashboard".to_string();
        }
        if path != "/login" && path != "/register" && path != "/password/reset" && !authed {
            path = "/login".to_string();
        }
    }

    let component = if is_edit_template(path.as_str()) {
        "Deduction/EditTemplate".to_string()
    } else {
        component_for_path()
            .get(path.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Deduction/Index".to_string())
    };

    let mut props = base_props(state, sess);

    match component.as_str() {
        "Auth/Login" | "Auth/Register" => {}
        "Deduction/Index" => {
            let shops = sess.get("shops").and_then(|v| v.as_array()).cloned().unwrap_or_default();
            let rows = build_shop_rows(&shops);
            let rows_arr = rows.as_array().cloned().unwrap_or_default();
            let active_id = rows_arr.first().and_then(|r| r.get("id").cloned()).unwrap_or(Value::Null);
            let p = props.as_object_mut().unwrap();
            p.insert("subscriptionSummary".into(), subscription_summary());
            p.insert("shops".into(), json!(shops));
            p.insert("shopDisplayRows".into(), rows);
            p.insert("dashboardRows".into(), Value::Array(rows_arr));
            p.insert("activeDashboardRowId".into(), active_id);
        }
        "Deduction/Shops" => {
            let shops = sess.get("shops").and_then(|v| v.as_array()).cloned().unwrap_or_default();
            let rows = build_shop_rows(&shops);
            let user = sess.get("user").cloned().unwrap_or_else(|| json!({}));
            let p = props.as_object_mut().unwrap();
            p.insert("shops".into(), json!(shops));
            p.insert("shopDisplayRows".into(), rows);
            p.insert("platforms".into(), Value::Array(crate::domain::platforms().to_vec()));
            p.insert(
                "accountInfo".into(),
                json!({"name": user.get("name"), "phone": user.get("phone")}),
            );
            p.insert("subscriptionSummary".into(), subscription_summary());
        }
        "Settings/Devices" => {
            let p = props.as_object_mut().unwrap();
            p.insert("devices".into(), sess.get("devices").cloned().unwrap_or_else(|| json!([])));
            p.insert("deviceLimit".into(), json!(99));
        }
        "Settings/OrderSubscriptions" => {
            let mut subs: Vec<Value> = Vec::new();
            let orders: Vec<Value> = state
                .payment_orders
                .lock()
                .map(|g| g.values().cloned().collect())
                .unwrap_or_default();
            for o in &orders {
                let paid = o.get("status").and_then(|v| v.as_i64()) == Some(1);
                subs.push(state.mock_order_status(o, paid));
            }
            for o in &orders {
                let paid = o.get("status").and_then(|v| v.as_i64()) == Some(1);
                if !paid {
                    subs.push(state.mock_order_status(o, false));
                }
            }
            if subs.is_empty() {
                subs.push(json!({
                    "id": 1,
                    "order_no": format!("SO{}", uuid::Uuid::new_v4().simple().to_string()[..8].to_uppercase()),
                    "version": "企业版（本地mock）",
                    "days": 3650,
                    "start_time": now_iso(),
                    "end_time": expire_iso(3650),
                    "amount_paid": 0,
                    "pay_method": 4,
                    "status": 1,
                    "pay_time": now_iso(),
                    "refund_status": Value::Null,
                    "refund_amount": Value::Null,
                    "refund_time": Value::Null,
                    "remark": "本地mock：企业版已开通",
                    "can_refund": false,
                    "can_continue_payment": false,
                }));
            }
            props.as_object_mut().unwrap().insert("subscriptions".into(), json!(subs));
        }
        "Settings/PaymentConfirm" => {
            let qs_plan = query
                .and_then(|q| q.get("plan_code"))
                .and_then(|v| v.first())
                .cloned()
                .unwrap_or_default();
            let plan_list = plans();
            let plan = plan_list
                .iter()
                .find(|p| p["plan_code"].as_str() == Some(qs_plan.as_str()))
                .cloned()
                .unwrap_or_else(|| plan_list[plan_list.len() - 1].clone());
            let days = plan.get("days").and_then(|v| v.as_i64()).unwrap_or(30);
            let user = sess.get("user").cloned().unwrap_or_else(|| json!({}));
            let tenant = sess.get("tenant").cloned().unwrap_or_else(|| json!({}));
            let p = props.as_object_mut().unwrap();
            p.insert(
                "plan".into(),
                json!({
                    "id": plan["id"],
                    "plan_code": plan["plan_code"],
                    "name": plan["name"],
                    "label": plan["label"],
                    "price": plan["price"],
                    "days": days,
                    "start_time": now_iso(),
                    "end_time": expire_iso(days),
                }),
            );
            p.insert(
                "buyer".into(),
                json!({
                    "name": user.get("name"),
                    "phone": user.get("phone"),
                    "tenant_name": tenant.get("name"),
                }),
            );
            p.insert("confirmUrl".into(), json!("/payment/create"));
        }
        "Settings/WechatNativePay" => {
            let out_no = query
                .and_then(|q| q.get("out_trade_no"))
                .and_then(|v| v.first())
                .cloned()
                .unwrap_or_default();
            let mut order = state.payment_order(&out_no);
            if order.is_none() {
                // 直接访问未带 out_trade_no：给一个默认已支付订单
                order = Some(state.create_payment_order("enterprise", "wechat"));
                if let Some(o) = order.as_mut() {
                    o.as_object_mut().map(|m| m.insert("status".into(), json!(1)));
                }
            }
            let order = order.unwrap();
            let p = props.as_object_mut().unwrap();
            p.insert(
                "order".into(),
                json!({
                    "order_no": order.get("order_no"),
                    "out_trade_no": order.get("out_trade_no"),
                    "amount": order.get("amount"),
                    "code_url": order.get("code_url"),
                    "description": order.get("description"),
                }),
            );
        }
        "Deduction/Notes" => {
            let p = props.as_object_mut().unwrap();
            p.insert("apiToken".into(), sess.get("api_token").cloned().unwrap_or(Value::Null));
            p.insert("subscriptionSummary".into(), subscription_summary());
        }
        "Deduction/PrintLog" => {
            let p = props.as_object_mut().unwrap();
            p.insert("items".into(), json!([]));
            p.insert("tenantId".into(), json!(1));
        }
        "Deduction/Config" => {
            let relations = state.danmu_relations();
            let p = props.as_object_mut().unwrap();
            p.insert("configs".into(), json!(relations));
            p.insert("tenantId".into(), json!(1));
        }
        "Deduction/Blacklists" => {
            let p = props.as_object_mut().unwrap();
            p.insert("items".into(), json!([]));
            p.insert("tenantId".into(), json!(1));
        }
        "Deduction/Buyers" => {
            let p = props.as_object_mut().unwrap();
            p.insert("buyers".into(), json!([]));
            p.insert("liveShops".into(), json!([]));
        }
        "Deduction/Template" => {
            let tpls = templates::ensure_templates(&state.assets_dir, sess);
            let flash = props.get("flash").cloned().unwrap_or_else(|| json!({"success": Value::Null, "error": Value::Null}));
            let p = props.as_object_mut().unwrap();
            p.insert("templates".into(), tpls);
            p.insert("flash".into(), flash);
        }
        "Deduction/EditTemplate" => {
            // /tag-templates/create or /tag-templates/{id}/edit
            let mut tpl = None;
            if let Some(id_str) = extract_edit_template_id(path.as_str()) {
                if let Ok(tid) = id_str.parse::<i64>() {
                    let tpls = templates::ensure_templates(&state.assets_dir, sess);
                    if let Some(arr) = tpls.as_array() {
                        tpl = arr.iter().find(|t| t.get("id").and_then(|v| v.as_i64()) == Some(tid)).cloned();
                    }
                }
            }
            let auth = props.get("auth").cloned().unwrap_or(Value::Null);
            let p = props.as_object_mut().unwrap();
            p.insert("template".into(), tpl.unwrap_or(Value::Null));
            p.insert("auth".into(), auth);
        }
        "Settings/ClientSettings" => {}
        _ => {}
    }

    page(&component, path.as_str(), props, crate::domain::VERSION)
}

fn is_edit_template(path: &str) -> bool {
    let re = regex::Regex::new(r"^/tag-templates/\d+/edit$").unwrap();
    re.is_match(path)
}

fn extract_edit_template_id(path: &str) -> Option<&str> {
    let re = regex::Regex::new(r"^/tag-templates/(\d+)/edit$").unwrap();
    re.captures(path).map(|c| c.get(1).unwrap().as_str())
}

/// Python `only_props`：Inertia partial reload 过滤 props
pub fn only_props(full: &Value, only_header: Option<&str>) -> Value {
    let Some(only) = only_header else { return full.clone() };
    let keys: Vec<String> = only
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();
    let mut props = serde_json::Map::new();
    if let Some(src) = full.get("props").and_then(|p| p.as_object()) {
        for k in &keys {
            if let Some(v) = src.get(k) {
                props.insert(k.clone(), v.clone());
            }
        }
        // always keep errors/flash lightly
        for k in ["errors", "flash", "csrfToken"] {
            if let Some(v) = src.get(k) {
                if !props.contains_key(k) {
                    props.insert(k.to_string(), v.clone());
                }
            }
        }
    }
    let mut out = full.clone();
    out.as_object_mut().map(|o| o.insert("props".into(), Value::Object(props)));
    out
}

/// Python `shell_html()`：渲染 Inertia 壳（data-page 属性 + script JSON + 双 mock 注入）
pub fn shell_html(state: &AppState, page_obj: &Value) -> Vec<u8> {
    let compact = compact_json(page_obj);
    let data_attr = html_escape(&compact);
    let script = script_data(page_obj);
    let csrf = page_obj
        .get("props")
        .and_then(|p| p.get("csrfToken"))
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let tpl = state.shell_template();
    tpl.replace("@@DATA_PAGE_ATTR@@", &data_attr)
        .replace("@@SCRIPT_DATA@@", &script)
        .replace("@@CSRF@@", &csrf)
        .into_bytes()
}

/// 由 build_page_for 使用的 deduction rules（live-config）
pub fn live_config_payload(state: &AppState, sess: &Value, shop_id: &str) -> Value {
    let shop_name = sess
        .get("shops")
        .and_then(|v| v.as_array())
        .and_then(|a| a.first())
        .and_then(|s| s.get("shop_name"))
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("本地mock店铺")
        .to_string();
    let cfg: Value = if shop_id.is_empty() {
        Value::Null
    } else {
        store::store_get(state, "deduction_configs")
            .get(shop_id)
            .cloned()
            .unwrap_or(Value::Null)
    };
    let cfg = merged_deduction_config(&cfg);
    json!({
        "success": true,
        "displayFilter": {"hiddenTypes": []},
        "deductionRules": build_deduction_rules(&cfg),
        "blacklist": [],
        "shopInfo": {"name": shop_name},
    })
}
