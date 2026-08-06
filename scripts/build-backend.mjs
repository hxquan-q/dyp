// scripts/build-backend.mjs —— 跨平台 Rust 后端构建（Windows / macOS）
// ==================================================================
// 对齐原 scripts/build-backend.ps1 行为：
//   1. cargo build --release
//   2. 产物 → backend-dist/（平台对应文件名：win32 → koudanbao-backend.exe，其他 → koudanbao-backend）
//   3. 运行资源（backend-rs/assets + static + default_custom_config.json + shell.html）
//   4. 构建期 bundle 补丁（patch-bundle.js，幂等；重建构建自动跳过）
// 用法：node scripts/build-backend.mjs
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rust = path.join(root, 'backend-rs')
const dist = path.join(root, 'backend-dist')

function run(cmd, opts = {}) {
  console.log(`[build-backend] ${cmd}`)
  execSync(cmd, { stdio: 'inherit', ...opts })
}

// 1. cargo release 构建
run('cargo build --release', { cwd: rust })

// 2. 产物 → backend-dist（保持 Electron extraResources 期望的路径/文件名）
fs.mkdirSync(dist, { recursive: true })
const exeName = process.platform === 'win32' ? 'koudanbao-backend.exe' : 'koudanbao-backend'
const srcExe = path.join(rust, 'target', 'release', exeName)
if (!fs.existsSync(srcExe)) {
  throw new Error(`release 产物缺失: ${srcExe}（请确认 cargo build --release 成功）`)
}
fs.copyFileSync(srcExe, path.join(dist, exeName))

// 3. 运行资源：assets（前端 bundle/css）+ static（图片）+ 配置 + shell 模板
// 3.0 若 frontend-src/dist 存在，先同步最新前端构建产物到 backend-rs/assets（排除 sourcemap）
const frontendDist = path.join(root, 'frontend-src', 'dist', 'assets')
if (fs.existsSync(path.join(frontendDist, 'app-Buzwood0.js'))) {
  console.log('[build-backend] 同步前端构建产物 frontend-src/dist/assets → backend-rs/assets')
  fs.cpSync(frontendDist, path.join(rust, 'assets'), {
    recursive: true,
    force: true,
    filter: (src) => !src.endsWith('.map'),
  })
}
fs.cpSync(path.join(rust, 'assets'), path.join(dist, 'assets'), {
  recursive: true,
  force: true,
  filter: (src) => !src.endsWith('.map'),
})
fs.cpSync(path.join(rust, 'static'), path.join(dist, 'static'), { recursive: true, force: true })
fs.copyFileSync(path.join(rust, 'default_custom_config.json'), path.join(dist, 'default_custom_config.json'))
fs.copyFileSync(path.join(rust, 'assets', 'shell.html'), path.join(dist, 'shell.html'))

// 4. 构建期 bundle 补丁（P2-9：幂等，重建构建自动跳过）
run(`node ${JSON.stringify(path.join(root, 'tools', 'patch-bundle.js'))} ${JSON.stringify(path.join(dist, 'assets', 'app-Buzwood0.js'))}`)

console.log(`[build-backend] 完成：${path.join(dist, exeName)}`)
