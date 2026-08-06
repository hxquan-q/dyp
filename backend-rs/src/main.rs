#![recursion_limit = "256"]
//! 扣单宝本地 SaaS Mock —— Rust (axum) 版
//!
//! 与 Python server.py 契约等价（HTTP + Inertia data-page + 菜鸟 WS mock）。
//! 修复项：P0-1 持久化并发安全（锁 + 原子写）、P0-2 snake_case 契约、
//! P2-9 无运行时字节补丁、P1-3 模块化。

mod cainiao_ws;
mod domain;
mod electron;
mod engine;
mod handlers;
mod inertia;
mod log;
mod shops;
mod state;
mod store;
mod templates;
mod util;

use axum::Router;
use clap::Parser;
use std::path::PathBuf;
use std::sync::Arc;

/// 开发模式判定：exe 位于 cargo target 目录（backend-rs 内）即 dev
fn is_frozen() -> bool {
    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    std::env::current_exe()
        .map(|exe| !exe.starts_with(&manifest))
        .unwrap_or(false)
}

/// 资源目录解析（assets/ + static/ 所在目录；M1 后资源收拢到 backend-rs/）
fn resolve_res_dir() -> PathBuf {
    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Ok(d) = std::env::var("KDB_RES_DIR") {
        candidates.push(PathBuf::from(d));
    }
    if let Ok(exe) = std::env::current_exe()
        && let Some(parent) = exe.parent()
    {
        candidates.push(parent.to_path_buf());
    }
    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(cwd.clone());
        candidates.push(cwd.join("backend-rs"));
    }
    // cargo manifest 相对（cwd 非项目根时兜底到 backend-rs 自身）
    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    candidates.push(manifest);

    for c in &candidates {
        if c.join("assets").join("app-Buzwood0.js").is_file() && c.join("static").is_dir() {
            return c.clone();
        }
    }
    // 兜底：最后一个候选（通常 backend-rs/）
    candidates
        .into_iter()
        .next_back()
        .unwrap_or_else(|| PathBuf::from("."))
}

/// shell.html 解析（dev 在 backend-rs/assets；打包后随 exe 分发）
fn resolve_shell_path(res_dir: &std::path::Path) -> PathBuf {
    if let Ok(p) = std::env::var("KDB_SHELL") {
        return PathBuf::from(p);
    }
    if let Ok(exe) = std::env::current_exe()
        && let Some(parent) = exe.parent()
    {
        let p = parent.join("shell.html");
        if p.is_file() {
            return p;
        }
    }
    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let p = manifest.join("assets").join("shell.html");
    if p.is_file() {
        return p;
    }
    res_dir.join("shell.html")
}

#[derive(Parser, Debug)]
#[command(
    name = "koudanbao-backend",
    version,
    about = "扣单宝本地 SaaS Mock (Rust)"
)]
struct Args {
    #[arg(long, default_value = "127.0.0.1")]
    host: String,
    #[arg(long, default_value_t = 8787)]
    port: u16,
    #[arg(long, help = "运行数据目录；也可用环境变量 KDB_DATA_DIR 设置")]
    data_dir: Option<String>,
    #[arg(
        long,
        help = "服务启动后输出一行 JSON ready 事件，便于 Electron/脚本读取动态端口"
    )]
    print_json_ready: bool,
    #[arg(
        long,
        default_value = "local",
        help = "认证模式：local（本地零门槛）/ cloud（未来云账号登录）"
    )]
    auth_mode: String,
    #[arg(
        long,
        help = "关闭自动登录；仍可用任意手机号+任意密码 POST /login（cloud 模式下生效）"
    )]
    no_auto_login: bool,
}

#[tokio::main]
async fn main() {
    let args = Args::parse();
    let frozen = is_frozen();

    let res_dir = resolve_res_dir();
    let assets_dir = res_dir.join("assets");
    let static_dir = res_dir.join("static");
    let shell_path = resolve_shell_path(&res_dir);

    // 数据目录：--data-dir > KDB_DATA_DIR > (frozen? %APPDATA%/Koudanbao : res_dir)
    let data_dir = match &args.data_dir {
        Some(d) => PathBuf::from(d),
        None => state::AppState::resolve_data_dir(args.data_dir.clone(), frozen),
    };
    if !data_dir.exists() {
        let _ = std::fs::create_dir_all(&data_dir);
    }

    let auth_mode = if args.auth_mode == "cloud" {
        "cloud".to_string()
    } else {
        "local".to_string()
    };
    // auth.mode=local（默认）：永远零门槛自动登录；cloud 模式下可用 --no-auto-login 开启登录门
    let auto_login = auth_mode == "local" || !args.no_auto_login;
    let state = Arc::new(state::AppState::new(
        data_dir.clone(),
        assets_dir.clone(),
        static_dir,
        auto_login,
        auth_mode.clone(),
    ));
    // 预载 shell 模板（启动即校验资源，缺则提前暴露）
    let shell = std::fs::read_to_string(&shell_path).unwrap_or_else(|e| {
        eprintln!("[mock] shell.html 读取失败（{shell_path:?}）: {e}");
        String::new()
    });
    let _ = state.shell.set(shell);

    // 菜鸟打印组件 mock（独立端口，失败不影响主服务）
    tokio::spawn(cainiao_ws::run());

    // 绑定 + 启动 HTTP
    let addr = format!("{}:{}", args.host, args.port);
    let listener = match tokio::net::TcpListener::bind(&addr).await {
        Ok(l) => l,
        Err(e) => {
            eprintln!("[mock] 绑定 {addr} 失败: {e}");
            std::process::exit(1);
        }
    };
    let actual_port = listener.local_addr().map(|a| a.port()).unwrap_or(args.port);
    let base = format!("http://{}:{actual_port}", args.host);

    if args.print_json_ready {
        println!(
            "{}",
            serde_json::json!({
                "event": "ready",
                "host": args.host,
                "port": actual_port,
                "url": base,
                "dataDir": data_dir,
            })
        );
    }
    println!("============================================================");
    println!("  扣单宝 Local SaaS Mock (Rust)");
    println!("  listen     : {base}");
    println!("  data dir   : {}", data_dir.display());
    println!("  assets     : {}", assets_dir.display());
    println!("  auth-mode  : {auth_mode}");
    println!("  auto-login : {auto_login}");
    println!("  login page : {base}/login");
    println!("  dashboard  : {base}/dashboard");
    println!("============================================================");

    let app = Router::new().fallback(handlers::dispatch).with_state(state);
    if let Err(e) = axum::serve(listener, app).await {
        eprintln!("[mock] server error: {e}");
    }
}
