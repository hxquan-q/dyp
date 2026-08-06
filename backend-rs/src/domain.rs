//! 领域常量与假数据模型（对齐 server.py 的 PLATFORMS / PLANS / COMPONENT_FOR_PATH /
//! fake_user / fake_tenant / electron_device / subscription_summary / 默认打印模板）。

use crate::util::{expire_iso, now_iso};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::OnceLock;

pub const VERSION: &str = "local-mock-1";

pub fn platforms() -> &'static [Value] {
    static P: OnceLock<Vec<Value>> = OnceLock::new();
    P.get_or_init(|| {
        vec![
            json!({"code":"douyin","name":"抖店工作台","display_name":"抖音","logo":"/logo/doudian_logo.png","authorization_url":"https://anchor.douyin.com/"}),
            json!({"code":"douyin_talent","name":"抖店达人工作台","display_name":"抖店达人","logo":"/logo/doudian_logo.png","authorization_url":"https://anchor.douyin.com/login"}),
            json!({"code":"taobao","name":"淘宝工作台","display_name":"淘宝","logo":"/logo/taobao_logo.png","authorization_url":"https://liveplatform.taobao.com/live/liveAdmin.htm"}),
            json!({"code":"xiaohongshu","name":"小红书工作台","display_name":"小红书","logo":"/logo/xiaohongshu_logo.png","authorization_url":"https://creator.xiaohongshu.com/user/setting"}),
            json!({"code":"channels","name":"视频号工作台","display_name":"视频号","logo":"/logo/shipinghao_logo.png","authorization_url":"https://channels.weixin.qq.com/platform/user/setting"}),
            json!({"code":"wxstore","name":"微信小店工作台","display_name":"微信小店","logo":"/logo/shipinghao_logo.png","authorization_url":"https://store.weixin.qq.com/shop/setting/home"}),
        ]
    })
}

/// Python `platform_name(code)`：按 code 找 display_name
pub fn platform_name(code: &str) -> String {
    for p in platforms() {
        if p["code"].as_str() == Some(code) {
            if let Some(d) = p["display_name"].as_str() {
                return d.to_string();
            }
            if let Some(n) = p["name"].as_str() {
                return n.to_string();
            }
        }
    }
    if code.is_empty() {
        "未知平台".to_string()
    } else {
        code.to_string()
    }
}

pub fn plans() -> &'static [Value] {
    static P: OnceLock<Vec<Value>> = OnceLock::new();
    P.get_or_init(|| {
        vec![
            json!({"id":1,"plan_code":"standard","name":"标准版","label":"标准版","price":0.01,"days":30,"features":["live","print"]}),
            json!({"id":2,"plan_code":"pro","name":"专业版","label":"专业版","price":0.01,"days":90,"features":["live","print","remark","order"]}),
            json!({"id":3,"plan_code":"enterprise","name":"企业版","label":"企业版","price":0.01,"days":3650,"features":["live","order","remark","print","multi_device","decrypt"]}),
        ]
    })
}

pub fn component_for_path() -> &'static HashMap<String, &'static str> {
    static C: OnceLock<HashMap<String, &'static str>> = OnceLock::new();
    C.get_or_init(|| {
        let mut m = HashMap::new();
        m.insert("/login".into(), "Auth/Login");
        m.insert("/register".into(), "Auth/Register");
        m.insert("/dashboard".into(), "Deduction/Index");
        m.insert("/print-log".into(), "Deduction/PrintLog");
        m.insert("/notes".into(), "Deduction/Notes");
        m.insert("/template".into(), "Deduction/Template");
        m.insert("/config".into(), "Deduction/Config");
        m.insert("/blacklists".into(), "Deduction/Blacklists");
        m.insert("/buyers".into(), "Deduction/Buyers");
        m.insert("/shops".into(), "Deduction/Shops");
        m.insert("/settings/devices".into(), "Settings/Devices");
        m.insert("/settings/client".into(), "Settings/ClientSettings");
        m.insert("/settings/order-subscriptions".into(), "Settings/OrderSubscriptions");
        m.insert("/order/confirm".into(), "Settings/PaymentConfirm");
        m.insert("/payment/create".into(), "Settings/PaymentConfirm");
        m.insert("/payment/plans".into(), "Settings/OrderSubscriptions");
        m.insert("/payment/wechat".into(), "Settings/WechatNativePay");
        m.insert("/tag-templates/create".into(), "Deduction/EditTemplate");
        m
    })
}

// ---- 假数据模型 ----

pub fn fake_user(phone: &str) -> Value {
    json!({
        "id": 1,
        "name": "本地体验账号",
        "phone": phone,
        "email": format!("{phone}@local.mock"),
        "avatar": Value::Null,
    })
}

pub fn fake_tenant() -> Value {
    json!({
        "id": 1,
        "name": "本地专属租户",
        "code": "local-tenant",
        "plan_code": "enterprise",
    })
}

pub fn electron_device(status: &str, device_id: Option<&str>) -> Value {
    json!({
        "status": status,
        "device_id": device_id.unwrap_or("00000000-0000-4000-8000-000000000001"),
        "device_name": "Local Mock Device",
        "last_seen_at": now_iso(),
        "is_current": true,
    })
}

pub fn subscription_summary() -> Value {
    json!({
        "plan_code": "enterprise",
        "plan_name": "企业版（本地mock）",
        "name": "企业版（本地mock）",
        "is_active": true,
        "end_time": expire_iso(3650),
        "start_time": now_iso(),
        "device_limit": 99,
        "max_devices": 99,
        "features": ["live", "order", "remark", "print", "multi_device", "decrypt"],
    })
}

/// Python `_default_deduction_config()`：与前端默认一致的扣数规则配置
pub fn default_deduction_config() -> Value {
    json!({
        "templateId": Value::Null,
        "selectPrinter": "扣单宝-Mock-打印机",
        "antiDuplicateEnabled": true,
        "antiDuplicateSeconds": 5,
        "serialMode": "flow",
        "serialResetTime": 0,
        "printRule": "anyNumber",
        "deductionMode": "custom",
        "numberMode": "specified",
        "numberMin": 1,
        "numberMax": 999999,
        "numberSpecified": "",
        "numberIncludeDecimal": false,
        "customFormats": ["includeNumber"],
        "customKeywords": "",
        "customKeywordDeductMode": "numberWithKeyword",
        "customKeywordMatchMode": "exact",
        "gridCount": 12,
        "gridAutoAssign": false,
        "gridFormats": ["pureNumber"],
        "gridKeywords": "",
        "gridKeywordDeductMode": "numberWithKeyword",
        "gridKeywordMatchMode": "exact",
        "gridDedupMode": "buyerEachGridOnce",
        "sizeRules": [],
        "keyword1": "",
        "keyword2": "",
        "keyword3": "",
        "enableLimitOrder": true,
        "limitOrderCount": 100,
        "enableQuickPass": false,
        "enableLuckyBagQuickPass": false,
        "quickPassSeconds": 30,
        "luckyBagEnabled": false,
        "luckyBagEffectiveCount": 100,
        "luckyBagPrizeCount": 5,
        "luckyBagMaxWinsPerUser": Value::Null,
        "luckyBagMaxParticipationsPerUser": Value::Null,
    })
}

/// Python `_merged_deduction_config`：缺失/空字段回退默认
pub fn merged_deduction_config(cfg: &Value) -> Value {
    let mut d = default_deduction_config();
    if let Some(obj) = cfg.as_object() {
        if !obj.is_empty() {
            for (k, v) in obj {
                let fallback = d.get(k).cloned().unwrap_or(Value::Null);
                let val = if v.is_null() || v.as_str().map(|s| s.is_empty()).unwrap_or(false) {
                    fallback
                } else {
                    v.clone()
                };
                d.as_object_mut().unwrap().insert(k.clone(), val);
            }
        }
    }
    d
}

/// Python `_build_deduction_rules`：扁平配置 → 主进程 loadConfig 可匹配的 rules 数组
pub fn build_deduction_rules(config: &Value) -> Value {
    let pr = config
        .get("printRule")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("anyNumber");
    json!([{
        "id": 1,
        "rule_type": pr,
        "keywords": [
            as_s(config.get("keyword1").unwrap_or(&Value::Null)),
            as_s(config.get("keyword2").unwrap_or(&Value::Null)),
            as_s(config.get("keyword3").unwrap_or(&Value::Null)),
        ],
        "size_rules": config.get("sizeRules").cloned().unwrap_or_else(|| json!([])),
        "gridCount": as_i64(config.get("gridCount").unwrap_or(&Value::Null)).unwrap_or(12),
        "gridFormats": config.get("gridFormats").cloned().unwrap_or_else(|| json!(["pureNumber"])),
        "gridKeywords": as_s(config.get("gridKeywords").unwrap_or(&Value::Null)),
        "gridAutoAssign": as_bool(config.get("gridAutoAssign").unwrap_or(&Value::Null)).unwrap_or(false),
        "gridDedupMode": as_s_opt(config.get("gridDedupMode").unwrap_or(&Value::Null)).unwrap_or_else(|| "buyerEachGridOnce".into()),
        "numberMin": config.get("numberMin").cloned().unwrap_or(Value::Null),
        "numberMax": config.get("numberMax").cloned().unwrap_or(Value::Null),
        "numberSpecified": as_s(config.get("numberSpecified").unwrap_or(&Value::Null)),
        "numberIncludeDecimal": as_bool(config.get("numberIncludeDecimal").unwrap_or(&Value::Null)).unwrap_or(false),
        "customFormats": config.get("customFormats").cloned().unwrap_or_else(|| json!(["includeNumber"])),
        "customKeywords": as_s(config.get("customKeywords").unwrap_or(&Value::Null)),
        "enableLuckyBagQuickPass": as_bool(config.get("enableLuckyBagQuickPass").unwrap_or(&Value::Null)).unwrap_or(false),
        "luckyBagEnabled": as_bool(config.get("luckyBagEnabled").unwrap_or(&Value::Null)).unwrap_or(false),
        "luckyBagEffectiveCount": as_i64(config.get("luckyBagEffectiveCount").unwrap_or(&Value::Null)).unwrap_or(100),
        "luckyBagPrizeCount": as_i64(config.get("luckyBagPrizeCount").unwrap_or(&Value::Null)).unwrap_or(5),
    }])
}

pub fn as_s(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Null => String::new(),
        other => other.to_string(),
    }
}

pub fn as_s_opt(v: &Value) -> Option<String> {
    match v {
        Value::Null => None,
        Value::String(s) => Some(s.clone()),
        other => Some(other.to_string()),
    }
}

pub fn as_i64(v: &Value) -> Option<i64> {
    v.as_i64().or_else(|| v.as_str().and_then(|s| s.parse().ok()))
}

pub fn as_bool(v: &Value) -> Option<bool> {
    v.as_bool().or_else(|| match v.as_str() {
        Some("true") | Some("1") => Some(true),
        Some("false") | Some("0") => Some(false),
        _ => None,
    })
}

/// Python `_load_official_default_fields`：读取 default_custom_config.json（资源目录）
pub fn load_official_default_fields(assets_or_res_dir: &std::path::Path) -> Value {
    let p = assets_or_res_dir.join("default_custom_config.json");
    if p.is_file() {
        if let Ok(text) = std::fs::read_to_string(&p) {
            if let Ok(data) = serde_json::from_str::<Value>(&text) {
                if let Some(arr) = data.as_array() {
                    if !arr.is_empty() {
                        return data;
                    }
                }
            }
        }
    }
    // minimal fallback matching official schema
    json!([
        {"id":1,"aliasName":"店铺名称","showName":"店铺名称","testValue":"阳光小铺","value":"<%=data.mallName%>","width":120,"height":18,"top":1,"left":1,"fontSize":8,"fontFamily":"SimHei","fontWeight":"normal","isChecked":true,"showHeader":false},
        {"id":3,"aliasName":"序号","showName":"序号","testValue":"1","value":"<%=data.index%>","width":60,"height":18,"top":1,"left":120,"fontSize":12,"fontFamily":"SimHei","fontWeight":"normal","isChecked":true,"showHeader":false},
        {"id":4,"aliasName":"昵称","showName":"昵称","testValue":"聪明小狗","value":"<%=data.nickname%>","width":140,"height":18,"top":20,"left":1,"fontSize":13,"fontFamily":"SimHei","fontWeight":"bold","isChecked":true,"showHeader":true},
        {"id":5,"aliasName":"公屏信息","showName":"公屏信息","testValue":"我要1","value":"<%=data.content%>","width":140,"height":18,"top":40,"left":1,"fontSize":12,"fontFamily":"SimSun","fontWeight":"normal","isChecked":true,"showHeader":false},
    ])
}

/// Python `default_print_template`
pub fn default_print_template(state_res_dir: &std::path::Path, tid: i64) -> Value {
    let items = load_official_default_fields(state_res_dir);
    json!({
        "id": tid,
        "name": "默认模板 50x30",
        "width": 50,
        "height": 30,
        "horizontal": 0,
        "vertical": 0,
        "is_default": true,
        "default_printer": "",
        "custom_config": serde_json::to_string(&items).unwrap_or_else(|_| "[]".into()),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn build_rules_any_number_default() {
        let cfg = default_deduction_config();
        let rules = build_deduction_rules(&cfg);
        assert_eq!(rules[0]["rule_type"], "anyNumber");
        assert_eq!(rules[0]["gridCount"], 12);
    }

    #[test]
    fn merged_config_falls_back() {
        let cfg = json!({"printRule": "grid"});
        let merged = merged_deduction_config(&cfg);
        assert_eq!(merged["printRule"], "grid");
        assert_eq!(merged["gridCount"], 12); // 默认回退
        assert_eq!(merged["selectPrinter"], "扣单宝-Mock-打印机");
    }

    #[test]
    fn platform_name_known() {
        assert_eq!(platform_name("douyin"), "抖音");
        assert_eq!(platform_name("taobao"), "淘宝");
    }
}
