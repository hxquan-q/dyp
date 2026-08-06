// @ts-nocheck
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { Xr, Co, gl, Et, m, s, at, zt, yn, cm, o2, CM, za, jv, oY, rY, aY, mv, s2, eY, tY, CG, EG, ii, Bm, jW, Em, cnService as cn, nc, vi, bG, fq, RR, Un, $n, EC, Jp, Fp, ap, yv, Gp, dG, dn, un, Hp, xM, UC, vM, xG, Aq, NO, qC, cf, l0, sG, bW, wW, SW, NW, MC, qd, rp, xW, iG, lG, cG, uG, oG, fG, HC } from '@/lib/reverse-runtime'
import { Sf } from '@/lib/reverse-runtime'

function yM({
  open: e,
  progress: t,
  onOpenChange: a,
  onStartBatchRemark: o,
  onRetryDecryptAndRemark: l,
  mode: u = "sync_only"
}) {
  const d = iG(t),
    f = lG(t),
    p = cG(t),
    g = Number(t?.decryptProcessed || 0),
    x = Number(t?.decryptAttemptTotal || 0),
    v = Math.max(x - g, 0),
    _ = t?.status === "decrypting" && t?.decryptRetrying ? "正在重试" : "昵称获取进度",
    S = t?.status === "ready" || t?.status === "no_decrypt",
    j = t?.status === "failed",
    N = t?.syncFailures?.length > 0,
    w = t?.decryptFailures?.length > 0,
    E = Number(t?.total || 0) > 0,
    A = !!t?.canBatchRemark,
    R = uG(t, u),
    D = u === "sync_and_remark" && !j && E && A && (["syncing", "decrypting"].includes(t?.status) || t?.status === "preparing_remark" || t?.status === "ready"),
    V = u === "sync_and_remark" ? "重试并继续" : "重试",
    U = oG(t);
  return <Dialog open={e} onOpenChange={a}><DialogContent className="sm:max-w-[720px]"><DialogHeader className="pb-2"><DialogTitle className="flex items-center justify-between gap-3 text-xl font-semibold"><span>订单同步</span><span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"><hG status={t?.status} />{fG[t?.status] || "准备中"}</span></DialogTitle></DialogHeader><div className="min-w-0 space-y-4"><div className="grid grid-cols-2 gap-3"><div className="rounded border bg-gray-50 p-3"><div className="text-xs text-gray-500">订单总数</div><div className="text-2xl font-semibold text-gray-900">{t?.total ?? "-"}</div></div><div className="rounded border bg-gray-50 p-3"><div className="text-xs text-gray-500">已同步</div><div className="text-2xl font-semibold text-gray-900">{t?.synced ?? 0}</div></div></div><div className="space-y-2"><div className="flex justify-between text-xs text-gray-500"><span>同步进度</span><span>{d}%</span></div><HC value={d} /></div>{p && <div className="rounded border bg-gray-50 p-3"><div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium text-gray-900">{_}</span><span className="text-gray-500">已处理 {g} / {x}</span></div><HC value={f} color={j ? "bg-red-500" : "bg-green-500"} /><div className="mt-2 text-xs text-gray-500">成功 {t?.decrypted ?? 0} · 失败 {t?.decryptFailed ?? 0} · 待处理 {v}</div></div>}<div className={`min-w-0 break-words rounded border p-3 text-sm ${j ? "border-red-100 bg-red-50 text-red-700" : D ? "border-teal-100 bg-teal-50 text-teal-800" : "bg-gray-50 text-gray-600"}`}>{D ? <div><div>同步完成，正在继续处理</div><div className="mt-1 text-xs text-gray-500">请稍候，系统会自动继续。</div></div> : j ? <div><div>{U.message}</div>{U.actionHint && <div className="mt-2 text-xs text-red-600">{U.actionHint}</div>}{U.traceId && <div className="mt-2 select-all text-xs text-gray-500">排查编号：{U.traceId}</div>}</div> : t?.error || t?.message || (p ? "处理完成后即可继续操作。" : "同步完成后即可继续操作。")}</div>{t?.limitReached && <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">已达到 5000 条，请缩小时间范围</div>}{N && <div className="max-h-[220px] w-full overflow-auto rounded border"><Table className="w-full table-fixed"><TableHeader><TableRow><TableHead className="w-[190px]">订单号</TableHead><TableHead>失败原因</TableHead></TableRow></TableHeader><TableBody>{t.syncFailures.map((I, B) => <TableRow><TableCell className="break-all">{I.orderNo || I.order_no || "-"}</TableCell><TableCell className="whitespace-normal break-words text-red-600">{I.reason || "-"}</TableCell></TableRow>)}</TableBody></Table></div>}{p && w && <div className="max-h-[260px] w-full overflow-auto rounded border"><Table className="w-full table-fixed"><TableHeader><TableRow><TableHead className="w-[170px]">订单号</TableHead><TableHead className="w-[88px] whitespace-nowrap">当前状态</TableHead><TableHead className="w-[88px] whitespace-nowrap">备注状态</TableHead><TableHead>失败原因</TableHead></TableRow></TableHeader><TableBody>{t.decryptFailures.map(I => <TableRow><TableCell className="break-all">{I.orderNo}</TableCell><TableCell className="whitespace-nowrap">待重试</TableCell><TableCell className="whitespace-nowrap">待处理</TableCell><TableCell className="whitespace-normal break-words text-red-600">{I.reason}</TableCell></TableRow>)}</TableBody></Table></div>}<div className="flex justify-end gap-2">{R ? <Button onClick={() => a(false)}>完成</Button> : <><Button variant="outline" onClick={() => a(false)}>后台等待</Button>{j && u === "sync_and_remark" && t?.decryptFailures?.length > 0 && <Button className="bg-blue-600 hover:bg-blue-700" onClick={l}>{V}</Button>}{D ? <Button className="bg-teal-600 hover:bg-teal-700" disabled={true}><Loader2 className="mr-2 h-4 w-4 animate-spin" />继续处理中</Button> : <Button className="bg-blue-600 hover:bg-blue-700" disabled={!S} onClick={o}>开始处理</Button>}</>}</div></div></DialogContent></Dialog>;
}