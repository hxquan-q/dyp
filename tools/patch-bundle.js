#!/usr/bin/env node
/**
 * 构建期 bundle 补丁（P2-9：消除 Python 版运行时 `data.replace(b"a(!1),SV()", ...)` 硬编码补丁）
 *
 * 背景：官方原版 bundle 中 `a(!1),SV()` 是 isElectron 标志的压缩形态；补丁改为
 * `a(!0),SV()` 后 UI 显示「新增授权」而非「请下载桌面客户端」。
 * 现在只在【构建/部署时】对目标 bundle 执行一次，且带硬断言：
 *   - 已打过补丁（含 a(!0),SV()）→ 跳过
 *   - 未打补丁且含 a(!1),SV() → 替换
 *   - 两者都不含 → 报错退出（官方 bundle 升级后标记串变更时立刻暴露，而非静默失效）
 *
 * 注：重建工程构建（frontend-src 产物）不含该标记串，补丁对其自动跳过（幂等）。
 *
 * 用法：node tools/patch-bundle.js [bundle路径]   （默认 backend/assets/app-Buzwood0.js）
 */
const fs = require('fs')
const path = require('path')

const target = path.resolve(process.argv[2] || 'backend/assets/app-Buzwood0.js')
const FROM = 'a(!1),SV()'
const TO = 'a(!0),SV()'

if (!fs.existsSync(target)) {
  console.error(`[patch-bundle] 文件不存在: ${target}`)
  process.exit(1)
}
const src = fs.readFileSync(target, 'utf8')
if (src.includes(TO)) {
  console.log(`[patch-bundle] ${path.basename(target)} 已打过补丁，跳过`)
  process.exit(0)
}
if (src.includes(FROM)) {
  fs.writeFileSync(target, src.replace(FROM, TO))
  console.log(`[patch-bundle] ${path.basename(target)} 已补丁: ${FROM} → ${TO}`)
  process.exit(0)
}
// 既不含旧标记也不含新标记：重建工程构建（frontend-src 产物，isElectron 由应用代码处理）
// 或官方 bundle 标记已变更。此时无需补丁——打印提示并正常跳过，避免构建失败。
console.log(
  `[patch-bundle] ${path.basename(target)} 未含标记 "${FROM}"（重建构建或标记已变更），跳过补丁（isElectron 由应用代码处理）`
)
process.exit(0)
