// @ts-nocheck
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { PackageOpen } from 'lucide-react'
import { TemplateSelect, PrinterSelect } from '@/components/ui/selectors'
import { TemplateFieldItem, SizeDialog } from '@/components/ui/template-editor'
import { Xr, Co, gl, Et, m, s, at, zt, yn, cm, o2, CM, za, jv, oY, rY, aY, mv, s2, eY, tY, CG, EG, ii, Bm, jW, Em, cnService as cn, nc, vi, bG, fq, RR, Un, $n, EC, Jp, Fp, ap, yv, Gp, dG, dn, un, Hp, xM, UC, vM, xG, Aq, NO, qC, cf, l0, sG, bW, wW, SW, NW, MC, qd, rp, xW } from '@/lib/reverse-runtime'
import { Sf } from '@/lib/reverse-runtime'

// 页面: Deduction/Template
// 模块: XG -> 组件函数: OM
function OM() {
  // ══════════ Deduction/Template 打印模板列表页 ══════════
  const {
      templates: e = [],
      flash: t = {}
    } = Xr().props,
    {
      showError: a,
      ErrorToastRenderer: o
    } = gl(),
    [l, u] = m.useState([]),
    [d, f] = m.useState(false),
    [p, g] = m.useState(null),
    [x, v] = m.useState(false),
    {
      location: _
    } = window,
    j = new URLSearchParams(_.search).get("name") || "",
    [N, w] = m.useState(j),
    E = e;
  m.useEffect(() => {
    if (t?.success) {
      g(t.success);
      const Q = setTimeout(() => {
        g(null);
      }, 2e3);
      return () => clearTimeout(Q);
    }
  }, [t]);
  const A = 2;
  async function R(Q = false, Z = false) {
    Z && f(true);
    try {
      await cn.loadPrinters(A, {
        showGuideOnError: Q,
        onPrinters: ne => {
          u([...ne]);
        }
      });
    } catch (ne) {
      console.error(ne);
    } finally {
      Z && f(false);
    }
  }
  m.useEffect(() => {
    R(false);
  }, []), m.useEffect(() => {
    const Q = () => {
      u([]), R(false, false);
    };
    return window.addEventListener(nc, Q), () => window.removeEventListener(nc, Q);
  }, []);
  const D = () => {
      v(true);
    },
    V = ({
      width: Q,
      height: Z
    }) => {
      Et.visit(`/tag-templates/create?width=${Q}&height=${Z}`), v(false);
    },
    U = Q => {
      Et.visit(`/tag-templates/${Q.id}/edit`);
    },
    I = Q => {
      confirm("确定要删除该模板吗？") && Et.delete(`/tag-templates/${Q}`, {
        preserveScroll: true
      });
    };
  function B(Q, Z) {
    if (Z === 0) {
      R(true, true);
      return;
    }
    const ne = {
      preserveScroll: true,
      onError: P => {
        const q = Object.values(P ?? {})[0];
        q && a(q);
      },
      onSuccess: () => {
        Q.default_printer = Z;
      }
    };
    Et.put(`/tag-templates/${Q.id}`, {
      ...Q,
      default_printer: Z
    }, ne);
  }
  function J(Q, Z) {
    const ne = {
      preserveScroll: true,
      onError: P => {
        const q = Object.values(P ?? {})[0];
        q && a(q);
      },
      onSuccess: () => {
        Q.is_default = Z;
      }
    };
    Et.put(`/tag-templates/${Q.id}`, {
      ...Q,
      is_default: Z
    }, ne);
  }
  function ie(Q) {
    if (!Q.horizontal && !Q.vertical) return "无偏移";
    let Z = "";
    return Q.horizontal && (Z += Q.horizontal > 0 ? "向右" : "向左", Z += Math.abs(Q.horizontal) + "mm "), Q.vertical && (Z += Q.vertical > 0 ? "向下" : "向上", Z += Math.abs(Q.vertical) + "mm"), Z;
  }
  const de = () => {
      Et.get(window.location.pathname, {
        name: N
      }, {
        preserveState: true,
        replace: true
      });
    },
    te = () => {
      w(""), Et.get(window.location.pathname, {}, {
        preserveState: true,
        replace: true
      });
    };
  return <div className="space-y-6"><div className="flex flex-wrap items-center gap-4 border w-full rounded-lg p-4 bg-white"><div className="flex items-center gap-2"><Label className="text-sm text-gray-700 whitespace-nowrap">模板名称：</Label><Input value={N} onChange={Q => w(Q.target.value)} placeholder="请输入模板名称" className="w-[200px] h-9 text-sm" /></div><div className="flex items-center gap-3 ml-auto"><Button className="bg-blue-500 hover:bg-blue-600 w-[90px]" onClick={de}>查询</Button><Button variant="outline" className="w-[90px]" onClick={te}>重置</Button><div className="2xl:block h-5 w-px bg-gray-300" /><Button variant="outline" onClick={D} className="border-green-500 text-green-600 hover:bg-green-50">新增模板</Button></div></div>{p && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm">{p}</div>}<o /><div className="bg-white rounded-lg border"><Table><TableHeader><TableRow><TableHead className="w-[180px]">模板名称</TableHead><TableHead>尺寸(宽×高)</TableHead><TableHead>偏移(横/竖)</TableHead><TableHead>默认打印机</TableHead><TableHead>默认模板</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{E.length === 0 && <TableRow><TableCell colSpan={10} className="py-12 text-center text-gray-500"><div className="flex flex-col items-center gap-3"><div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center"><PackageOpen className="w-8 h-8 text-gray-400" /></div><p className="text-sm text-gray-500">暂无数据</p></div></TableCell></TableRow>}{E.map(Q => <TableRow><TableCell>{Q.name}</TableCell><TableCell>{Q.width} × {Q.height}</TableCell><TableCell>{ie(Q)}</TableCell><TableCell><PrinterSelect value={Q.default_printer} onValueChange={Z => B(Q, Z)} printerList={l} width="200px" className="h-8 text-xs" showClearOption={true} refreshing={d} onRefresh={() => R(true, true)} /></TableCell><TableCell><Switch checked={Q.is_default} onCheckedChange={Z => J(Q, Z)} /></TableCell><TableCell className="text-right space-x-2"><Button variant="link" className="text-blue-600 h-auto p-0" onClick={() => U(Q)}>编辑</Button><Button variant="link" className="text-blue-600 h-auto p-0" onClick={() => I(Q.id)}>删除</Button></TableCell></TableRow>)}</TableBody></Table></div><SizeDialog open={x} onOpenChange={v} onConfirm={V} onInvalid={a} /></div>;
}

export default OM
