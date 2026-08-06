#!/usr/bin/env python3
"""扣单宝逆向还原完整性一键验证
================================
运行本脚本对还原工程做全量核查并输出 PASS/FAIL 报告：
  1. 原始文件覆盖（逐字节一致 / 重建存在）
  2. 主进程结构 marker 与官方 100% 一致
  3. 全部测试套件
用法: python tools/verify-reconstruction.py
"""
import hashlib
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # print/
ORIG = "C:/Users/xquan/Desktop/扣数宝/portable/koudanbao-desktop/resources/app.asar.extracted"

PASS = 0
FAIL = 0
FAILURES = []


def check(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
    else:
        FAIL += 1
        FAILURES.append(f"{name}: {detail}")


def same(p1, p2):
    try:
        return open(p1, "rb").read() == open(p2, "rb").read()
    except Exception:
        return False


def main():
    print("═" * 62)
    print("  扣单宝 v1.1.2 逆向还原完整性验证")
    print("═" * 62)

    # ── 1. 原始文件覆盖 ──
    print("\n[1] 原始文件覆盖")
    # preload
    for f in ["index.js", "electron-print.js", "xhs-live-capture.js", "xhs-order-sync-capture.js"]:
        check(f"preload/{f} 逐字节一致", same(f"{ROOT}/electron/preload/{f}", f"{ORIG}/dist/preload/{f}"))
    # platform-tabs
    for f in ["index.html", "style.css", "tabs.js"]:
        check(f"platform-tabs/{f} 逐字节一致", same(f"{ROOT}/electron/platform-tabs/{f}", f"{ORIG}/platform-tabs/{f}"))
    # resources
    for f in ["app-icon.png", "electron-print.html", "tray-icon.png", "tray-icon-Template.png", "tray-icon-Template@2x.png"]:
        check(f"resources/{f} 逐字节一致", same(f"{ROOT}/electron/resources/{f}", f"{ORIG}/resources/{f}"))
    # main process reconstruction
    check("主进程重建存在", os.path.exists(f"{ROOT}/legacy/main-process-reverse/index.js"))
    # 17 pages
    pages = ["Auth/Login", "Auth/Register", "Deduction/Index", "Deduction/Config", "Deduction/Shops",
             "Deduction/Template", "Deduction/EditTemplate", "Deduction/PrintLog", "Deduction/Notes",
             "Deduction/Blacklists", "Deduction/Buyers", "Deduction/OrderSyncProgressBoard",
             "Settings/Devices", "Settings/ClientSettings", "Settings/OrderSubscriptions",
             "Settings/PaymentConfirm", "Settings/WechatNativePay"]
    for p in pages:
        check(f"页面 {p}.tsx", os.path.exists(f"{ROOT}/frontend-src/src/Pages/{p}.tsx"))
    check("后端 server.py", os.path.exists(f"{ROOT}/legacy/backend-python/server.py"))
    check("后端 deduction_engine.py", os.path.exists(f"{ROOT}/legacy/backend-python/deduction_engine.py"))
    check("菜鸟打印 mock", os.path.exists(f"{ROOT}/legacy/backend-python/mock_cainiao_ws.py"))

    # ── 2. 主进程结构 marker 一致 ──
    print("\n[2] 主进程结构 marker 与官方一致")
    orig_main = open(f"{ORIG}/dist/main/index.js", encoding="utf-8", errors="replace").read()
    recon_main = open(f"{ROOT}/legacy/main-process-reverse/index.js", encoding="utf-8", errors="replace").read()
    for name, pat in [
        ("IPC channel", r'ipcMain\.(?:handle|on)\("([^"]+)"'),
        ("平台代码", r'(?:douyin|douyin_talent|douyin_talent_ecosystem|taobao|xiaohongshu|channels|wxstore|wechat|wechat_ecosystem|jinritemai)'),
        ("弹幕规则类型", r'(?:anyNumber|onlyPureNumber|only12|exclude12|letter3Digit1|numberWithSize|numberWithKeyword|onlyKeyword|numberIncludeKeyword|customCombined)'),
        ("调度器函数", r'(?:flushMatchedBuffer|matchSingleRule|matchGridRule|preMatchRules|gridAutoAssign|gridDedupMode|recentMatchedSignatures)'),
    ]:
        o = set(re.findall(pat, orig_main))
        r = set(re.findall(pat, recon_main))
        missing = o - r
        check(f"{name}: 原始{len(o)} 重建{len(r)} 重叠{len(o & r)}", not missing and len(o) == len(r),
              f"缺失={sorted(missing)}")

    # ── 3. 全部测试套件 ──
    print("\n[3] 测试套件")
    tests = [
        ("弹幕调度器(JS)", ["node", "tests/test-danmaku-dispatcher.js"], "0 失败"),
        ("扣数引擎(Py)", ["python", "tests/test_deduction_engine.py"], "0 失败"),
        ("后端协议(Py)", ["python", "tests/test_backend_protocol.py", "http://127.0.0.1:8787"], "0 失败"),
        ("运行时辅助(JS)", ["node", "tests/runtime/out.js"], "0 fail"),
        ("真实平台集成(JS)", ["node", "tests/test_platform_integration.js"], "0 失败"),
    ]
    # 先构建运行时测试
    subprocess.run(["node", "tests/runtime/build-test.mjs"], cwd=ROOT, capture_output=True)
    for name, cmd, okmark in tests:
        r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
        out = (r.stdout + r.stderr)
        check(f"{name}: {okmark} 通过", okmark in out, out.strip()[-120:])

    # ── 4. 部署确认 ──
    print("\n[4] 部署确认")
    b1 = os.path.join(ROOT, "backend", "assets", "app-Buzwood0.js")
    b2 = os.path.join(ROOT, "frontend-src", "dist", "assets", "app-Buzwood0.js")
    check("部署 = 重建构建（哈希一致）", os.path.exists(b1) and os.path.exists(b2) and
          hashlib.md5(open(b1, "rb").read()).hexdigest() == hashlib.md5(open(b2, "rb").read()).hexdigest())
    try:
        import urllib.request
        code = urllib.request.urlopen("http://127.0.0.1:8787/__mock/health", timeout=5).status
        check("主服务运行", code == 200)
    except Exception:
        check("主服务运行", False, "无法连接")

    print(f"\n{'═' * 62}")
    print(f"  结果: {PASS} 通过, {FAIL} 失败")
    if FAILURES:
        print("  失败明细:")
        for f in FAILURES:
            print(f"    ✗ {f}")
    print("═" * 62)
    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
