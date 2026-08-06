//! 菜鸟打印组件 WebSocket mock（对齐 mock_cainiao_ws.py，监听 127.0.0.1:13528）。

use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use std::net::SocketAddr;
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::accept_async;

const CAINIAO_HOST: &str = "127.0.0.1";
const CAINIAO_PORT: u16 = 13528;
pub const MOCK_PRINTERS: [&str; 2] = ["扣单宝-Mock-打印机", "扣单宝-Mock-打印机-2"];

fn response_for(req: &Value) -> Value {
    let cmd = req.get("cmd").and_then(|v| v.as_str()).unwrap_or("");
    let request_id = req.get("requestID").cloned();
    match cmd {
        "getPrinterList" | "getPrinters" => json!({
            "cmd": cmd, "code": 0, "printerList": MOCK_PRINTERS
        }),
        "print" => json!({
            "cmd": cmd, "code": 0, "success": true, "requestID": request_id
        }),
        "getAgentInfo" | "getAppInfo" | "getGlobalConfig" => json!({
            "cmd": cmd, "code": 0, "data": {"version": "1.0", "name": "mock-cainiao"}, "requestID": request_id
        }),
        "getPrinterConfig" => json!({
            "cmd": cmd, "code": 0, "data": {}
        }),
        "setPrinterConfig" => json!({
            "cmd": cmd, "code": 0, "success": true
        }),
        _ => json!({
            "cmd": cmd, "code": 0, "data": {}
        }),
    }
}

async fn handle_connection(stream: TcpStream, _peer: SocketAddr) {
    let ws_stream = match accept_async(stream).await {
        Ok(ws) => ws,
        Err(_) => return,
    };
    let (mut sender, mut receiver) = ws_stream.split();
    while let Some(Ok(msg)) = receiver.next().await {
        let text = match msg {
            tokio_tungstenite::tungstenite::Message::Text(t) => t.to_string(),
            tokio_tungstenite::tungstenite::Message::Binary(b) => String::from_utf8_lossy(&b).to_string(),
            tokio_tungstenite::tungstenite::Message::Close(_) => break,
            _ => continue,
        };
        let req: Value = serde_json::from_str(&text).unwrap_or_else(|_| json!({}));
        let resp = response_for(&req);
        let out = serde_json::to_string(&resp).unwrap_or_else(|_| "{}".into());
        if sender.send(tokio_tungstenite::tungstenite::Message::Text(out.into())).await.is_err() {
            break;
        }
    }
}

/// 启动菜鸟 WS mock（对齐 run_cainiao_mock；失败不影响主服务）
pub async fn run() {
    let addr = format!("{CAINIAO_HOST}:{CAINIAO_PORT}");
    let listener = match TcpListener::bind(&addr).await {
        Ok(l) => l,
        Err(e) => {
            eprintln!("[mock-cainiao] 端口 {CAINIAO_PORT} 可能被占用: {e}");
            return;
        }
    };
    println!("[mock-cainiao] WebSocket listening ws://{addr}");
    loop {
        match listener.accept().await {
            Ok((stream, peer)) => {
                tokio::spawn(handle_connection(stream, peer));
            }
            Err(_) => break,
        }
    }
}
