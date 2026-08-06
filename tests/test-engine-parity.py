"""扣数引擎差分对齐测试：同语料跑 Python 与 Rust 双后端，比对匹配结果。

背景：Rust (backend-rs) 重写扣数引擎后，必须以 Python 版为基准做逐项等价验证。
本测试通过 HTTP 契约面（POST /deduction-rule + POST /api/electron/danmaku/simulate）
对 11 类规则 × 语料库 求匹配结果，断言两后端输出完全一致。

运行：
  python tests/test-engine-parity.py <python_base> <rust_base>
  （两个后端需已启动；建议各用独立 KDB_DATA_DIR）
"""
import json
import sys
import urllib.request

CORPUS = [
    "1", "2", "3", "7", "12", "13", "99", "1234", "1.9", "12.5",
    "abc", "abc12", "A1", "abcd1", "abc1", "12号", "拍了", "来一个7号",
    "42¥", "L", "XL", "12L", "8 XL", "hello", "0", "10", "50",
]

RULES = [
    {"name": "anyNumber", "config": {"printRule": "anyNumber"}},
    {"name": "onlyPureNumber", "config": {"printRule": "onlyPureNumber"}},
    {"name": "only12", "config": {"printRule": "only12"}},
    {"name": "exclude12", "config": {"printRule": "exclude12"}},
    {"name": "letter3Digit1", "config": {"printRule": "letter3Digit1"}},
    {"name": "onlyKeyword", "config": {"printRule": "customCombined", "customFormats": ["onlyKeyword"], "customKeywords": "拍了"}},
    {"name": "numberIncludeKeyword", "config": {"printRule": "numberIncludeKeyword", "keyword3": "号"}},
    {"name": "grid", "config": {"printRule": "grid", "gridFormats": ["pureNumber"], "gridCount": 12, "gridAutoAssign": False}},
    {"name": "gridAuto", "config": {"printRule": "grid", "gridFormats": ["pureNumber"], "gridCount": 12, "gridAutoAssign": True}},
    {"name": "customSpecified", "config": {"printRule": "customCombined", "customFormats": ["includeNumber"], "numberMode": "specified", "numberSpecified": "1,2,3"}},
    {"name": "customRange", "config": {"printRule": "customCombined", "customFormats": ["includeNumber"], "numberMode": "range", "numberMin": 1, "numberMax": 10}},
    {"name": "customNumberWithKeyword", "config": {"printRule": "customCombined", "customFormats": ["numberWithKeyword"], "customKeywords": "号"}},
    {"name": "customFourDigit", "config": {"printRule": "customCombined", "customFormats": ["fourDigit"]}},
    {"name": "customSize", "config": {"printRule": "customCombined", "customFormats": ["numberWithSize"], "sizeRules": ["L", "XL"]}},
    # 注：numberWithSymbol 在 Python 版 deduction_engine.py 中会崩溃——
    # Python `re` 模块不支持 `\p{L}`（re.PatternError: bad escape \p）。
    # Rust 版用 regex crate 正确实现（含 \p{L}/\p{N}）。此为修复，不参与差分，故从 RULES 排除。
    {"name": "customExclude12", "config": {"printRule": "customCombined", "customFormats": ["exclude12"]}},
    {"name": "customPureNumberDecimal", "config": {"printRule": "customCombined", "customFormats": ["pureNumber"], "numberIncludeDecimal": True}},
]

SHOP_ID = "4242"


def req(base, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(
        base + path, data=data,
        headers={"Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest"},
        method=method,
    )
    try:
        resp = urllib.request.urlopen(r, timeout=10)
        return json.loads(resp.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode("utf-8") or "{}")


def run_rules(base):
    """对每个规则配置返回 {rule_name: {content: (matched, grid)}}"""
    out = {}
    for item in RULES:
        req(base, "POST", "/deduction-rule", {"shopId": int(SHOP_ID), **item["config"]})
        msgs = [{"nickname": f"u{i}", "content": c, "comment_id": f"c{i}"} for i, c in enumerate(CORPUS)]
        resp = req(base, "POST", "/api/electron/danmaku/simulate",
                   {"shop_id": int(SHOP_ID), "messages": msgs})
        results = {}
        for row in resp.get("displayItems", []):
            results[row["content"]] = (row.get("matched_content"), row.get("grid_no"))
        out[item["name"]] = results
    return out


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    py_base, rs_base = sys.argv[1], sys.argv[2]
    print(f"Python: {py_base}\nRust  : {rs_base}\n")
    py = run_rules(py_base)
    rs = run_rules(rs_base)

    total = diffs = 0
    for rule_name in py:
        py_map, rs_map = py[rule_name], rs[rule_name]
        for content in sorted(set(py_map) | set(rs_map)):
            total += 1
            if py_map.get(content) != rs_map.get(content):
                diffs += 1
                print(f"[DIFF] {rule_name:<22} content={content!r:<10} "
                      f"Python={py_map.get(content)} Rust={rs_map.get(content)}")

    print(f"\n=== 引擎差分: {total} 项比对, {diffs} 项差异 ===")
    return 1 if diffs else 0


if __name__ == "__main__":
    sys.exit(main())
