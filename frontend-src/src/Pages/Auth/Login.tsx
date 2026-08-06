// @ts-nocheck
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Smartphone, Mail, Lock } from 'lucide-react'
import {   Xr, Co, gl, Et, m, s, at, zt, yn, cm, o2, CM, za, jv, oY, rY, aY, mv, s2, eY, tY, CG, EG, ii, Bm, jW, Em, cnService as cn, nc, vi, bG, fq, RR, Un, $n, EC, Jp, Fp, ap, yv, Gp, dG, dn, un, Hp, xM, UC, vM, xG, Aq, NO, qC, cf, l0, sG, bW, wW, SW, NW, MC, qd, rp, xW, Lx, bp, yf, kn, dj, OE, So, ab, ib, lb, ob, sb, Ib, Ab, Sb, Ob, Lb } from '@/lib/reverse-runtime'
import { Sf } from '@/lib/reverse-runtime'

// 页面: Auth/Login
// 模块: eH -> 组件函数: JB
function JB() {
  const {
      csrfToken: e,
      flash: t
    } = Xr().props,
    [a, o] = m.useState(false),
    [l, u] = m.useState(0),
    [d, f] = m.useState(false),
    [p, g] = m.useState(""),
    [x, v] = m.useState(""),
    {
      data: _,
      setData: S,
      post: j,
      processing: N,
      errors: w,
      reset: E,
      transform: A
    } = Co({
      phone: "",
      password: "",
      remember: true
    }),
    {
      data: R,
      setData: D,
      post: V,
      processing: U,
      errors: I,
      reset: B
    } = Co({
      phone: "",
      code: "",
      password: "",
      password_confirmation: ""
    });
  m.useEffect(() => {
    const te = Number(localStorage.getItem(Lx));
    te && te > Date.now() && u(Math.ceil((te - Date.now()) / 1e3));
  }, []), m.useEffect(() => {
    if (l <= 0) {
      localStorage.removeItem(Lx);
      return;
    }
    const te = setInterval(() => {
      u(Q => Q <= 1 ? 0 : Q - 1);
    }, 1e3);
    return () => clearInterval(te);
  }, [l]);
  const J = async te => {
      te.preventDefault(), A(Z => ({
        ...Z,
        _token: e || document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || ""
      }));
      const Q = {};
      if (window.electronAPI) {
        const Z = await bp();
        Z && yf(Q, Z);
      }
      j("/login", {
        headers: Q,
        onFinish: () => E("password")
      });
    },
    ie = async () => {
      if (!R.phone || l > 0 || d) {
        R.phone || g("请先输入手机号");
        return;
      }
      f(true), g(""), v("");
      try {
        await kn.post("/sms/send/password-reset", {
          phone: R.phone
        });
        const te = Date.now() + dj * 1e3;
        localStorage.setItem(Lx, String(te)), u(dj), v("验证码发送成功");
      } catch (te) {
        g(te.response?.data?.message || "验证码发送失败，请稍后重试"), v("");
      } finally {
        f(false);
      }
    },
    de = te => {
      te.preventDefault(), g(""), v(""), V("/password/reset", {
        onSuccess: () => {
          o(false), B();
        },
        onFinish: () => B("password", "password_confirmation")
      });
    };
  return <div className="min-h-screen bg-[#F4F2EE] flex items-center justify-center py-12 px-4"><OE title="登录 - 扣单宝" /><div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"><div className="space-y-8"><So href="/" className="inline-block"><img src="/images/logo.svg" alt="扣单宝" className="h-10 w-auto" /></So><div className="space-y-4"><span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-xs font-medium text-orange-700"><span className="size-2 rounded-full bg-green-500 animate-pulse" />智能直播场控系统</span><h1 className="text-4xl lg:text-5xl font-bold leading-tight text-gray-900">欢迎回来</h1><p className="text-lg text-gray-600 max-w-md">登录后即可继续管理您的直播店铺、打印配置和订单数据</p></div><div className="grid grid-cols-2 gap-4"><div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100"><div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-3"><span className="text-lg">🔐</span></div><p className="font-semibold text-gray-900 text-sm">数据安全隔离</p><p className="text-gray-500 text-xs mt-1">每个租户独立存储，保障数据安全</p></div><div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100"><div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mb-3"><span className="text-lg">🖨️</span></div><p className="font-semibold text-gray-900 text-sm">云端打印同步</p><p className="text-gray-500 text-xs mt-1">支持菜鸟云打印，多端实时同步</p></div></div></div><Ab className="border border-gray-200 bg-white shadow-xl rounded-3xl"><Sb className="pb-4"><Ob className="text-2xl text-gray-900">{a ? "忘记密码" : "账号登录"}</Ob><Ib className="text-gray-500">{a ? "通过手机号验证码重置密码" : "使用您的手机号和密码登录"}</Ib></Sb><Lb>{(w.phone || w.password || I.phone || I.code || I.password || p || t?.error) && <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"><AlertCircle className="mt-0.5 h-4 w-4" /><div>{w.phone && <p>{w.phone}</p>}{w.password && <p>{w.password}</p>}{I.phone && <p>{I.phone}</p>}{I.code && <p>{I.code}</p>}{I.password && <p>{I.password}</p>}{p && <p>{p}</p>}{t?.error && <p>{t.error}</p>}</div></div>}{(x || t?.success) && <div className="mb-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-600"><AlertCircle className="mt-0.5 h-4 w-4" /><div>{x && <p>{x}</p>}{t?.success && <p>{t.success}</p>}</div></div>}{a ? <form className="space-y-4" onSubmit={de}><div className="space-y-2"><Label htmlFor="reset_phone" className="text-gray-700">手机号</Label><div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-orange-400 transition-all"><Smartphone className="h-4 w-4 text-gray-400" /><Input id="reset_phone" type="tel" className="border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus-visible:ring-0" value={R.phone} onChange={te => D("phone", te.target.value)} placeholder="请输入手机号" required={true} autoComplete="tel" /></div></div><div className="space-y-2"><Label htmlFor="code" className="text-gray-700">验证码</Label><div className="flex items-center gap-2"><div className="flex flex-1 items-center gap-2 rounded-xl bg-gray-50 px-4 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-orange-400 transition-all"><Mail className="h-4 w-4 text-gray-400" /><Input id="code" type="text" className="border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus-visible:ring-0" value={R.code} onChange={te => D("code", te.target.value)} placeholder="请输入验证码" required={true} autoComplete="one-time-code" /></div><Button type="button" className="shrink-0 rounded-xl px-4" onClick={ie} disabled={l > 0 || d}>{l > 0 ? `${l}s` : "获取验证码"}</Button></div></div><div className="space-y-2"><Label htmlFor="new_password" className="text-gray-700">新密码</Label><div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-orange-400 transition-all"><Lock className="h-4 w-4 text-gray-400" /><Input id="new_password" type="password" className="border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus-visible:ring-0" value={R.password} onChange={te => D("password", te.target.value)} placeholder="请输入新密码" required={true} autoComplete="new-password" /></div></div><div className="space-y-2"><Label htmlFor="password_confirmation" className="text-gray-700">确认密码</Label><div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-orange-400 transition-all"><Lock className="h-4 w-4 text-gray-400" /><Input id="password_confirmation" type="password" className="border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus-visible:ring-0" value={R.password_confirmation} onChange={te => D("password_confirmation", te.target.value)} placeholder="请再次输入新密码" required={true} autoComplete="new-password" /></div></div><Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl py-6 shadow-lg shadow-orange-500/25" loading={U} loadingText="正在重置...">重置密码</Button></form> : <form className="space-y-5" onSubmit={J}><div className="space-y-2"><Label htmlFor="phone" className="text-gray-700">手机号</Label><div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-orange-400 transition-all"><Smartphone className="h-4 w-4 text-gray-400" /><Input id="phone" type="tel" className="border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus-visible:ring-0" value={_.phone} onChange={te => S("phone", te.target.value)} placeholder="请输入手机号" required={true} autoComplete="tel" /></div></div><div className="space-y-2"><Label htmlFor="password" className="text-gray-700">密码</Label><div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-orange-400 transition-all"><Lock className="h-4 w-4 text-gray-400" /><Input id="password" type="password" className="border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus-visible:ring-0" value={_.password} onChange={te => S("password", te.target.value)} placeholder="请输入密码" required={true} autoComplete="current-password" /></div></div><div className="flex items-center justify-between text-sm"><label className="inline-flex items-center gap-2 text-gray-600"><Checkbox id="remember" checked={_.remember} onCheckedChange={te => S("remember", !!te)} className="border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500" /><span>记住登录状态</span></label><p className="text-sm text-gray-500 text-center pt-2">没有账号？<So className="text-orange-600 hover:text-orange-700 font-medium" href="/register">去注册</So></p></div><Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl py-6 shadow-lg shadow-orange-500/25" loading={N} loadingText="正在登录...">立即登录</Button></form>}<div className="mt-6 text-center"><button type="button" className="text-sm text-gray-500 hover:text-gray-700 transition" onClick={() => {
              o(te => !te), g(""), v("");
            }}>{a ? "← 返回登录" : "忘记密码"}</button></div></Lb></Ab></div></div>;
}

export default JB
