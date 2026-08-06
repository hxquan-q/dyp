// @ts-nocheck
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogActions } from '@/components/ui/dialog'
import { PackageOpen } from 'lucide-react'
import {   Xr, Co, gl, Et, m, s, at, ie, IE, Ob } from '@/lib/reverse-runtime'

function FT() {
  // ══════════ Deduction/Config 弹幕配置页（弹幕→商品映射） ══════════
  const {
      configs: e = [],
      tenantId: t = 0,
      flash: a = {}
    } = Xr().props,
    [o, l] = m.useState(false),
    [u, d] = m.useState(null),
    [f, p] = m.useState(null),
    {
      location: g
    } = window,
    x = new URLSearchParams(g.search),
    v = x.get("danmu") || "",
    _ = x.get("product_no") || "",
    [S, j] = m.useState(v),
    [N, w] = m.useState(_),
    E = e;
  m.useEffect(() => {
    if (a?.success) {
      p(a.success);
      const M = setTimeout(() => {
        p(null);
      }, 2e3);
      return () => clearTimeout(M);
    }
  }, [a]);
  const A = {
      id: null,
      danmu: "",
      price: "",
      product_no: "",
      tenant_id: t
    },
    {
      data: R,
      setData: D,
      reset: V,
      errors: U
    } = Co(A),
    [I, B] = m.useState(false),
    {
      showError: J,
      ErrorToastRenderer: ie
    } = gl(),
    de = () => {
      l(false), d(null), V(), D({
        ...A,
        tenant_id: t
      }), B(false);
    },
    te = () => {
      de(), l(true);
    },
    Q = M => {
      d(M), D({
        id: M.id,
        danmu: M.danmu,
        price: M.price ?? "",
        product_no: M.product_no ?? "",
        tenant_id: M.tenant_id ?? t
      }), l(true);
    },
    Z = M => {
      confirm("确定要删除该配置吗？") && Et.delete(`/danmu-product-relations/${M}`, {
        preserveScroll: true,
        onSuccess: de
      });
    },
    ne = () => {
      if (I) return;
      const M = {
        tenant_id: R.tenant_id ?? 0,
        danmu: R.danmu?.trim() || "",
        price: R.price === "" ? null : R.price,
        product_no: R.product_no?.trim() || ""
      };
      if (!M.product_no) {
        J("请输入货号");
        return;
      }
      if (!R.id && e.some(fe => fe.danmu === M.danmu)) {
        J("该弹幕内容您已配置过，请勿重复配置");
        return;
      }
      const G = {
        preserveScroll: true,
        onStart: () => B(true),
        onError: fe => {
          const z = Object.values(fe ?? {})[0];
          z && J(z);
        },
        onFinish: () => B(false),
        onSuccess: de
      };
      if (R.id) {
        Et.put(`/danmu-product-relations/${R.id}`, M, G);
        return;
      }
      Et.post("/danmu-product-relations", M, G);
    },
    P = () => {
      Et.get(window.location.pathname, {
        danmu: S,
        product_no: N
      }, {
        preserveState: true,
        replace: true
      });
    },
    q = () => {
      j(""), w(""), Et.get(window.location.pathname, {}, {
        preserveState: true,
        replace: true
      });
    };
  return <div className="space-y-6"><div className="flex flex-wrap items-center gap-4 border w-full rounded-lg p-4 bg-white"><div className="flex items-center gap-2"><Label className="text-sm text-gray-700 whitespace-nowrap">弹幕内容：</Label><Input value={S} onChange={M => j(M.target.value)} placeholder="请输入弹幕内容" className="w-[200px] h-9 text-sm" /></div><div className="flex items-center gap-2"><Label className="text-sm text-gray-700 whitespace-nowrap">货号：</Label><Input value={N} onChange={M => w(M.target.value)} placeholder="请输入货号" className="w-[200px] h-9 text-sm" /></div><div className="flex items-center gap-3 ml-auto"><Button className="bg-blue-500 hover:bg-blue-600 w-[90px]" onClick={P}>查询</Button><Button variant="outline" className="w-[90px]" onClick={q}>重置</Button><div className="hidden 2xl:block h-5 w-px bg-gray-300" /><Button variant="outline" onClick={te} className="border-green-500 text-green-600 hover:bg-green-50">新增配置</Button></div></div>{f && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm">{f}</div>}<div className="bg-white rounded-lg border"><Table><TableHeader><TableRow><TableHead className="w-[220px]">弹幕内容</TableHead><TableHead>价格(元)</TableHead><TableHead>货号</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{E.length === 0 && <TableRow><TableCell colSpan={10} className="py-12 text-center text-gray-500"><div className="flex flex-col items-center gap-3"><div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center"><PackageOpen className="w-8 h-8 text-gray-400" /></div><p className="text-sm text-gray-500">暂无数据</p></div></TableCell></TableRow>}{E.map(M => <TableRow><TableCell>{M.danmu}</TableCell><TableCell>{M.price ?? "-"}</TableCell><TableCell>{M.product_no ?? "-"}</TableCell><TableCell className="text-right space-x-2"><Button variant="link" className="text-blue-600 h-auto p-0" onClick={() => Q(M)}>编辑</Button><Button variant="link" className="text-blue-600 h-auto p-0" onClick={() => Z(M.id)}>删除</Button></TableCell></TableRow>)}</TableBody></Table></div><Dialog open={o} onOpenChange={l}><DialogContent className="sm:max-w-[500px]"><DialogHeader><DialogTitle className="text-xl">{u ? "编辑配置" : "新增配置"}</DialogTitle></DialogHeader><div className="space-y-6 py-4"><div className="space-y-2"><Label htmlFor="danmu" className="text-base"><span className="text-red-500">* </span>弹幕内容</Label><Input id="danmu" placeholder="请输入弹幕内容" value={R.danmu} maxLength={64} onChange={M => D("danmu", M.target.value)} className="h-11" />{U.danmu && <p className="text-sm text-red-500">{U.danmu}</p>}</div><div className="space-y-2"><Label htmlFor="price" className="text-base">价格(元)</Label><Input id="price" placeholder="请输入价格" value={R.price} onChange={M => D("price", M.target.value)} className="h-11" />{U.price && <p className="text-sm text-red-500">{U.price}</p>}</div><div className="space-y-2"><Label htmlFor="product_no" className="text-base"><span className="text-red-500">* </span>货号</Label><Input id="product_no" placeholder="请输入货号" value={R.product_no} maxLength={64} onChange={M => D("product_no", M.target.value)} required={true} className="h-11" />{U.product_no && <p className="text-sm text-red-500">{U.product_no}</p>}</div></div><DialogActions onCancel={de} onSubmit={ne} submitting={I} submitLoadingText="提交中..." submitText="确定" /></DialogContent></Dialog><IE /></div>;
}

export default FT
