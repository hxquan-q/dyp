// @ts-nocheck
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BadgeCheck, AlertCircle, Smartphone, Mail, Lock } from 'lucide-react';
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
  Bx,
  kn,
  fj,
  OE,
  So,
  ab,
  ib,
  lb,
  ob,
  sb,
  rj,
  Ib,
  Ab,
  Sb,
  RJ,
  Ob,
  Lb,
} from '@/lib/reverse-runtime';
import { Sf } from '@/lib/reverse-runtime';

// 页面: Auth/Register
// 模块: nH -> 组件函数: tH
function tH() {
  const {
      data: e,
      setData: t,
      post: a,
      processing: o,
      errors: l,
      reset: u,
    } = Co({
      name: '',
      phone: '',
      code: '',
      password: '',
      password_confirmation: '',
    }),
    [d, f] = m.useState(0),
    [p, g] = m.useState(false),
    [x, v] = m.useState(''),
    [_, S] = m.useState('');
  (m.useEffect(() => {
    const w = Number(localStorage.getItem(Bx));
    w && w > Date.now() && f(Math.ceil((w - Date.now()) / 1e3));
  }, []),
    m.useEffect(() => {
      if (d <= 0) {
        localStorage.removeItem(Bx);
        return;
      }
      const w = setInterval(() => {
        f((E) => (E <= 1 ? 0 : E - 1));
      }, 1e3);
      return () => clearInterval(w);
    }, [d]));
  const j = async () => {
      if (!e.phone || d > 0 || p) {
        e.phone || v('请先输入手机号');
        return;
      }
      (g(true), v(''), S(''));
      try {
        await kn.post('/sms/send/register', {
          phone: e.phone,
        });
        const w = Date.now() + fj * 1e3;
        (localStorage.setItem(Bx, String(w)), f(fj), S('验证码发送成功'));
      } catch (w) {
        const E = w.response.data.message || '验证码发送失败，请稍后重试';
        (v(E), S(''));
      } finally {
        g(false);
      }
    },
    N = (w) => {
      (w.preventDefault(),
        S(''),
        v(''),
        a('/register', {
          onFinish: () => u('password', 'password_confirmation'),
        }));
    };
  return (
    <div className="min-h-screen bg-[#F4F2EE] flex items-center justify-center py-12 px-4">
      <OE title="注册 - 扣单宝" />
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div className="space-y-8">
          <So href="/" className="inline-block">
            <img src="/images/logo.svg" alt="扣单宝" className="h-10 w-auto" />
          </So>
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-xs font-medium text-green-700">
              <BadgeCheck className="h-3 w-3" />
              免费试用 3 天
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-gray-900">
              开启智能扣单之旅
            </h1>
            <p className="text-lg text-gray-600 max-w-md">
              注册后系统自动创建专属租户空间，所有配置独立隔离，安全可靠
            </p>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center flex-shrink-0">
                <RJ className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">自动初始化</p>
                <p className="text-gray-500 text-sm mt-1">
                  系统自动创建租户空间和账户，无需手动配置
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                <k8 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">团队协作可扩展</p>
                <p className="text-gray-500 text-sm mt-1">
                  后续可扩展成员或绑定更多店铺，数据彼此隔离
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                <BadgeCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">安全合规</p>
                <p className="text-gray-500 text-sm mt-1">
                  密码加密存储，租户数据隔离，确保信息安全
                </p>
              </div>
            </div>
          </div>
        </div>
        <Ab className="border border-gray-200 bg-white shadow-xl rounded-3xl">
          <Sb className="pb-4">
            <Ob className="text-2xl text-gray-900">创建账户</Ob>
            <Ib className="text-gray-500">填写基本信息，我们会同时创建租户与主账号</Ib>
          </Sb>
          <Lb>
            {(l.name || l.phone || l.code || l.password || x) && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <div>
                  {l.name && <p>{l.name}</p>}
                  {l.phone && <p>{l.phone}</p>}
                  {l.code && <p>{l.code}</p>}
                  {l.password && <p>{l.password}</p>}
                  {x && <p>{x}</p>}
                </div>
              </div>
            )}
            {_ && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-600">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <div>
                  <p>{_}</p>
                </div>
              </div>
            )}
            <form className="space-y-4" onSubmit={N}>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700">
                  用户名
                </Label>
                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-orange-400 transition-all">
                  <RJ className="h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    className="border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus-visible:ring-0"
                    value={e.name}
                    onChange={(w) => t('name', w.target.value)}
                    placeholder="商家名称 / 联系人"
                    required={true}
                    autoComplete="name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  手机号
                </Label>
                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-orange-400 transition-all">
                  <Smartphone className="h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    className="border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus-visible:ring-0"
                    value={e.phone}
                    onChange={(w) => t('phone', w.target.value)}
                    placeholder="请输入手机号"
                    required={true}
                    autoComplete="tel"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code" className="text-gray-700">
                  短信验证码
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-xl bg-gray-50 px-4 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-orange-400 transition-all">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <Input
                      id="code"
                      type="text"
                      className="border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus-visible:ring-0"
                      value={e.code}
                      onChange={(w) => t('code', w.target.value)}
                      placeholder="请输入短信验证码"
                      required={true}
                      autoComplete="one-time-code"
                    />
                  </div>
                  <Button
                    type="button"
                    className="shrink-0 rounded-xl px-4"
                    onClick={j}
                    disabled={d > 0 || p}
                  >
                    {d > 0 ? `${d}s` : '获取验证码'}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  密码
                </Label>
                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-orange-400 transition-all">
                  <Lock className="h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    className="border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus-visible:ring-0"
                    value={e.password}
                    onChange={(w) => t('password', w.target.value)}
                    placeholder="至少 8 位，包含字母或数字"
                    required={true}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_confirmation" className="text-gray-700">
                  确认密码
                </Label>
                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-orange-400 transition-all">
                  <Lock className="h-4 w-4 text-gray-400" />
                  <Input
                    id="password_confirmation"
                    type="password"
                    className="border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus-visible:ring-0"
                    value={e.password_confirmation}
                    onChange={(w) => t('password_confirmation', w.target.value)}
                    placeholder="再次输入密码"
                    required={true}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl py-6 shadow-lg shadow-orange-500/25 mt-2"
                loading={o}
                loadingText="正在创建账户..."
              >
                立即注册
              </Button>
              <p className="text-sm text-gray-500 text-center pt-2">
                已有账号？
                <So className="text-orange-600 hover:text-orange-700 font-medium" href="/login">
                  去登录
                </So>
              </p>
            </form>
            <div className="mt-4 text-center">
              <So href="/" className="text-sm text-gray-500 hover:text-gray-700 transition">
                ← 返回首页
              </So>
            </div>
          </Lb>
        </Ab>
      </div>
    </div>
  );
}

export default tH;
