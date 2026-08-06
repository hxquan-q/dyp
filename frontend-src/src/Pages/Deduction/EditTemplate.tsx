import * as React from 'react';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/toast-provider';
import { TemplateFieldCanvasItem } from '@/components/ui/template-field-canvas-item';
import { TemplateSizeDialog } from '@/components/ui/template-size-dialog';
import { PrinterSelect } from '@/components/ui/selectors';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { http } from '@/lib/http';
import { cnService, jW, qd, rp, xW, li, Vd, MC, SW, NW, _W, vi } from '@/lib/reverse-runtime';

/**
 * 模板编辑器（复刻官方 EditTemplate 完整实现）
 * ==================================================================
 * 三栏布局：
 *   左 220px  展示信息（字段勾选显示 + 点击选中，设 zIndex 置顶）
 *   中 1fr    画布（点阵背景，按 zoom 缩放，字段可拖拽移动 + 右下角缩放）
 *   右 320px  属性编辑（表头文本/字号/字重/字体/锁定/镜像 + 序号编码格式）
 *
 * 支持：预置模板切换、自定义尺寸、打印测试页、保存为 custom_config JSON。
 */
export default function EditTemplate() {
  const page = usePage() as any;
  const props = page.props ?? {};
  const template = props.template ?? null;

  const { showError, showToast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const presetWidth = params.get('width');
  const presetHeight = params.get('height');

  // 字段列表（来自模板 custom_config，或默认字段）
  const [fields, setFields] = React.useState<any[]>(() => jW(template?.custom_config));
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [zoom, setZoom] = React.useState(2);
  const [printers, setPrinters] = React.useState<any[]>([]);
  const [selectedSize, setSelectedSize] = React.useState('50mm*30mm');
  const [presetIndex, setPresetIndex] = React.useState(0);
  const [presetGroups, setPresetGroups] = React.useState<any[]>([]);
  const [sizeDialogOpen, setSizeDialogOpen] = React.useState(false);
  const [printDialogOpen, setPrintDialogOpen] = React.useState(false);

  // 模板基础信息
  const [form, setForm] = React.useState({
    id: template?.id ?? null,
    name: template?.name ?? '',
    horizontal: Math.abs(template?.horizontal ?? 0),
    vertical: Math.abs(template?.vertical ?? 0),
    width: template?.width ?? (presetWidth ? Number(presetWidth) : 50),
    height: template?.height ?? (presetHeight ? Number(presetHeight) : 30),
    is_default: Boolean(template?.is_default),
    default_printer: template?.default_printer ?? '',
    horizontal_direction: (template?.horizontal ?? 0) < 0 ? 'left' : 'right',
    vertical_direction: (template?.vertical ?? 0) < 0 ? 'up' : 'down',
  });
  const [saving, setSaving] = React.useState(false);

  // 画布尺寸（1mm = 4px 减 4，与官方一致）
  const canvasWidth = React.useMemo(() => {
    const w = Number(form.width);
    return w > 0 ? w * 4 - 4 : 196;
  }, [form.width]);
  const canvasHeight = React.useMemo(() => {
    const h = Number(form.height);
    return h > 0 ? h * 4 - 4 : 116;
  }, [form.height]);

  const selectedField = fields.find((f) => f.id === selectedId) ?? null;
  const { state: sidebarState, open: sidebarOpen } = vi();
  const footerWidth = sidebarState === 'collapsed' || !sidebarOpen ? '20px' : '225px';

  // 加载打印机
  const loadPrinters = React.useCallback(async (showGuide = false) => {
    try {
      await cnService.loadPrinters(2, {
        showGuideOnError: showGuide,
        onPrinters: (list: any[]) => setPrinters([...list]),
      });
    } catch {
      /* 静默 */
    }
  }, []);

  // 初始化：加载预置模板
  React.useEffect(() => {
    loadPrinters();
  }, [loadPrinters]);

  React.useEffect(() => {
    const groups = xW.map((g: any) => ({
      ...g,
      list: g.list.map((t: any) => ({
        ...t,
        custom_config: t.custom_config.map((f: any) => ({ ...f, mirror: false })),
      })),
    }));
    setPresetGroups(groups);
  }, []);

  /** 选中字段（提升 zIndex 置顶） */
  const selectField = (id: number) => {
    setSelectedId(id);
    const maxZ = fields.reduce((acc, f) => Math.max(acc, f.zIndex ?? 100), 100);
    updateField(id, { zIndex: maxZ + 1 });
  };

  /** 更新字段属性 */
  const updateField = (id: number, patch: any) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  /** 勾选/取消字段（选中时提升 zIndex） */
  const toggleFieldChecked = (id: number, checked: boolean) => {
    updateField(id, { isChecked: !!checked });
    if (checked) {
      const maxZ = fields.reduce((acc, f) => Math.max(acc, f.zIndex ?? 100), 100);
      updateField(id, { zIndex: maxZ + 1 });
    }
    if (!checked && id === selectedId) setSelectedId(null);
  };

  /** 选择预置模板 */
  const applyPreset = (index: number) => {
    const group = presetGroups[index];
    if (!group?.list?.length) return;
    setForm((prev) => ({ ...prev, name: group.size, width: group.width, height: group.height }));
    const presetFields = group.list[0].custom_config;
    const merged = fields.map((f) => {
      const found = presetFields.find((p: any) => p.id === f.id);
      return found ? { ...found } : { ...qd.find((q: any) => q.id === f.id) };
    });
    setFields(merged);
    setPresetIndex(index);
  };

  /** 应用尺寸 */
  const applySize = (sizeKey: string) => {
    const group = rp.find((g: any) => li(g.size) === sizeKey);
    if (group) {
      setSelectedSize(li(group.size));
      setForm((prev) => ({ ...prev, width: group.width, height: group.height }));
    }
  };

  /** 尺寸弹窗确认 */
  const handleSizeConfirm = ({ width, height, sizeKey }: any) => {
    if (sizeKey === Vd) {
      setSelectedSize('custom');
      setPresetGroups([]);
      setForm((prev) => ({
        ...prev,
        width,
        height,
        name: prev.name && !prev.name.startsWith('模板/') ? prev.name : '模板/自定义',
      }));
    } else {
      applySize(sizeKey);
    }
    setSizeDialogOpen(false);
  };

  /** 序号字段（id=2）的编码格式更新 */
  const updateSerialConfig = (patch: any) => {
    if (selectedField?.id !== 2) return;
    updateField(2, { ...patch, testValue: MC({ ...selectedField, ...patch }) });
  };

  /** 保存模板 */
  const handleSave = async () => {
    if (saving) return;
    const checked = fields.filter((f) => f.isChecked);
    if (!checked.length) {
      showError('请选择展示信息');
      return;
    }
    const payload = {
      name: form.name.trim() || '',
      horizontal: Number(form.horizontal)
        ? form.horizontal_direction === 'left'
          ? -Number(form.horizontal)
          : Number(form.horizontal)
        : 0,
      vertical: Number(form.vertical)
        ? form.vertical_direction === 'up'
          ? -Number(form.vertical)
          : Number(form.vertical)
        : 0,
      width: Number(form.width),
      height: Number(form.height),
      is_default: !!form.is_default,
      default_printer: form.default_printer?.trim() || '',
      custom_config: JSON.stringify(checked),
    };
    if (!payload.name) {
      showError('请输入模板名称');
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await http.put(`/tag-templates/${form.id}`, payload);
      } else {
        await http.post('/tag-templates', payload);
      }
      showToast('保存成功');
      router.visit('/template');
    } catch (err: any) {
      showError(err?.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  /** 打印测试页 */
  const handlePrintTest = () => {
    if (!form.default_printer) {
      showError('请选择打印机');
      return;
    }
    if (!form.width || !form.height) {
      showError('请填写宽高');
      return;
    }
    const checked = fields.filter((f) => f.isChecked);
    if (!checked.length) {
      showError('请选择展示信息');
      return;
    }
    showToast('打印测试页已提交（浏览器模式下为模拟）');
    setPrintDialogOpen(false);
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    router.visit('/template');
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="space-y-6 pb-24">
        {/* 顶部：返回 + 基础信息 + 偏移矫正 */}
        <div className="bg-white border rounded-lg p-4 space-y-4" style={{ marginBottom: '1rem' }}>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="mb-0 gap-2" onClick={goBack}>
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4 ml-[20px] flex-1">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-gray-500 whitespace-nowrap">模板名称:</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="请输入模板名称"
                  className="w-[200px]"
                />
              </div>
              {selectedSize !== 'custom' && presetGroups.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 whitespace-nowrap">预置模板：</span>
                  <RadioGroup
                    value={String(presetIndex)}
                    onValueChange={(v) => applyPreset(Number(v))}
                    className="flex gap-4"
                  >
                    {presetGroups.map((g, i) => (
                      <div key={i} className="flex items-center gap-1 w-[60px]">
                        <RadioGroupItem value={String(i)} id={`preset-${i}`} />
                        <Label htmlFor={`preset-${i}`}>{g.size.replace('模板/', '')}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium text-gray-500 whitespace-nowrap">
                  偏移矫正：
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {[
                      { label: '向左', value: 'left' },
                      { label: '向右', value: 'right' },
                    ].map((opt) => (
                      <Button
                        key={opt.value}
                        type="button"
                        variant={form.horizontal_direction === opt.value ? 'default' : 'outline'}
                        size="sm"
                        className="px-4"
                        onClick={() => setForm({ ...form, horizontal_direction: opt.value })}
                      >
                        {opt.label}
                      </Button>
                    ))}
                    <Input
                      type="number"
                      min={0}
                      value={form.horizontal}
                      onChange={(e) => setForm({ ...form, horizontal: Number(e.target.value) })}
                      placeholder="距离"
                      className="w-24"
                    />
                    <span className="text-xs text-gray-500">mm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      { label: '向上', value: 'up' },
                      { label: '向下', value: 'down' },
                    ].map((opt) => (
                      <Button
                        key={opt.value}
                        type="button"
                        variant={form.vertical_direction === opt.value ? 'default' : 'outline'}
                        size="sm"
                        className="px-4"
                        onClick={() => setForm({ ...form, vertical_direction: opt.value })}
                      >
                        {opt.label}
                      </Button>
                    ))}
                    <Input
                      type="number"
                      min={0}
                      value={form.vertical}
                      onChange={(e) => setForm({ ...form, vertical: Number(e.target.value) })}
                      placeholder="距离"
                      className="w-24"
                    />
                    <span className="text-xs text-gray-500">mm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 三栏：展示信息 / 画布 / 属性编辑 */}
        <div className="grid lg:grid-cols-[220px_minmax(400px,1fr)_320px] gap-4">
          {/* 左：展示信息 */}
          <div className="bg-white border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">展示信息</p>
            <div className="space-y-2 overflow-y-auto">
              {fields.map((field) => (
                <label
                  key={field.id}
                  className={cn(
                    'flex items-center gap-3 border rounded px-3 py-2 cursor-pointer transition',
                    field.id === selectedId ? 'border-blue-500 bg-blue-50' : 'border-gray-200',
                  )}
                >
                  <Checkbox
                    checked={field.isChecked}
                    onCheckedChange={(v) => toggleFieldChecked(field.id, !!v)}
                  />
                  <div
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectField(field.id);
                    }}
                  >
                    <p className="text-sm font-medium text-gray-800">{field.aliasName}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 中：画布 */}
          <div className="bg-white border rounded-lg p-4" style={{ overflow: 'scroll' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-gray-500 whitespace-nowrap">模板尺寸：</Label>
                <div className="flex items-center gap-2">
                  {form.width}
                  <span className="text-xs text-gray-500">mm</span>
                  <span className="text-gray-400">×</span>
                  {form.height}
                  <span className="text-xs text-gray-500">mm</span>
                </div>
                {!form.id && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-3"
                    onClick={() => setSizeDialogOpen(true)}
                  >
                    修改尺寸
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">预览比例：{zoom.toFixed(1)}</div>
                <input
                  type="range"
                  min="1"
                  max="2"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-start">
              <div
                className="relative border border-dashed border-gray-300 bg-[radial-gradient(circle,_#e5e7eb_1px,_transparent_1px)] inline-block"
                style={{
                  width: canvasWidth,
                  height: canvasHeight,
                  backgroundSize: '16px 16px',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
                onClick={() => setSelectedId(null)}
              >
                {fields
                  .filter((f) => f.isChecked)
                  .map((field) => (
                    <TemplateFieldCanvasItem
                      key={field.id}
                      item={field}
                      selected={field.id === selectedId}
                      onSelect={selectField}
                      onChange={updateField}
                      zoom={zoom}
                      canvasWidth={canvasWidth}
                      canvasHeight={canvasHeight}
                    />
                  ))}
              </div>
            </div>
          </div>

          {/* 右：属性编辑 */}
          <div className="bg-white border rounded-lg p-4 space-y-4">
            <p className="text-sm font-medium text-gray-700 mb-4">属性编辑</p>
            {selectedField ? (
              <div className="space-y-5">
                {selectedField.id !== 11 && (
                  <div className="space-y-4 pb-4 border-b border-gray-100">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">
                        {selectedField.id === 15
                          ? '中奖标识文字'
                          : selectedField.custom
                            ? '自定义内容'
                            : '表头文本'}
                      </Label>
                      <Input
                        value={selectedField.showName || ''}
                        onChange={(e) =>
                          updateField(selectedField.id, { showName: e.target.value })
                        }
                        className="w-full"
                      />
                    </div>
                    {selectedField.id !== 15 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">打印表头</Label>
                        <RadioGroup
                          value={selectedField.showHeader ? 'yes' : 'no'}
                          onValueChange={(v) =>
                            updateField(selectedField.id, { showHeader: v === 'yes' })
                          }
                          className="flex items-center gap-4"
                        >
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <RadioGroupItem value="yes" id="header-yes" />是
                          </label>
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <RadioGroupItem value="no" id="header-no" />否
                          </label>
                        </RadioGroup>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">标题字体</Label>
                    <Select
                      value={String(selectedField.fontSize ?? 12)}
                      onValueChange={(v) => updateField(selectedField.id, { fontSize: Number(v) })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="请选择字号" />
                      </SelectTrigger>
                      <SelectContent>
                        {SW.map((s: number) => (
                          <SelectItem key={s} value={String(s)}>
                            {s} 号
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">字体粗细</Label>
                    <Select
                      value={selectedField.fontWeight || 'normal'}
                      onValueChange={(v) => updateField(selectedField.id, { fontWeight: v })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="请选择粗细" />
                      </SelectTrigger>
                      <SelectContent>
                        {NW.map((o: any) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">字体类型</Label>
                    <Select
                      value={selectedField.fontFamily || 'SimHei'}
                      onValueChange={(v) => updateField(selectedField.id, { fontFamily: v })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="请选择字体" />
                      </SelectTrigger>
                      <SelectContent>
                        {_W.map((o: any) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">锁定</Label>
                    <div className="flex items-center h-10">
                      <Switch
                        checked={!!selectedField.locked}
                        onCheckedChange={(v) => updateField(selectedField.id, { locked: !!v })}
                      />
                      <span className="ml-3 text-sm text-gray-600">
                        {selectedField.locked ? '已锁定位置' : '允许拖拽'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">镜像</Label>
                    <RadioGroup
                      value={selectedField.mirror ? 'yes' : 'no'}
                      onValueChange={(v) => updateField(selectedField.id, { mirror: v === 'yes' })}
                      className="flex items-center gap-4"
                    >
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <RadioGroupItem value="yes" id="mirror-yes" />是
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <RadioGroupItem value="no" id="mirror-no" />否
                      </label>
                    </RadioGroup>
                  </div>
                </div>
                {selectedField.id === 2 && (
                  <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        编码格式
                      </Label>
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <Checkbox
                          checked={!!(selectedField.includeMonth ?? true)}
                          onCheckedChange={(v) => updateSerialConfig({ includeMonth: !!v })}
                        />
                        <span>月</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <Checkbox
                          checked={!!(selectedField.includeDay ?? true)}
                          onCheckedChange={(v) => updateSerialConfig({ includeDay: !!v })}
                        />
                        <span>日</span>
                      </label>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span>序号位数:</span>
                        <Select
                          value={String(selectedField.serialDigits ?? 5)}
                          onValueChange={(v) => updateSerialConfig({ serialDigits: Number(v) })}
                        >
                          <SelectTrigger className="h-8 w-[90px]">
                            <SelectValue placeholder="5位" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3位</SelectItem>
                            <SelectItem value="4">4位</SelectItem>
                            <SelectItem value="5">5位</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 font-medium">示例：{MC(selectedField)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-10">
                请选择中间画布中的控件查看编辑内容
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部工具栏 */}
      <div
        style={{ position: 'fixed', bottom: 0, width: `calc(100% - ${footerWidth})` }}
        className="sticky bottom-4 bg-white border rounded-lg py-4 px-6 flex items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20"
      >
        <div className="flex-1 flex justify-center gap-3">
          <Button
            variant="outline"
            className="border-sky-400 text-sky-600 hover:text-sky-700 hover:border-sky-500"
            onClick={() => setPrintDialogOpen(true)}
          >
            打印测试页
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </div>

      {/* 打印测试页弹窗 */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogTitle className="text-lg font-semibold">打印测试页</DialogTitle>
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <Label className="w-[64px] text-gray-700">打印机:</Label>
              <PrinterSelect
                value={form.default_printer}
                onValueChange={(v) =>
                  setForm({ ...form, default_printer: v === 0 ? '' : String(v) })
                }
                printerList={printers}
                onRefresh={() => loadPrinters(true)}
                width="200px"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
              取消
            </Button>
            <Button className="w-24 bg-blue-600 hover:bg-blue-700" onClick={handlePrintTest}>
              立即打印
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 尺寸选择弹窗 */}
      <TemplateSizeDialog
        open={sizeDialogOpen}
        onOpenChange={setSizeDialogOpen}
        onConfirm={handleSizeConfirm}
        onInvalid={showError}
        initialSize={selectedSize}
        initialWidth={form.width}
        initialHeight={form.height}
        title="修改模板尺寸"
      />
    </div>
  );
}
