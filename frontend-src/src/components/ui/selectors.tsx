import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * 反转版占位选择器组件
 * ------------------------------------------------------------------
 * 官方 TemplateSelect（模板选择）/ PrinterSelect（打印机选择）是复杂业务组件，
 * 反转版引用时用简单下拉占位，保证布局不崩。后续可替换为完整实现。
 */

interface SelectorOption {
  id?: number | string
  name?: string
  [key: string]: any
}

export function TemplateSelect({
  value,
  onValueChange,
  templateList = [],
  width = '200px',
  className,
}: {
  value?: any
  onValueChange?: (v: any) => void
  templateList?: SelectorOption[]
  width?: string
  className?: string
}) {
  return (
    <select
      className={cn('h-8 rounded-md border border-gray-300 bg-white px-2 text-xs', className)}
      style={{ width }}
      value={value ?? ''}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      <option value="">请选择模板</option>
      {templateList.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  )
}

export function PrinterSelect({
  value,
  onValueChange,
  printerList = [],
  width = '200px',
  className,
  refreshing,
  onRefresh,
}: {
  value?: any
  onValueChange?: (v: any) => void
  printerList?: SelectorOption[]
  width?: string
  className?: string
  refreshing?: boolean
  onRefresh?: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      <select
        className={cn('h-8 rounded-md border border-gray-300 bg-white px-2 text-xs', className)}
        style={{ width }}
        value={value ?? ''}
        onChange={(e) => onValueChange?.(e.target.value === '0' ? 0 : e.target.value)}
      >
        <option value="">请选择打印机</option>
        {printerList.map((p) => (
          <option key={p.id ?? p.name} value={p.id ?? p.name}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
        onClick={onRefresh}
        title="刷新打印机"
      >
        {refreshing ? '...' : '刷新'}
      </button>
    </div>
  )
}
