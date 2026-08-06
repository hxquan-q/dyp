// @ts-nocheck
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogActions } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PackageOpen } from 'lucide-react'
import { Xr, Co, gl, Et, m, s, at, zt, yn, cm, o2, CM, za, jv, oY, rY, aY, mv, s2, eY, tY, CG, EG, ii, Bm, jW, Em, cnService as cn, nc, vi, bG, fq, RR, Un, $n, EC, Jp, Fp, ap, yv, Gp, dG, dn, un, Hp, xM, UC, vM, xG, Aq, NO, qC, cf, l0, sG, bW, wW, SW, NW, MC, qd, rp, xW } from '@/lib/reverse-runtime'
import { Sf } from '@/lib/reverse-runtime'

// 页面: Deduction/Blacklists
// 模块: GK -> 组件函数: BT
function BT() {
  // ══════════ Deduction/Shops 授权账号管理页 ══════════
  const {
      items: e = [],
      tenantId: t = 0,
      flash: a = {}
    } = Xr().props,
    [o, l] = m.useState(false),
    [u, d] = m.useState(null),
    [f, p] = m.useState(null),
    [g, x] = m.useState(""),
    [v, _] = m.useState("all");
  m.useEffect(() => {
    if (a?.success) {
      p(a.success);
      const Q = setTimeout(() => {
        p(null);
      }, 2e3);
      return () => clearTimeout(Q);
    }
  }, [a]);
  const S = {
      id: null,
      nickname: "",
      platform_type: "",
      tenant_id: t
    },
    {
      data: j,
      setData: N,
      reset: w,
      errors: E
    } = Co(S),
    [A, R] = m.useState(false),
    {
      showError: D,
      ErrorToastRenderer: V
    } = gl(),
    U = () => {
      l(false), d(null), w(), N({
        ...S,
        tenant_id: t
      }), R(false);
    },
    I = () => {
      U(), l(true);
    },
    B = Q => {
      d(Q), N({
        id: Q.id,
        nickname: Q.nickname ?? "",
        platform_type: Q.platform_type ?? "",
        tenant_id: Q.tenant_id ?? t
      }), l(true);
    },
    J = Q => {
      confirm("确定要删除该黑名单记录吗？") && Et.delete(`/blacklists/${Q}`, {
        preserveScroll: true,
        onSuccess: U
      });
    },
    ie = () => {
      if (A) return;
      const Q = {
        tenant_id: j.tenant_id ?? 0,
        nickname: j.nickname?.trim() || "",
        platform_type: j.platform_type === "" ? null : Number(j.platform_type)
      };
      if (!Q.nickname) {
        D("请输入昵称");
        return;
      }
      if (Q.platform_type === null || Number.isNaN(Q.platform_type)) {
        D("请选择平台");
        return;
      }
      const Z = {
        preserveScroll: true,
        onStart: () => R(true),
        onError: ne => {
          const P = Object.values(ne ?? {})[0];
          P && D(P);
        },
        onFinish: () => R(false),
        onSuccess: U
      };
      if (j.id) {
        Et.put(`/blacklists/${j.id}`, Q, Z);
        return;
      }
      Et.post("/blacklists", Q, Z);
    },
    de = () => {
      Et.get(window.location.pathname, {
        nickname: g,
        platform_type: v === "all" ? "" : v
      }, {
        preserveState: true,
        replace: true
      });
    },
    te = () => {
      x(""), _("all"), Et.get(window.location.pathname, {}, {
        preserveState: true,
        replace: true
      });
    };
  return <div className="space-y-6"><div className="flex flex-wrap items-center gap-4 border w-full rounded-lg p-4 bg-white"><div className="flex items-center gap-2"><Label className="text-sm text-gray-700 whitespace-nowrap">平台：</Label><Select value={v} onValueChange={Q => _(Q)}><SelectTrigger className="w-[200px] h-9 text-sm"><SelectValue placeholder="请选择平台" /></SelectTrigger><SelectContent><SelectItem value="all">全部平台</SelectItem>{mv.map(Q => <SelectItem value={Q.value}>{Q.label}</SelectItem>)}</SelectContent></Select></div><div className="flex items-center gap-2"><Label className="text-sm text-gray-700 whitespace-nowrap">昵称：</Label><Input value={g} onChange={Q => x(Q.target.value)} placeholder="请输入昵称" className="w-[200px] h-9 text-sm" /></div><div className="flex items-center gap-3 ml-auto"><Button className="bg-blue-500 hover:bg-blue-600 w-[90px]" onClick={de}>查询</Button><Button variant="outline" className="w-[90px]" onClick={te}>重置</Button><div className="hidden 2xl:block h-5 w-px bg-gray-300" /><Button onClick={I} className="border-green-500 text-green-600 hover:bg-green-50" variant="outline">新增黑名单</Button></div></div>{f && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm">{f}</div>}<div className="bg-white rounded-lg border"><Table><TableHeader><TableRow><TableHead className="w-[220px]">昵称</TableHead><TableHead>平台</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{e.length === 0 && <TableRow><TableCell colSpan={10} className="py-12 text-center text-gray-500"><div className="flex flex-col items-center gap-3"><div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center"><PackageOpen className="w-8 h-8 text-gray-400" /></div><p className="text-sm text-gray-500">暂无数据</p></div></TableCell></TableRow>}{e.map(Q => <TableRow><TableCell>{Q.nickname}</TableCell><TableCell>{mv.find(Z => Z.value === Q.platform_type)?.label}</TableCell><TableCell className="text-right space-x-2"><Button variant="link" className="text-blue-600 h-auto p-0" onClick={() => B(Q)}>编辑</Button><Button variant="link" className="text-blue-600 h-auto p-0" onClick={() => J(Q.id)}>删除</Button></TableCell></TableRow>)}</TableBody></Table></div><Dialog open={o} onOpenChange={l}><DialogContent className="sm:max-w-[500px]"><DialogHeader><DialogTitle className="text-xl">{u ? "编辑黑名单" : "新增黑名单"}</DialogTitle></DialogHeader><div className="space-y-6 py-4"><div className="space-y-2"><Label htmlFor="nickname" className="text-base"><span className="text-red-500">* </span>昵称</Label><Input id="nickname" placeholder="请输入昵称" value={j.nickname} maxLength={64} onChange={Q => N("nickname", Q.target.value)} className="h-11" />{E.nickname && <p className="text-sm text-red-500">{E.nickname}</p>}</div><div className="space-y-2"><Label htmlFor="platform_type" className="text-base"><span className="text-red-500">* </span>平台</Label><Select value={j.platform_type} onValueChange={Q => N("platform_type", Q)}><SelectTrigger id="platform_type" className="h-11 w-[100%]"><SelectValue placeholder="请选择平台" /></SelectTrigger><SelectContent>{mv.map(Q => <SelectItem value={Q.value}>{Q.label}</SelectItem>)}</SelectContent></Select>{E.platform_type && <p className="text-sm text-red-500">{E.platform_type}</p>}</div></div><DialogActions onCancel={U} onSubmit={ie} submitting={A} submitLoadingText="提交中..." submitText="确定" /></DialogContent></Dialog><V /></div>;
}

export default BT
