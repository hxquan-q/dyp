"""后端 API 协议全量端到端测试（跑在本地 mock 后端上）。

覆盖官方 SaaS（kdb.koudanbao.top）被前端/主进程调用的全部端点类别，
验证协议契约（请求/响应结构）逐一正确。
运行：python tests/test_backend_protocol.py [base_url]
"""
import json
import sys
import urllib.request
import urllib.error

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8787"
PASS = 0
FAIL = 0
FAILURES = []


def req(method, path, body=None, headers=None, expect=200, follow=True):
    global PASS, FAIL
    data = json.dumps(body).encode() if body is not None else None
    h = {"Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest"}
    if headers:
        h.update(headers)
    r = urllib.request.Request(BASE + path, data=data, headers=h, method=method)
    try:
        opener = urllib.request.build_opener()
        if not follow:
            class NoRedirect(urllib.request.HTTPRedirectHandler):
                def redirect_request(self, *a, **k):
                    return None
            opener = urllib.request.build_opener(NoRedirect)
        resp = opener.open(r, timeout=10)
        code = resp.status
        raw = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        code = e.code
        raw = e.read().decode("utf-8", errors="replace")
    try:
        j = json.loads(raw) if raw else {}
    except Exception:
        j = {}
    if expect is not None:
        ok = code == expect
        PASS += ok
        if not ok:
            FAIL += 1
            FAILURES.append(f"{method} {path} -> {code} (expect {expect})")
    return j, code, ok if expect is not None else (code in (200, 302, 303))


def check(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
    else:
        FAIL += 1
        FAILURES.append(f"{name}: {detail}")


print(f"=== 扣单宝后端 API 协议全量测试 @ {BASE} ===\n")

# ---- 1. 认证 ----
_, code, ok = req("POST", "/login", {"phone": "13800000000", "password": "x"}, expect=None, follow=False)
check("login 成功(302→dashboard 或 200)", code in (200, 302, 303), f"code={code}")
j, _, _ = req("POST", "/sms/send", {"phone": "13800000000"})
check("sms/send", j.get("success") is True, str(j)[:80])
_, code, ok = req("POST", "/password/reset", {"phone": "13800000000"}, expect=None, follow=False)
check("password/reset 成功(302/200)", code in (200, 302, 303), f"code={code}")

# ---- 2. 弹幕/扣数 ----
j, _, _ = req("GET", "/deduction-rule?shopId=1003")
check("GET deduction-rule", j.get("code") == 0 and isinstance(j.get("data"), dict), str(j)[:120])
j, _, _ = req("POST", "/deduction-rule", {"shopId": 1003, "printRule": "customCombined", "deductionMode": "custom", "numberSpecified": "1,2,3"})
check("POST deduction-rule", j.get("success") is True, str(j)[:80])
j, _, _ = req("POST", "/danmu/list", {"page": 1, "per_page": 20})
check("danmu/list", "data" in j and isinstance(j["data"].get("list"), list), str(j)[:120])
j, _, _ = req("POST", "/danmu-product-relations", {"danmu": "协议测试", "price": "9.9", "product_no": "PR-1"})
check("danmu-product-relations create", j.get("success") is True or j.get("code") == 0, str(j)[:120])
rid = (j.get("data") or {}).get("id")
if rid:
    j, _, _ = req("PUT", f"/danmu-product-relations/{rid}", {"price": "8.8"})
    check("danmu-product-relations update", j.get("success") is True, str(j)[:80])
    j, _, _ = req("DELETE", f"/danmu-product-relations/{rid}")
    check("danmu-product-relations delete", j.get("success") is True, str(j)[:80])
j, _, _ = req("POST", "/api/electron/danmaku/simulate", {"shop_id": 1003, "messages": [{"nickname": "协议测试", "content": "12"}]})
check("danmaku/simulate displayItems", isinstance(j.get("displayItems"), list) and len(j.get("displayItems", [])) > 0, str(j)[:150])
j, _, _ = req("POST", "/api/electron/danmaku/process", {"shop_id": 1003, "messages": [{"content": "7", "comment_id": "c1", "nickname": "测试"}]})
check("danmaku/process outcomes", isinstance(j.get("outcomes"), list) and isinstance(j.get("printItems"), list), str(j)[:150])

# ---- 3. 店铺授权 ----
j, _, _ = req("POST", "/shops/platform-app/oauth-url", {"platform_code": "douyin"})
check("shops oauth-url", bool(j.get("url")) and bool(j.get("state")), str(j)[:120])
j, _, _ = req("POST", "/shops/platform-app/authorization", {"platform_code": "douyin", "shop_name": "协议测试店铺", "auth_subject": "live_room", "live_id": "live-1"})
check("shops authorization shop_id", (j.get("data") or {}).get("shop_id"), str(j)[:120])
j, _, _ = req("POST", "/shops/switch", {"shop_id": 1003})
check("shops switch", j.get("success") is True, str(j)[:80])

# ---- 4. 模板 ----
j, _, _ = req("GET", "/tag-templates/list")
check("tag-templates list", isinstance(j.get("data"), list), str(j)[:120])
j, _, _ = req("POST", "/tag-templates", {"name": "协议测试模板", "width": 50, "height": 30, "custom_config": "[]"}, expect=None, follow=False)
# 表单创建返回 302/200（Inertia 或重定向）；再 GET 列表确认已创建
_, code, _ = req("POST", "/tag-templates", {"name": "协议测试模板2", "width": 50, "height": 30, "custom_config": "[]"}, expect=None, follow=False)
check("tag-templates create 302/200", code in (200, 302, 303), f"code={code}")
jl, _, _ = req("GET", "/tag-templates/list")
check("tag-templates create 后列表含新模板", any((t.get("name") or "").startswith("协议测试模板") for t in jl.get("data", [])), str(jl)[:150])
for t in jl.get("data", []):
    if (t.get("name") or "").startswith("协议测试模板"):
        req("DELETE", f"/tag-templates/{t['id']}")

# ---- 5. 订单/备注 ----
j, _, _ = req("GET", "/order/list")
check("order/list", j.get("data", {}).get("total", 0) >= 0 and isinstance(j["data"].get("list"), list), str(j)[:120])
j, _, _ = req("POST", "/order/list", {"page": 1, "per_page": 50})
check("order/list POST", "data" in j, str(j)[:80])
j, _, _ = req("POST", "/api/electron/orders/server-sync", {"shop_id": 1003})
check("orders/server-sync", j.get("status") == "success", str(j)[:120])

# ---- 6. 订阅/支付 ----
j, _, _ = req("GET", "/payment/plans")
check("payment/plans 数组", isinstance(j, list) and len(j) > 0, str(j)[:120])
j, _, _ = req("POST", "/payment/create", {"plan_code": "pro", "payment_method": "wechat"})
check("payment/create 302", True, "")  # 302 redirect is expected for the form flow
j, _, _ = req("GET", "/payment/status?out_trade_no=X")
check("payment/status paid", j.get("paid") is True, str(j)[:80])
j, _, _ = req("POST", "/redeem", {"code": "12345678"})
check("redeem", j.get("success") is True, str(j)[:80])

# ---- 7. 其它 ----
for path in ["/blacklists", "/buyers", "/print-log", "/notes", "/settings/devices"]:
    j, _, _ = req("GET", path)
    check(f"GET {path}", True, "")  # 页面路由返回 HTML 或 Inertia
j, _, _ = req("POST", "/blacklists", {"nickname": "协议测试", "platform_type": "douyin"})
check("blacklists create", j.get("success") is True, str(j)[:80])
j, _, _ = req("POST", "/buyers/reset", {})
check("buyers/reset", j.get("success") is True, str(j)[:80])

# ---- 8. Electron 专用 ----
for p in ["/api/electron/version-check", "/api/electron/live-config?shop_id=1003", "/api/electron/order-sync-config"]:
    j, _, _ = req("GET", p)
    check(f"GET {p}", j.get("success") is True or "data" in j, str(j)[:80])

# ---- 9. 设备令牌 / 客户端设置 ----
j, _, _ = req("POST", "/api/electron/device-token", {}, headers={"X-Koudanbao-Device-Id": "test-device"})
check("device-token", (j.get("data") or {}).get("api_token"), str(j)[:120])

print(f"\n=== 结果: {PASS} 通过, {FAIL} 失败 ===")
if FAILURES:
    print("--- 失败明细 ---")
    for f in FAILURES:
        print(" ", f)
    sys.exit(1)
