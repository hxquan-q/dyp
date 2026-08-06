@echo off
chcp 65001 >nul
cd /d %~dp0
echo Starting koudanbao backend on http://127.0.0.1:8787
if exist backend-dist\koudanbao-backend.exe (
  echo [backend] Rust (axum) 版
  backend-dist\koudanbao-backend.exe --host 127.0.0.1 --port 8787
) else (
  echo [backend] 未找到 backend-dist\koudanbao-backend.exe
  echo 请先运行: npm run build:backend
  pause
)
