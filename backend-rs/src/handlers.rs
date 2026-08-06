//! 统一 HTTP 分发（对齐 server.py 的 Handler：do_GET / do_POST / _shops_api /
//! _templates_api + _send/_json/_inertia/_redirect 响应语义）。
//!
//! 路由：axum fallback 全量进入本分发器（保持与 Python if/elif 完全一致的判定顺序，
//! 最大化契约保真；模块化体现在各域逻辑已拆到 shops/templates/electron 模块）。

use crate::domain::{as_s, VERSION, default_deduction_config, merged_deduction_config, plans};
use crate::electron;
use crate::inertia::{build_page_for, only_props, shell_html};
use crate::shops;
use crate::state::AppState;
use crate::store;
use crate::templates;
use crate::util::{
    is_inertia_header, now_iso, parse_body_any, parse_cookie_header, parse_form, parse_qs,
    percent_decode, session_cookies, token_hex, token_urlsafe,
};
use axum::body::Body;
use axum::extract::State;
use axum::http::{header, HeaderMap, Method, StatusCode, Uri};
use axum::response::Response;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;

pub async fn dispatch(
    State(state): State<Arc<AppState>>,
    method: Method,
    uri: Uri,
    headers: HeaderMap,
    body: bytes::Bytes,
) -> Response<Body> {
    let head_only = method == Method::HEAD;
    let effective = if head_only { Method::GET } else { method.clone() };

    // ---- 路径解析（对齐 urlparse + unquote + parse_qs）----
    let raw_path = uri.path().to_string();
    let query = uri.query().unwrap_or("");
    let path = percent_decode(&raw_path);
    let qs = parse_qs(query);

    // OPTIONS 直接 204
    if effective == Method::OPTIONS {
        return send_base(&state, 204, b"".to_vec(), &headers, &[], &[], head_only);
    }

    // ---- 会话解析（对齐 _get_or_create_session）----
    let cookie_map = parse_cookie_header(headers.get(header::COOKIE).and_then(|v| v.to_str().ok()));
    let sid0 = cookie_map.get("kdb_session").cloned();
    let (sid, mut sess) = state.ensure_session(sid0.as_deref(), state.auto_login);
    state.sync_session_from_store(&mut sess);
    let mut set_cookie: Vec<String> = Vec::new();
    if sid0.as_deref() != Some(sid.as_str()) {
        let csrf = sess.get("csrf").and_then(|v| v.as_str()).unwrap_or("").to_string();
        set_cookie = session_cookies(&sid, &csrf);
    }

    let ctx = Ctx {
        state: &state,
        cmd: effective_method_str(&effective),
        path: path.clone(),
        raw_path: raw_path.clone(),
        qs,
        headers: &headers,
        body: &body,
        sess,
        set_cookie,
    };

    let mut ctx = ctx;
    let resp = if effective == Method::GET || head_only {
        handle_get(&mut ctx)
    } else {
        handle_post(&mut ctx)
    };

    // 写回会话（对齐 Python 直接改 sess 引用）
    state.set_session(&sid, &ctx.sess);

    // HEAD：去 body（Python: if self.command != "HEAD": wfile.write(body)）
    if head_only {
        let (parts, _) = resp.into_parts();
        return Response::from_parts(parts, Body::empty());
    }
    resp
}

fn effective_method_str(m: &Method) -> &'static str {
    match *m {
        Method::POST => "POST",
        Method::PUT => "PUT",
        Method::PATCH => "PATCH",
        Method::DELETE => "DELETE",
        Method::GET => "GET",
        _ => "GET",
    }
}

pub struct Ctx<'a> {
    pub state: &'a AppState,
    pub cmd: &'static str,
    pub path: String,
    pub raw_path: String,
    pub qs: HashMap<String, Vec<String>>,
    pub headers: &'a HeaderMap,
    pub body: &'a [u8],
    pub sess: Value,
    pub set_cookie: Vec<String>,
}

impl Ctx<'_> {
    fn is_inertia(&self) -> bool {
        is_inertia_header(self.headers)
    }

    fn referer_path(&self, fallback: &str) -> String {
        self.headers
            .get("Referer")
            .and_then(|v| v.to_str().ok())
            .map(|r| {
                let p = percent_decode(r.split('?').next().unwrap_or(r));
                if p.is_empty() { fallback.to_string() } else { p }
            })
            .unwrap_or_else(|| fallback.to_string())
    }
}

// ---- 响应构造（对齐 _send/_json/_inertia/_redirect）----

fn cors_origin(headers: &HeaderMap) -> String {
    headers
        .get(header::ORIGIN)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("*")
        .to_string()
}

fn send_base(
    state: &AppState,
    code: u16,
    body: Vec<u8>,
    headers: &HeaderMap,
    extra: &[(&str, String)],
    cookies: &[String],
    _head_only: bool,
) -> Response<Body> {
    let mut builder = Response::builder().status(StatusCode::from_u16(code).unwrap_or(StatusCode::OK));
    builder = builder
        .header("Cache-Control", "no-store")
        .header("Access-Control-Allow-Origin", cors_origin(headers))
        .header("Access-Control-Allow-Credentials", "true")
        .header(
            "Access-Control-Allow-Headers",
            "Content-Type, X-Requested-With, X-Inertia, X-Inertia-Version, X-Inertia-Partial-Component, X-Inertia-Partial-Data, X-XSRF-TOKEN, X-CSRF-TOKEN, Authorization, X-Koudanbao-Client, X-Koudanbao-Device-Id, X-Koudanbao-Device-Name, X-Koudanbao-App-Version, X-Koudanbao-Platform, Accept",
        )
        .header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        .header("Access-Control-Expose-Headers", "X-Inertia, X-Inertia-Location, X-Inertia-Version")
        .header("Content-Length", body.len().to_string());
    for (k, v) in extra {
        builder = builder.header(*k, v.clone());
    }
    for c in cookies {
        builder = builder.header("Set-Cookie", c.clone());
    }
    let _ = state;
    builder
        .body(Body::from(body))
        .unwrap_or_else(|_| Response::new(Body::from("internal error")))
}

fn json_resp(ctx: &Ctx, code: u16, obj: &Value) -> Response<Body> {
    let raw = serde_json::to_string(obj).unwrap_or_else(|_| "{}".into()).into_bytes();
    send_base(
        ctx.state,
        code,
        raw,
        ctx.headers,
        &[("Content-Type", "application/json; charset=utf-8".to_string())],
        &ctx.set_cookie,
        false,
    )
}

fn inertia_resp(ctx: &Ctx, code: u16, page_obj: &Value, only: Option<&str>) -> Response<Body> {
    let page_obj = only_props(page_obj, only);
    if ctx.is_inertia() {
        let raw = serde_json::to_string(&page_obj).unwrap_or_else(|_| "{}".into()).into_bytes();
        send_base(
            ctx.state,
            code,
            raw,
            ctx.headers,
            &[
                ("Content-Type", "application/json; charset=utf-8".to_string()),
                ("X-Inertia", "true".to_string()),
                ("X-Inertia-Version", VERSION.to_string()),
                ("Vary", "X-Inertia".to_string()),
            ],
            &ctx.set_cookie,
            false,
        )
    } else {
        let html = shell_html(ctx.state, &page_obj);
        send_base(
            ctx.state,
            code,
            html,
            ctx.headers,
            &[
                ("Content-Type", "text/html; charset=utf-8".to_string()),
                ("X-Inertia-Version", VERSION.to_string()),
            ],
            &ctx.set_cookie,
            false,
        )
    }
}

fn redirect_resp(ctx: &Ctx, location: &str) -> Response<Body> {
    if ctx.is_inertia() {
        send_base(
            ctx.state,
            409,
            Vec::new(),
            ctx.headers,
            &[
                ("X-Inertia-Location", location.to_string()),
                ("X-Inertia-Version", VERSION.to_string()),
                ("Content-Type", "text/plain".to_string()),
                ("Content-Length", "0".to_string()),
            ],
            &ctx.set_cookie,
            false,
        )
    } else {
        send_base(
            ctx.state,
            302,
            Vec::new(),
            ctx.headers,
            &[
                ("Location", location.to_string()),
                ("Content-Length", "0".to_string()),
            ],
            &ctx.set_cookie,
            false,
        )
    }
}

fn mime_for(path: &str) -> &'static str {
    let ext = std::path::Path::new(path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    match ext.as_str() {
        "js" | "mjs" => "application/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "html" | "htm" => "text/html; charset=utf-8",
        "json" => "application/json; charset=utf-8",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "ico" => "image/x-icon",
        "woff" => "font/woff",
        "woff2" => "font/woff2",
        "ttf" => "font/ttf",
        "map" => "application/json",
        _ => "application/octet-stream",
    }
}

/// 静态文件（对齐 _file；注意静态文件覆盖 Cache-Control）
fn serve_file(ctx: &Ctx, fp: &PathBuf) -> Response<Body> {
    if !fp.is_file() {
        return send_base(
            ctx.state,
            404,
            b"not found".to_vec(),
            ctx.headers,
            &[("Content-Type", "text/plain".to_string())],
            &ctx.set_cookie,
            false,
        );
    }
    let data = std::fs::read(fp).unwrap_or_default();
    let ctype = mime_for(fp.to_str().unwrap_or(""));
    // P2-9：不做运行时字节补丁——构建期处理（tools/patch-bundle.js）
    send_base(
        ctx.state,
        200,
        data,
        ctx.headers,
        &[
            ("Content-Type", ctype.to_string()),
            ("Cache-Control", "public, max-age=3600".to_string()),
        ],
        &[],
        false,
    )
}

// ---- do_GET（对齐 server.py do_GET 全部分支顺序）----

fn handle_get(ctx: &mut Ctx) -> Response<Body> {
    let path = &ctx.path;

    // static / build assets
    if let Some(rest) = path.strip_prefix("/build/assets/") {
        if !rest.contains('/') && !rest.is_empty() {
            return serve_file(ctx, &ctx.state.assets_dir.join(rest));
        }
    }
    if path.starts_with("/images/") || path.starts_with("/logo/") || path == "/kefu.png" {
        let rel = path.trim_start_matches('/').replace('/', std::path::MAIN_SEPARATOR_STR);
        return serve_file(ctx, &ctx.state.static_dir.join(rel));
    }
    if path == "/favicon.ico" {
        return serve_file(ctx, &ctx.state.static_dir.join("images").join("favicon.ico"));
    }
    if path == "/build/manifest.json" {
        return json_resp(
            ctx,
            200,
            &json!({
                "resources/css/app.css": {"file": "assets/app-CVK6h-fN.css", "src": "resources/css/app.css", "isEntry": true},
                "resources/js/app.jsx": {"file": "assets/app-Buzwood0.js", "src": "resources/js/app.jsx", "isEntry": true, "css": ["assets/app-CVK6h-fN.css"]},
            }),
        );
    }

    // 系统日志：记录 API/页面请求（跳过静态资源）
    if let Some(logger) = &ctx.state.logger {
        logger.info(&format!("request method=GET path={path}"));
    }

    // sanctum csrf
    if path == "/sanctum/csrf-cookie" {
        return send_base(ctx.state, 204, Vec::new(), ctx.headers, &[], &ctx.set_cookie, false);
    }

    // health
    if path == "/__mock/health" || path == "/health" {
        return json_resp(
            ctx,
            200,
            &json!({"ok": true, "auto_login": ctx.state.auto_login, "version": VERSION}),
        );
    }

    // shops list (SPA: zt.get("/shops/list"))
    if path == "/shops/list" {
        return json_resp(ctx, 200, &shops::shops_list_payload(&ctx.sess));
    }

    // SPA dashboard io(): zt.get("/shops") 期望 JSON {data:{...}}
    if path == "/shops" && !ctx.is_inertia() && is_xhr(ctx.headers) {
        return json_resp(ctx, 200, &shops::shops_dashboard_payload(&ctx.sess));
    }

    // template list (SPA: zt.get("/tag-templates/list") → body.data = array)
    if path == "/tag-templates/list" {
        let mut sess = ctx.sess.clone();
        let tpls = templates::ensure_templates(&ctx.state.assets_dir, &mut sess);
        ctx.sess = sess;
        return json_resp(ctx, 200, &json!({"success": true, "data": tpls}));
    }

    // 打印日志列表
    if path == "/print-log/list" {
        let page_no = ctx
            .qs
            .get("page")
            .and_then(|v| v.first())
            .and_then(|s| s.parse::<i64>().ok())
            .unwrap_or(1)
            .max(1);
        let per_page = ctx
            .qs
            .get("size")
            .or_else(|| ctx.qs.get("page_size"))
            .and_then(|v| v.first())
            .and_then(|s| s.parse::<i64>().ok())
            .unwrap_or(20);
        let logs = store::store_get(ctx.state, "print_logs")
            .as_array()
            .cloned()
            .unwrap_or_default();
        let s_nick = ctx.qs.get("nickname").and_then(|v| v.first()).cloned().unwrap_or_default().trim().to_string();
        let s_shop = ctx
            .qs
            .get("shopId")
            .or_else(|| ctx.qs.get("shop_id"))
            .and_then(|v| v.first())
            .cloned()
            .unwrap_or_default()
            .trim()
            .to_string();
        let s_start = ctx.qs.get("startTime").and_then(|v| v.first()).cloned().unwrap_or_default().trim().to_string();
        let s_end = ctx.qs.get("endTime").and_then(|v| v.first()).cloned().unwrap_or_default().trim().to_string();
        let mut filtered: Vec<Value> = logs.into_iter().filter(|r| {
            let nick = as_s(r.get("nickname").unwrap_or(&Value::Null));
            let shop_id_v = as_s(r.get("shop_id").unwrap_or_else(|| r.get("id").unwrap_or(&Value::Null)));
            let created = as_s(r.get("created_at").unwrap_or(&Value::Null));
            let nick_ok = s_nick.is_empty() || nick.contains(&s_nick);
            let shop_ok = s_shop.is_empty() || shop_id_v.starts_with(&s_shop);
            let start_ok = s_start.is_empty() || created >= s_start;
            let end_ok = s_end.is_empty() || created <= s_end;
            nick_ok && shop_ok && start_ok && end_ok
        }).collect();
        let total = filtered.len();
        let start = ((page_no - 1) * per_page).max(0) as usize;
        let end = (start + per_page as usize).min(total);
        let page_items: Vec<Value> = filtered.drain(start..end).collect();
        return json_resp(
            ctx,
            200,
            &json!({"success": true, "data": {"list": page_items, "total": total}}),
        );
    }

    // 扣数规则加载
    if path == "/deduction-rule" {
        let shop_id = ctx
            .qs
            .get("shop_id")
            .or_else(|| ctx.qs.get("shopId"))
            .and_then(|v| v.first())
            .cloned()
            .unwrap_or_default();
        let cfg: Value = if shop_id.is_empty() {
            default_deduction_config()
        } else {
            store::store_get(ctx.state, "deduction_configs")
                .get(&shop_id)
                .cloned()
                .unwrap_or(Value::Null)
        };
        let cfg = merged_deduction_config(&cfg);
        return json_resp(ctx, 200, &json!({"code": 0, "data": cfg}));
    }

    // 订单列表（GET，Notes 页）
    if path == "/order/list" {
        let page_no = ctx
            .qs
            .get("page")
            .and_then(|v| v.first())
            .and_then(|s| s.parse::<i64>().ok())
            .unwrap_or(1)
            .max(1);
        let per_page = ctx
            .qs
            .get("per_page")
            .or_else(|| ctx.qs.get("page_size"))
            .and_then(|v| v.first())
            .and_then(|s| s.parse::<i64>().ok())
            .unwrap_or(50);
        return json_resp(
            ctx,
            200,
            &json!({"success": true, "data": ctx.state.mock_order_list(&ctx.sess, page_no, per_page)}),
        );
    }

    // 订购套餐列表：期望响应体直接是套餐数组
    if path == "/payment/plans" && is_xhr(ctx.headers) {
        let list: Vec<Value> = plans()
            .iter()
            .map(|p| {
                json!({
                    "plan_code": p["plan_code"],
                    "price": p["price"],
                    "label": p["label"],
                    "days": p["days"],
                    "name": p["name"],
                })
            })
            .collect();
        return json_resp(ctx, 200, &json!(list));
    }

    // 微信支付状态轮询
    if path == "/payment/status" {
        let out_no = ctx.qs.get("out_trade_no").and_then(|v| v.first()).cloned().unwrap_or_default();
        let order = ctx.state.payment_order(&out_no);
        let paid = order.as_ref().map(|o| o.get("status").and_then(|v| v.as_i64()) == Some(1)).unwrap_or(false);
        // mock 便利：不存在的订单号也按已支付处理
        let paid = if order.is_some() { paid } else { true };
        return json_resp(ctx, 200, &json!({"paid": paid, "out_trade_no": out_no}));
    }

    // 微信支付页直接访问兜底
    if path == "/payment/wechat" {
        let mut sess = ctx.sess.clone();
        let pg = build_page_for(ctx.state, path, &mut sess, Some(&ctx.qs));
        ctx.sess = sess;
        return inertia_resp(ctx, 200, &pg, None);
    }

    // electron version-check
    if path == "/api/electron/version-check" {
        return json_resp(
            ctx,
            200,
            &json!({
                "success": true,
                "data": {
                    "update_available": false,
                    "latest_version": "1.1.2",
                    "current_version": ctx.qs.get("version").and_then(|v| v.first()).cloned().unwrap_or_else(|| "1.1.2".into()),
                    "force_update": false,
                    "download_url": Value::Null,
                    "release_notes": "local mock — no update",
                },
            }),
        );
    }

    // electron 主进程 GET /api/electron/* → JSON
    if path.starts_with("/api/electron/") {
        let mut sess = ctx.sess.clone();
        let out = electron::electron_api(ctx.state, &ctx.raw_path, b"", &mut sess);
        ctx.sess = sess;
        return json_resp(ctx, 200, &out);
    }

    if path == "/download/desktop/runtime-config.json" {
        let host = ctx
            .headers
            .get(header::HOST)
            .and_then(|v| v.to_str().ok())
            .unwrap_or("127.0.0.1:8787")
            .to_string();
        return json_resp(
            ctx,
            200,
            &json!({"success": true, "channel": "stable", "baseUrl": format!("http://{host}")}),
        );
    }

    // generic pages
    let mut page_path = path.clone();
    if page_path == "/" {
        page_path = if ctx.state.auto_login { "/dashboard".to_string() } else { "/login".to_string() };
    }

    let mut sess = ctx.sess.clone();
    let pg = build_page_for(ctx.state, &page_path, &mut sess, Some(&ctx.qs));
    // unauthenticated protected
    let authed = sess.get("user").map(|u| !u.is_null()).unwrap_or(false);
    let is_public = matches!(page_path.as_str(), "/login" | "/register" | "/password/reset");
    if !authed && !is_public {
        return redirect_resp(ctx, "/login");
    }
    if authed && (page_path == "/login" || page_path == "/register") {
        return redirect_resp(ctx, "/dashboard");
    }
    let only = ctx
        .headers
        .get("X-Inertia-Partial-Data")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    let _ = sess;
    inertia_resp(ctx, 200, &pg, only.as_deref())
}

fn is_xhr(headers: &HeaderMap) -> bool {
    let xrw = headers
        .get("X-Requested-With")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_lowercase();
    let accept = headers
        .get(header::ACCEPT)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    xrw == "xmlhttprequest" || accept.contains("application/json")
}

// ---- do_POST（对齐 server.py do_POST 全部分支顺序）----

fn handle_post(ctx: &mut Ctx) -> Response<Body> {
    let path = &ctx.path;
    let content_type = ctx
        .headers
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();
    let form = parse_form(ctx.body, &content_type);

    // 系统日志
    if path != "/__mock/health" && path != "/health" {
        if let Some(logger) = &ctx.state.logger {
            logger.info(&format!("request method=POST path={path}"));
        }
    }

    // ---- auth ----
    if path == "/login" {
        let phone = form
            .get("phone")
            .and_then(|v| v.as_str())
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| "13800000000".to_string());
        // password ignored on purpose
        login_session(ctx.state, &mut ctx.sess, &phone);
        if ctx.is_inertia() {
            let mut sess = ctx.sess.clone();
            let pg = build_page_for(ctx.state, "/dashboard", &mut sess, None);
            ctx.sess = sess;
            return inertia_resp(ctx, 200, &pg, None);
        }
        return redirect_resp(ctx, "/dashboard");
    }

    if path == "/register" {
        let phone = form
            .get("phone")
            .and_then(|v| v.as_str())
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| "13800000001".to_string());
        login_session(ctx.state, &mut ctx.sess, &phone);
        if ctx.is_inertia() {
            let mut sess = ctx.sess.clone();
            let pg = build_page_for(ctx.state, "/dashboard", &mut sess, None);
            ctx.sess = sess;
            return inertia_resp(ctx, 200, &pg, None);
        }
        return redirect_resp(ctx, "/dashboard");
    }

    if path == "/logout" {
        if let Some(o) = ctx.sess.as_object_mut() {
            o.insert("user".into(), Value::Null);
            o.insert("tenant".into(), Value::Null);
            o.insert("api_token".into(), Value::Null);
            o.insert("electron_device".into(), json!({"status": "guest"}));
        }
        if ctx.is_inertia() {
            let mut sess = ctx.sess.clone();
            let pg = build_page_for(ctx.state, "/login", &mut sess, None);
            ctx.sess = sess;
            return inertia_resp(ctx, 200, &pg, None);
        }
        return redirect_resp(ctx, "/login");
    }

    // 换绑手机
    if path == "/phone/update" {
        let body_obj = parse_body_any(ctx.body, &content_type);
        let new_phone = if let Some(obj) = body_obj.as_object() {
            obj.get("new_phone")
                .or_else(|| obj.get("phone"))
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
                .unwrap_or_default()
        } else {
            String::new()
        };
        let new_phone = if new_phone.is_empty() {
            form.get("new_phone")
                .or_else(|| form.get("phone"))
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
                .unwrap_or_default()
        } else {
            new_phone
        };
        let new_phone = if new_phone.is_empty() {
            ctx.sess
                .get("user")
                .and_then(|u| u.get("phone"))
                .and_then(|v| v.as_str())
                .unwrap_or("13800000000")
                .to_string()
        } else {
            new_phone
        };
        if let Some(user) = ctx.sess.get_mut("user").and_then(|u| u.as_object_mut()) {
            user.insert("phone".into(), json!(new_phone));
        }
        return json_resp(ctx, 200, &json!({"success": true, "data": {"user": ctx.sess.get("user")}}));
    }

    if path == "/pwd/update" {
        return json_resp(ctx, 200, &json!({"success": true, "message": "密码已更新（本地mock）"}));
    }

    if path == "/sms/send" || path == "/sms/send/register" || path == "/sms/send/password-reset" {
        return json_resp(
            ctx,
            200,
            &json!({"success": true, "message": "验证码已发送（本地mock，任意6位即可）", "code": "000000"}),
        );
    }

    if path == "/password/reset" {
        let phone = form
            .get("phone")
            .and_then(|v| v.as_str())
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| "13800000000".to_string());
        login_session(ctx.state, &mut ctx.sess, &phone);
        if ctx.is_inertia() {
            let mut sess = ctx.sess.clone();
            let pg = build_page_for(ctx.state, "/dashboard", &mut sess, None);
            ctx.sess = sess;
            return inertia_resp(ctx, 200, &pg, None);
        }
        return redirect_resp(ctx, "/dashboard");
    }

    if path == "/old/phone/judge" {
        return json_resp(ctx, 200, &json!({"exists": true, "registered": true}));
    }

    // ---- device token (critical for Electron after login) ----
    if path == "/api/electron/device-token" {
        let authed = ctx.sess.get("user").map(|u| !u.is_null()).unwrap_or(false);
        if !authed {
            login_session(ctx.state, &mut ctx.sess, "13800000000");
        }
        let device_id = ctx
            .headers
            .get("X-Koudanbao-Device-Id")
            .and_then(|v| v.to_str().ok())
            .map(|s| s.to_string())
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        let device_name = ctx
            .headers
            .get("X-Koudanbao-Device-Name")
            .and_then(|v| v.to_str().ok())
            .map(|s| s.to_string())
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| "Electron".to_string());
        let platform = ctx
            .headers
            .get("X-Koudanbao-Platform")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("win32")
            .to_string();
        let app_version = ctx
            .headers
            .get("X-Koudanbao-App-Version")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("1.1.2")
            .to_string();

        if let Some(o) = ctx.sess.as_object_mut() {
            o.insert("electron_device".into(), crate::domain::electron_device("active", Some(&device_id)));
        }
        // upsert device list
        let mut devices: Vec<Value> = ctx.sess.get("devices").and_then(|v| v.as_array()).cloned().unwrap_or_default();
        let mut found = false;
        for d in devices.iter_mut() {
            if as_s(d.get("device_id").unwrap_or(&Value::Null)) == device_id {
                d.as_object_mut().map(|m| {
                    m.insert("last_seen_at".into(), json!(now_iso()));
                    m.insert("device_name".into(), json!(device_name));
                    m.insert("is_current".into(), json!(true));
                });
                found = true;
            } else {
                d.as_object_mut().map(|m| m.insert("is_current".into(), json!(false)));
            }
        }
        if !found {
            let id = devices.len() as i64 + 1;
            devices.push(json!({
                "id": id,
                "device_id": device_id,
                "device_name": device_name,
                "platform": platform,
                "app_version": app_version,
                "last_seen_at": now_iso(),
                "created_at": now_iso(),
                "is_current": true,
                "status": "active",
            }));
        }
        ctx.sess.as_object_mut().map(|o| o.insert("devices".into(), json!(devices)));

        let has_token = ctx
            .sess
            .get("api_token")
            .and_then(|v| v.as_str())
            .map(|s| !s.is_empty())
            .unwrap_or(false);
        if !has_token {
            ctx.sess
                .as_object_mut()
                .map(|o| o.insert("api_token".into(), json!(format!("kdb_local_{}", token_hex(16)))));
        }
        return json_resp(
            ctx,
            200,
            &json!({
                "success": true,
                "data": {
                    "api_token": ctx.sess.get("api_token"),
                    "device": ctx.sess.get("electron_device"),
                    "subscription": crate::domain::subscription_summary(),
                },
            }),
        );
    }

    // ---- electron business APIs ----
    if path.starts_with("/api/electron/") {
        let mut sess = ctx.sess.clone();
        let out = electron::electron_api(ctx.state, &ctx.raw_path, ctx.body, &mut sess);
        ctx.sess = sess;
        return json_resp(ctx, 200, &out);
    }

    // ---- shops ----
    if path.starts_with("/shops") {
        return shops_api(ctx);
    }

    // ---- payment ----
    if path == "/payment/create" {
        let payload = parse_body_any(ctx.body, &content_type);
        let plan_code = payload
            .get("plan_code")
            .and_then(|v| v.as_str())
            .unwrap_or("enterprise")
            .to_string();
        let pay_method = payload
            .get("payment_method")
            .and_then(|v| v.as_str())
            .unwrap_or("alipay")
            .to_string();
        let order = ctx.state.create_payment_order(&plan_code, &pay_method);
        let out_trade_no = as_s(order.get("out_trade_no").unwrap_or(&Value::Null));
        return redirect_resp(ctx, &format!("/payment/wechat?out_trade_no={out_trade_no}"));
    }

    if path == "/redeem" {
        let payload = parse_body_any(ctx.body, &content_type);
        let mut code = payload
            .get("code")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        code = code.chars().filter(|c| c.is_ascii_digit()).take(8).collect();
        if code.chars().count() != 8 {
            return json_resp(ctx, 422, &json!({"success": false, "message": "兑换码无效，请输入 8 位数字兑换码"}));
        }
        let mut codes: Vec<Value> = ctx.sess.get("redeemed_codes").and_then(|v| v.as_array()).cloned().unwrap_or_default();
        codes.push(json!(code));
        ctx.sess.as_object_mut().map(|o| o.insert("redeemed_codes".into(), json!(codes)));
        return json_resp(ctx, 200, &json!({"success": true, "message": "兑换成功！企业版已开通", "plan": "enterprise"}));
    }

    if path.starts_with("/payment") {
        if ctx.is_inertia() {
            ctx.sess.as_object_mut().map(|o| o.insert("flash_success".into(), json!("本地mock：无需支付，已是企业版")));
            let mut sess = ctx.sess.clone();
            let pg = build_page_for(ctx.state, "/settings/order-subscriptions", &mut sess, None);
            ctx.sess = sess;
            return inertia_resp(ctx, 200, &pg, None);
        }
        return json_resp(ctx, 200, &json!({"success": true}));
    }

    // ---- print templates ----
    if path == "/tag-templates" || path.starts_with("/tag-templates/") {
        return templates_api(ctx);
    }

    // ---- 扣数规则保存 ----
    if path == "/deduction-rule" {
        let payload = parse_body_any(ctx.body, &content_type);
        let mut shop_id = payload
            .get("shopId")
            .or_else(|| payload.get("shop_id"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        if shop_id.is_empty() {
            shop_id = payload
                .get("shopId")
                .or_else(|| payload.get("shop_id"))
                .and_then(|v| v.as_i64())
                .map(|n| n.to_string())
                .unwrap_or_default();
        }
        if !shop_id.is_empty() {
            let mut cfg = payload.clone();
            if let Some(o) = cfg.as_object_mut() {
                o.remove("shopId");
                o.remove("shop_id");
            }
            store::store_set(ctx.state, "deduction_configs", {
                let mut configs = store::store_get(ctx.state, "deduction_configs");
                if let Some(m) = configs.as_object_mut() {
                    m.insert(shop_id, cfg);
                }
                configs
            });
        }
        return json_resp(ctx, 200, &json!({"success": true, "code": 0}));
    }

    // ---- 弹幕→商品映射 ----
    if path == "/danmu-product-relations" {
        let payload = parse_body_any(ctx.body, &content_type);
        let danmu = as_s(payload.get("danmu").unwrap_or(&Value::Null)).trim().to_string();
        let price = payload.get("price").cloned();
        let product_no = as_s(payload.get("product_no").unwrap_or(&Value::Null)).trim().to_string();
        let tenant_id = payload.get("tenant_id").cloned();
        let mut relations = ctx.state.danmu_relations();
        // 相同弹幕内容不允许重复
        if !danmu.is_empty() && relations.iter().any(|r| as_s(r.get("danmu").unwrap_or(&Value::Null)) == danmu) {
            if ctx.is_inertia() {
                let mut sess = ctx.sess.clone();
                let mut pg = build_page_for(ctx.state, "/config", &mut sess, None);
                pg["props"]["errors"] = json!({"message": "该弹幕内容您已配置过，请勿重复配置"});
                ctx.sess = sess;
                return inertia_resp(ctx, 409, &pg, None);
            }
            return json_resp(ctx, 422, &json!({"success": false, "message": "该弹幕内容您已配置过，请勿重复配置"}));
        }
        let rel = json!({
            "id": ctx.state.next_dpr_id(),
            "danmu": danmu,
            "price": price.unwrap_or(Value::Null),
            "product_no": product_no,
            "tenant_id": tenant_id.unwrap_or_else(|| json!(1)),
        });
        relations.push(rel.clone());
        store::store_set(ctx.state, "danmu_product_relations", json!(relations));
        if ctx.is_inertia() {
            let refer = ctx.referer_path("/config");
            let mut sess = ctx.sess.clone();
            let pg = build_page_for(ctx.state, &refer, &mut sess, None);
            ctx.sess = sess;
            return inertia_resp(ctx, 200, &pg, None);
        }
        return json_resp(ctx, 200, &json!({"success": true, "code": 0, "data": rel}));
    }

    if path.starts_with("/danmu-product-relations/") {
        let rid = path.rsplit('/').next().unwrap_or("").to_string();
        let mut relations = ctx.state.danmu_relations();
        let idx = relations.iter().position(|r| as_s(r.get("id").unwrap_or(&Value::Null)) == rid);
        let Some(idx) = idx else {
            return json_resp(ctx, 404, &json!({"success": false, "message": "配置不存在"}));
        };
        if ctx.cmd == "DELETE" {
            relations.remove(idx);
            store::store_set(ctx.state, "danmu_product_relations", json!(relations));
            if ctx.is_inertia() {
                let refer = ctx.referer_path("/config");
                let mut sess = ctx.sess.clone();
                let pg = build_page_for(ctx.state, &refer, &mut sess, None);
                ctx.sess = sess;
                return inertia_resp(ctx, 200, &pg, None);
            }
            return json_resp(ctx, 200, &json!({"success": true, "code": 0}));
        }
        // PUT/PATCH/POST update
        let payload = parse_body_any(ctx.body, &content_type);
        if let Some(obj) = relations[idx].as_object_mut() {
            if let Some(v) = payload.get("danmu") {
                obj.insert("danmu".into(), json!(as_s(v).trim()));
            }
            if let Some(v) = payload.get("price") {
                obj.insert("price".into(), v.clone());
            }
            if let Some(v) = payload.get("product_no") {
                obj.insert("product_no".into(), json!(as_s(v).trim()));
            }
            if let Some(v) = payload.get("tenant_id") {
                obj.insert("tenant_id".into(), v.clone());
            }
        }
        let updated = relations[idx].clone();
        store::store_set(ctx.state, "danmu_product_relations", json!(relations));
        if ctx.is_inertia() {
            let refer = ctx.referer_path("/config");
            let mut sess = ctx.sess.clone();
            let pg = build_page_for(ctx.state, &refer, &mut sess, None);
            ctx.sess = sess;
            return inertia_resp(ctx, 200, &pg, None);
        }
        return json_resp(ctx, 200, &json!({"success": true, "code": 0, "data": updated}));
    }

    // POST /danmu/list — 直播弹幕列表
    if path == "/danmu/list" {
        let payload = parse_body_any(ctx.body, &content_type);
        let page = payload
            .get("page")
            .or_else(|| payload.get("current_page"))
            .and_then(|v| v.as_i64())
            .unwrap_or(1)
            .max(1);
        let per_page = payload
            .get("per_page")
            .or_else(|| payload.get("page_size"))
            .and_then(|v| v.as_i64())
            .unwrap_or(20);
        return json_resp(
            ctx,
            200,
            &json!({
                "success": true,
                "data": {"list": [], "total": 0, "current_page": page, "per_page": per_page},
            }),
        );
    }

    // POST /order/list
    if path == "/order/list" {
        let payload = parse_body_any(ctx.body, &content_type);
        let page_no = payload
            .get("page")
            .or_else(|| payload.get("current_page"))
            .and_then(|v| v.as_i64())
            .unwrap_or(1)
            .max(1);
        let per_page = payload
            .get("per_page")
            .or_else(|| payload.get("page_size"))
            .and_then(|v| v.as_i64())
            .unwrap_or(50);
        return json_resp(
            ctx,
            200,
            &json!({"success": true, "data": ctx.state.mock_order_list(&ctx.sess, page_no, per_page)}),
        );
    }

    // ---- catch-all 前缀组 ----
    let prefixes = [
        "/order/", "/danmu", "/buyers", "/blacklists", "/print-log", "/notes",
        "/phone/", "/pwd/", "/redeem", "/wechat-bindings", "/deduction-rule", "/settings/",
    ];
    if prefixes.iter().any(|p| path.starts_with(p)) {
        if ctx.is_inertia() {
            let refer = ctx.referer_path("/dashboard");
            let mut sess = ctx.sess.clone();
            let pg = build_page_for(ctx.state, &refer, &mut sess, None);
            ctx.sess = sess;
            return inertia_resp(ctx, 200, &pg, None);
        }
        return json_resp(ctx, 200, &json!({"success": true}));
    }

    // fallback
    json_resp(ctx, 200, &json!({"success": true, "message": format!("mock accepted POST {path}")}))
}

/// Python `login_session`
fn login_session(state: &AppState, sess: &mut Value, phone: &str) {
    let token = format!("kdb_local_{}", token_hex(16));
    let device_id = uuid::Uuid::new_v4().to_string();
    if let Some(o) = sess.as_object_mut() {
        o.insert("user".into(), crate::domain::fake_user(phone));
        o.insert("tenant".into(), crate::domain::fake_tenant());
        o.insert("api_token".into(), json!(token));
        o.insert("electron_device".into(), crate::domain::electron_device("active", Some(&device_id)));
        o.insert(
            "devices".into(),
            json!([{
                "id": 1,
                "device_id": device_id,
                "device_name": "Local Mock Device",
                "platform": "win32",
                "app_version": "1.1.2",
                "last_seen_at": now_iso(),
                "created_at": now_iso(),
                "is_current": true,
                "status": "active",
            }]),
        );
        // ★ 保留已有的 shops
        if !o.contains_key("shops") || o.get("shops").and_then(|v| v.as_array()).map(|a| a.is_empty()).unwrap_or(true) {
            o.insert("shops".into(), json!([]));
        }
        o.insert("oauth_states".into(), json!({}));
        o.insert("template_seq".into(), json!(1));
        o.insert(
            "templates".into(),
            json!([crate::domain::default_print_template(&state.assets_dir, 1)]),
        );
        o.insert("flash_success".into(), json!("本地登录成功（mock，无需验证码）"));
    }
}

// ---- _shops_api（对齐 server.py _shops_api 分支）----

fn shops_api(ctx: &mut Ctx) -> Response<Body> {
    let path = &ctx.path;
    let content_type = ctx
        .headers
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();
    let payload = parse_body_any(ctx.body, &content_type);

    // GET-style list sometimes posted
    if path == "/shops/list" || path == "/shops" {
        return json_resp(ctx, 200, &shops::shops_dashboard_payload(&ctx.sess));
    }

    if path == "/shops/platform-app/login-token" {
        let shop_id = payload.get("shop_id").cloned().unwrap_or_else(|| json!(1));
        return json_resp(
            ctx,
            200,
            &json!({
                "success": true,
                "data": {
                    "token": "mock-login-token",
                    "app_id": "mock-app",
                    "shop_id": shop_id,
                    "nickname_base_url": "https://fxg.jinritemai.com/",
                    "nicknameBaseUrl": "https://fxg.jinritemai.com/",
                    "appId": "mock-app",
                    "nicknameShopId": as_s(&shop_id),
                },
            }),
        );
    }

    if path == "/shops/platform-app/oauth-url" {
        let platform_code = payload
            .get("platform_code")
            .or_else(|| payload.get("platformCode"))
            .and_then(|v| v.as_str())
            .unwrap_or("douyin")
            .to_string();
        let state = token_urlsafe(16);
        let st = json!({
            "platform_code": platform_code,
            "created": crate::util::now_ms() as f64 / 1000.0,
            "shop_id": payload.get("shop_id").or_else(|| payload.get("shopId")),
        });
        shops::set_oauth_state(&mut ctx.sess, &state, st);
        let url = format!(
            "https://fxg.jinritemai.com/ffa/mshop/homepage/index?mock_oauth=1&state={state}&platform={platform_code}"
        );
        return json_resp(
            ctx,
            200,
            &json!({
                "success": true,
                "url": url,
                "state": state,
                "platform_code": platform_code,
                "data": {"url": url, "state": state, "platform_code": platform_code},
            }),
        );
    }

    if path == "/shops/platform-app/authorization" {
        let state = as_s(payload.get("state").unwrap_or(&Value::Null));
        let st = shops::oauth_state(&ctx.sess, &state);
        let platform_code = payload
            .get("platform_code")
            .or_else(|| payload.get("platformCode"))
            .or_else(|| st.get("platform_code"))
            .and_then(|v| v.as_str())
            .unwrap_or("douyin")
            .to_string();
        let fields = shops::extract_shop_fields_from_payload(&payload);
        let existing = payload
            .get("shop_id")
            .or_else(|| payload.get("shopId"))
            .or_else(|| st.get("shop_id"))
            .cloned();
        let existing_id = existing
            .as_ref()
            .and_then(|v| v.as_i64())
            .or_else(|| existing.as_ref().and_then(|v| v.as_str()).and_then(|s| s.parse().ok()));
        let auth_subject = payload
            .get("auth_subject")
            .and_then(|v| v.as_str())
            .or_else(|| fields.get("auth_subject").and_then(|v| v.as_str()))
            .unwrap_or("order_shop")
            .to_string();
        let picked = shops::pick_fields(
            &fields,
            &[
                "shop_name", "platform_shop_id", "live_id", "live_room_name",
                "live_avatar_url", "avatar_url", "shop_curl", "authorization_scope", "raw_data",
            ],
        );
        let mut shop = shops::make_shop_record(
            &mut ctx.sess,
            &platform_code,
            picked.get("shop_name").map(|v| as_s(v)),
            picked.get("platform_shop_id").map(|v| as_s(v)),
            picked.get("live_id").map(|v| as_s(v)),
            picked.get("live_room_name").map(|v| as_s(v)),
            picked.get("live_avatar_url").map(|v| as_s(v)),
            picked.get("avatar_url").map(|v| as_s(v)),
            picked.get("shop_curl").cloned(),
            Some(auth_subject),
            picked.get("authorization_scope").cloned(),
            picked.get("raw_data").cloned(),
            existing_id,
        );
        let name = as_s(shop.get("shop_name").unwrap_or(&Value::Null));
        if name.is_empty() {
            let fallback = format!("{}订单店铺", crate::domain::platform_name(&platform_code));
            shop.as_object_mut().map(|o| {
                o.insert("shop_name".into(), json!(fallback.clone()));
                o.insert("name".into(), json!(fallback));
            });
        }
        let shop = shops::upsert_shop(ctx.state, &mut ctx.sess, shop);
        if !state.is_empty() {
            shops::pop_oauth_state(&mut ctx.sess, &state);
        }
        let mut body_out = shops::shop_api_payload(ctx.state, &shop, Some(&ctx.sess));
        body_out["message"] = json!("订单店铺授权成功（本地mock）");
        return json_resp(ctx, 200, &body_out);
    }

    if path == "/shops/finalize-authorization" {
        let platform_code = payload
            .get("platform_code")
            .or_else(|| payload.get("platformCode"))
            .or_else(|| payload.get("platform"))
            .and_then(|v| v.as_str())
            .unwrap_or("douyin")
            .to_string();
        let mut fields = shops::extract_shop_fields_from_payload(&payload);
        if as_s(fields.get("live_id").unwrap_or(&Value::Null)).is_empty() {
            if let Some(meta) = payload.get("metadata") {
                let more = shops::extract_shop_fields_from_payload(meta);
                for (k, v) in more.as_object().unwrap() {
                    fields.as_object_mut().unwrap().insert(k.clone(), v.clone());
                }
            }
        }
        let mut shop = shops::make_shop_record(
            &mut ctx.sess,
            &platform_code,
            fields.get("shop_name").map(|v| as_s(v)),
            fields.get("platform_shop_id").map(|v| as_s(v)),
            fields.get("live_id").map(|v| as_s(v)),
            fields.get("live_room_name").map(|v| as_s(v)),
            fields.get("live_avatar_url").map(|v| as_s(v)),
            fields.get("avatar_url").map(|v| as_s(v)),
            fields.get("shop_curl").cloned(),
            Some(as_s(fields.get("auth_subject").unwrap_or(&Value::Null))),
            fields.get("authorization_scope").cloned(),
            fields.get("raw_data").cloned(),
            None,
        );
        shop = shops::upsert_shop(ctx.state, &mut ctx.sess, shop);
        let mut body_out = shops::shop_api_payload(ctx.state, &shop, Some(&ctx.sess));
        body_out["message"] = json!("店铺创建成功（本地mock）");
        return json_resp(ctx, 200, &body_out);
    }

    if path == "/shops/connect" {
        let platform_code = payload
            .get("platform_code")
            .or_else(|| payload.get("platformCode"))
            .and_then(|v| v.as_str())
            .unwrap_or("douyin")
            .to_string();
        let fields = shops::extract_shop_fields_from_payload(&payload);
        let existing = payload
            .get("shop_id")
            .or_else(|| payload.get("shopId"))
            .or_else(|| payload.get("id"))
            .cloned();
        let existing_id = existing
            .as_ref()
            .and_then(|v| v.as_i64())
            .or_else(|| existing.as_ref().and_then(|v| v.as_str()).and_then(|s| s.parse().ok()));
        let shop = shops::make_shop_record(
            &mut ctx.sess,
            &platform_code,
            fields.get("shop_name").map(|v| as_s(v)),
            fields.get("platform_shop_id").map(|v| as_s(v)),
            fields.get("live_id").map(|v| as_s(v)),
            fields.get("live_room_name").map(|v| as_s(v)),
            fields.get("live_avatar_url").map(|v| as_s(v)),
            fields.get("avatar_url").map(|v| as_s(v)),
            fields.get("shop_curl").cloned(),
            Some(as_s(fields.get("auth_subject").unwrap_or(&Value::Null))),
            fields.get("authorization_scope").cloned(),
            fields.get("raw_data").cloned(),
            existing_id,
        );
        let shop = shops::upsert_shop(ctx.state, &mut ctx.sess, shop);
        let mut body_out = shops::shop_api_payload(ctx.state, &shop, Some(&ctx.sess));
        body_out["message"] = json!("店铺连接状态已保存");
        return json_resp(ctx, 200, &body_out);
    }

    if path == "/shops/switch" {
        let shop_id = payload.get("shop_id").or_else(|| payload.get("shopId")).cloned();
        return json_resp(ctx, 200, &json!({"success": true, "data": {"shop_id": shop_id, "switched": true}}));
    }

    // DELETE /shops/{id}
    if let Some(id_str) = path.strip_prefix("/shops/") {
        if !id_str.is_empty() && id_str.chars().all(|c| c.is_ascii_digit()) {
            if ctx.cmd == "DELETE" || ctx.cmd == "POST" {
                if let Ok(shop_id) = id_str.parse::<i64>() {
                    let before = ctx.sess.get("shops").and_then(|v| v.as_array()).map(|a| a.len()).unwrap_or(0);
                    let removed = shops::remove_shop(&mut ctx.sess, shop_id);
                    let after = ctx.sess.get("shops").and_then(|v| v.as_array()).map(|a| a.len()).unwrap_or(0);
                    let shop_seq = ctx.sess.get("shop_seq").cloned().unwrap_or(json!(1000));
                    store::store_set(ctx.state, "shops", ctx.sess.get("shops").cloned().unwrap_or_else(|| json!([])));
                    store::store_set(ctx.state, "shop_seq", shop_seq);
                    if ctx.is_inertia() {
                        let mut sess = ctx.sess.clone();
                        let pg = build_page_for(ctx.state, "/shops", &mut sess, None);
                        ctx.sess = sess;
                        return inertia_resp(ctx, 200, &pg, None);
                    }
                    return json_resp(
                        ctx,
                        200,
                        &json!({"success": true, "message": format!("店铺 {shop_id} 已删除（{before} → {after}）"), "_removed": removed}),
                    );
                }
            }
        }
    }

    // generic shops/* fallback
    if ctx.is_inertia() {
        let mut sess = ctx.sess.clone();
        let pg = build_page_for(ctx.state, "/shops", &mut sess, None);
        ctx.sess = sess;
        return inertia_resp(ctx, 200, &pg, None);
    }
    let shops_arr = ctx.sess.get("shops").and_then(|v| v.as_array()).cloned().unwrap_or_default();
    let fallback_shop_id = shops_arr
        .last()
        .and_then(|s| s.get("id").cloned())
        .unwrap_or_else(|| json!(shops::next_shop_id(&mut ctx.sess)));
    json_resp(
        ctx,
        200,
        &json!({
            "success": true,
            "data": {
                "shop_id": fallback_shop_id,
                "shops": ctx.sess.get("shops"),
            },
            "message": format!("mock accepted {}", ctx.path),
        }),
    )
}

// ---- _templates_api（对齐 server.py _templates_api 分支）----

fn templates_api(ctx: &mut Ctx) -> Response<Body> {
    let path = &ctx.path;
    let content_type = ctx
        .headers
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();
    let payload = parse_body_any(ctx.body, &content_type);
    let mut sess = ctx.sess.clone();
    let _templates = templates::ensure_templates(&ctx.state.assets_dir, &mut sess);

    // POST /tag-templates create
    if path == "/tag-templates" && ctx.cmd == "POST" {
        let mut template_seq = sess.get("template_seq").and_then(|v| v.as_i64()).unwrap_or(1) + 1;
        // Python: sess["template_seq"] = int(...) + 1; 然后 tid = sess["template_seq"]
        let tid = template_seq;
        template_seq += 1;
        sess.as_object_mut().map(|o| o.insert("template_seq".into(), json!(template_seq)));

        let name = as_s(payload.get("name").unwrap_or(&Value::Null))
            .trim()
            .to_string();
        let name = if name.is_empty() { format!("模板{tid}") } else { name };
        let custom_config = match payload.get("custom_config") {
            Some(Value::String(s)) => s.clone(),
            Some(v) => serde_json::to_string(v).unwrap_or_else(|_| "[]".into()),
            None => "[]".to_string(),
        };
        let tpl = json!({
            "id": tid,
            "name": name.clone(),
            "width": as_int(payload.get("width"), 50),
            "height": as_int(payload.get("height"), 30),
            "horizontal": as_int(payload.get("horizontal"), 0),
            "vertical": as_int(payload.get("vertical"), 0),
            "is_default": boolish(payload.get("is_default")),
            "default_printer": as_s(payload.get("default_printer").unwrap_or(&Value::Null)),
            "custom_config": custom_config,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        });
        let is_default = tpl.get("is_default").and_then(|v| v.as_bool()).unwrap_or(false);
        if is_default {
            if let Some(arr) = sess.get_mut("templates").and_then(|v| v.as_array_mut()) {
                for t in arr.iter_mut() {
                    t.as_object_mut().map(|o| o.insert("is_default".into(), json!(false)));
                }
            }
        }
        let mut tpls = sess.get("templates").and_then(|v| v.as_array()).cloned().unwrap_or_default();
        tpls.push(tpl.clone());
        sess.as_object_mut().map(|o| o.insert("templates".into(), json!(tpls)));
        sess.as_object_mut().map(|o| o.insert("flash_success".into(), json!(format!("模板「{name}」已保存"))));
        let template_seq_v = sess.get("template_seq").cloned().unwrap_or(json!(1));
        store::store_set(ctx.state, "templates", sess.get("templates").cloned().unwrap_or_else(|| json!([])));
        store::store_set(ctx.state, "template_seq", template_seq_v);
        if ctx.is_inertia() {
            ctx.sess = sess;
            let pg = build_page_for(ctx.state, "/template", &mut ctx.sess, None);
            return inertia_resp(ctx, 200, &pg, None);
        }
        ctx.sess = sess;
        return redirect_resp(ctx, "/template");
    }

    // /tag-templates/{id}
    if let Some(id_str) = path.strip_prefix("/tag-templates/") {
        if !id_str.is_empty() && id_str.chars().all(|c| c.is_ascii_digit()) && !id_str.contains('/') {
            let tid = id_str.parse::<i64>().unwrap_or(0);
            let mut tpls = sess.get("templates").and_then(|v| v.as_array()).cloned().unwrap_or_default();
            let existing_idx = tpls.iter().position(|t| t.get("id").and_then(|v| v.as_i64()) == Some(tid));
            if ctx.cmd == "DELETE" {
                tpls.retain(|t| t.get("id").and_then(|v| v.as_i64()) != Some(tid));
                sess.as_object_mut().map(|o| o.insert("templates".into(), json!(tpls)));
                let template_seq_v = sess.get("template_seq").cloned().unwrap_or(json!(1));
                store::store_set(ctx.state, "templates", sess.get("templates").cloned().unwrap_or_else(|| json!([])));
                store::store_set(ctx.state, "template_seq", template_seq_v);
                if ctx.is_inertia() {
                    ctx.sess = sess;
                    let pg = build_page_for(ctx.state, "/template", &mut ctx.sess, None);
                    return inertia_resp(ctx, 200, &pg, None);
                }
                ctx.sess = sess;
                return json_resp(ctx, 200, &json!({"success": true}));
            }
            if matches!(ctx.cmd, "PUT" | "POST" | "PATCH") {
                if let Some(idx) = existing_idx {
                    let mut existing = tpls[idx].clone();
                    if let Some(name_v) = payload.get("name") {
                        let new_name = as_s(name_v).trim().to_string();
                        if !new_name.is_empty() {
                            existing.as_object_mut().map(|o| o.insert("name".into(), json!(new_name)));
                        }
                    }
                    for k in ["width", "height", "horizontal", "vertical"] {
                        if let Some(v) = payload.get(k) {
                            if !v.is_null() && as_s(v) != "" {
                                let val = as_int(Some(v), existing.get(k).and_then(|x| x.as_i64()).unwrap_or(0));
                                existing.as_object_mut().map(|o| o.insert(k.to_string(), json!(val)));
                            }
                        }
                    }
                    if let Some(v) = payload.get("default_printer") {
                        existing.as_object_mut().map(|o| o.insert("default_printer".into(), json!(as_s(v))));
                    }
                    if let Some(v) = payload.get("custom_config") {
                        let cc = match v {
                            Value::String(s) => s.clone(),
                            other => serde_json::to_string(other).unwrap_or_else(|_| "[]".into()),
                        };
                        existing.as_object_mut().map(|o| o.insert("custom_config".into(), json!(cc)));
                    }
                    if let Some(v) = payload.get("is_default") {
                        let nd = boolish(Some(v));
                        existing.as_object_mut().map(|o| o.insert("is_default".into(), json!(nd)));
                        if nd {
                            for t in tpls.iter_mut() {
                                if t.get("id").and_then(|x| x.as_i64()) != Some(tid) {
                                    t.as_object_mut().map(|o| o.insert("is_default".into(), json!(false)));
                                }
                            }
                        }
                    }
                    existing.as_object_mut().map(|o| o.insert("updated_at".into(), json!(now_iso())));
                    tpls[idx] = existing;
                    sess.as_object_mut().map(|o| o.insert("templates".into(), json!(tpls)));
                    let name_disp = as_s(tpls[idx].get("name").unwrap_or(&Value::Null));
                    sess.as_object_mut().map(|o| o.insert("flash_success".into(), json!(format!("模板「{name_disp}」已更新"))));
                    let template_seq_v = sess.get("template_seq").cloned().unwrap_or(json!(1));
                    store::store_set(ctx.state, "templates", sess.get("templates").cloned().unwrap_or_else(|| json!([])));
                    store::store_set(ctx.state, "template_seq", template_seq_v);
                    if ctx.is_inertia() {
                        ctx.sess = sess;
                        let refer = ctx.referer_path("/template");
                        let target = if refer != "/tag-templates/create" { refer } else { "/template".to_string() };
                        let pg = build_page_for(ctx.state, &target, &mut ctx.sess, None);
                        return inertia_resp(ctx, 200, &pg, None);
                    }
                    ctx.sess = sess;
                    return json_resp(ctx, 200, &json!({"success": true, "data": tpls[idx]}));
                }
            }
        }
    }

    if ctx.is_inertia() {
        ctx.sess = sess;
        let pg = build_page_for(ctx.state, "/template", &mut ctx.sess, None);
        return inertia_resp(ctx, 200, &pg, None);
    }
    let templates_out = sess.get("templates").cloned().unwrap_or(Value::Null);
    ctx.sess = sess;
    json_resp(ctx, 200, &json!({"success": true, "data": templates_out}))
}

fn as_int(v: Option<&Value>, default: i64) -> i64 {
    v.and_then(|x| x.as_i64())
        .or_else(|| v.and_then(|x| x.as_str()).and_then(|s| s.parse().ok()))
        .unwrap_or(default)
}

fn boolish(v: Option<&Value>) -> bool {
    match v {
        Some(Value::Bool(b)) => *b,
        Some(Value::Number(n)) => n.as_i64().map(|x| x != 0).unwrap_or(false),
        Some(Value::String(s)) => {
            let s = s.trim().to_lowercase();
            matches!(s.as_str(), "1" | "true" | "on" | "yes")
        }
        _ => false,
    }
}
