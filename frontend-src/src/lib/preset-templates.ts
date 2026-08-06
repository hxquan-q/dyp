/**
 * 预设打印模板数据（纯数据文件，避免 114KB 单行源码）
 * ==================================================================
 * 数据源：preset-templates.json
 *   —— 由 scripts/extract-preset-templates.mjs 从官方 bundle 提取（roundtrip 校验通过）
 * 导出：xW / rp（与原单行版完全一致，反向引用方零改动）
 */
import presetData from './preset-templates.json'

/** 完整预置模板（9 尺寸 × 3 模板）——官方 xW */
export const xW = presetData.xW

/** 模板字段/尺寸规则数据——官方 rp */
export const rp = presetData.rp

export default presetData
