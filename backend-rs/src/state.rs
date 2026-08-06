//! 全局应用状态：会话、支付订单、全局存储镜像、资源目录。
//!
//! 并发模型（P0-1）：
//! - `store` Mutex 串行化全局数据（shops/templates/configs/relations/logs）读写
//! - `sessions` Mutex 保护会话表
//! - 锁顺序约定：永不嵌套持锁（一次性锁内完成 mutate + 落盘），避免死锁

use crate::store::load_store;
use crate::util;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};

pub struct AppState {
    #[allow(dead_code)]
    pub data_dir: PathBuf,
    pub assets_dir: PathBuf,
    pub static_dir: PathBuf,
    pub store_path: PathBuf,
    pub auto_login: bool,
    pub shell: OnceLock<String>,
    pub logger: Option<crate::log::Logger>,
    /// global-store.json 内存镜像（唯一真源，磁盘只是投影）
    pub store: Mutex<Value>,
    /// sid -> session
    pub sessions: Mutex<HashMap<String, Value>>,
    /// out_trade_no -> order
    pub payment_orders: Mutex<HashMap<String, Value>>,
    pub payment_seq: Mutex<i64>,
    pub dpr_seq: Mutex<i64>,
}

impl AppState {
    /// 解析数据目录（对齐 Python `_default_app_data_dir`）
    pub fn resolve_data_dir(env_data_dir: Option<String>, frozen: bool) -> PathBuf {
        if let Some(d) = env_data_dir {
            return PathBuf::from(d);
        }
        if let Some(d) = std::env::var_os("KDB_DATA_DIR") {
            return PathBuf::from(d);
        }
        if !frozen {
            // 开发模式：backend/ 目录本身（保留 global-store.json）
            return std::env::current_dir()
                .unwrap_or_else(|_| PathBuf::from("."));
        }
        if cfg!(windows) {
            if let Some(appdata) = std::env::var_os("APPDATA") {
                return PathBuf::from(appdata).join("Koudanbao");
            }
        }
        if let Some(xdg) = std::env::var_os("XDG_DATA_HOME") {
            return PathBuf::from(xdg).join("koudanbao");
        }
        PathBuf::from(".").join(".local").join("share").join("koudanbao")
    }

    pub fn new(data_dir: PathBuf, assets_dir: PathBuf, static_dir: PathBuf, auto_login: bool) -> Self {
        let store_path = data_dir.join("global-store.json");
        let store = load_store(&store_path);
        let logger = crate::log::Logger::init(&data_dir);
        AppState {
            data_dir,
            assets_dir,
            static_dir,
            store_path,
            auto_login,
            shell: OnceLock::new(),
            logger: Some(logger),
            store: Mutex::new(store),
            sessions: Mutex::new(HashMap::new()),
            payment_orders: Mutex::new(HashMap::new()),
            payment_seq: Mutex::new(1),
            dpr_seq: Mutex::new(1),
        }
    }

    #[cfg(test)]
    pub fn new_for_test(dir: &std::path::Path) -> AppState {
        AppState::new(
            dir.to_path_buf(),
            dir.to_path_buf(),
            dir.to_path_buf(),
            true,
        )
    }

    /// 读取 shell 模板（惰性）
    pub fn shell_template(&self) -> &str {
        self.shell.get_or_init(|| {
            let p = self.assets_dir.join("shell.html");
            std::fs::read_to_string(&p).unwrap_or_else(|_| {
                // 资源缺失时给一个最小可用壳（正常打包不会发生）
                "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/><title>扣数宝</title></head><body><div id=\"app\" data-page='@@DATA_PAGE_ATTR@@'></div></body></html>".to_string()
            })
        })
    }

    // ---- 会话 ----

    /// Python `ensure_session(sid, auto)`：取或建会话
    /// 返回 (sid, 会话克隆)。auto 时自动登录。
    pub fn ensure_session(&self, sid0: Option<&str>, auto: bool) -> (String, Value) {
        let mut guard = self.sessions.lock().expect("sessions poisoned");
        if let Some(sid) = sid0 {
            if let Some(sess) = guard.get(sid) {
                return (sid.to_string(), sess.clone());
            }
        }
        let new_sid = sid0.map(|s| s.to_string()).unwrap_or_else(|| util::token_urlsafe(32));
        let sess = if auto {
            json!({
                "user": crate::domain::fake_user("13800000000"),
                "tenant": crate::domain::fake_tenant(),
                "csrf": util::token_urlsafe(32),
                "api_token": format!("kdb_local_{}", util::token_hex(16)),
                "electron_device": crate::domain::electron_device("active", None),
                "shops": [],
                "shop_seq": 1000,
                "templates": [],
                "template_seq": 1,
                "flash_success": Value::Null,
                "flash_error": Value::Null,
            })
        } else {
            json!({
                "user": Value::Null,
                "tenant": Value::Null,
                "csrf": util::token_urlsafe(32),
                "shops": [],
                "shop_seq": 1000,
                "templates": [],
                "template_seq": 1,
                "flash_success": Value::Null,
                "flash_error": Value::Null,
            })
        };
        guard.insert(new_sid.clone(), sess.clone());
        (new_sid, sess)
    }

    /// Python `_get_or_create_session` 的会话侧：从全局 store 同步 shops/templates
    pub fn sync_session_from_store(&self, sess: &mut Value) {
        let gstore = self.store.lock().expect("store poisoned").clone();
        let g_shops = gstore.get("shops").cloned().unwrap_or_else(|| json!([]));
        let g_templates = gstore.get("templates").cloned().unwrap_or_else(|| json!([]));
        let g_shop_seq = gstore.get("shop_seq").and_then(|v| v.as_i64()).unwrap_or(0);
        let g_template_seq = gstore.get("template_seq").and_then(|v| v.as_i64()).unwrap_or(0);

        let s_shops = sess.get("shops").and_then(|v| v.as_array()).map(|a| a.len()).unwrap_or(0);
        let g_shops_len = g_shops.as_array().map(|a| a.len()).unwrap_or(0);
        if g_shops_len > s_shops {
            sess.as_object_mut().map(|o| o.insert("shops".into(), g_shops));
        }
        let s_seq = sess.get("shop_seq").and_then(|v| v.as_i64()).unwrap_or(0);
        if g_shop_seq > s_seq {
            sess.as_object_mut().map(|o| o.insert("shop_seq".into(), json!(g_shop_seq)));
        }
        let s_tpl = sess.get("templates").and_then(|v| v.as_array()).map(|a| a.len()).unwrap_or(0);
        let g_tpl_len = g_templates.as_array().map(|a| a.len()).unwrap_or(0);
        if g_tpl_len > s_tpl {
            sess.as_object_mut().map(|o| o.insert("templates".into(), g_templates));
        }
        let s_tseq = sess.get("template_seq").and_then(|v| v.as_i64()).unwrap_or(0);
        if g_template_seq > s_tseq {
            sess.as_object_mut().map(|o| o.insert("template_seq".into(), json!(g_template_seq)));
        }
    }

    /// 写回会话
    pub fn set_session(&self, sid: &str, sess: &Value) {
        if let Ok(mut guard) = self.sessions.lock() {
            guard.insert(sid.to_string(), sess.clone());
        }
    }

    /// 会话克隆
    #[allow(dead_code)]
    pub fn get_session(&self, sid: &str) -> Option<Value> {
        self.sessions.lock().ok().and_then(|g| g.get(sid).cloned())
    }

    // ---- 弹幕→商品映射 ----

    pub fn danmu_relations(&self) -> Vec<Value> {
        self.store
            .lock()
            .map(|g| {
                g.get("danmu_product_relations")
                    .and_then(|v| v.as_array().cloned())
                    .unwrap_or_default()
            })
            .unwrap_or_default()
    }

    pub fn next_dpr_id(&self) -> i64 {
        let used_max = self
            .danmu_relations()
            .iter()
            .filter_map(|r| r.get("id").and_then(|v| v.as_i64()))
            .max()
            .unwrap_or(0);
        let mut seq = self.dpr_seq.lock().expect("dpr_seq poisoned");
        let next = (*seq).max(used_max + 1);
        *seq = next + 1;
        next
    }

    /// Python `_find_product_relation`：精确优先，其次包含
    pub fn find_product_relation(&self, content: &str) -> Option<Value> {
        if content.is_empty() {
            return None;
        }
        let rels = self.danmu_relations();
        for r in &rels {
            if crate::domain::as_s(r.get("danmu").unwrap_or(&Value::Null)) == content {
                return Some(r.clone());
            }
        }
        for r in &rels {
            let kw = crate::domain::as_s(r.get("danmu").unwrap_or(&Value::Null));
            if !kw.is_empty() && content.contains(&kw) {
                return Some(r.clone());
            }
        }
        None
    }

    // ---- 支付 ----

    pub fn next_payment_id(&self) -> i64 {
        let mut seq = self.payment_seq.lock().expect("payment_seq poisoned");
        let next = *seq;
        *seq += 1;
        next
    }

    pub fn create_payment_order(&self, plan_code: &str, payment_method: &str) -> Value {
        let plans = crate::domain::plans();
        let plan = plans
            .iter()
            .find(|p| p["plan_code"].as_str() == Some(plan_code))
            .unwrap_or_else(|| &plans[plans.len() - 1]);
        let out_trade_no = format!("KD{}", uuid::Uuid::new_v4().simple().to_string()[..18].to_uppercase());
        let pay_method = if payment_method == "wechat" { 5 } else { 1 };
        let order = json!({
            "id": self.next_payment_id(),
            "order_no": format!("SO{}", uuid::Uuid::new_v4().simple().to_string()[..8].to_uppercase()),
            "out_trade_no": out_trade_no.clone(),
            "plan_code": plan["plan_code"],
            "plan_name": plan["name"],
            "version": plan["label"],
            "description": format!("扣单宝 {} {} 天", plan["label"], plan["days"]),
            "days": plan["days"],
            "amount": plan["price"],
            "amount_paid": plan["price"],
            "pay_method": pay_method,
            "status": 1,
            "start_time": util::now_iso(),
            "end_time": util::expire_iso(plan["days"].as_i64().unwrap_or(3650)),
            "pay_time": util::now_iso(),
            "created_at": util::now_iso(),
            "code_url": out_trade_no.clone(),
            "refund_status": Value::Null,
            "refund_amount": Value::Null,
            "refund_time": Value::Null,
            "remark": "本地mock订单（即时支付成功）",
            "can_refund": false,
            "can_continue_payment": true,
        });
        if let Ok(mut orders) = self.payment_orders.lock() {
            orders.insert(out_trade_no, order.clone());
        }
        order
    }

    /// Python `_mock_order_status`
    pub fn mock_order_status(&self, order: &Value, paid: bool) -> Value {
        json!({
            "id": order["id"],
            "order_no": order["order_no"],
            "version": order["version"],
            "days": order["days"],
            "start_time": order.get("start_time"),
            "end_time": order.get("end_time"),
            "amount_paid": order.get("amount_paid").and_then(|v| if v.is_null() { None } else { Some(v.clone()) }).unwrap_or_else(|| json!(0)),
            "pay_method": order.get("pay_method"),
            "status": if paid { json!(1) } else { order.get("status").cloned().unwrap_or(json!(0)) },
            "pay_time": order.get("pay_time"),
            "refund_status": order.get("refund_status"),
            "refund_amount": order.get("refund_amount"),
            "refund_time": order.get("refund_time"),
            "remark": order.get("remark"),
            "can_continue_payment": !paid && order.get("can_continue_payment").and_then(|v| v.as_bool()).unwrap_or(false),
            "can_refund": order.get("can_refund").and_then(|v| v.as_bool()).unwrap_or(false),
        })
    }

    /// Python `_mock_order_list`：Notes 样例订单
    pub fn mock_order_list(&self, sess: &Value, page_no: i64, per_page: i64) -> Value {
        let shops = sess.get("shops").and_then(|v| v.as_array()).cloned().unwrap_or_default();
        let shop0 = shops.first().cloned().unwrap_or_else(|| json!({}));
        let shop_id = shop0.get("id").cloned();
        let shop_name = shop0
            .get("shop_name")
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty())
            .unwrap_or("抖音店铺")
            .to_string();
        let store_shop = json!({"id": shop_id, "shop_name": shop_name});
        let orders = vec![
            json!({
                "id": 1, "order_no": "DY20260801001", "shop_order_id": "DY20260801001",
                "order_owner_shop_id": shop_id, "store_shop": store_shop,
                "shop_name": shop_name, "buyer_name": "小明", "buyer_nickname": "小明",
                "product_title": "测试商品A（12号链接）", "goods_name": "测试商品A（12号链接）",
                "goods_count": 1, "pay_amount": "19.90", "total_amount": "19.90",
                "order_time": "2026-08-01 12:00:00", "order_status": "paid",
                "buyer_words": "备注：不要发错", "merchant_note": "", "remark": "",
                "decrypt_status": "ready", "decrypted": true,
                "products": [{"product_image": "https://img.alicdn.com/imgextra/logo.png", "product_title": "测试商品A（12号链接）", "variant": "默认", "quantity": 1}],
            }),
            json!({
                "id": 2, "order_no": "DY20260801002", "shop_order_id": "DY20260801002",
                "order_owner_shop_id": shop_id, "store_shop": store_shop,
                "shop_name": shop_name, "buyer_name": "小红", "buyer_nickname": "小红",
                "product_title": "测试商品B（7号链接）", "goods_name": "测试商品B（7号链接）",
                "goods_count": 2, "pay_amount": "25.80", "total_amount": "25.80",
                "order_time": "2026-08-01 12:05:00", "order_status": "paid",
                "buyer_words": "", "merchant_note": "测试备注", "remark": "测试备注",
                "decrypt_status": "ready", "decrypted": true,
                "products": [{"product_image": "https://img.alicdn.com/imgextra/logo.png", "product_title": "测试商品B（7号链接）", "variant": "红色", "quantity": 2}],
            }),
        ];
        let start = ((page_no - 1) * per_page).max(0) as usize;
        let end = (start + per_page as usize).min(orders.len());
        json!({
            "list": &orders[start..end],
            "total": orders.len(),
            "current_page": page_no,
            "per_page": per_page,
        })
    }

    /// Python `_create_payment_order` 后用于 build_page_for 的订单查找
    pub fn payment_order(&self, out_no: &str) -> Option<Value> {
        self.payment_orders.lock().ok().and_then(|g| g.get(out_no).cloned())
    }
}
