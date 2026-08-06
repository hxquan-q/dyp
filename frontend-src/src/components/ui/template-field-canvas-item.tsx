import * as React from 'react'
import { cn } from '@/lib/utils'

/** clamp 辅助（官方 am） */
function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max)
}

/**
 * 画布字段项（官方 CW 完整逻辑）
 * ------------------------------------------------------------------
 * - 点击选中（提升 zIndex）
 * - 拖拽移动：onMouseDown 记录起点，mousemove 时按 zoom 换算位移，
 *   用 clamp 限制在画布边界内（left/top ∈ [0, canvas - 自身尺寸]）
 * - 右下角缩放把手：宽高按 zoom 换算，clamp 最小 40x18
 * - locked 字段不可拖拽/缩放
 * - id 11(黑名单)/15(免单) 固定高 zIndex
 */
export function TemplateFieldCanvasItem({
  item,
  selected,
  onSelect,
  onChange,
  zoom,
  canvasWidth,
  canvasHeight,
}: {
  item: any
  selected: boolean
  onSelect: (id: number) => void
  onChange: (id: number, patch: any) => void
  zoom: number
  canvasWidth: number
  canvasHeight: number
}) {
  // 拖拽移动
  const startDrag = (e: React.MouseEvent) => {
    if (item.locked) return
    e.preventDefault()
    e.stopPropagation()
    onSelect(item.id)
    const startX = e.clientX
    const startY = e.clientY
    const origLeft = item.left
    const origTop = item.top
    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / zoom
      const dy = (ev.clientY - startY) / zoom
      onChange(item.id, {
        left: clamp(origLeft + dx, 0, canvasWidth - item.width),
        top: clamp(origTop + dy, 0, canvasHeight - item.height),
      })
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // 右下角缩放
  const startResize = (e: React.MouseEvent) => {
    if (item.locked) return
    e.preventDefault()
    e.stopPropagation()
    onSelect(item.id)
    const startX = e.clientX
    const startY = e.clientY
    const origW = item.width
    const origH = item.height
    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / zoom
      const dy = (ev.clientY - startY) / zoom
      onChange(item.id, {
        width: clamp(origW + dx, 40, canvasWidth - item.left),
        height: clamp(origH + dy, 18, canvasHeight - item.top),
      })
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const displayText = item.custom
    ? item.showName
    : item.id === 11
      ? '黑'
      : item.id === 15
        ? item.showName || '免'
        : item.aliasName

  return (
    <div
      className={cn(
        'absolute shadow-sm border cursor-move bg-white',
        selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      )}
      style={{
        left: item.left,
        top: item.top,
        width: item.width,
        height: item.height,
        zIndex: [11, 15].includes(item.id) ? 1111 : item.zIndex ?? 1,
      }}
      onMouseDown={startDrag}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(item.id)
      }}
    >
      <div
        className="w-full h-full flex items-center justify-start text-left px-2 select-none pointer-events-none overflow-hidden"
        style={{
          fontSize: `${item.fontSize}px`,
          fontFamily: item.fontFamily,
          fontWeight: item.fontWeight,
        }}
      >
        <span
          style={{
            display: 'block',
            width: '100%',
            textAlign: item.mirror ? 'right' : 'left',
            transform: item.mirror ? 'scaleX(-1)' : 'none',
            transformOrigin: 'center',
          }}
        >
          {displayText}
        </span>
      </div>
      {selected && (
        <div
          className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border border-blue-500 rounded-full cursor-se-resize flex items-center justify-center text-[10px]"
          onMouseDown={startResize}
        >
          ↘
        </div>
      )}
    </div>
  )
}
