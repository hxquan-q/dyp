// @ts-nocheck
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PackageOpen } from 'lucide-react'
import {   Xr, Co, gl, Et, m, s, at, zt, yn, cm, o2, CM, za, jv, oY, rY, aY, mv, s2, eY, tY, CG, EG, ii, Bm, jW, Em, cnService as cn, nc, vi, bG, fq, RR, Un, $n, EC, Jp, Fp, ap, yv, Gp, dG, dn, un, Hp, xM, UC, vM, xG, Aq, NO, qC, cf, l0, sG, bW, wW, SW, NW, MC, qd, rp, xW, cu, CU, Ob } from '@/lib/reverse-runtime'
import { Sf } from '@/lib/reverse-runtime'

// 页面: Settings/OrderSubscriptions
// 模块: nY -> 组件函数: zM
function zM() {
  const {
      subscriptions: e = []
    } = Xr().props,
    t = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
    [a, o] = m.useState(() => new URLSearchParams(window.location.search).get("order_no") || ""),
    [l, u] = m.useState(() => new URLSearchParams(window.location.search).get("status") || "all"),
    [d, f] = m.useState(() => new URLSearchParams(window.location.search).get("start_time") || yn().subtract(7, "day").format("YYYY-MM-DD")),
    [p, g] = m.useState(() => new URLSearchParams(window.location.search).get("end_time") || yn().format("YYYY-MM-DD")),
    x = () => {
      Et.get(window.location.pathname, {
        order_no: a,
        status: l === "all" ? "" : l,
        start_time: d,
        end_time: p
      }, {
        preserveState: true,
        replace: true
      });
    },
    v = () => {
      o(""), u("all");
      const w = yn(),
        A = w.subtract(7, "day").format("YYYY-MM-DD"),
        R = w.format("YYYY-MM-DD");
      f(A), g(R), Et.get(window.location.pathname, {
        start_time: A,
        end_time: R
      }, {
        preserveState: true,
        replace: true
      });
    },
    _ = w => {
      window.confirm(`确认发起退款？预计退款金额：￥${jv(w.refund_preview_amount)}`) && Et.post(`/settings/order-subscriptions/${w.id}/refund`, {}, {
        preserveScroll: true
      });
    },
    S = w => {
      const E = document.createElement("form");
      E.method = "POST", E.action = `/settings/order-subscriptions/${w.id}/continue`, E.style.display = "none";
      const A = document.createElement("input");
      A.type = "hidden", A.name = "_token", A.value = t, E.appendChild(A), document.body.appendChild(E), E.submit();
    },
    j = w => {
      window.confirm("确认取消该待支付订单？") && Et.post(`/settings/order-subscriptions/${w.id}/cancel`, {}, {
        preserveScroll: true
      });
    },
    N = [{
      label: "全部状态",
      value: "all"
    }, ...Object.entries(s2).map(([w, E]) => ({
      label: E,
      value: String(w)
    }))];
  return <div className="space-y-6"><div className="flex flex-wrap items-center gap-4 border w-full rounded-lg p-4 bg-white"><div className="flex items-center gap-2"><Label className="text-sm text-gray-700 whitespace-nowrap">订单状态：</Label><Select value={l} onValueChange={w => u(w)}><SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue placeholder="请选择状态" /></SelectTrigger><SelectContent>{N.map(w => <SelectItem value={w.value}>{w.label}</SelectItem>)}</SelectContent></Select></div><div className="flex items-center gap-2"><Label className="text-sm text-gray-700 whitespace-nowrap">订购时间：</Label><div className="flex items-center gap-0"><div className="relative"><Input type="date" value={d} onChange={w => f(w.target.value)} className="w-[160px] h-9 pr-8 rounded-r-none text-sm" /><CU className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /></div><span className="px-3 h-9 flex items-center justify-center text-gray-500 border border-l-0 border-r-0 border-gray-200 -ml-px -mr-px bg-white rounded-none">→</span><div className="relative"><Input type="date" value={p} onChange={w => g(w.target.value)} className="w-[160px] h-9 pr-8 rounded-l-none border-l-0 -ml-px text-sm" /><CU className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /></div></div></div><div className="flex items-center gap-2"><Label className="text-sm text-gray-700 whitespace-nowrap">订单编号：</Label><Input value={a} onChange={w => o(w.target.value)} placeholder="请输入订单编号" className="w-[200px] h-9 text-sm" /></div><div className="flex items-center gap-3 ml-auto"><Button className="bg-blue-500 hover:bg-blue-600 w-[90px]" onClick={x}>查询</Button><Button variant="outline" className="w-[90px]" onClick={v}>重置</Button></div></div><div className="bg-white rounded-lg border overflow-hidden"><Table><TableHeader><TableRow><TableHead>订单编号</TableHead><TableHead>套餐版本</TableHead><TableHead>订购天数</TableHead><TableHead>起止时间</TableHead><TableHead>实付金额</TableHead><TableHead>支付方式</TableHead><TableHead>状态</TableHead><TableHead>退款</TableHead><TableHead>订购时间</TableHead><TableHead>备注</TableHead><TableHead>操作</TableHead></TableRow></TableHeader><TableBody>{e.length === 0 && <TableRow><TableCell colSpan={11} className="py-12 text-center text-gray-500"><div className="flex flex-col items-center gap-3"><div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center"><PackageOpen className="w-8 h-8 text-gray-400" /></div><p className="text-sm text-gray-500">暂无数据</p></div></TableCell></TableRow>}{e.map(w => <TableRow><TableCell>{w.order_no}</TableCell><TableCell>{w.version}</TableCell><TableCell>{w.days}</TableCell><TableCell><div className="flex flex-col text-gray-700"><span>开始：{cm(w.start_time)}</span><span>结束：{cm(w.end_time)}</span></div></TableCell><TableCell>￥{jv(w.amount_paid)}</TableCell><TableCell>{eY[w.pay_method] ?? "其他"}</TableCell><TableCell><Badge variant="outline">{s2[w.status] ?? "未知"}</Badge></TableCell><TableCell>{w.refund_status === null || w.refund_status === void 0 ? <span>—</span> : <div className="flex flex-col gap-1 text-gray-700"><Badge variant="outline">{tY[w.refund_status] ?? "未知"}</Badge><span>￥{jv(w.refund_amount)}</span><span>{cm(w.refund_time)}</span></div>}</TableCell><TableCell>{cm(w.pay_time)}</TableCell><TableCell className="max-w-[200px] whitespace-pre-wrap break-words text-gray-700">{w.remark || "—"}</TableCell><TableCell>{Number(w.status) === 0 ? <div className="flex items-center gap-2">{w.can_continue_payment ? <Button variant="outline" size="sm" onClick={() => S(w)}>继续支付</Button> : <span className="text-xs text-gray-400">已超时</span>}<Button variant="outline" size="sm" onClick={() => j(w)}>取消</Button></div> : w.can_refund ? <Button variant="outline" size="sm" onClick={() => _(w)}>退款</Button> : <span>—</span>}</TableCell></TableRow>)}</TableBody></Table></div></div>;
}

export default zM
