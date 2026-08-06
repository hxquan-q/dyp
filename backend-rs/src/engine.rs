//! 扣数匹配引擎（对齐 deduction_engine.py + danmaku-dispatcher.reconstructed.js）。
//!
//! match_rule(content, rule) → Option<(matched_content, grid_no)>
//! 支持 11 种规则：anyNumber / onlyPureNumber / only12 / exclude12 / letter3Digit1 /
//! onlyKeyword / numberIncludeKeyword / grid / customCombined。

use crate::domain::as_s;
use crate::util::{escape_regex, split_keywords};
use regex::Regex;
use serde_json::Value;
use std::collections::HashMap;
use std::sync::OnceLock;

fn re_digit() -> &'static Regex {
    static R: OnceLock<Regex> = OnceLock::new();
    R.get_or_init(|| Regex::new(r"\d+").unwrap())
}

fn re_full_digit() -> &'static Regex {
    static R: OnceLock<Regex> = OnceLock::new();
    R.get_or_init(|| Regex::new(r"^\d+$").unwrap())
}

fn re_decimal() -> &'static Regex {
    static R: OnceLock<Regex> = OnceLock::new();
    R.get_or_init(|| Regex::new(r"\d+\.\d+").unwrap())
}

fn re_letter() -> &'static Regex {
    static R: OnceLock<Regex> = OnceLock::new();
    R.get_or_init(|| Regex::new(r"[A-Za-z]").unwrap())
}

fn re_alnum() -> &'static Regex {
    static R: OnceLock<Regex> = OnceLock::new();
    R.get_or_init(|| Regex::new(r"^[A-Za-z\d]+$").unwrap())
}

pub struct DeductionEngine {
    /// 自动入格分配表：数字串 -> 格子号
    auto_assign: HashMap<String, i64>,
}

fn num_pattern(include_decimal: bool) -> &'static str {
    if include_decimal {
        r"\d+(?:\.\d+)?"
    } else {
        r"\d+"
    }
}

impl DeductionEngine {
    pub fn new() -> Self {
        DeductionEngine {
            auto_assign: HashMap::new(),
        }
    }

    #[allow(dead_code)]
    pub fn reset_auto_assign(&mut self) {
        self.auto_assign.clear();
    }

    /// 单规则匹配（对齐 JS matchSingleRule）
    pub fn match_rule(&mut self, content: &str, rule: &Value) -> (Option<String>, Option<i64>) {
        let text = content.trim();
        if text.is_empty() {
            return (None, None);
        }
        let rule_type = rule.get("rule_type").and_then(|v| v.as_str()).unwrap_or("");

        match rule_type {
            "anyNumber" => {
                if re_digit().is_match(text) {
                    (Some(text.to_string()), None)
                } else {
                    (None, None)
                }
            }
            "onlyPureNumber" => {
                if re_full_digit().is_match(text) {
                    (Some(text.to_string()), None)
                } else {
                    (None, None)
                }
            }
            "only12" => {
                if text == "1" || text == "2" {
                    (Some(text.to_string()), None)
                } else {
                    (None, None)
                }
            }
            "exclude12" => {
                if re_full_digit().is_match(text) && text != "1" && text != "2" {
                    (Some(text.to_string()), None)
                } else {
                    (None, None)
                }
            }
            "letter3Digit1" => {
                let letters = re_letter().find_iter(text).count();
                let digits = re_digit().find_iter(text).count();
                let matched = text.chars().count() == 4
                    && re_alnum().is_match(text)
                    && letters == 3
                    && digits == 1;
                if matched {
                    (Some(text.to_string()), None)
                } else {
                    (None, None)
                }
            }
            "onlyKeyword" => {
                let keyword = rule
                    .get("keywords")
                    .and_then(|k| k.as_array())
                    .and_then(|arr| arr.first())
                    .map(as_s)
                    .filter(|s| !s.is_empty());
                match keyword {
                    Some(kw) if text == kw => (Some(text.to_string()), None),
                    _ => (None, None),
                }
            }
            "numberIncludeKeyword" => {
                let keyword = rule
                    .get("keywords")
                    .and_then(|k| k.as_array())
                    .and_then(|arr| arr.get(2))
                    .map(as_s)
                    .filter(|s| !s.is_empty());
                match keyword {
                    Some(kw) => {
                        let contains_kw = text.to_lowercase().contains(&kw.to_lowercase());
                        let contains_digit = re_digit().is_match(text);
                        if contains_kw && contains_digit {
                            (Some(text.to_string()), None)
                        } else {
                            (None, None)
                        }
                    }
                    None => (None, None),
                }
            }
            "grid" => self.match_grid_rule(rule, text),
            "customCombined" => self.match_custom_combined_rule(rule, text),
            _ => (None, None),
        }
    }

    // ---- 宫格 ----

    fn match_grid_rule(&mut self, rule: &Value, content: &str) -> (Option<String>, Option<i64>) {
        let formats = normalize_formats(
            rule.get("gridFormats").unwrap_or(&Value::Null),
            &["pureNumber".to_string()],
        );
        let grid_count = rule.get("gridCount").and_then(|v| v.as_i64()).unwrap_or(12);
        let grid_auto_assign = rule
            .get("gridAutoAssign")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        for fmt in formats {
            // 宫格强制不含小数（JS: force_no_decimal=true）
            let number = match self.match_format(content, &fmt, rule, true) {
                Some(n) => n,
                None => continue,
            };
            if !re_full_digit().is_match(&number) {
                continue;
            }
            if grid_auto_assign {
                match self.resolve_auto_assigned_grid_no(&number, grid_count) {
                    Some(assigned) => return (Some(number), Some(assigned)),
                    None => return (None, None),
                }
            }
            if let Ok(grid_value) = number.parse::<i64>()
                && (1..=grid_count).contains(&grid_value)
            {
                return (Some(grid_value.to_string()), Some(grid_value));
            }
        }
        (None, None)
    }

    fn resolve_auto_assigned_grid_no(
        &mut self,
        number_string: &str,
        grid_count: i64,
    ) -> Option<i64> {
        let max_grids = grid_count.clamp(1, 50);
        if let Some(existing) = self.auto_assign.get(number_string) {
            return Some(*existing);
        }
        if self.auto_assign.len() as i64 >= max_grids {
            return None;
        }
        let assigned = self.auto_assign.len() as i64 + 1;
        self.auto_assign.insert(number_string.to_string(), assigned);
        Some(assigned)
    }

    // ---- 自定义组合 ----

    fn match_custom_combined_rule(
        &mut self,
        rule: &Value,
        content: &str,
    ) -> (Option<String>, Option<i64>) {
        let formats = normalize_formats(
            rule.get("customFormats").unwrap_or(&Value::Null),
            &["includeNumber".to_string()],
        );
        for fmt in formats {
            let number = match self.match_format(content, &fmt, rule, false) {
                Some(n) => n,
                None => continue,
            };
            if fmt == "onlyKeyword" {
                return (Some(content.to_string()), None);
            }
            if self.number_passes_custom_condition(rule, &number) {
                return (Some(number), None);
            }
        }
        (None, None)
    }

    fn number_passes_custom_condition(&self, rule: &Value, number_string: &str) -> bool {
        if number_string.is_empty() {
            return false;
        }
        let value: f64 = number_string.parse().unwrap_or(f64::NAN);
        if rule.get("numberMode").and_then(|v| v.as_str()) == Some("range") {
            let min_ok = match rule.get("numberMin") {
                Some(m) if !m.is_null() => m.as_f64().map(|mn| value >= mn).unwrap_or(true),
                _ => true,
            };
            let max_ok = match rule.get("numberMax") {
                Some(m) if !m.is_null() => m.as_f64().map(|mx| value <= mx).unwrap_or(true),
                _ => true,
            };
            return min_ok && max_ok;
        }
        let specified = split_keywords(&as_s(rule.get("numberSpecified").unwrap_or(&Value::Null)));
        specified.is_empty() || specified.contains(&number_string.to_string())
    }

    // ---- 格式级匹配（对齐 JS matchFormatRule）----

    #[allow(clippy::only_used_in_recursion)]
    fn match_format(
        &self,
        content: &str,
        fmt: &str,
        rule: &Value,
        force_no_decimal: bool,
    ) -> Option<String> {
        let include_decimal = rule
            .get("numberIncludeDecimal")
            .and_then(|v| v.as_bool())
            .unwrap_or(false)
            && !force_no_decimal;
        let pattern = num_pattern(include_decimal);

        // 未开启小数时弹幕含小数直接不匹配
        if !include_decimal && re_decimal().is_match(content) {
            return None;
        }

        // 关键词来源：custom 用 customKeywords，grid 用 gridKeywords
        let keywords_raw = if rule.get("customKeywords").is_some() {
            as_s(rule.get("customKeywords").unwrap_or(&Value::Null))
        } else {
            as_s(rule.get("gridKeywords").unwrap_or(&Value::Null))
        };
        let keywords = split_keywords(&keywords_raw);

        match fmt {
            "onlyKeyword" => {
                if keywords.contains(&content.to_string()) {
                    Some(content.to_string())
                } else {
                    None
                }
            }
            "exclude12" => {
                if re_full_digit().is_match(content) && content != "1" && content != "2" {
                    Some(content.to_string())
                } else {
                    None
                }
            }
            "pureNumber" => {
                let re = Regex::new(&format!(r"^({pattern})$")).unwrap();
                re.captures(content).map(|c| c[1].to_string())
            }
            "fourDigit" => {
                let re = Regex::new(r"^(\d{4})$").unwrap();
                re.captures(content).map(|c| c[1].to_string())
            }
            "letter3Digit1" => {
                let letters = re_letter().find_iter(content).count();
                let digits = re_digit().find_iter(content).count();
                if content.chars().count() == 4
                    && re_alnum().is_match(content)
                    && letters == 3
                    && digits == 1
                {
                    re_digit().find(content).map(|m| m.as_str().to_string())
                } else {
                    None
                }
            }
            "numberWithSymbol" => {
                // Python: rf"({num_pattern})\s*[^\p{{L}}\p{{N}}\s]+" + re.fullmatch
                let re = Regex::new(&format!(r"^({pattern})\s*[^\p{{L}}\p{{N}}\s]+$")).unwrap();
                re.captures(content).map(|c| c[1].to_string())
            }
            "includeNumber" => {
                let re = Regex::new(&format!(r"({pattern})")).unwrap();
                re.find(content).map(|m| m.as_str().to_string())
            }
            "numberWithKeyword" => {
                for keyword in keywords {
                    let escaped = escape_regex(&keyword);
                    let re =
                        Regex::new(&format!(r"(?i)^({pattern}){escaped}({pattern})?$")).unwrap();
                    if let Some(caps) = re.captures(content) {
                        let mut out = caps
                            .get(1)
                            .map(|m| m.as_str().to_string())
                            .unwrap_or_default();
                        if let Some(g2) = caps.get(2) {
                            out.push_str(g2.as_str());
                        }
                        return Some(out);
                    }
                }
                None
            }
            "numberWithSize" => {
                let sizes = rule
                    .get("sizeRules")
                    .or_else(|| rule.get("size_rules"))
                    .and_then(|v| v.as_array())
                    .cloned()
                    .unwrap_or_default();
                if sizes.is_empty() {
                    return None;
                }
                let mut list: Vec<String> = sizes.iter().map(|s| escape_regex(&as_s(s))).collect();
                list.sort_by_key(|a| std::cmp::Reverse(a.len()));
                let pattern2 = list.join("|");
                let re = Regex::new(&format!(r"(?i)^({pattern})\s*({pattern2})$")).unwrap();
                re.captures(content).map(|c| c[1].to_string())
            }
            "numberIncludeKeyword" => {
                for keyword in keywords {
                    let re = Regex::new(&format!(r"({pattern})")).unwrap();
                    if let Some(m) = re.find(content)
                        && content.to_lowercase().contains(&keyword.to_lowercase())
                    {
                        return Some(m.as_str().to_string());
                    }
                }
                None
            }
            _ => None,
        }
    }
}

impl Default for DeductionEngine {
    fn default() -> Self {
        Self::new()
    }
}

fn normalize_formats(formats: &Value, fallback: &[String]) -> Vec<String> {
    if let Some(arr) = formats.as_array()
        && !arr.is_empty()
    {
        let mut seen = std::collections::HashSet::new();
        let mut out = Vec::new();
        for v in arr {
            let s = as_s(v);
            if seen.insert(s.clone()) {
                out.push(s);
            }
        }
        return out;
    }
    fallback.to_vec()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn rule(rule_type: &str) -> Value {
        json!({"rule_type": rule_type, "keywords": ["", "", ""], "gridFormats": ["pureNumber"], "gridCount": 12, "gridAutoAssign": false, "customFormats": ["includeNumber"], "customKeywords": "", "gridKeywords": "", "numberIncludeDecimal": false, "numberSpecified": "", "numberMin": Value::Null, "numberMax": Value::Null, "sizeRules": []})
    }

    #[test]
    fn any_number() {
        let mut e = DeductionEngine::new();
        assert_eq!(
            e.match_rule("来了12", &rule("anyNumber")),
            (Some("来了12".into()), None)
        );
        assert_eq!(e.match_rule("abc", &rule("anyNumber")), (None, None));
    }

    #[test]
    fn only_pure_number() {
        let mut e = DeductionEngine::new();
        assert_eq!(
            e.match_rule("12", &rule("onlyPureNumber")),
            (Some("12".into()), None)
        );
        assert_eq!(e.match_rule("12a", &rule("onlyPureNumber")), (None, None));
    }

    #[test]
    fn only12_and_exclude12() {
        let mut e = DeductionEngine::new();
        assert_eq!(e.match_rule("1", &rule("only12")), (Some("1".into()), None));
        assert_eq!(e.match_rule("3", &rule("only12")), (None, None));
        assert_eq!(
            e.match_rule("3", &rule("exclude12")),
            (Some("3".into()), None)
        );
        assert_eq!(e.match_rule("2", &rule("exclude12")), (None, None));
    }

    #[test]
    fn grid_basic() {
        let mut e = DeductionEngine::new();
        let r = rule("grid");
        assert_eq!(e.match_rule("7", &r), (Some("7".into()), Some(7)));
        assert_eq!(e.match_rule("13", &r), (None, None));
        assert_eq!(e.match_rule("12", &r), (Some("12".into()), Some(12)));
    }

    #[test]
    fn grid_auto_assign() {
        let mut e = DeductionEngine::new();
        let r = json!({"rule_type": "grid", "gridFormats": ["pureNumber"], "gridCount": 12, "gridAutoAssign": true, "numberIncludeDecimal": false});
        // 首次出现分配格子
        let (c, g) = e.match_rule("99", &r);
        assert_eq!((c.as_deref(), g), (Some("99"), Some(1)));
        let (c, g) = e.match_rule("98", &r);
        assert_eq!((c.as_deref(), g), (Some("98"), Some(2)));
        // 重复数字复用格子
        let (c, g) = e.match_rule("99", &r);
        assert_eq!((c.as_deref(), g), (Some("99"), Some(1)));
    }

    #[test]
    fn custom_combined_specified() {
        let mut e = DeductionEngine::new();
        let r = json!({"rule_type": "customCombined", "customFormats": ["includeNumber"], "numberSpecified": "1,2,3", "numberIncludeDecimal": false});
        assert_eq!(e.match_rule("2", &r), (Some("2".into()), None));
        assert_eq!(e.match_rule("5", &r), (None, None));
    }

    #[test]
    fn custom_combined_range() {
        let mut e = DeductionEngine::new();
        let r = json!({"rule_type": "customCombined", "customFormats": ["includeNumber"], "numberMode": "range", "numberMin": 10, "numberMax": 20, "numberIncludeDecimal": false});
        assert_eq!(e.match_rule("15", &r), (Some("15".into()), None));
        assert_eq!(e.match_rule("5", &r), (None, None));
    }

    #[test]
    fn number_with_keyword() {
        let mut e = DeductionEngine::new();
        let r = json!({"rule_type": "customCombined", "customFormats": ["numberWithKeyword"], "customKeywords": "号", "numberIncludeDecimal": false});
        assert_eq!(e.match_rule("12号", &r), (Some("12".into()), None));
        assert_eq!(e.match_rule("12", &r), (None, None));
    }

    #[test]
    fn four_digit_format() {
        let mut e = DeductionEngine::new();
        let r = json!({"rule_type": "customCombined", "customFormats": ["fourDigit"], "numberIncludeDecimal": false});
        assert_eq!(e.match_rule("1234", &r), (Some("1234".into()), None));
        assert_eq!(e.match_rule("12345", &r), (None, None));
    }

    #[test]
    fn letter3_digit1() {
        let mut e = DeductionEngine::new();
        let r = rule("letter3Digit1");
        assert_eq!(e.match_rule("abc1", &r), (Some("abc1".into()), None));
        assert_eq!(e.match_rule("abcd1", &r), (None, None));
    }
}
