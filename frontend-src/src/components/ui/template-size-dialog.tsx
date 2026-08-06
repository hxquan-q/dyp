import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { rp, li, Vd } from '@/lib/reverse-runtime'

/**
 * 模板尺寸选择弹窗（官方 cw 完整逻辑）
 * ------------------------------------------------------------------
 * 从预置模板列表（rp）选择尺寸，或选「自定义」输入宽高。
 * 确认时回调 onConfirm({ width, height, sizeKey })。
 */
export function TemplateSizeDialog({
  open,
  onOpenChange,
  onConfirm,
  onInvalid,
  title = '选择模板尺寸',
  initialSize = '50mm*30mm',
  initialWidth = 50,
  initialHeight = 30,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: (v: { width: number; height: number; sizeKey: string }) => void
  onInvalid?: (msg: string) => void
  title?: string
  initialSize?: string
  initialWidth?: number
  initialHeight?: number
}) {
  const presets = React.useMemo(
    () =>
      rp.map((t: any) => ({
        value: li(t.size),
        label: li(t.size),
        width: Number(t.width),
        height: Number(t.height),
      })),
    []
  )

  const [selectedSize, setSelectedSize] = React.useState(initialSize)
  const [customWidth, setCustomWidth] = React.useState(initialWidth ? String(initialWidth) : '')
  const [customHeight, setCustomHeight] = React.useState(initialHeight ? String(initialHeight) : '')

  React.useEffect(() => {
    if (!open) return
    // 从 initialSize 解析当前选中的尺寸（可能为 custom）
    const found = presets.find((p: any) => p.value === li(initialSize))
    if (found) {
      setSelectedSize(found.value)
      setCustomWidth(String(found.width))
      setCustomHeight(String(found.height))
    } else {
      setSelectedSize(Vd)
      setCustomWidth(String(initialWidth || ''))
      setCustomHeight(String(initialHeight || ''))
    }
  }, [open, initialSize, initialWidth, initialHeight, presets])

  const handleConfirm = () => {
    if (selectedSize === Vd) {
      if (!customWidth || !customHeight) {
        onInvalid?.('请输入完整的自定义宽高')
        return
      }
      const w = Number(customWidth)
      const h = Number(customHeight)
      if (!w || !h) {
        onInvalid?.('请输入有效的自定义宽高')
        return
      }
      onConfirm({ width: w, height: h, sizeKey: Vd })
      return
    }
    const found = presets.find((p: any) => p.value === selectedSize)
    if (found) onConfirm({ width: found.width, height: found.height, sizeKey: found.value })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 预置尺寸 */}
          <div>
            <div className="mb-2 text-sm font-medium text-gray-700">预置尺寸</div>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p: any) => (
                <button
                  key={p.value}
                  type="button"
                  className={cn(
                    'rounded-md border px-3 py-2 text-sm transition',
                    selectedSize === p.value
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                  onClick={() => setSelectedSize(p.value)}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                className={cn(
                  'rounded-md border px-3 py-2 text-sm transition',
                  selectedSize === Vd
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                )}
                onClick={() => setSelectedSize(Vd)}
              >
                自定义
              </button>
            </div>
          </div>
          {/* 自定义宽高 */}
          {selectedSize === Vd && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">宽度(mm)</label>
              <input
                type="number"
                className="h-9 w-24 rounded-md border border-gray-300 px-3 text-sm"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
              />
              <label className="text-sm text-gray-600">高度(mm)</label>
              <input
                type="number"
                className="h-9 w-24 rounded-md border border-gray-300 px-3 text-sm"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => onOpenChange(false)}
          >
            取消
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
            onClick={handleConfirm}
          >
            确定
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
