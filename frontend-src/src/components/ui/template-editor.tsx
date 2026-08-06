import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * 模板编辑器占位组件
 * ------------------------------------------------------------------
 * 官方 TemplateFieldItem（画布字段项）/ SizeDialog（尺寸选择弹窗）
 * 是拖拽编辑器的核心交互组件。反转版引用时用占位保证布局不崩。
 * 完整实现可在后续替换（src/_reverse-ref/Deduction_EditTemplate.src.js 有原始逻辑）。
 */

export function TemplateFieldItem({
  item,
  selected,
  onSelect,
  onChange,
  zoom = 1,
  canvasWidth,
  canvasHeight,
  className,
}: {
  item?: any;
  selected?: boolean;
  onSelect?: (id: any) => void;
  onChange?: (id: any, patch: any) => void;
  zoom?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  className?: string;
}) {
  const name = item?.showName || item?.aliasName || '字段';
  return (
    <div
      className={cn(
        'absolute border border-dashed px-1 py-0.5 text-[10px] leading-tight overflow-hidden cursor-pointer select-none',
        selected
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-gray-300 text-gray-700 hover:border-blue-400',
        className,
      )}
      style={{
        left: (item?.left || 0) * 4 * zoom,
        top: (item?.top || 0) * 4 * zoom,
        width: (item?.width || 60) * 4 * zoom,
        height: (item?.height || 18) * 4 * zoom,
      }}
      onClick={() => onSelect?.(item?.id)}
      data-testid="template-field-item"
    >
      {name}
    </div>
  );
}

const SIZE_PRESETS = [
  { label: '50mm × 30mm', value: '50mm*30mm', width: 50, height: 30 },
  { label: '40mm × 30mm', value: '40mm*30mm', width: 40, height: 30 },
  { label: '50mm × 40mm', value: '50mm*40mm', width: 50, height: 40 },
  { label: '60mm × 40mm', value: '60mm*40mm', width: 60, height: 40 },
];

export function SizeDialog({
  open,
  onOpenChange,
  onConfirm,
  onInvalid,
  title = '选择模板尺寸',
  initialSize = '50mm*30mm',
  initialWidth,
  initialHeight,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (v: { width: number; height: number }) => void;
  onInvalid?: (msg: string) => void;
  title?: string;
  initialSize?: string;
  initialWidth?: number;
  initialHeight?: number;
}) {
  const [width, setWidth] = React.useState<number>(initialWidth || 50);
  const [height, setHeight] = React.useState<number>(initialHeight || 30);

  if (!open) return null;

  const handleConfirm = () => {
    if (!width || width <= 0 || !height || height <= 0) {
      onInvalid?.('请输入有效的模板尺寸');
      return;
    }
    onConfirm({ width, height });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-[420px] rounded-lg border border-gray-200 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-lg font-semibold text-gray-900">{title}</div>
        <div className="mt-4 space-y-4">
          <div className="text-sm text-gray-700">选择模板尺寸</div>
          <div className="grid grid-cols-2 gap-2">
            {SIZE_PRESETS.map((size) => (
              <button
                key={size.value}
                type="button"
                className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                onClick={() => {
                  setWidth(size.width);
                  setHeight(size.height);
                }}
              >
                {size.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm text-gray-600">宽度(mm)</label>
              <input
                type="number"
                className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-600">高度(mm)</label>
              <input
                type="number"
                className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
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
      </div>
    </div>
  );
}
