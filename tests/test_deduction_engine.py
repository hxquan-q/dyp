# -*- coding: utf-8 -*-
"""
DeductionEngine 行为一致性测试
===============================
运行: python tests/test_deduction_engine.py

与 JS 版 tests/test-danmaku-dispatcher.js 的用例逐条对应，
验证 Python 引擎与主进程 DanmakuDispatcher 匹配逻辑一致。
覆盖: 11 种规则匹配 / 自定义范围校验 / 宫格 / 自动入格
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "legacy", "backend-python"))

from deduction_engine import DeductionEngine

_pass = 0
_fail = 0


def check(ok: bool, msg: str) -> None:
    global _pass, _fail
    if ok:
        _pass += 1
    else:
        _fail += 1
        print(f"FAIL: {msg}")


def expect_rule(engine, rule, content, expected, expected_grid=None):
    """断言 match_rule 结果。expected=None 表示不匹配。"""
    matched, grid_no = engine.match_rule(content, rule)
    if expected is None:
        check(matched is None, f'{rule.get("rule_type")} "{content}" 期望不匹配, 实际 {matched!r}')
        return
    check(matched == expected, f'{rule.get("rule_type")} "{content}" 期望 {expected!r}, 实际 {matched!r}')
    if expected_grid is not None:
        check(grid_no == expected_grid, f'{rule.get("rule_type")} "{content}" grid 期望 {expected_grid}, 实际 {grid_no!r}')


eng = DeductionEngine()

# ---- 规则匹配 ----
expect_rule(eng, {"rule_type": "anyNumber"}, "abc12", "abc12")
expect_rule(eng, {"rule_type": "anyNumber"}, "你好", None)
expect_rule(eng, {"rule_type": "anyNumber"}, "1.9", "1.9")
expect_rule(eng, {"rule_type": "onlyPureNumber"}, "12", "12")
expect_rule(eng, {"rule_type": "onlyPureNumber"}, "1.9", None)
expect_rule(eng, {"rule_type": "only12"}, "1", "1")
expect_rule(eng, {"rule_type": "only12"}, "3", None)
expect_rule(eng, {"rule_type": "exclude12"}, "5", "5")
expect_rule(eng, {"rule_type": "exclude12"}, "1", None)
expect_rule(eng, {"rule_type": "letter3Digit1"}, "ABC1", "ABC1")
expect_rule(eng, {"rule_type": "letter3Digit1"}, "ABCD1", None)
expect_rule(eng, {"rule_type": "onlyKeyword", "keywords": ["上"]}, "上", "上")
expect_rule(eng, {"rule_type": "numberIncludeKeyword", "keywords": ["", "", "号"]}, "6号", "6号")
expect_rule(eng, {"rule_type": "numberIncludeKeyword", "keywords": ["", "", "号"]}, "号", None)
expect_rule(eng, {"rule_type": "numberWithSize", "dt": "size"}, "42码", None)  # Python 无预编译 dt，走 numberWithSize 需 sizeRules

# ---- 宫格 ----
expect_rule(eng, {"rule_type": "grid", "gridCount": 12, "gridFormats": ["pureNumber"]}, "6", "6", 6)
expect_rule(eng, {"rule_type": "grid", "gridCount": 12, "gridFormats": ["pureNumber"]}, "13", None)
expect_rule(eng, {"rule_type": "grid", "gridCount": 12, "gridFormats": ["pureNumber"]}, "1.9", None)
expect_rule(
    eng,
    {"rule_type": "grid", "gridCount": 12, "gridFormats": ["numberWithKeyword"], "gridKeywords": "号"},
    "6号", "6", 6,
)
expect_rule(
    eng,
    {"rule_type": "grid", "gridCount": 12, "gridFormats": ["numberWithKeyword"], "gridKeywords": "号"},
    "6", None,
)

# ---- 自定义组合 ----
expect_rule(eng, {"rule_type": "customCombined", "customFormats": ["includeNumber"]}, "6号", "6")
expect_rule(eng, {"rule_type": "customCombined", "customFormats": ["includeNumber"]}, "abc", None)
expect_rule(
    eng,
    {"rule_type": "customCombined", "customFormats": ["includeNumber"], "numberIncludeDecimal": True},
    "1.9", "1.9",
)
expect_rule(
    eng,
    {"rule_type": "customCombined", "customFormats": ["includeNumber"], "numberIncludeDecimal": False},
    "1.9", None,
)

# ---- 自定义 range 范围校验 ----
expect_rule(
    eng,
    {"rule_type": "customCombined", "customFormats": ["pureNumber"], "numberMode": "range", "numberMin": 1, "numberMax": 100},
    "50", "50",
)
expect_rule(
    eng,
    {"rule_type": "customCombined", "customFormats": ["pureNumber"], "numberMode": "range", "numberMin": 1, "numberMax": 100},
    "200", None,
)
expect_rule(
    eng,
    {"rule_type": "customCombined", "customFormats": ["pureNumber"], "numberMode": "specified", "numberSpecified": "5,8"},
    "8", "8",
)
expect_rule(
    eng,
    {"rule_type": "customCombined", "customFormats": ["pureNumber"], "numberMode": "specified", "numberSpecified": "5,8"},
    "7", None,
)

# ---- 自动入格 ----
eng2 = DeductionEngine()
expect_rule(
    eng2,
    {"rule_type": "grid", "gridCount": 12, "gridFormats": ["numberWithKeyword"], "gridKeywords": "号", "gridAutoAssign": True},
    "3号", "3", 1,
)
expect_rule(
    eng2,
    {"rule_type": "grid", "gridCount": 12, "gridFormats": ["numberWithKeyword"], "gridKeywords": "号", "gridAutoAssign": True},
    "9号", "9", 2,
)
check(eng2._auto_assign_map == {"3": 1, "9": 2}, f"自动入格分配表: 期望 {{'3':1,'9':2}}, 实际 {eng2._auto_assign_map}")

# ---- 重置自动入格 ----
eng2.reset_auto_assign()
check(eng2._auto_assign_map == {}, "reset_auto_assign: 应清空分配表")

# ---- 工具 ----
check(DeductionEngine.split_keywords("号，排，1") == ["号", "排", "1"], "split_keywords 中文逗号")
check(DeductionEngine._normalize_formats(["a", "b", "a"], ["c"]) == ["a", "b"], "_normalize_formats 去重保序")

print(f"\n结果: {_pass} 通过, {_fail} 失败")
sys.exit(1 if _fail > 0 else 0)
