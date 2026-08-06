// @ts-nocheck
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Monitor, Trash2 } from 'lucide-react';
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
  ZG,
} from '@/lib/reverse-runtime';
import { Sf } from '@/lib/reverse-runtime';

// 页面: Settings/Devices
// 模块: JG -> 组件函数: DM
function DM() {
  // ══════════ Settings/Devices 登录设备页 ══════════
  const { devices: e = [], deviceLimit: t = 3 } = Xr().props,
    [a, o] = m.useState(e),
    [l, u] = m.useState(t),
    [d, f] = m.useState(null),
    [p, g] = m.useState(null),
    x = (S) => {
      window.confirm(`确定要彻底删除设备 ${S.device_name || S.device_id} 吗？`) &&
        (f(S.id),
        window.axios
          .delete(`/api/electron/devices/${S.id}`)
          .then((j) => {
            (o(j.data?.data?.devices || []), u(j.data?.data?.limit || t));
          })
          .finally(() => f(null)));
    },
    v = (S) => {
      const j = S.revoked_at ? '启用' : '禁用';
      window.confirm(`确定要${j}设备 ${S.device_name || S.device_id} 吗？`) &&
        (g(S.id),
        window.axios
          .post(`/api/electron/devices/${S.id}/toggle`)
          .then((N) => {
            (o(N.data?.data?.devices || []), u(N.data?.data?.limit || t));
          })
          .catch((N) => {
            alert(N.response?.data?.message || '操作失败');
          })
          .finally(() => g(null)));
    },
    _ = a.filter((S) => !S.revoked_at).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">登录设备</h1>
          <p className="text-sm text-gray-500">
            客户端设备：{_}/{l}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>设备</TableHead>
              <TableHead>平台</TableHead>
              <TableHead>最新 IP</TableHead>
              <TableHead>最后活动时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-[180px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {a.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-gray-500">
                  暂无客户端设备
                </TableCell>
              </TableRow>
            )}
            {a.map((S) => (
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900">{S.device_name || '未知设备'}</div>
                      <div className="text-xs text-gray-500 break-all">{S.device_id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{S.platform || '-'}</TableCell>
                <TableCell>{S.last_ip || '-'}</TableCell>
                <TableCell>{ZG(S.last_seen_at)}</TableCell>
                <TableCell>
                  {S.is_current ? (
                    <Badge>当前设备</Badge>
                  ) : S.revoked_at ? (
                    <Badge variant="destructive">已禁用</Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      在线
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {!S.is_current && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={
                          S.revoked_at
                            ? 'text-green-600 border-green-200 hover:bg-green-50'
                            : 'text-yellow-600 border-yellow-200 hover:bg-yellow-50'
                        }
                        disabled={p === S.id}
                        onClick={() => v(S)}
                      >
                        {S.revoked_at ? '启用' : '禁用'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 border-red-100 hover:bg-red-50"
                        disabled={d === S.id}
                        onClick={() => x(S)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default DM;
