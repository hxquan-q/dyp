// @ts-nocheck
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { HelpCircle, PackageOpen } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Xr,
  Co,
  gl,
  Et,
  m,
  s,
  at,
  zt,
  yn,
  cm,
  o2,
  CM,
  za,
  jv,
  oY,
  rY,
  aY,
  mv,
  s2,
  eY,
  tY,
  CG,
  EG,
  ii,
  Bm,
  jW,
  Em,
  cnService as cn,
  nc,
  vi,
  bG,
  fq,
  RR,
  Un,
  $n,
  EC,
  Jp,
  Fp,
  ap,
  yv,
  Gp,
  dG,
  dn,
  un,
  Hp,
  xM,
  UC,
  vM,
  xG,
  Aq,
  NO,
  qC,
  cf,
  l0,
  sG,
  bW,
  wW,
  SW,
  NW,
  MC,
  qd,
  rp,
  xW,
  da,
  DA,
} from '@/lib/reverse-runtime';
import { Sf } from '@/lib/reverse-runtime';

// 页面: Deduction/Buyers
// 模块: XK -> 组件函数: YK
function YK() {
  const { buyers: e = [], liveShops: t = [], flash: a = {}, errors: o = {} } = Xr().props,
    l = (B) => EC.find((J) => J.value === B)?.label || '未知平台',
    [u, d] = m.useState(() => new URLSearchParams(window.location.search).get('nickname') || ''),
    [f, p] = m.useState(() => {
      const J = new URLSearchParams(window.location.search).get('platform_type');
      return J ? Number(J) : 'all';
    }),
    [g, x] = m.useState(false),
    [v, _] = m.useState([]),
    [S, j] = m.useState(false),
    N = `如果永久编号仅单场直播使用，可在直播后点击重置，下场直播会更新永久编号
如永久编号需一直使用，请谨慎点击重置，无法恢复！`,
    w = t.length > 0 && v.length === t.length,
    E = (B = {}) => {
      Et.post('/buyers/reset', B, {
        preserveScroll: true,
        onStart: () => j(true),
        onFinish: () => j(false),
        onSuccess: () => {
          (x(false), _([]));
        },
      });
    },
    A = () => {
      if (t.length > 1) {
        x(true);
        return;
      }
      confirm(N) && E();
    },
    R = (B, J) => {
      _((ie) => (J ? [...ie, B] : ie.filter((de) => de !== B)));
    },
    D = () => {
      _(w ? [] : t.map((B) => B.id));
    },
    V = () => {
      v.length !== 0 &&
        confirm(N) &&
        E({
          shop_ids: v,
        });
    },
    U = () => {
      Et.get(
        window.location.pathname,
        {
          nickname: u,
          platform_type: f === 'all' ? '' : f,
        },
        {
          preserveState: true,
          replace: true,
        },
      );
    },
    I = () => {
      (d(''),
        p('all'),
        Et.get(
          window.location.pathname,
          {},
          {
            preserveState: true,
            replace: true,
          },
        ));
    };
  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4 border w-full rounded-lg p-4 bg-white">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-700 whitespace-nowrap">平台：</Label>
            <Select value={f} onValueChange={(B) => p(B)}>
              <SelectTrigger className="w-[200px] h-9 text-sm">
                <SelectValue placeholder="请选择平台" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部平台</SelectItem>
                {EC.map((B) => (
                  <SelectItem value={B.value}>{B.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-700 whitespace-nowrap">昵称：</Label>
            <Input
              value={u}
              onChange={(B) => d(B.target.value)}
              placeholder="请输入昵称"
              className="w-[200px] h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Button className="bg-blue-500 hover:bg-blue-600 w-[90px]" onClick={U}>
              查询
            </Button>
            <Button variant="outline" className="w-[90px]" onClick={I}>
              重置
            </Button>
            <div className="hidden 2xl:block h-5 w-px bg-gray-300" />
            <Button variant="destructive" onClick={A}>
              重置永久编号
              <Tooltip>
                <TooltipProvider>
                  <TooltipTrigger asChild={true}>
                    <span
                      className="ml-1 inline-flex cursor-help"
                      onClick={(B) => B.stopPropagation()}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="center"
                    sideOffset={8}
                    className="bg-white text-gray-700 border shadow-lg"
                  >
                    <p>如永久编号需一直使用，请谨慎点击重置，无法恢复！</p>
                  </TooltipContent>
                </TooltipProvider>
              </Tooltip>
            </Button>
          </div>
        </div>
        {a?.success && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm">
            {a.success}
          </div>
        )}
        {o?.shop_ids && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
            {o.shop_ids}
          </div>
        )}
        <div className="bg-white rounded-lg border shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>永久编号</TableHead>
                <TableHead>昵称</TableHead>
                <TableHead>平台</TableHead>
                <TableHead>直播店铺</TableHead>
                <TableHead>OpenID</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {e.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <PackageOpen className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">暂无数据</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {e.map((B) => (
                <TableRow>
                  <TableCell className="font-medium text-base">
                    {B.number ?? <span className="text-gray-400">未分配</span>}
                  </TableCell>
                  <TableCell>{B.nickname || '—'}</TableCell>
                  <TableCell>{l(B.platform_type)}</TableCell>
                  <TableCell>{B.shop_name || '—'}</TableCell>
                  <TableCell className="font-mono text-sm text-gray-700">{B.openid}</TableCell>
                  <TableCell className="text-gray-600">
                    {B.created_at ? new Date(B.created_at).toLocaleString() : ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Dialog open={g} onOpenChange={x}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>选择要重置的直播店铺</DialogTitle>
              <DialogDescription>
                将删除所选店铺下的永久编号和买家数据，操作后无法恢复。
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                已选择 {v.length} / {t.length} 个店铺
              </span>
              <Button type="button" variant="outline" size="sm" onClick={D} disabled={S}>
                {w ? '取消全选' : '全选'}
              </Button>
            </div>
            <div className="max-h-[360px] overflow-y-auto rounded-md border">
              {t.map((B) => (
                <label className="flex cursor-pointer items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-gray-50">
                  <Checkbox
                    checked={v.includes(B.id)}
                    onCheckedChange={(J) => R(B.id, J === true)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900">
                      {B.shop_name || '未命名店铺'}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {B.platform_name || '未知平台'} ·{' '}
                      {B.auth_subject === 'live_room' ? '直播间' : '店铺'}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <DA>
              <Button variant="outline" onClick={() => x(false)} disabled={S}>
                取消
              </Button>
              <Button variant="destructive" onClick={V} disabled={v.length === 0 || S}>
                {S ? '重置中...' : '重置'}
              </Button>
            </DA>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

export default YK;
