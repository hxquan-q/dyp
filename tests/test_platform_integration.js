// 真实平台集成逻辑测试：抖店订单解密响应解析 + 平台采集脚本
// 不依赖真实账号；验证真实集成代码（main.js extractUserInfo + preload 采集脚本）
const fs = require('fs')
const path = require('path')

let pass = 0, fail = 0
function check(name, cond, detail = '') {
  if (cond) pass++
  else { fail++; console.log(`  FAIL ${name}: ${detail}`) }
}

// ── 1. 真实 main.js 的 extractUserInfo ──
const mainJs = fs.readFileSync(path.join(__dirname, '..', 'electron', 'main.js'), 'utf-8')
const m = mainJs.match(/function extractUserInfo\([^]*?\n\}/)
if (!m) { console.log('extractUserInfo not found'); process.exit(1) }
const fnSource = m[0].replace(/\/\/[^\n]*/g, '') // strip comments
const extract = new Function('return ' + fnSource.replace(/^function extractUserInfo/, 'function extractUserInfo'))()

// 真实 pigeon user_fuzzy_search 响应（contact_search_result 路径）
const resp1 = { data: { contact_search_result: { user_search_data_list: [
  { user_search_info: { user_id: '123456', nick_name: '小明', avatar: 'a.jpg' } },
  { user_search_info: { user_id: '654321', nick_name: '小红' } }
] } } }
let r = extract(resp1)
check('extractUserInfo contact_search_result', r && r.user_name === '小明' && r.user_id === '123456', JSON.stringify(r))

const resp2 = { data: { conversation_search_result: { user_search_data_list: [
  { user_search_info: { user_id: '888', nickname: '阿强' } }
] } } }
r = extract(resp2)
check('extractUserInfo conversation_search_result', r && r.user_name === '阿强' && r.user_id === '888', JSON.stringify(r))

for (const key of ['users', 'list', 'result', 'items']) {
  const resp = { data: { [key]: [{ nick: '老王', user_id: '77' }] } }
  r = extract(resp)
  check(`extractUserInfo ${key} 路径`, r && r.user_name === '老王', JSON.stringify(r))
}

check('extractUserInfo 脱敏昵称拒绝', extract({ data: { users: [{ nickname: '张**' }] } }) === null)
check('extractUserInfo 空列表', extract({ data: { users: [] } }) === null)
check('extractUserInfo 无data', extract({ foo: 1 }) === null)
check('extractUserInfo None', extract(null) === null)

// ── 2. 采集脚本（可选逐字节一致原件 + 固有结构检查）──
const origDir = process.env.KDB_ORIGINAL_PRELOAD_DIR || ''
const hasOrigDir = origDir && fs.existsSync(origDir)
if (!hasOrigDir) {
  console.log('  SKIP 原版逐字节比对：未设置 KDB_ORIGINAL_PRELOAD_DIR 或目录不存在')
}
const preloadDir = path.join(__dirname, '..', 'electron', 'preload')
for (const f of ['xhs-live-capture.js', 'xhs-order-sync-capture.js']) {
  const recon = fs.readFileSync(path.join(preloadDir, f), 'utf-8')
  if (hasOrigDir) {
    const orig = fs.readFileSync(path.join(origDir, f), 'utf-8')
    check(`${f} 与原版逐字节一致`, recon === orig)
  }
  const hasCapture = /websocket|fetch|xmlhttp|message/i.test(recon)
  const hasData = f.includes('order') ? /order|purchase/i.test(recon) : /comment|danmaku|message/i.test(recon)
  check(`${f} 含网络采集逻辑`, hasCapture)
  check(`${f} 含业务数据字段`, hasData)
}

// ── 3. 主进程结构 marker ──
const main = fs.readFileSync(path.join(__dirname, '..', 'legacy', 'main-process-reverse', 'index.js'), 'utf-8')
for (const marker of ['douyin', 'taobao', 'xiaohongshu', 'channels', 'wxstore', 'jinritemai',
                      'flushMatchedBuffer', 'matchSingleRule', 'matchGridRule', 'preMatchRules',
                      'pigeon', 'server-sync', 'live-sync']) {
  check(`主进程含 ${marker}`, main.includes(marker))
}

console.log(`\n=== 真实平台集成逻辑测试: ${pass} 通过, ${fail} 失败 ===`)
process.exit(fail ? 1 : 0)
