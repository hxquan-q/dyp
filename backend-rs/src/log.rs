//! 轻量双通道日志：system（请求/事件，同时打终端）与 live（结构化弹幕扣数记录）。
//! 对齐 Python logger.py 的目录布局：<data_dir>/logs/{system,live}.log。

use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Logger {
    data_dir: PathBuf,
    sys: Mutex<std::fs::File>,
    live: Mutex<std::fs::File>,
}

impl Logger {
    pub fn init(data_dir: &std::path::Path) -> Self {
        let log_dir = data_dir.join("logs");
        let _ = std::fs::create_dir_all(&log_dir);
        let sys = OpenOptions::new()
            .create(true)
            .append(true)
            .open(log_dir.join("system.log"))
            .unwrap_or_else(|_| {
                // 极退化：stdout 兜底（不会触发——测试脚本总会给可写 data dir）
                std::fs::OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open(std::env::temp_dir().join("kdb-system-fallback.log"))
                    .expect("cannot open system log")
            });
        let live = OpenOptions::new()
            .create(true)
            .append(true)
            .open(log_dir.join("live.log"))
            .unwrap_or_else(|_| {
                std::fs::OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open(std::env::temp_dir().join("kdb-live-fallback.log"))
                    .expect("cannot open live log")
            });
        Logger {
            data_dir: log_dir,
            sys: Mutex::new(sys),
            live: Mutex::new(live),
        }
    }

    /// [SYSTEM] 级别：写文件 + 终端（INFO 级别仅终端；全部写文件）
    pub fn sys(&self, level: &str, msg: &str) {
        let line = format!(
            "{} {} {}\n",
            chrono::Local::now().format("%Y-%m-%d %H:%M:%S"),
            level,
            msg
        );
        if let Ok(mut f) = self.sys.lock() {
            let _ = f.write_all(line.as_bytes());
        }
        eprintln!("[SYSTEM] {level} {msg}");
    }

    pub fn info(&self, msg: &str) {
        self.sys("INFO", msg);
    }

    /// 直播记录：一行一条 JSON（对齐 live_log_record）
    pub fn live(&self, record: &serde_json::Value) {
        let line = serde_json::to_string(record).unwrap_or_else(|_| "{}".into());
        if let Ok(mut f) = self.live.lock() {
            let _ = writeln!(f, "{line}");
        }
    }

    #[allow(dead_code)]
    pub fn data_dir(&self) -> &std::path::Path {
        &self.data_dir
    }
}
