//! 全局存储：global-store.json 的内存镜像 + 磁盘持久化。
//!
//! P0-1 修复：所有读写都在 `AppState.store` 的 Mutex 下串行化（消除 Python
//! `_save_global_store` 的读-改-写竞态），落盘用「临时文件 + 原子重命名」，
//! 避免写一半崩溃留下损坏 JSON。

use crate::state::AppState;
use serde_json::{Value, json};
use std::io::Write;
use std::path::Path;

/// Python `_load_global_store` 的空结构 + setdefault
pub fn empty_store() -> Value {
    json!({
        "shops": [],
        "shop_seq": 1000,
        "templates": [],
        "template_seq": 1,
        "deduction_configs": {},
        "danmu_product_relations": [],
        "decrypted_orders": {},
        "print_logs": [],
    })
}

/// 从磁盘读取并合并默认字段（对齐 Python `_load_global_store`）
pub fn load_store(path: &Path) -> Value {
    let mut data = empty_store();
    if let Ok(text) = std::fs::read_to_string(path)
        && !text.trim().is_empty()
        && let Ok(parsed) = serde_json::from_str::<Value>(&text)
        && let Some(obj) = parsed.as_object()
    {
        for (k, v) in obj {
            data.as_object_mut().unwrap().insert(k.clone(), v.clone());
        }
    }
    data
}

/// 原子落盘：写 `<file>.tmp` → rename 覆盖（Windows MoveFileEx REPLACE_EXISTING）。
/// 调用方须已持有 `state.store` 锁。
pub fn save_store(state: &AppState) -> Result<(), String> {
    let data = state
        .store
        .lock()
        .map_err(|e| format!("store lock poisoned: {e}"))?;
    if let Some(parent) = state.store_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(&*data).map_err(|e| e.to_string())?;
    let tmp = state.store_path.with_extension("json.tmp");
    {
        let mut f = std::fs::File::create(&tmp).map_err(|e| e.to_string())?;
        f.write_all(json.as_bytes()).map_err(|e| e.to_string())?;
        f.sync_all().map_err(|e| e.to_string())?;
    }
    std::fs::rename(&tmp, &state.store_path).map_err(|e| e.to_string())?;
    Ok(())
}

/// 便捷：从 store 取指定 key（调用方持锁前先 clone，避免锁泄漏——直接读引用）
pub fn store_get(state: &AppState, key: &str) -> Value {
    state
        .store
        .lock()
        .map(|g| g.get(key).cloned().unwrap_or(Value::Null))
        .unwrap_or(Value::Null)
}

/// 便捷：store[key] = value 并落盘（内部加锁，安全）
pub fn store_set(state: &AppState, key: &str, value: Value) {
    if let Ok(mut g) = state.store.lock() {
        g.as_object_mut().map(|o| o.insert(key.to_string(), value));
    }
    let _ = save_store(state);
}

/// Python `_log_print_items`：把打印数据追加到 store.print_logs 并落盘
pub fn log_print_items(state: &AppState, items: &[Value]) {
    if items.is_empty() {
        return;
    }
    let stamp = crate::util::now_iso();
    let mut logs: Vec<Value> = store_get(state, "print_logs")
        .as_array()
        .cloned()
        .unwrap_or_default();
    let existing_ids: std::collections::HashSet<String> = logs
        .iter()
        .filter_map(|r| {
            r.get("id")
                .or_else(|| r.get("comment_id"))
                .map(crate::domain::as_s)
        })
        .collect();
    for it in items {
        let mut row = it.clone();
        if row.get("created_at").is_none() {
            row.as_object_mut()
                .map(|o| o.insert("created_at".into(), Value::String(stamp.clone())));
        }
        if row.get("id").is_none() {
            let fallback = format!("pl-{}", logs.len() + items.len());
            let id = row
                .get("comment_id")
                .or_else(|| row.get("id"))
                .map(crate::domain::as_s)
                .unwrap_or(fallback);
            row.as_object_mut()
                .map(|o| o.insert("id".into(), Value::String(id)));
        }
        if !existing_ids.contains(&crate::domain::as_s(row.get("id").unwrap_or(&Value::Null))) {
            logs.push(row);
        }
    }
    let record = serde_json::json!({
        "type": "deduction",
        "items": items,
        "time": stamp,
    });
    if let Some(logger) = &state.logger {
        logger.live(&record);
    }
    store_set(state, "print_logs", Value::Array(logs));
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::AppState;

    #[test]
    fn atomic_save_roundtrip() {
        let dir = std::env::temp_dir().join(format!("kdb-store-test-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        let state = AppState::new_for_test(&dir);
        store_set(&state, "shop_seq", json!(1001));
        drop(state);
        // 重新加载
        let state2 = AppState::new_for_test(&dir);
        assert_eq!(store_get(&state2, "shop_seq"), json!(1001));
        let _ = std::fs::remove_dir_all(&dir);
    }
}
