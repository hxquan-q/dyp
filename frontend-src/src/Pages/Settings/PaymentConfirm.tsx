// @ts-nocheck
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BadgeCheck } from 'lucide-react';
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
} from '@/lib/reverse-runtime';
import { Sf } from '@/lib/reverse-runtime';

// 页面: Settings/PaymentConfirm
// 模块: sY -> 组件函数: IM
function IM() {
  // ══════════ Settings/PaymentConfirm 支付确认页 ══════════
  const { plan: e, buyer: t, confirmUrl: a } = Xr().props,
    [o, l] = m.useState(false),
    [u, d] = m.useState('alipay'),
    f = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
    p = rY(e?.price),
    g = () => {
      o || (l(true), document.getElementById('payment-create-form')?.submit());
    };
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2" onClick={() => Et.visit('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <div className="text-sm text-gray-500">确认订单</div>
      </div>
      {Xr().props.flash?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">发起支付失败</h3>
              <div className="mt-2 text-sm text-red-700">{Xr().props.flash.error}</div>
            </div>
          </div>
        </div>
      )}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="px-6 py-5">
          <div className="mb-4 text-sm font-semibold text-gray-900">商品信息</div>
          <div className="flex items-start gap-4 rounded-md border border-orange-100 bg-orange-50/30 p-4">
            <img
              src="/images/logo1.png"
              alt="扣单宝旗舰版"
              className="h-20 w-20 rounded-md border bg-white object-contain p-2"
            />
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-gray-900">
                扣单宝 - {e?.name || '旗舰版'}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                规格：{e?.label || '-'}，服务时长 {e?.days || 0} 天
              </div>
              <div className="mt-1 text-sm text-gray-600">
                服务期：{o2(e?.start_time)} 至 {o2(e?.end_time)}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                <span className="rounded-full bg-white px-2 py-1">扣数打印</span>
                <span className="rounded-full bg-white px-2 py-1">订单备注</span>
                <span className="rounded-full bg-white px-2 py-1">永久编号</span>
                <span className="rounded-full bg-white px-2 py-1">多店开播</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">单价</div>
              <div className="mt-1 text-lg font-semibold text-red-600">¥{p}</div>
              <div className="mt-2 text-sm text-gray-500">数量 1</div>
            </div>
          </div>
        </div>
        <div className="grid gap-6 border-t px-6 py-5 md:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-3 text-sm font-semibold text-gray-900">买家信息</div>
            <div className="rounded-md border bg-gray-50 p-4 text-sm text-gray-700">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">购买账号</span>
                <span>{t?.name || '-'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">手机号</span>
                <span>{aY(t?.phone)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">租户名称</span>
                <span>{t?.tenant_name || '-'}</span>
              </div>
            </div>
          </div>
          <div className="rounded-md border bg-white p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">商品金额</span>
              <span>¥{p}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-500">优惠金额</span>
              <span>- ¥0.00</span>
            </div>
            <div className="mt-4 border-t pt-4 text-right">
              <span className="mr-2 text-sm text-gray-500">实付款：</span>
              <span className="text-2xl font-bold text-red-600">¥{p}</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium text-gray-700">支付方式</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    value: 'alipay',
                    label: '支付宝支付',
                  },
                  {
                    value: 'wechat',
                    label: '微信支付',
                  },
                ].map((x) => (
                  <button
                    type="button"
                    className={`rounded-md border px-3 py-2 text-sm transition ${u === x.value ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
                    onClick={() => d(x.value)}
                  >
                    {x.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">
              <BadgeCheck className="h-4 w-4" />
              信息真实有效，清晰完整，未做修改
            </div>
            <Button
              className="mt-4 h-11 w-full bg-rose-600 text-white hover:bg-rose-700"
              disabled={o}
              onClick={g}
            >
              {o ? '提交中...' : '提交订单'}
            </Button>
          </div>
        </div>
      </div>
      <form id="payment-create-form" method="POST" action="/payment/create" className="hidden">
        <input type="hidden" name="_token" value={f} />
        <input type="hidden" name="plan_code" value={e?.plan_code || ''} />
        <input type="hidden" name="payment_method" value={u} />
      </form>
    </div>
  );
}

export default IM;
