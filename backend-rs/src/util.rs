//! 通用工具：时间格式（对齐 Python datetime.isoformat）、随机 token、
//! 请求体/表单解析、HTML 转义、percent-decode、cookie 解析。

use chrono::{Duration, FixedOffset, Utc};
use serde_json::{json, Value};

/// UTC+8（对齐 Python `TZ = timezone(timedelta(hours=8))`）
pub fn tz() -> FixedOffset {
    FixedOffset::east_opt(8 * 3600).expect("invalid fixed offset")
}

fn format_iso(dt: chrono::DateTime<FixedOffset>) -> String {
    let micros = dt.timestamp_subsec_micros();
    let base = dt.format("%Y-%m-%dT%H:%M:%S").to_string();
    let off = dt.format("%:z").to_string();
    if micros == 0 {
        format!("{base}{off}")
    } else {
        format!("{base}.{micros:06}{off}")
    }
}

/// Python `datetime.now(TZ).isoformat()` 等价
pub fn now_iso() -> String {
    format_iso(Utc::now().with_timezone(&tz()))
}

/// Python `(datetime.now(TZ) + timedelta(days=days)).isoformat()` 等价
pub fn expire_iso(days: i64) -> String {
    format_iso(Utc::now().with_timezone(&tz()) + Duration::days(days))
}

/// 时间戳（毫秒），对齐 `int(time.time() * 1000)`
pub fn now_ms() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

// ---- 随机 ----

/// 伪随机字节（用 uuid v4 的随机位生成，避免依赖 rand 特性变动）
fn random_bytes(n: usize) -> Vec<u8> {
    let mut out = Vec::with_capacity(n);
    while out.len() < n {
        out.extend_from_slice(uuid::Uuid::new_v4().as_bytes());
    }
    out.truncate(n);
    out
}

fn base64url_encode(data: &[u8]) -> String {
    const T: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let mut out = String::with_capacity(data.len() * 4 / 3 + 2);
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = *chunk.get(1).unwrap_or(&0) as u32;
        let b2 = *chunk.get(2).unwrap_or(&0) as u32;
        let n = (b0 << 16) | (b1 << 8) | b2;
        out.push(T[(n >> 18) as usize & 63] as char);
        out.push(T[(n >> 12) as usize & 63] as char);
        if chunk.len() > 1 {
            out.push(T[(n >> 6) as usize & 63] as char);
        }
        if chunk.len() > 2 {
            out.push(T[n as usize & 63] as char);
        }
    }
    out
}

/// Python `secrets.token_urlsafe(nbytes)` 等价（base64url 无填充）
pub fn token_urlsafe(nbytes: usize) -> String {
    base64url_encode(&random_bytes(nbytes))
}

/// Python `secrets.token_hex(n)` 等价
pub fn token_hex(nbytes: usize) -> String {
    random_bytes(nbytes).iter().map(|b| format!("{b:02x}")).collect()
}

// ---- 字符串 ----

/// Python `_RE_SPECIAL` 正则转义：`[.*+?^${}()|[\]\\]`
pub fn escape_regex(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 8);
    for ch in s.chars() {
        if matches!(ch, '.' | '*' | '+' | '?' | '^' | '$' | '{' | '}' | '(' | ')' | '|' | '[' | ']' | '\\') {
            out.push('\\');
        }
        out.push(ch);
    }
    out
}

/// Python `split_keywords`：中英文逗号拆分、去空
pub fn split_keywords(raw: &str) -> Vec<String> {
    raw.replace('，', ",")
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

/// Python `html.escape(s, quote=True)` 等价
pub fn html_escape(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 8);
    for ch in s.chars() {
        match ch {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#x27;"),
            _ => out.push(ch),
        }
    }
    out
}

/// Python `json.dumps(obj, ensure_ascii=False, separators=(",", ":"))` 等价（紧凑、UTF-8 直出）
pub fn compact_json(v: &Value) -> String {
    serde_json::to_string(v).unwrap_or_else(|_| "{}".to_string())
}

/// script_data：compact_json 且 `</` 转义为 `<\/`
pub fn script_data(v: &Value) -> String {
    compact_json(v).replace("</", "<\\/")
}

fn hex_val(b: u8) -> Option<u8> {
    match b {
        b'0'..=b'9' => Some(b - b'0'),
        b'a'..=b'f' => Some(b - b'a' + 10),
        b'A'..=b'F' => Some(b - b'A' + 10),
        _ => None,
    }
}

/// Python `urllib.parse.unquote` 的实用子集（%XX 解码，+ 保留为 +）
pub fn percent_decode(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let (Some(h), Some(l)) = (hex_val(bytes[i + 1]), hex_val(bytes[i + 2])) {
                out.push(h * 16 + l);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).to_string()
}

/// `parse_qs` 实用子集：'a=1&a=2&b=x+y' → {a:[1,2], b:["x y"]}
pub fn parse_qs(query: &str) -> std::collections::HashMap<String, Vec<String>> {
    let mut out: std::collections::HashMap<String, Vec<String>> = std::collections::HashMap::new();
    if query.is_empty() {
        return out;
    }
    for pair in query.split('&') {
        if pair.is_empty() {
            continue;
        }
        let (k, v) = match pair.split_once('=') {
            Some((k, v)) => (k, v),
            None => (pair, ""),
        };
        // parse_qs 把 '+' 解码为空格（percent_decode 不做，需在此处理）
        let v = percent_decode(&v.replace('+', " "));
        let k = percent_decode(&k);
        out.entry(k).or_default().push(v);
    }
    out
}

// ---- 请求体解析（对齐 parse_body_any / parse_form）----

/// Python `parse_body_any`：JSON 优先，否则表单
pub fn parse_body_any(body: &[u8], content_type: &str) -> Value {
    if body.is_empty() {
        return json!({});
    }
    let ct = content_type.to_lowercase();
    let looks_json = ct.contains("application/json")
        || body.first() == Some(&b'{')
        || body.first() == Some(&b'[');
    if looks_json {
        if let Ok(v) = serde_json::from_slice::<Value>(body) {
            return v;
        }
    }
    parse_form(body, content_type)
}

/// Python `parse_form`：JSON dict → str 化；urlencoded；multipart 简易
pub fn parse_form(body: &[u8], content_type: &str) -> Value {
    if body.is_empty() {
        return json!({});
    }
    let ct = content_type.to_lowercase();
    if ct.contains("application/json") {
        if let Ok(v) = serde_json::from_slice::<Value>(body) {
            if let Value::Object(map) = v {
                let mut out = serde_json::Map::new();
                for (k, val) in map {
                    let s = match val {
                        Value::Null => String::new(),
                        Value::Object(_) | Value::Array(_) => {
                            serde_json::to_string(&val).unwrap_or_default()
                        }
                        other => other.to_string(),
                    };
                    out.insert(k, Value::String(s));
                }
                return Value::Object(out);
            }
        }
        return json!({});
    }
    let text = String::from_utf8_lossy(body).to_string();
    if ct.contains("multipart/form-data") {
        let mut out = serde_json::Map::new();
        let re = regex::Regex::new(r#"name="([^"]+)"\r?\n\r?\n([^\r\n-]*)"#).unwrap();
        for cap in re.captures_iter(&text) {
            out.insert(cap[1].to_string(), Value::String(cap[2].to_string()));
        }
        return Value::Object(out);
    }
    let mut out = serde_json::Map::new();
    for pair in text.split('&') {
        if pair.is_empty() {
            continue;
        }
        let (k, v) = match pair.split_once('=') {
            Some((k, v)) => (k, v),
            None => (pair, ""),
        };
        out.insert(
            percent_decode(&k.replace('+', " ")),
            Value::String(percent_decode(&v.replace('+', " "))),
        );
    }
    Value::Object(out)
}

// ---- Cookie ----

/// 解析请求 Cookie 头 → {name: value}
pub fn parse_cookie_header(header: Option<&str>) -> std::collections::HashMap<String, String> {
    let mut out = std::collections::HashMap::new();
    if let Some(h) = header {
        for part in h.split(';') {
            let part = part.trim();
            if let Some((k, v)) = part.split_once('=') {
                out.insert(k.trim().to_string(), v.trim().to_string());
            }
        }
    }
    out
}

/// Python `_session_cookies`：会话 + XSRF
pub fn session_cookies(sid: &str, csrf: &str) -> Vec<String> {
    vec![
        format!("kdb_session={sid}; Path=/; HttpOnly; SameSite=Lax"),
        format!("XSRF-TOKEN={csrf}; Path=/; SameSite=Lax"),
    ]
}

// ---- JSON 取值辅助（对齐 _dig）----

/// Python `is_inertia(headers)`：X-Inertia: true
pub fn is_inertia_header(headers: &axum::http::HeaderMap) -> bool {
    headers
        .get("X-Inertia")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.eq_ignore_ascii_case("true"))
        .unwrap_or(false)
}

#[allow(dead_code)]
pub fn dig<'a>(obj: &'a Value, keys: &[&str]) -> Option<&'a Value> {
    let mut cur = obj;
    for k in keys {
        cur = cur.get(*k)?;
    }
    Some(cur)
}

#[allow(dead_code)]
pub fn as_str_any(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Null => String::new(),
        other => other.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn token_urlsafe_charset() {
        let t = token_urlsafe(32);
        assert_eq!(t.len(), 43);
        assert!(t.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_'));
    }

    #[test]
    fn split_keywords_chinese_comma() {
        assert_eq!(split_keywords("a，b, c"), vec!["a", "b", "c"]);
        assert_eq!(split_keywords(""), Vec::<String>::new());
    }

    #[test]
    fn html_escape_quotes() {
        assert_eq!(html_escape("<a href='x'>&"), "&lt;a href=&#x27;x&#x27;&gt;&amp;");
    }

    #[test]
    fn percent_decode_basic() {
        assert_eq!(percent_decode("a%20b"), "a b");
        assert_eq!(percent_decode("%E6%89%A3"), "扣");
    }

    #[test]
    fn now_iso_format() {
        let s = now_iso();
        assert!(s.ends_with("+08:00"), "got {s}");
        assert!(s.starts_with("20"), "got {s}");
    }
}
