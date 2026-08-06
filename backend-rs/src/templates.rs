//! 打印模板域逻辑（对齐 server.py 的 ensure_templates 与 default_print_template）。

use crate::domain::{default_print_template, load_official_default_fields};
use serde_json::{Value, json};
use std::path::Path;

/// Python `ensure_templates`：保证模板列表存在，并迁移坏模板（string id / 缺布局键）
pub fn ensure_templates(res_dir: &Path, sess: &mut Value) -> Value {
    let has_templates = sess
        .get("templates")
        .and_then(|v| v.as_array())
        .map(|a| !a.is_empty())
        .unwrap_or(false);
    if !has_templates {
        if let Some(o) = sess.as_object_mut() {
            o.insert(
                "templates".into(),
                json!([default_print_template(res_dir, 1)]),
            );
            o.insert("template_seq".into(), json!(1));
        }
        return sess.get("templates").cloned().unwrap_or_else(|| json!([]));
    }

    // 迁移坏模板
    let templates = sess
        .get("templates")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
    let mut fixed: Vec<Value> = Vec::new();
    let mut changed = false;
    for tpl in templates {
        let bad = template_is_broken(&tpl);
        if bad {
            let tid = tpl.get("id").and_then(|v| v.as_i64()).unwrap_or(1);
            let mut nt = default_print_template(res_dir, tid);
            if let Some(obj) = nt.as_object_mut() {
                if let Some(name) = tpl
                    .get("name")
                    .and_then(|v| v.as_str())
                    .filter(|s| !s.is_empty())
                {
                    obj.insert("name".into(), json!(name));
                }
                if let Some(is_default) = tpl.get("is_default").and_then(|v| v.as_bool()) {
                    obj.insert("is_default".into(), json!(is_default));
                }
                if let Some(dp) = tpl.get("default_printer").and_then(|v| v.as_str()) {
                    obj.insert("default_printer".into(), json!(dp));
                }
            }
            fixed.push(nt);
            changed = true;
        } else {
            fixed.push(tpl);
        }
    }
    if changed {
        sess.as_object_mut()
            .map(|o| o.insert("templates".into(), json!(fixed)));
    }
    sess.get("templates").cloned().unwrap_or_else(|| json!([]))
}

fn template_is_broken(tpl: &Value) -> bool {
    let cc = tpl.get("custom_config").cloned().unwrap_or(Value::Null);
    let parsed: Value = match &cc {
        Value::String(s) => serde_json::from_str(s).unwrap_or(Value::Null),
        other => other.clone(),
    };
    let mut bad = false;
    if let Some(arr) = parsed.as_array() {
        if arr.is_empty() {
            bad = true;
        } else if let Some(sample) = arr.first() {
            if !sample.is_object() || sample.get("id").is_none() {
                bad = true;
            } else if sample.get("id").and_then(|v| v.as_str()).is_some() {
                bad = true; // 旧 mock 用 string id
            } else if sample.get("top").is_none() && sample.get("left").is_none() {
                bad = true;
            }
        }
    } else {
        bad = true;
    }
    bad
}

/// 供 handlers 读取 default_custom_config.json（EditTemplate 画布字段目录）
#[allow(dead_code)]
pub fn default_fields(res_dir: &Path) -> Value {
    load_official_default_fields(res_dir)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn broken_string_id_migrates() {
        let dir = std::env::temp_dir();
        let mut sess = json!({
            "templates": [{"id": 1, "name": "旧模板", "custom_config": "[{\"id\": \"nickname\", \"value\": \"x\"}]"}],
            "template_seq": 1,
        });
        let out = ensure_templates(&dir, &mut sess);
        let tpl = &out[0];
        // 迁移后 custom_config 是数值 id 的合法字段
        let cc: Value = serde_json::from_str(tpl["custom_config"].as_str().unwrap()).unwrap();
        assert_eq!(cc[0]["id"].as_i64(), Some(1));
        assert_eq!(tpl["name"], "旧模板");
    }

    #[test]
    fn valid_template_kept() {
        let dir = std::env::temp_dir();
        let valid = json!([{"id": 1, "value": "<%=data.nickname%>", "top": 1, "left": 1}]);
        let mut sess = json!({
            "templates": [{"id": 5, "name": "好模板", "custom_config": serde_json::to_string(&valid).unwrap()}],
            "template_seq": 1,
        });
        let out = ensure_templates(&dir, &mut sess);
        assert_eq!(out[0]["id"], 5);
        assert_eq!(out[0]["name"], "好模板");
    }
}
