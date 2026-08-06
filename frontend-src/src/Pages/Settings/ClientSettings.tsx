// @ts-nocheck
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
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
  Xj,
  nv,
  Qj,
  hq,
} from '@/lib/reverse-runtime';
import { Sf } from '@/lib/reverse-runtime';

// 页面: Settings/ClientSettings
// 模块: QG -> 组件函数: PM
function PM() {
  const [e, t] = m.useState(false),
    [a, o] = m.useState(true),
    [l, u] = m.useState(false),
    [d, f] = m.useState(ii.closeBehavior),
    [p, g] = m.useState(false),
    [x, v] = m.useState(() => fq()),
    [_, S] = m.useState(''),
    [j, N] = m.useState('');
  m.useEffect(() => {
    const E = RR();
    if ((t(E), !E)) {
      o(false);
      return;
    }
    let A = false;
    return (
      window.electronAPI.clientSettings
        .get()
        .then((R) => {
          if (A) return;
          if (!R?.success) {
            N(R?.error || '读取客户端设置失败');
            return;
          }
          const D = Xj(R.settings);
          (f(D.closeBehavior), g(D.askOnClose === false), v(D.printProvider), nv(D.printProvider));
        })
        .catch((R) => {
          A || N(R?.message || '读取客户端设置失败');
        })
        .finally(() => {
          A || o(false);
        }),
      () => {
        A = true;
      }
    );
  }, []);
  const w = () => {
    if ((u(true), S(''), N(''), nv(x), Qj(x), !e)) {
      (S('系统设置已保存'), u(false));
      return;
    }
    const E = hq(d, p, x);
    window.electronAPI.clientSettings
      .update(E)
      .then((A) => {
        if (!A?.success) {
          N(A?.error || '保存客户端设置失败');
          return;
        }
        const R = Xj(A.settings);
        (f(R.closeBehavior),
          g(R.askOnClose === false),
          v(R.printProvider),
          nv(R.printProvider),
          Qj(R.printProvider),
          S('系统设置已保存'));
      })
      .catch((A) => {
        N(A?.message || '保存客户端设置失败');
      })
      .finally(() => u(false));
  };
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">系统设置</h1>
        <p className="text-sm text-gray-500">这些设置只影响当前设备。</p>
      </div>
      <div className="rounded-lg border bg-white p-6">
        <div className="space-y-5">
          {a ? (
            <div className="text-sm text-gray-500">正在读取系统设置...</div>
          ) : (
            <>
              <div className="space-y-5">
                <div>
                  <h2 className="text-base font-medium text-gray-900">关闭行为</h2>
                  <p className="mt-1 text-sm text-gray-500">设置点击主窗口关闭按钮时的处理方式。</p>
                </div>
                <RadioGroup value={d} onValueChange={f} className="gap-4">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem id="close-exit" value="exit" />
                    <Label htmlFor="close-exit" className="text-sm font-normal text-gray-800">
                      退出程序
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem id="close-tray" value="tray" />
                    <Label htmlFor="close-tray" className="text-sm font-normal text-gray-800">
                      最小化到托盘
                    </Label>
                  </div>
                </RadioGroup>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="remember-close-choice"
                    checked={p}
                    onCheckedChange={(E) => g(E === true)}
                  />
                  <Label
                    htmlFor="remember-close-choice"
                    className="text-sm font-normal text-gray-800"
                  >
                    关闭窗口时不再询问
                  </Label>
                </div>
              </div>
              <div className="border-t pt-5">
                <div className="mb-4">
                  <h2 className="text-base font-medium text-gray-900">打印方式</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    自动模式下，Mac 使用 系统打印，Windows 使用菜鸟打印组件。
                  </p>
                </div>
                <RadioGroup value={x} onValueChange={v} className="gap-4">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem id="print-provider-auto" value="auto" />
                    <Label
                      htmlFor="print-provider-auto"
                      className="text-sm font-normal text-gray-800"
                    >
                      自动
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem id="print-provider-cainiao" value="cainiao" />
                    <Label
                      htmlFor="print-provider-cainiao"
                      className="text-sm font-normal text-gray-800"
                    >
                      菜鸟打印组件
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem id="print-provider-electron" value="electron" />
                    <Label
                      htmlFor="print-provider-electron"
                      className="text-sm font-normal text-gray-800"
                    >
                      系统打印
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              {_ && <div className="text-sm text-green-600">{_}</div>}
              {j && <div className="text-sm text-red-600">{j}</div>}
              <div>
                <Button onClick={w} disabled={l}>
                  {l ? '保存中...' : '保存设置'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PM;
