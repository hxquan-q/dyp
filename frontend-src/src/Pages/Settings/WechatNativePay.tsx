// @ts-nocheck
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
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

// 页面: Settings/WechatNativePay
// 模块: iY -> 组件函数: LM
function LM() {
  // ══════════ Settings/WechatNativePay 微信支付页 ══════════
  const { order: e } = Xr().props,
    { showToast: t } = Sf(),
    [a, o] = m.useState(false),
    l = m.useRef(false),
    u = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(e?.code_url || '')}`;
  return (
    m.useEffect(() => {
      if (!e?.out_trade_no) return;
      let d = null,
        f = null;
      const p = async () => {
        try {
          const g = await fetch(
            `/payment/status?out_trade_no=${encodeURIComponent(e.out_trade_no)}`,
            {
              headers: {
                Accept: 'application/json',
              },
            },
          );
          if (!g.ok) return;
          (await g.json())?.paid &&
            !l.current &&
            ((l.current = true),
            d && window.clearInterval(d),
            o(true),
            t({
              title: '支付成功',
              description: '订购已生效，即将跳转到订购记录。',
              type: 'success',
              duration: 2500,
            }),
            (f = window.setTimeout(() => {
              Et.visit('/settings/order-subscriptions');
            }, 1600)));
        } catch (g) {
          console.warn('Payment status polling failed', g);
        }
      };
      return (
        p(),
        (d = window.setInterval(p, 3e3)),
        () => {
          (window.clearInterval(d), f && window.clearTimeout(f));
        }
      );
    }, [e?.out_trade_no, t]),
    (
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <Button variant="ghost" className="gap-2" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <div className="text-lg font-semibold text-gray-900">微信支付</div>
          <div className="mt-2 text-sm text-gray-500">{e?.description}</div>
          <div className="mt-4 text-3xl font-bold text-red-600">￥{oY(e?.amount)}</div>
          <div className="mt-6 inline-flex rounded-md border bg-white p-3">
            <img src={u} alt="微信支付二维码" className="h-[260px] w-[260px]" />
          </div>
          <div className="mt-4 text-sm text-gray-600">请使用微信扫码完成支付</div>
          {a && <div className="mt-2 text-sm text-green-600">支付成功，正在跳转...</div>}
          <div className="mt-2 text-xs text-gray-400">订单号：{e?.order_no}</div>
          <Button
            className="mt-6 h-10 w-full"
            variant="outline"
            onClick={() => Et.visit('/settings/order-subscriptions')}
          >
            查看订购记录
          </Button>
        </div>
      </div>
    )
  );
}

export default LM;
