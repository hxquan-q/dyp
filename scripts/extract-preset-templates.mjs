// 一次性工具：提取 preset-templates.ts 的数据到 preset-templates.json
// 用法：node scripts/extract-preset-templates.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import esbuild from 'esbuild'

const libDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'frontend-src', 'src', 'lib')
const srcFile = path.join(libDir, 'preset-templates.ts')
const src = fs.readFileSync(srcFile, 'utf8')

// TS → CJS（esbuild transform）
const { code } = await esbuild.transform(src, { loader: 'ts', format: 'cjs' })
const mod = { exports: {} }
new Function('module', 'exports', code)(mod, mod.exports)
const keys = Object.keys(mod.exports)
console.log('exported keys:', keys)

const xW = mod.exports.xW
const rp = mod.exports.rp
if (!Array.isArray(xW)) throw new Error('xW 不是数组')
console.log('xW length:', xW.length, '| rp type:', typeof rp, Array.isArray(rp) ? `array(${rp.length})` : '')

// 写 JSON（roundtrip 验证）
const jsonPath = path.join(libDir, 'preset-templates.json')
const json = JSON.stringify({ xW, rp })
fs.writeFileSync(jsonPath, json, 'utf8')
console.log('written:', jsonPath, 'size:', json.length)

// roundtrip 校验：解析回来与内存对象完全一致
const back = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
if (JSON.stringify(back.xW) !== JSON.stringify(xW)) throw new Error('xW roundtrip 不一致')
if (JSON.stringify(back.rp) !== JSON.stringify(rp)) throw new Error('rp roundtrip 不一致')
console.log('roundtrip OK')
