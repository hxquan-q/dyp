#[test]
fn debug_simulate_path() {
    use crate::domain::{default_deduction_config, build_deduction_rules, merged_deduction_config};
    use crate::engine::DeductionEngine;
    use serde_json::Value;
    let cfg = merged_deduction_config(&Value::Null);
    let rules = build_deduction_rules(&cfg);
    println!("rules = {rules}");
    let mut e = DeductionEngine::new();
    let r = &rules[0];
    let (mc, gn) = e.match_rule("12", r);
    println!("match(12) = ({mc:?}, {gn:?})");
}
