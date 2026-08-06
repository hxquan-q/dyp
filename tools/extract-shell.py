#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 server.py 精确抽取 Inertia shell 模板 → backend-rs/assets/shell.html。

保真手段：AST 解析 server.py，直接取 `ipc_mock` 与 `_danmaku_mock_script` 的
字符串字面量（不经过手工转录，杜绝 JS 内容抄写误差），再按 shell_html() 的
拼接顺序组装模板。占位符：
  @@DATA_PAGE_ATTR@@  → html.escape(compact_json, quote=True)（单引号属性定界）
  @@SCRIPT_DATA@@    → compact_json 且 </ 转义为 <\/
  @@CSRF@@           → 会话 csrf token（Python repr 语义 = 单引号包裹）
"""
import ast
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "legacy" / "backend-python" / "server.py"
OUT = Path(__file__).resolve().parent.parent / "backend-rs" / "assets" / "shell.html"


def extract_string_literals(tree: ast.Module, fn_name: str):
    """返回指定函数体内所有 ast.Constant(str) 字面量。"""
    out = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name == fn_name:
            for sub in ast.walk(node):
                if isinstance(sub, ast.Constant) and isinstance(sub.value, str):
                    out.append(sub.value)
    return out


def main() -> int:
    tree = ast.parse(SRC.read_text(encoding="utf-8"))
    ipc_blobs = extract_string_literals(tree, "shell_html")
    danmaku_blobs = extract_string_literals(tree, "_danmaku_mock_script")

    # shell_html 里的字符串字面量：取包含 "<script>" 的 ipc_mock 块（最大的一个）
    ipc_mock = None
    for s in ipc_blobs:
        if s.lstrip().startswith("<script>") and "openCloudPrintAuthorization" in s:
            ipc_mock = s
    danmaku_mock = None
    for s in danmaku_blobs:
        if s.lstrip().startswith("<script>") and "startDanmakuSession" in s:
            danmaku_mock = s

    if ipc_mock is None:
        print("FAIL: 未找到 ipc_mock 字符串字面量", file=sys.stderr)
        return 1
    if danmaku_mock is None:
        print("FAIL: 未找到 danmaku mock 字符串字面量", file=sys.stderr)
        return 1

    # shell_html() 的 f-string 拼接顺序（逐字复刻）：
    #   ...<div id="app" data-page='{data}'></div> + ipc_mock + '</scr'+'ipt>' + danmaku + '<script type="module">import(...)</script></body></html>'
    shell = (
        '<!DOCTYPE html><html lang="zh-CN"><head>'
        '<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>'
        '<meta name="robots" content="noindex,nofollow"/>'
        '<title>扣数宝</title>'
        '<link rel="stylesheet" href="/build/assets/app-CVK6h-fN.css"/>'
        '<script data-page="app" type="application/json">@@SCRIPT_DATA@@</script>'
        '<script>window.__KDB_DATA__ = @@SCRIPT_DATA@@;</script>'
        "<script>window._csrf = '@@CSRF@@';</script>"
        '</head><body>'
        '<div id="app-boot-loading"></div>'
        "<div id='app' data-page='@@DATA_PAGE_ATTR@@'></div>"
        + ipc_mock + "</script>"
        + danmaku_mock
        + '<script type="module">'
        'import("/build/assets/app-Buzwood0.js?v=" + Date.now());'
        '</script>'
        '</body></html>'
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(shell, encoding="utf-8")
    print(f"OK: shell.html 已生成 -> {OUT} ({len(shell)} chars, ipc={len(ipc_mock)}, danmaku={len(danmaku_mock)})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
