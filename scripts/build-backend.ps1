$ErrorActionPreference = 'Stop'

# 扣单宝后端构建：Rust (axum) → backend-dist/koudanbao-backend.exe（与 Electron 期望同名）
$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
$Rust = Join-Path $Root 'backend-rs'
$Dist = Join-Path $Root 'backend-dist'
# 运行资源源（assets/static/default_custom_config.json 已收拢到 backend-rs）
$Backend = Join-Path $Root 'backend-rs'

# 1. cargo release 构建
Push-Location $Rust
Write-Host '[build-backend] cargo build --release ...'
& cargo build --release
if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'cargo build --release 失败' }
Pop-Location

# 2. 产物 → backend-dist（保持 Electron extraResources 期望的路径/文件名）
New-Item -ItemType Directory -Force $Dist | Out-Null
$Exe = Join-Path $Dist 'koudanbao-backend.exe'
Copy-Item -Force (Join-Path $Rust 'target\release\koudanbao-backend.exe') $Exe

# 3. 运行资源：assets（前端 bundle/css）+ static（图片）+ 配置 + shell 模板
#    打包后 exe 以自身目录为 res_dir，直接读取同目录 assets/static/shell.html
Copy-Item -Recurse -Force (Join-Path $Backend 'assets') (Join-Path $Dist 'assets')
Copy-Item -Recurse -Force (Join-Path $Backend 'static') (Join-Path $Dist 'static')
Copy-Item -Force (Join-Path $Backend 'default_custom_config.json') (Join-Path $Dist 'default_custom_config.json')
Copy-Item -Force (Join-Path $Rust 'assets\shell.html') (Join-Path $Dist 'shell.html')

# 4. 构建期 bundle 补丁（P2-9：官方原版 bundle 部署时强制 isElectron=true，硬断言）
& node (Join-Path $Root 'tools\patch-bundle.js') (Join-Path $Dist 'assets\app-Buzwood0.js')
if ($LASTEXITCODE -ne 0) { throw 'bundle 补丁失败' }

Write-Host "[build-backend] 完成：$Exe"
