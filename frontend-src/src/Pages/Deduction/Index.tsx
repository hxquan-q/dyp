// @ts-nocheck
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { HelpCircle, Trash2, PackageOpen } from 'lucide-react'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { TemplateSelect, PrinterSelect } from '@/components/ui/selectors'
import { TemplateFieldItem, SizeDialog } from '@/components/ui/template-editor'
import { Xr, Co, gl, Et, m, s, at, zt, yn, cm, o2, CM, za, jv, oY, rY, aY, mv, s2, eY, tY, CG, EG, ii, Bm, jW, Em, cnService as cn, nc, vi, bG, fq, RR, Un, $n, EC, Jp, Fp, ap, yv, Gp, dG, dn, un, Hp, xM, UC, vM, xG, Aq, NO, qC, cf, l0, sG, bW, wW, SW, NW, MC, qd, rp, xW, Nq, Kb, PC, RG, TG, xv, wq, T0, MG, OG, PG, FG, bv, fw, HG, ZC, QC, e2, jq, mi, c0, vv, Vb, Xd, UG, $G, Nv, Sv, YC, GG, RM, TM, VG, UE, Yv, KW, zC, bu, Fr, wa, Gr, Gs, oC, im, vr, hC, lv, gv, RV, ri, ou, au, qq, oi, rT, qW, FW, om, nT, x0, h0, eC, VW, m0, Qm, Ef, pM, GW, GR, kn, uM, BW, Id, Vl, OC, kW, UW, MW, $W, iM, lM, tG, ZW, eG, Qb, Zb, JW, NV, pv, QW, nw, Fm, PW, vV, Jj, Lt, It, Qd, DC, Wv, CR, ER, AR, Yl, zW, SF, LW, dM, fM, HW, IW, DW, xV, LC, IC, eV, sm, BC, Yt, Oe, Da, HT, ab, ib, lb, lu, ob, sb, da, tb, ng, Ib, LU, Ab, DA, TB, Sb, Ob, Lb, ErrToast } from '@/lib/reverse-runtime'
import { Sf } from '@/lib/reverse-runtime'

function gM() {
  // ══════════ Deduction/Index 扣数打印主页/直播工作台 ══════════
  const {
      apiToken: e,
      subscriptionSummary: t = null,
      shops: a = [],
      shopDisplayRows: o = [],
      dashboardRows: l = [],
      activeDashboardRowId: u = null
    } = Xr().props,
    {
      isElectron: d,
      liveStatus: f,
      liveOrderSyncStatus: p,
      danmakuList: g,
      electronMatchedCount: x,
      electronLuckyBagWonCount: v,
      electronActiveLuckyBagBatchNo: _,
      electronLuckyBagParticipated: S,
      sessionActive: j,
      startSession: N,
      stopSession: w,
      resetDanmakuBatch: E,
      resetLuckyBagBatch: A,
      clearDanmakuList: R,
      reloadConfig: D,
      bootstrapShops: V,
      channelsGetQr: U,
      channelsCheckLogin: I,
      channelsBindSession: B,
      getShopCapabilityStatus: J,
      switchShop: ie
    } = Fp(),
    de = !!t?.is_active,
    te = m.useRef(PC()),
    Q = m.useRef(KW()),
    Z = m.useMemo(() => l.filter(cf), [l]),
    ne = m.useRef(zC(Z, u)),
    [P, q] = m.useState(Z),
    [M, G] = m.useState(a),
    [fe, z] = m.useState(o),
    [$, re] = m.useState(Array.isArray(Z) && Z.length > 0),
    [oe, ge] = m.useState(false),
    [_e, X] = m.useState(false),
    [we, Re] = m.useState([]),
    [Me, Pe] = m.useState(false),
    [W, et] = m.useState(ne.current.selectedShop || {}),
    [Ue, nt] = m.useState(ne.current.selectedStoreShop),
    [be, qe] = m.useState(false),
    [mt, Pt] = m.useState(false),
    [yt, Xt] = m.useState(() => bu()),
    [nr, le] = m.useState(false),
    [Ye, Qt] = m.useState("custom"),
    [pt, Jt] = m.useState({
      deductMode: "numberWithKeyword",
      matchMode: "exact"
    }),
    [xn, ke] = m.useState([]),
    [He, ft] = m.useState(false),
    [st, gt] = m.useState({
      minutes: 5,
      compareMode: "identity",
      displayField: "nickname",
      checked: false
    }),
    [Rt, At] = m.useState({
      minutes: 5,
      compareMode: "identity",
      displayField: "nickname",
      checked: false
    }),
    [ee, se] = m.useState([]),
    [xt, dt] = m.useState(true),
    [jt, ct] = m.useState(false),
    [Tt, Vt] = m.useState(false),
    [Zt, vn] = m.useState([]),
    [Te, vt] = m.useState(true),
    [Ot, mn] = m.useState({
      participated: 0,
      won: 0
    }),
    [pr, bn] = m.useState(0),
    [Yn, _n] = m.useState({}),
    [$t, Wt] = m.useState(false),
    [dr, Or] = m.useState(false),
    [Rn, hn] = m.useState("idle"),
    [fr, Xn] = m.useState(),
    [fa, Rs] = m.useState(0),
    [ha, Kn] = m.useState({}),
    rr = m.useRef(/* @__PURE__ */new Set()),
    Qr = m.useRef(0),
    Qn = m.useRef(null),
    O = m.useRef(0),
    je = m.useRef(""),
    Xe = m.useRef(""),
    Le = m.useRef(null),
    $e = m.useRef(null),
    Ve = m.useRef(null),
    De = m.useRef(false),
    _t = m.useRef(null),
    [Zn, ja] = m.useState(null),
    Zr = m.useRef(null),
    Ts = m.useRef(null),
    {
      data: Se,
      setData: Tn,
      reset: _r,
      processing: In,
      errors: ls
    } = Co(te.current),
    {
      data: Ln,
      setData: qa
    } = Co(Q.current),
    Ke = m.useRef(Se),
    Vr = m.useRef(xn),
    Ms = m.useRef(Promise.resolve()),
    Bt = m.useRef($t),
    ma = m.useRef(dr),
    Pr = m.useRef(st),
    Os = m.useRef(true),
    en = m.useRef(false),
    ao = m.useRef(null),
    Va = m.useRef(0),
    H = m.useRef(0),
    ye = m.useRef(""),
    Ie = m.useRef(""),
    Ze = m.useRef(""),
    Qe = m.useRef([]),
    Ge = m.useRef(ne.current.selectedShop?.id ?? null),
    wn = m.useRef(Fr(ne.current.selectedShop)),
    ar = m.useRef("idle"),
    jr = m.useRef(0),
    gr = m.useRef(false),
    hr = m.useRef(0),
    sr = m.useRef(0),
    pa = m.useRef(0),
    Ro = m.useRef(""),
    [Mu, Ou] = m.useState(false),
    [yl, or] = m.useState(wa.gettingQrcode),
    [Pu, Dr] = m.useState(""),
    [Ps, To] = m.useState(null),
    [uc, xl] = m.useState(false),
    [dc, fc] = m.useState("订单店铺授权失效，请重新授权"),
    vl = m.useRef(null),
    ir = m.useRef(0),
    cs = m.useRef(null),
    Jr = m.useRef(null),
    so = m.useRef(false),
    hc = m.useRef(false),
    Ka = Rn !== "idle",
    us = b => {
      _t.current = b, ja(b);
    },
    Wa = () => {
      ar.current = "idle", hn("idle");
    },
    bi = (b = "订单店铺授权失效，请重新授权") => {
      fc(b), xl(true);
    },
    Af = () => {
      xl(false), window.location.href = "/shops";
    },
    bl = (b = W, k = _t.current) => {
      const L = Pr.current || {},
        F = Number(L.minutes),
        Ce = Gr(b),
        me = Gs(Ce),
        Fe = me === "dual" ? k?.storeShopId : null,
        ht = oC({
          liveShopId: b?.id ?? null,
          storeShopId: Fe,
          selectorMode: me,
          compareMode: L.compareMode ?? im(Ce)
        });
      return {
        enabled: !!L.checked && !!F && F > 0,
        minutes: F,
        compareMode: L.compareMode,
        storeShopId: Fe,
        storageKey: _i,
        cacheKey: ht
      };
    },
    Du = (b = W, k = Ke.current, L = Vr.current, F = _t.current) => {
      const Ce = vr();
      return {
        shopId: b?.id,
        platformCode: b?.platform_code,
        type: hs,
        templateId: k?.templateId,
        selectPrinter: k?.selectPrinter,
        templates: L,
        orderAlert: bl(b, F),
        orderAlertItems: ee,
        quickPassEnabled: !!k?.enableQuickPass,
        quickPassSeconds: Number(k?.quickPassSeconds || 0),
        quickPassStartedAt: Number(Ce?.quickPassStartedAt || sr.current || 0),
        onError: tt,
        onRetryPrinter: () => Ca(true, true, true)
      };
    },
    oa = (b = {}) => {
      if (!d) return;
      const k = b.shopId ?? W?.id,
        L = b.platformCode ?? W?.platform_code;
      hC(k, L) && lv({
        ...Du(),
        ...b
      });
    },
    ds = () => {
      ma.current = false, Or(false);
    },
    Yp = () => {
      if (!Bt.current || !d) return;
      const b = !ma.current;
      ma.current = b, Or(b), oa({
        paused: b
      });
    },
    fs = () => {
      vl.current && (clearInterval(vl.current), vl.current = null), ir.current += 1, cs.current = null, so.current = false, hc.current = false;
    },
    kf = (b = {}) => {
      const {
        clearPendingStart: k = true,
        clearActionState: L = true
      } = b;
      fs(), Ou(false), or(wa.gettingQrcode), Dr(""), To(null), k && (Jr.current = null), L && Wa();
    },
    Xp = b => {
      Jr.current = {
        ...b,
        retryUsed: !!b?.retryUsed
      }, Dr(""), To(null), or(wa.gettingQrcode), Ou(true);
    },
    Qp = b => {
      const k = b?.qrCodeUrl || Ps;
      return [1, 3].includes(b?.status) ? (or(wa.binding), Dr(""), "binding") : b?.status === 5 ? (or(wa.scannedWaitConfirm), Dr(""), k && To(k), "waiting_confirm") : k ? (or(wa.scanQrcode), To(k), Dr(""), "scan_qrcode") : (or(wa.gettingQrcode), "getting_qrcode");
    },
    Rf = async () => {
      const b = Jr.current;
      b && (await Mf({
        pendingStart: b,
        startAttemptId: b.startAttemptId,
        isChannelsRetry: true
      }));
    },
    Zp = async b => {
      const k = Jr.current;
      if (!k) return;
      const L = cs.current;
      if (!(b !== ir.current || !L)) try {
        const F = gv(await B(L, k.shop.id));
        if (b !== ir.current) return;
        if (!F?.success) {
          fs(), or(wa.failed), Dr(F?.error || "绑定视频号会话失败，请重试");
          return;
        }
        Jr.current = {
          ...k,
          retryUsed: true
        }, kf({
          clearPendingStart: false,
          clearActionState: false
        }), await Rf();
      } catch (F) {
        if (b !== ir.current) return;
        fs(), or(wa.failed), Dr(F?.message || "绑定视频号会话失败，请重试");
      } finally {
        so.current = false;
      }
    },
    Tf = async () => {
      const b = Jr.current,
        k = cs.current;
      if (!b || !k || so.current || hc.current) return;
      const L = ir.current;
      hc.current = true;
      try {
        const F = gv(await I(k));
        if (L !== ir.current || !Jr.current) return;
        if (!F?.success) {
          fs(), or(wa.failed), Dr(F?.error || "获取视频号二维码失败，请稍后重试");
          return;
        }
        if (F.code === "channels_not_live") {
          fs(), or(wa.failed), Dr("未检测到视频号直播，请先开播后再点击开启打印");
          return;
        }
        if ([1, 3].includes(F.status)) {
          so.current = true, await Zp(L);
          return;
        }
        Qp(F);
      } catch (F) {
        if (L !== ir.current) return;
        fs(), or(wa.failed), Dr(F?.message || "获取视频号二维码失败，请稍后重试");
      } finally {
        hc.current = false;
      }
    },
    Jp = async b => {
      fs(), Xp(b);
      try {
        const k = gv(await U());
        if (!k?.success || !k?.token || !(k?.qrCodeUrl || k?.qrUrl)) {
          fs(), or(wa.failed), Dr(k?.error || "获取视频号二维码失败，请稍后重试");
          return;
        }
        cs.current = k.token, To(k.qrCodeUrl || k.qrUrl), or(wa.scanQrcode), Dr("");
        const L = ir.current;
        vl.current = setInterval(() => {
          Tf();
        }, 1500), Tf().catch(() => {
          ir.current;
        });
      } catch (k) {
        fs(), or(wa.failed), Dr(k?.message || "获取视频号二维码失败，请稍后重试");
      }
    },
    eg = b => {
      b || kf();
    },
    Ds = (b = Date.now(), k = {}) => {
      if ($e.current && (clearInterval($e.current), $e.current = null), !Ke.current.enableQuickPass) {
        Xn(Number(Ke.current.quickPassSeconds) || 0), k.skipRuntimeSync || oa({
          quickPassEnabled: false,
          quickPassSeconds: Number(Ke.current.quickPassSeconds) || 0,
          quickPassStartedAt: 0
        });
        return;
      }
      const L = Number(Ke.current.quickPassSeconds) || 0;
      if (L <= 0) {
        Xn(0), k.skipRuntimeSync || oa({
          quickPassEnabled: true,
          quickPassSeconds: L,
          quickPassStartedAt: 0
        });
        return;
      }
      const F = Number(b || Date.now());
      sr.current = F, pa.current = Math.floor(Math.max(0, Date.now() - F) / 1e3 / L), k.skipRuntimeSync || oa({
        quickPassEnabled: true,
        quickPassSeconds: L,
        quickPassStartedAt: F
      });
      const Ce = () => {
        const me = vr();
        if (!en.current && me?.active && Number(me.quickPassRemaining || 0) > 0) {
          Xn(Number(me.quickPassRemaining));
          return;
        }
        const Fe = L * 1e3,
          ht = Math.max(0, Date.now() - F),
          bt = Math.floor(ht / Fe);
        if (ht >= Fe && bt > pa.current) {
          pa.current = bt, Kn({}), rr.current = /* @__PURE__ */new Set(), co(W?.platform_code, Ge.current, Ke.current).then(() => {
            Ke.current.enableQuickPass && Ds(Date.now(), {
              skipRuntimeSync: en.current
            });
          });
          return;
        }
        const kt = ht % Fe;
        if (ht > 0 && kt === 0) {
          Xn(0);
          return;
        }
        if (L === 1) {
          Xn(kt < 500 ? 1 : 0);
          return;
        }
        Xn(Math.ceil((Fe - kt) / 1e3));
      };
      Ce(), $e.current = setInterval(Ce, 250);
    },
    zu = (b = {}) => {
      $e.current && (clearInterval($e.current), $e.current = null), Xn(Number(Ke.current.quickPassSeconds) || 0), sr.current = 0, pa.current = 0, !b.skipRuntimeSync && oa({
        quickPassEnabled: !!Ke.current.enableQuickPass,
        quickPassSeconds: Number(Ke.current.quickPassSeconds) || 0,
        quickPassStartedAt: 0
      });
    },
    tg = async (b, k, L) => {
      gr.current = false, hr.current = Date.now(), ds(), Wt(true), us(L), RV(Du(b, Ke.current, Vr.current, L)), L?.storeShopId && L?.storeShop && nt(L.storeShop), Ds();
      const F = b.id,
        Ce = Fr(b);
      try {
        await Uf(Ce, L?.storeShopId ?? null);
      } catch (me) {
        console.warn("刷新店铺状态失败:", me);
      }
      return k !== jr.current ? (await ms({
        stopElectronSession: true
      }), false) : (L?.storeShopId && L?.storeShop && nt(L.storeShop), await zt.put(`/shops/${F}/toggle-printing`, {
        enable: true
      }).catch(me => console.warn("开启打印状态失败:", me)), Mo([]), mc(0), true);
    },
    Mf = async ({
      pendingStart: b = null,
      startAttemptId: k,
      isChannelsRetry: L = false
    }) => {
      const F = b?.shop || P.find(Sn => Fr(Sn) === wn.current) || W,
        Ce = ji(F, Ue),
        me = Ci(F, Ue, b),
        Fe = me.orderAlertEnabled ? b?.storeShopId ?? Ce.storeShopId : null,
        ht = me.orderAlertEnabled ? b?.storeShopRawData ?? Ce.storeShopRawData : null,
        bt = me.orderAlertEnabled ? b?.storeShopCurl ?? Ce.storeShopCurl : null,
        kt = me.orderAlertEnabled ? b?.storeAuthSubject ?? Ce.storeAuthSubject : null,
        jn = {
          liveShopId: F?.id ?? null,
          liveAuthSubject: F?.auth_subject ?? "shop",
          storeShop: me.orderAlertEnabled ? Ce.storeShop : null,
          storeShopId: Fe,
          storeShopRawData: ht,
          storeShopCurl: bt,
          storeAuthSubject: kt
        };
      let Mt = false;
      try {
        if (me.blocked) {
          Uu(me);
          return;
        }
        if (!F?.id) {
          tt("请选择店铺");
          return;
        }
        if (!d && !W?.is_connected) {
          tt("店铺连接失败，请重新连接");
          return;
        }
        if (!Se.templateId) {
          tt("请选择打印模板");
          return;
        }
        if (!(await oo())) {
          cn.isElectronProvider() || cn.showPrinterGuide(hs, () => Ca(true, true, true));
          return;
        }
        if (!Se.selectPrinter) {
          tt("请选择打印机");
          return;
        }
        if (Se.enableQuickPass && !Se.quickPassSeconds) {
          tt("请填写自动切换下一轮的秒数");
          return;
        }
        if (Se.deductionMode === "custom" && Se.customFormats?.includes("numberWithSize") && Se.sizeRuleOptions.findIndex(Dt => Dt.checked && Dt.label) < 0) {
          tt("请选择尺码");
          return;
        }
        if (Se.deductionMode === "custom" && (!Se.customFormats || Se.customFormats.length === 0)) {
          tt("请至少选择一种扣数格式");
          return;
        }
        if (Se.deductionMode === "custom" && Se.customFormats?.includes("numberWithKeyword") && !ri(Se.customKeywords)) {
          tt("请输入关键词");
          return;
        }
        if (Se.deductionMode === "grid" && (!Se.gridFormats || Se.gridFormats.length === 0)) {
          tt("请至少选择一种宫格扣数格式");
          return;
        }
        if (Se.deductionMode === "grid" && Se.gridFormats?.includes("numberWithKeyword") && !ri(Se.gridKeywords)) {
          tt("请输入宫格关键词");
          return;
        }
        if (Se.luckyBagEnabled) {
          const Dt = Number(Se.luckyBagEffectiveCount),
            Jn = Number(Se.luckyBagPrizeCount);
          if (!Number.isFinite(Dt) || Dt <= 0) {
            tt("请输入福袋有效参与总数");
            return;
          }
          if (!Number.isFinite(Jn) || Jn <= 0) {
            tt("请输入福袋中奖数");
            return;
          }
          if (Jn > Dt) {
            tt("福袋中奖数不能大于有效参与数");
            return;
          }
        }
        if (Se.deductionMode === "grid" && Se.gridFormats?.includes("numberWithKeyword") && !Se.gridAutoAssign && Se.gridKeywordDeductMode === "onlyKeyword") {
          tt("未开启按扣数内容自动入格时，关键词匹配规则不能选择仅关键词，请重新设置");
          return;
        }
        if (!F?.id || !F?.platform_code) {
          tt("请选择已授权的店铺");
          return;
        }
        if (F.platform_code === "taobao" && ou("start-click", {
          shop: au(F),
          actionState: Rn,
          autoPrint: $t,
          hasApiToken: !!e,
          storeShopId: Fe ?? null,
          hasStoreShopRawData: !!ht,
          storeShopRawDataKeys: Object.keys(ht || {}).slice(0, 50)
        }), d && (await ta(F.id, {
          ...Ke.current
        }, {
          silent: true
        })), d && F.platform_code !== "channels") {
          let Dt = J(F, "live");
          if (Dt.state === "pending") {
            let Jn = [];
            try {
              Jn = await V(M.length ? M : P, {
                force: true,
                capabilityNames: ["live"],
                ...Sc(F)
              });
            } catch (mo) {
              console.warn("重新读取店铺授权状态失败:", mo);
            }
            Dt = Array.isArray(Jn) && Jn.length > 0 ? qq({
              shop: F,
              capabilityName: "live",
              rows: Jn
            }) : J(F, "live");
          }
          if (oi(Dt)) {
            tt("主播账号授权失效，请重新授权");
            return;
          }
          if (Dt.state === "pending") {
            tt("直播上下文还在恢复，请稍后重试");
            return;
          }
          if (Dt.state !== "ready") {
            tt(Dt.message || "当前店铺直播上下文未就绪，请重新授权");
            return;
          }
          if (me.orderAlertEnabled && rT(F.platform_code) && !zf(Ce.storeShop || F)) return;
        }
        if (F.platform_code === "channels" && d) try {
          await V(M.length ? M : P, {
            force: true,
            ...Sc(F)
          });
        } catch (Dt) {
          console.warn("重新读取店铺授权状态失败:", Dt);
        }
        if (!d) {
          let Dt = J(F, "live");
          if (oi(Dt)) {
            tt("主播账号授权失效，请重新授权");
            return;
          }
          if (Dt.state === "pending") {
            tt("直播上下文还在恢复，请稍后重试");
            return;
          }
          if (Dt.state !== "ready") {
            tt(Dt.message || "主播账号授权失效，请重新授权");
            return;
          }
        }
        if (d) {
          F.platform_code === "taobao" && ou("ipc:startSession", {
            shop: au(F),
            storeShopId: Fe ?? null,
            hasStoreShopRawData: !!ht,
            orderAlertEnabled: me.orderAlertEnabled
          }), console.log(">>> [FRONTEND] About to call startSession IPC", {
            shopId: F.id,
            platform: F.platform_code,
            orderAlertEnabled: me.orderAlertEnabled,
            isElectron: d
          });
          const Dt = await N(F.id, F.shop_name || "", e, F.platform_code, Fe, ht, F.live_room_name || "", me.orderAlertEnabled, F.shop_curl || null, bt, F.auth_subject || "shop", kt);
          if (k !== jr.current) {
            Dt?.success && (await w(F.platform_code, F.id).catch(mo => console.warn("取消已过期的弹幕会话失败:", mo)));
            return;
          }
          if (F.platform_code === "taobao" && ou("ipc:result", {
            shop: au(F),
            result: Dt
          }), Dt?.success) {
            if (!(await tg(F, k, jn))) return;
            Jr.current = null;
            return;
          }
          if (F.platform_code === "channels" && Dt?.code === "channels_not_live") {
            tt("未检测到视频号直播，请先开播后再点击开启打印"), Jr.current = null;
            return;
          }
          if (F.platform_code === "channels" && !L && (Dt?.needLogin || Dt?.code === "channels_session_required")) {
            Mt = true, await Jp({
              startAttemptId: k,
              shop: F,
              storeShopId: Fe,
              storeShopRawData: ht,
              storeShopCurl: bt,
              storeAuthSubject: kt,
              orderAlertEnabled: me.orderAlertEnabled
            });
            return;
          }
          if (!me.orderAlertEnabled && Dt?.error === "order_restore_pending") {
            Jr.current = null;
            return;
          }
          const Jn = qW(Dt?.error);
          Dt?.error === "order_restore_pending" ? bi(Jn) : tt(Jn), Jr.current = null;
          return;
        }
        Ds(), co(), Qn.current = yn(), us(jn);
        const Sn = localStorage.getItem(Of),
          Hn = Sn ? JSON.parse(Sn) : {},
          Cn = Hn.endTime || null;
        Se.serialMode === "flow" && Cn && yn(Cn).add(Se.serialResetTime, "hour").isAfter(yn()) ? O.current = Hn.index || 0 : O.current = 0, gr.current = false, hr.current = Date.now(), ds(), Wt(true), console.log("开始任务，endTime为:", Cn, "index为：", O.current), Le.current = setInterval(() => {
          ki(Qn.current, yn(), Qr.current, O.current, je.current);
        }, 2e3), await zt.put(`/shops/${Ge.current}/toggle-printing`, {
          enable: true
        }).catch(Dt => console.warn("开启打印状态失败:", Dt));
      } catch (Sn) {
        if (console.error("启动自动打印失败", Sn), Ge.current) {
          const Hn = P.find(Cn => Fr(Cn) === wn.current) || W;
          Hn?.platform_code === "taobao" && ou("start-error", {
            shop: au(Hn),
            error: Sn
          });
        }
        tt(Sn?.message || "启动自动打印失败，请稍后重试"), Jr.current = null;
      } finally {
        Mt || Wa();
      }
    };
  m.useEffect(() => {
    Ke.current = Se, oa({
      templateId: Se.templateId,
      selectPrinter: Se.selectPrinter
    });
  }, [Se]), m.useEffect(() => {
    Vr.current = xn, oa({
      templates: xn
    });
  }, [xn]), m.useEffect(() => {
    Bt.current = $t;
  }, [$t]), m.useEffect(() => {
    ma.current = dr;
  }, [dr]), m.useEffect(() => {
    if (!d || Ke.current.deductionMode !== "grid") return;
    if (!Bt.current) {
      Kn({}), rr.current = /* @__PURE__ */new Set();
      return;
    }
    const b = vr()?.danmakuState?.activeBatchNo;
    if (!b) {
      Kn({}), rr.current = /* @__PURE__ */new Set();
      return;
    }
    const k = {},
      L = /* @__PURE__ */new Set();
    for (const F of g || []) {
      if (F?.batchNo !== b || !(F?.status === "matched" || F?.print_status || F?.printStatus)) continue;
      const me = FW(F);
      if (rr.current.has(me)) {
        L.add(me);
        continue;
      }
      const Fe = om(F, Ke.current.gridCount, Ke.current.gridAutoAssign);
      Fe && (L.add(me), k[Fe] = (k[Fe] || 0) + 1);
    }
    Object.keys(k).length > 0 && Kn(F => {
      const Ce = {
        ...F
      };
      return Object.entries(k).forEach(([me, Fe]) => {
        Ce[me] = (Ce[me] || 0) + Fe;
      }), Ce;
    }), L.size > 0 && (rr.current = /* @__PURE__ */new Set([...rr.current, ...L]));
  }, [d, g]), m.useEffect(() => {
    ar.current = Rn;
  }, [Rn]), m.useEffect(() => {
    if (d) return nT((b, k) => {
      if (!(!b || !(Number(b.shopId) === Number(Ge.current) && b.platformCode === W?.platform_code)) && ((k === "quick-pass-round" || k === "batch-reset") && (Kn({}), rr.current = /* @__PURE__ */new Set()), !(k === "subscribe" && b.stopReason === "live_ended"))) {
        if (b.stopReason === "live_ended") {
          if (gr.current) return;
          gr.current = true, ms().catch(F => {
            console.error("直播结束后停止自动打印失败", F);
          }).finally(() => {
            Wa(), tt("直播已结束，自动打印已关闭");
          });
          return;
        }
        Wt(!!b.active), Bt.current = !!b.active, b.active ? (Or(!!b.paused), ma.current = !!b.paused, Number(b.quickPassRemaining || 0) > 0 && Xn(Number(b.quickPassRemaining)), b.quickPassEnabled && Number(b.quickPassSeconds || 0) > 0 && Number(b.quickPassStartedAt || 0) > 0 && sr.current !== Number(b.quickPassStartedAt) && Ds(Number(b.quickPassStartedAt), {
          skipRuntimeSync: true
        })) : (ds(), sr.current = 0), Array.isArray(b.orderAlertItems) && se(b.orderAlertItems), k === "order-alert" && (ya.current = !!b.hasPendingOrderAlerts);
      }
    });
  }, [d, W?.platform_code]), m.useEffect(() => {
    W?.platform_code === "taobao" && ou("state-change", {
      shop: au(W),
      actionState: Rn,
      autoPrint: $t
    });
  }, [Rn, $t, W]), m.useEffect(() => {
    if (!d) return;
    const b = k => {
      const L = k?.detail || {},
        F = L?.reason;
      if (!["closed", "cancelled"].includes(F)) return;
      const Ce = P.find(Mt => Fr(Mt) === wn.current) || W;
      Ce?.platform_code === "taobao" && ou("support-window-closed", {
        shop: au(Ce),
        actionState: ar.current,
        autoPrint: Bt.current,
        reason: F
      });
      const me = vr(),
        Fe = Number(L?.shopId),
        ht = String(L?.platformCode || ""),
        bt = me?.shopId ?? Ge.current,
        kt = me?.platformCode ?? Ce?.platform_code;
      if (Number.isFinite(Fe) && Fe === Number(bt) && ht === String(kt || "")) {
        if (ar.current === "starting") {
          jr.current += 1, Wt(false), ds(), Wa();
          return;
        }
        Bt.current && ms({
          stopElectronSession: true
        });
      }
    };
    return window.addEventListener("electron:supportWindowClosed", b), () => window.removeEventListener("electron:supportWindowClosed", b);
  }, [d, P, W]), m.useEffect(() => () => {
    fs();
  }, []), m.useEffect(() => {
    const b = Et.on("before", () => {
      if (en.current) {
        if (!window.confirm("模拟开播测试正在进行，离开页面将结束本次测试，是否继续离开？")) return false;
        Ls();
        return;
      }
      if (!Bt.current || d) return;
      if (!window.confirm("自动打印已开启，离开页面将停止任务，是否继续离开？")) return false;
      ms();
    });
    return () => {
      b();
    };
  }, [d]), m.useEffect(() => {
    const b = k => {
      if (en.current) {
        k.preventDefault(), k.returnValue = "模拟开播测试正在进行，离开页面将结束本次测试，是否继续离开？";
        return;
      }
      Bt.current && (k.preventDefault(), k.returnValue = "自动打印已开启，离开页面将停止任务，是否继续离开？");
    };
    return window.addEventListener("beforeunload", b), () => {
      window.removeEventListener("beforeunload", b);
    };
  }, []), m.useEffect(() => {
    Pr.current = st;
  }, [st]), m.useEffect(() => {
    He && vc(st);
  }, [He, st]), m.useEffect(() => {
    if (W?.id) {
      Io(W);
      return;
    }
    nt(null);
  }, [W?.id, fe, M]), m.useEffect(() => {
    const b = () => {
      if (Bt.current && Ge.current) {
        console.log("检测到窗口关闭，尝试清理后台打印状态:", Ge.current), d && (x0(), window.electronAPI?.stopDanmakuSession?.({
          platformCode: W?.platform_code,
          shopId: Ge.current
        }).catch(k => console.warn("关闭弹幕会话失败:", k)));
        try {
          const k = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content"),
            L = new FormData();
          L.append("enable", "false"), L.append("_method", "PUT"), k && L.append("_token", k), navigator.sendBeacon(`/shops/${Ge.current}/toggle-printing`, L);
        } catch (k) {
          console.warn("清理状态失败:", k);
        }
      }
    };
    return window.addEventListener("unload", b), () => window.removeEventListener("unload", b);
  }, [d, W?.platform_code]);
  const [wi, mc] = m.useState(0),
    Of = "DANMU_TASK_END_KEY",
    pc = "ORDER_REMINDER_KEY",
    gc = "ORDER_ALERT_ENABLED_KEY",
    hs = 2,
    [wl, Mo] = m.useState([]),
    [Iu, Pf] = m.useState([]),
    [yc, Si] = m.useState(null),
    [Lu, Df] = m.useState({}),
    [Bu, Hu] = m.useState(""),
    [Fu, $u] = m.useState(false),
    {
      showError: tt,
      ErrorToastRenderer: ng,
      showSuccess: Sl
    } = gl(),
    xc = m.useRef(null);
  m.useEffect(() => {
    if (d && !en.current || !Bt.current && !en.current) return;
    if (!Ke.current.luckyBagEnabled || !Ke.current.enableLuckyBagQuickPass) {
      en.current ? Ze.current = "" : Ro.current = "";
      return;
    }
    const b = en.current,
      k = b ? Ie.current : Xe.current;
    if (!k) {
      b ? Ze.current = "" : Ro.current = "";
      return;
    }
    const L = Number(Ke.current.luckyBagEffectiveCount || 0);
    if (L <= 0) return;
    const Ce = ((b ? Zt : wl) || []).some(Fe => {
        if ((Fe?.luckyBagBatchNo ?? Fe?.lucky_bag_batch_no) !== k) return false;
        const bt = Number(Fe?.luckyBagPosition ?? Fe?.lucky_bag_position);
        return Number.isFinite(bt) && bt >= L;
      }),
      me = b ? Ze : Ro;
    !Ce || me.current === k || (me.current = k, Tl(W?.platform_code, Ge.current));
  }, [d, wl, W?.platform_code, Zt]);
  const Ni = (b = {}) => ({
      minutes: Number(b.minutes || 5),
      compareMode: b.compareMode || im(W?.platform_code),
      displayField: b.displayField || "nickname",
      checked: !!b.checked
    }),
    vc = (b = st) => {
      At(Ni(b));
    },
    Nl = (b, k) => {
      gt(L => {
        const F = Ni({
          ...L,
          [b]: k
        });
        return Pr.current = F, localStorage.setItem(pc, JSON.stringify(F)), F;
      });
    },
    Oo = (b, k) => {
      At(L => ({
        ...L,
        [b]: k
      }));
    },
    rg = b => {
      if (b) {
        const k = Ci(W, Ue, {
          orderAlertEnabled: true
        });
        if (k.blocked) {
          Uu(k);
          return;
        }
      }
      Bf(b), Nl("checked", b), dt(!!b);
    },
    _l = b => {
      if (ft(b), b) {
        vc();
        return;
      }
      vc();
    },
    _i = "ORDER_ALERT_LIST_CACHE_KEY";
  function ji(b = W, k = Ue) {
    const L = h0({
      liveShop: b,
      selectedStoreShop: k,
      isSplitPlatform: eC(Gr(b))
    });
    return {
      storeShop: L,
      storeShopId: L?.id ?? null,
      storeShopRawData: L?.raw_data ?? null,
      storeShopCurl: L?.shop_curl ?? null,
      storeAuthSubject: L?.auth_subject ?? null
    };
  }
  function jl(b = W, k = Ue) {
    const L = _t.current;
    return L && L.liveShopId === b?.id && L.storeShopId && Bt.current, false;
  }
  function bc(b) {
    return b?.id ? oi(J(b, "order")) || oi(J(b, "remark")) : false;
  }
  function Uu(b) {
    return b?.reason === "store_restore_pending" || b?.reason === "shop_restore_pending" ? (bi("订单店铺授权失效，请重新授权"), true) : b?.reason === "missing_store" ? (tt("请先选择订单店铺"), true) : false;
  }
  function zf(b) {
    if (!VW(b?.platform_code)) return true;
    const k = J(b, "order"),
      L = J(b, "remark");
    return oi(k) || oi(L) ? (bi("订单店铺授权失效，请重新授权"), false) : k.state === "pending" || L.state === "pending" ? (tt("订单店铺还在检测中，请稍后重试"), false) : k.state !== "ready" || L.state !== "ready" ? (tt(k.message || L.message || "当前店铺订单和备注能力未就绪，请重新授权"), false) : true;
  }
  function Ci(b = W, k = Ue, L = null) {
    if (!(L?.orderAlertEnabled ?? !!Pr.current?.checked)) return {
      orderAlertEnabled: false,
      reason: "disabled"
    };
    const Ce = ji(b, k),
      me = (L?.storeShopId, Ce.storeShop);
    if (Gs(Gr(b)) === "dual") {
      if (!me?.id) return {
        orderAlertEnabled: true,
        blocked: true,
        reason: "missing_store"
      };
      if (bc(me)) return {
        orderAlertEnabled: true,
        blocked: true,
        reason: "store_restore_pending"
      };
    } else if (bc(b)) return {
      orderAlertEnabled: true,
      blocked: true,
      reason: "shop_restore_pending"
    };
    return {
      orderAlertEnabled: true,
      reason: "ready"
    };
  }
  function If(b = W, k = Ue) {
    if (jl(b, k)) return {
      liveShopId: b?.id ?? null,
      storeShop: null,
      storeShopId: null,
      storeShopRawData: null,
      storeShopCurl: null
    };
    const L = _t.current;
    if (L && L.liveShopId === b?.id && (Bt.current || ya.current)) return L;
    const F = ji(b, k);
    return {
      liveShopId: b?.id ?? null,
      ...F
    };
  }
  const qu = ({
      liveShopId: b = Ge.current,
      liveShop: k = W,
      selectedStoreShop: L = Ue,
      platformCode: F = Gr(k),
      compareMode: Ce = Pr.current?.compareMode ?? im(F)
    } = {}) => jl(k, L) ? null : oC({
      liveShopId: b,
      storeShopId: ji(k, L).storeShopId,
      selectorMode: Gs(F),
      compareMode: Ce
    }),
    Lf = ({
      liveShopId: b = Ge.current,
      liveShop: k = W,
      selectedStoreShop: L = Ue,
      platformCode: F = Gr(k)
    } = {}) => {
      if (!b) return null;
      if (Gs(F) !== "dual") return `${b}:single`;
      const me = ji(k, L).storeShopId;
      return me ? `${b}:${me}` : null;
    },
    ag = (b = {}, k = false) => {
      try {
        const L = Lf(b);
        if (!L) return k;
        const F = JSON.parse(localStorage.getItem(gc) || "{}");
        return L in F ? !!F[L] : (F[L] = !!k, localStorage.setItem(gc, JSON.stringify(F)), !!k);
      } catch {
        return k;
      }
    },
    Bf = (b, k = {}) => {
      try {
        const L = Lf(k);
        if (!L) return;
        const F = JSON.parse(localStorage.getItem(gc) || "{}");
        F[L] = !!b, localStorage.setItem(gc, JSON.stringify(F));
      } catch {}
    },
    ga = (b, k, L = Pr.current) => {
      const F = Ni({
        ...L,
        checked: ag({
          liveShopId: b?.id ?? null,
          liveShop: b,
          selectedStoreShop: k,
          platformCode: Gr(b)
        }, !!L?.checked)
      });
      return Pr.current = F, gt(F), At(F), F;
    },
    Po = (b = {}) => {
      try {
        const k = JSON.parse(localStorage.getItem(_i)) || {},
          L = qu(b);
        if (!L || !k[L]) return [];
        const F = Date.now(),
          Ce = k[L].filter(me => me.timestamp && F - me.timestamp < 2592e5).map(me => m0(me));
        return Ce.length !== k[L].length && (k[L] = Ce, localStorage.setItem(_i, JSON.stringify(k))), Ce;
      } catch {
        return [];
      }
    },
    wc = (b, k = qu()) => {
      try {
        if (!k) return;
        const L = JSON.parse(localStorage.getItem(_i)) || {};
        L[k] = Qm([], b), localStorage.setItem(_i, JSON.stringify(L));
      } catch {}
    },
    Vu = async (b = []) => {
      const k = b.map(me => Number(me)).filter(me => Number.isFinite(me) && me > 0);
      if (!k.length || !Ge.current) return;
      const L = Gs(Gr(W)),
        F = If(W, Ue),
        Ce = {
          shopId: Ge.current,
          ids: k
        };
      L === "dual" && F.storeShopId && (Ce.storeShopId = F.storeShopId);
      try {
        await zt.post("/danmu/order/alerts/clear", Ce, {
          showLoading: false
        });
      } catch (me) {
        console.error("跑单提醒清除同步失败", me);
      }
    };
  m.useEffect(() => {
    if (W?.id) {
      ga(W, Ue), se(Po({
        compareMode: st.compareMode
      }));
      return;
    }
    se([]);
  }, [W?.id, W?.platform_code, W?.dashboard_platform_code, Ue?.id, st.compareMode]), m.useEffect(() => {
    if (!W?.platform_code) return;
    const k = Gs(Gr(W)) === "dual" ? ["nickname", "remark"] : ["identity", "remark"],
      L = im(Gr(W));
    gt(F => {
      const Ce = k.includes(F.compareMode) ? F.compareMode : L;
      if (Ce === F.compareMode) return F;
      const me = {
        ...F,
        compareMode: Ce
      };
      return localStorage.setItem(pc, JSON.stringify(me)), me;
    });
  }, [W?.platform_code, W?.dashboard_platform_code]);
  const Hf = async () => {
      const b = ee.map(k => k.id);
      try {
        await Vu(b);
      } finally {
        se([]), wc([]), oa({
          orderAlertItems: []
        });
      }
    },
    Ff = async b => {
      try {
        await Vu([b]);
      } finally {
        se(k => {
          const L = k.filter(F => F.id !== b);
          return wc(L), oa({
            orderAlertItems: L
          }), L;
        });
      }
    },
    ya = m.useRef(false),
    zs = () => {
      Ve.current && (clearInterval(Ve.current), Ve.current = null);
    },
    Do = async () => {
      if (De.current) return;
      const b = Pr.current,
        k = Number(b?.minutes);
      if (!k || k <= 0 || !Ge.current) return;
      const L = Ci(W, Ue);
      if (!L.orderAlertEnabled || L.blocked) {
        ya.current = false, us(null), zs();
        return;
      }
      const F = Gs(Gr(W)),
        Ce = If(W, Ue),
        me = F === "dual" ? Ce.storeShopId : null,
        Fe = qu({
          liveShopId: Ge.current,
          liveShop: W,
          selectedStoreShop: Ce.storeShop,
          platformCode: W?.platform_code
        });
      if (F === "dual" && !me) {
        ya.current = false, Bt.current || us(null);
        return;
      }
      De.current = true;
      try {
        const ht = {
          shopId: Ge.current,
          minutes: k,
          compareMode: b?.compareMode
        };
        me && (ht.storeShopId = me);
        const kt = (await zt.post("/danmu/order/match", ht, {
            showLoading: false
          })).data.data || {},
          jn = Array.isArray(kt) ? kt : kt.list ?? [];
        ya.current = kt.has_pending || false, !ya.current && !Bt.current && us(null), jn?.length > 0 && se(Mt => {
          const Sn = Date.now(),
            Hn = Qm(Mt, jn.map(Cn => ({
              id: Cn.id,
              nickname: Cn.nickname,
              itemCode: Cn.item_code,
              buyerNumber: Cn.buyer_number,
              serialNumber: Cn.num_index,
              commentTime: yn(Cn.comment_time).format("YYYY-MM-DD HH:mm:ss")
            })), Sn);
          return wc(Hn, Fe), Hn;
        });
      } catch (ht) {
        console.error("跑单提醒获取失败", ht);
      } finally {
        De.current = false, !$t && !ya.current && zs();
      }
    };
  async function Ca(b = false, k = false, L = false, F = {}) {
    L && Pe(true);
    try {
      await cn.loadPrinters(hs, {
        showGuideOnError: k,
        ...F,
        onPrinters: Ce => {
          if (Re([...Ce]), b && xc.current?.id) {
            const me = ap(xc.current, Ce);
            me && Tn("selectPrinter", me);
          }
        }
      });
    } catch (Ce) {
      console.error(Ce);
    } finally {
      L && Pe(false);
    }
  }
  m.useEffect(() => {
    const b = () => {
      Re([]), Tn("selectPrinter", ""), Ca(true, false, false);
    };
    return window.addEventListener(nc, b), () => window.removeEventListener(nc, b);
  }, []);
  async function oo() {
    if (cn.isConnected(hs)) return true;
    try {
      return await Ca(true, false, false), cn.isConnected(hs);
    } catch (b) {
      return console.warn("[dashboard] silent printer reconnect failed", b), false;
    }
  }
  const Ku = () => {
      Pt(true);
    },
    $f = ({
      width: b,
      height: k
    }) => {
      Et.visit(`/tag-templates/create?width=${b}&height=${k}`), Pt(false);
    };
  function zo(b) {
    return Xd(b) ? [] : Ef(b);
  }
  function Io(b, k = Ue) {
    if (!b || !eC(Gr(b))) return nt(null), null;
    if (Xd(b)) return nt(null), b;
    const L = pM(b);
    if (L !== void 0) return nt(L), L;
    const F = h0({
      liveShop: b,
      selectedStoreShop: k,
      isSplitPlatform: true
    });
    return nt(F), F;
  }
  function Lo(b, k = null) {
    if (!b) return et({}), nt(null), Ge.current = null, wn.current = null, se([]), ds(), null;
    GW(b), et(b);
    const L = Io(b, k);
    if (Ge.current = b.id, wn.current = Fr(b), hC(b.id, b.platform_code)) {
      const F = vr();
      return Wt(true), Bt.current = true, Or(!!F?.paused), ma.current = !!F?.paused, Array.isArray(F?.orderAlertItems) && se(F.orderAlertItems), oa(Du(b)), L;
    }
    return se(Po({
      liveShopId: b.id,
      liveShop: b,
      selectedStoreShop: L,
      compareMode: Pr.current?.compareMode
    })), ds(), L;
  }
  const Sc = (b = null) => {
    const k = vr(),
      L = Number(k?.active ? k.shopId : 0);
    if (Number.isFinite(L) && L > 0) return {
      preferredLiveShopId: L,
      preferredLivePlatformCode: k?.platformCode || void 0
    };
    const F = b?.id ? b : W,
      Ce = Number(F?.id ?? Ge.current ?? 0);
    return !Number.isFinite(Ce) || Ce <= 0 ? {} : {
      preferredLiveShopId: Ce,
      preferredLivePlatformCode: F?.platform_code || void 0
    };
  };
  function io() {
    return zt.get("/shops", {
      showLoading: false
    }).then(b => {
      const k = b.data.data || {},
        L = k.shops || [],
        F = k.shop_display_rows || [],
        Ce = (k.dashboard_rows || []).filter(cf),
        me = k.active_dashboard_row_id || null;
      return G(L), z(F), q(Ce), re(true), window.electronAPI && V(L, Sc()).catch(Fe => {
        console.warn("恢复店铺授权状态失败:", Fe);
      }), {
        dashboardRows: Ce,
        activeDashboardRowId: me
      };
    });
  }
  async function Uf(b = null, k = null) {
    const {
      dashboardRows: L,
      activeDashboardRowId: F
    } = await io();
    if (!L.length) return Lo(null), await Is(null), [];
    const {
      selectedShop: Ce,
      selectedStoreShop: me
    } = GR({
      dashboardRows: L,
      preferredDashboardRowId: b,
      activeDashboardRowId: F,
      preferredStoreShopId: k
    });
    return Lo(Ce, me), await Is(Ce?.id ?? null), L;
  }
  const Wu = async b => {
    if (Bt.current || ar.current !== "idle") return tt("自动打印运行中或正在切换状态，请稍后再切换店铺");
    Lo(b, null), await Is(b.id), lr || $s({
      page: 1,
      shopId: b.id
    }), Sl(`已切换到店铺：${b.shop_name}`), kn.post("/shops/switch", {
      shop_id: b.id,
      dashboard_row_id: Fr(b)
    }).catch(() => {});
  };
  async function qf(b) {
    await zt.get("/tag-templates/list", {
      showLoading: false
    }).then(k => {
      if (ke(k.data.data), k.data.data?.length && !b?.templateId) {
        let L = k.data.data.find(F => F.is_default);
        L || (L = k.data.data[0]), Tn("templateId", L.id), xc.current = L;
      } else if (b?.templateId) {
        let L = k.data.data.find(F => F.id === b.templateId);
        L || (L = k.data.data.find(F => F.is_default)), L || (L = k.data.data[0]), Tn("templateId", L.id), xc.current = L;
      }
    });
  }
  m.useEffect(() => {
    let b = null;
    return (async () => {
      const k = localStorage.getItem(pc);
      if (k) {
        const me = Ni(JSON.parse(k));
        Pr.current = me, gt(me), At(me);
      }
      let L = ne.current.selectedShop,
        F = ne.current.selectedStoreShop;
      if (L?.id && Lo(L, F), window.electronAPI || !Z.length) {
        const {
            dashboardRows: me,
            activeDashboardRowId: Fe
          } = await io(),
          ht = zC(me, Fe);
        L = ht.selectedShop, F = ht.selectedStoreShop, Lo(L, F);
      } else re(true);
      await Is(L?.id ?? null), await qf({}), $s({
        page: 1
      }), b = setTimeout(() => {
        Ca(true, false, false, {
          retries: 0,
          timeoutMs: 1500
        }).catch(me => {
          console.warn("[dashboard] background printer warmup skipped", me);
        });
      }, 1200);
    })(), () => {
      console.log("组件卸载，执行清理逻辑"), Le.current && (clearInterval(Le.current), Le.current = null), $e.current && (clearInterval($e.current), $e.current = null), b && clearTimeout(b), Zr.current?.cancel();
    };
  }, []), m.useEffect(() => {
    Xn(Se.quickPassSeconds);
  }, [Se.quickPassSeconds]), m.useEffect(() => {
    const b = Ci(W, Ue);
    b.orderAlertEnabled && !b.blocked || (ya.current = false, us(null), zs(), dt(false), se([]));
  }, [W?.id, W?.platform_code, W?.dashboard_platform_code, Ue?.id]), m.useEffect(() => {
    if (!st.checked) {
      zs(), oa({
        orderAlert: bl()
      });
      return;
    }
    const b = Number(st.minutes);
    if (!b || b <= 0) {
      zs(), oa({
        orderAlert: bl()
      });
      return;
    }
    const k = Ci(W, Ue);
    if (!k.orderAlertEnabled || k.blocked) {
      ya.current = false, us(null), dt(false), zs(), oa({
        orderAlert: bl()
      });
      return;
    }
    if (d && Bt.current) {
      oa({
        orderAlert: bl()
      }), zs();
      return;
    }
    if (!$t && !ya.current) {
      zs();
      return;
    }
    if (!Ve.current) return Do(), Ve.current = setInterval(Do, b / 2 * 60 * 1e3), () => {
      zs();
    };
  }, [st.checked, st.minutes, st.compareMode, $t, W?.id, W?.platform_code, W?.dashboard_platform_code, Ue?.id]);
  const Cl = (b, {
      saveMode: k = "debounced",
      saveOptions: L,
      shopId: F = Ge.current
    } = {}) => (Tn(b), Ke.current = b, k === "flush" ? ta(F, b, L) : (k === "debounced" && Nc(F, b, L), Promise.resolve(b))),
    El = async (b, {
      field: k = null,
      isLiveRuleField: L = false,
      isLivePrintConfigField: F = false
    } = {}) => {
      const Ce = en.current,
        me = Bt.current,
        Fe = k === "enableQuickPass" || k === "quickPassSeconds";
      if (!F && !(!L && !Fe)) {
        if (k === "enableQuickPass" && !b.enableQuickPass) {
          zu(Ce ? {
            skipRuntimeSync: true
          } : void 0), (Ce || me) && (await co(W?.platform_code, Ge.current, b));
          return;
        }
        if (Ce) {
          await co(W?.platform_code, Ge.current, b), b.enableQuickPass && Ds(Date.now(), {
            skipRuntimeSync: true
          });
          return;
        }
        me && (await co(W?.platform_code, Ge.current, b), b.enableQuickPass && Ds());
      }
    };
  function Ar(b, k) {
    if (b === "selectPrinter" && k === 0) {
      Ca(true, true, true);
      return;
    }
    if (b === "gridAutoAssign" && k === false && (f?.isLiving || j || Bt.current) && Ke.current.deductionMode === "grid" && Ke.current.gridFormats?.includes("numberWithKeyword") && Ke.current.gridKeywordDeductMode === "onlyKeyword" && Ke.current.gridKeywordMatchMode === "fuzzy") {
      tt("正在直播中，关键词匹配规则为仅关键词模糊匹配时，不能取消按扣数内容自动入格");
      return;
    }
    let L = {
      ...Ke.current,
      [b]: k
    };
    if (b === "luckyBagEnabled" && !k && (L.enableLuckyBagQuickPass = false), b === "selectPrinter" && uM(k), b === "templateId") {
      const kt = xn.find(Mt => Mt.id === k),
        jn = ap(kt, we);
      jn && (L.selectPrinter = jn);
    }
    const F = BW.has(b),
      Ce = Id.has(b),
      me = en.current,
      ht = (Bt.current || me) && (Ce || F) ? "flush" : "debounced",
      bt = Bt.current && F ? {
        applyWithoutNextRound: true
      } : void 0;
    Cl(L, {
      saveMode: ht,
      saveOptions: bt
    }).then(async () => {
      await El(Ke.current, {
        field: b,
        isLiveRuleField: Ce,
        isLivePrintConfigField: F
      });
    });
  }
  function ea(b, k) {
    Tn(b, k), Ke.current = {
      ...Ke.current,
      [b]: k
    };
  }
  function ia(b, k, L = "string") {
    let F = k;
    L === "number" ? F = k === "" ? "" : Math.max(0, Number(k)) : ["numberSpecified", "customKeywords", "gridKeywords"].includes(b) && (F = ri(k)), F === te.current[b] && b in te.current, Ar(b, F);
  }
  function Kr(b) {
    b.key === "Enter" && b.target.blur();
  }
  const Ga = async (b, k, L = {}) => {
    if (!b) return null;
    P.find(Fe => Fe.id === b);
    let F = k.enableLightBrandFirst,
      Ce = k.onlyLightBrand;
    F && Ce && (F = false);
    const me = {
      printRule: k.deductionMode === "grid" ? "grid" : "customCombined",
      deductionMode: k.deductionMode || "custom",
      numberMode: k.numberMode || "specified",
      numberMin: k.numberMin,
      numberMax: k.numberMax,
      numberSpecified: ri(k.numberSpecified),
      numberIncludeDecimal: !!k.numberIncludeDecimal,
      customFormats: k.customFormats || [],
      customKeywords: ri(k.customKeywords),
      customKeywordDeductMode: k.customKeywordDeductMode || "numberWithKeyword",
      customKeywordMatchMode: k.customKeywordMatchMode || "exact",
      gridCount: Vl(k.gridCount),
      gridAutoAssign: !!k.gridAutoAssign,
      gridFormats: k.gridFormats || [],
      gridKeywords: ri(k.gridKeywords),
      gridKeywordDeductMode: k.gridKeywordDeductMode || "numberWithKeyword",
      gridKeywordMatchMode: k.gridKeywordMatchMode || "exact",
      gridDedupMode: k.gridDedupMode || "buyerEachGridOnce",
      keyword1: k.keyword1,
      keyword2: k.keyword2,
      keyword3: k.keyword3,
      sizeRules: OC(k.sizeRuleOptions),
      antiDuplicateEnabled: k.antiDuplicateEnabled,
      antiDuplicateSeconds: k.antiDuplicateSeconds,
      enableLimitOrder: k.enableLimitOrder,
      limitOrderCount: k.limitOrderCount,
      enableQuickPass: k.enableQuickPass,
      enableLuckyBagQuickPass: !!k.enableLuckyBagQuickPass,
      quickPassSeconds: k.quickPassSeconds,
      serialMode: k.serialMode,
      serialResetTime: k.serialResetTime,
      lightBrandFirst: F,
      lightBrandDelay: k.lightBrandPrintDelay,
      onlyLightBrand: Ce,
      luckyBagEnabled: !!k.luckyBagEnabled,
      luckyBagEffectiveCount: k.luckyBagEffectiveCount,
      luckyBagPrizeCount: k.luckyBagPrizeCount,
      luckyBagMaxWinsPerUser: k.luckyBagMaxWinsPerUser || null,
      luckyBagMaxParticipationsPerUser: k.luckyBagMaxParticipationsPerUser || null
    };
    try {
      if (await zt.post("/deduction-rule", {
        shopId: b,
        ...me
      }, {
        showLoading: false
      }), window.electronAPI) {
        if (await D().catch(Fe => console.warn("Desktop rule reload delayed", Fe)), !L.silent) {
          if (L.applyWithoutNextRound) return Sl?.("扣数规则已更新并实时生效"), me;
          Sl?.("扣数规则已更新并实时生效");
        }
      } else if (!L.silent && L.applyWithoutNextRound) return me;
      return me;
    } catch (Fe) {
      throw console.error("保存扣数规则失败", Fe), Fe;
    }
  };
  Ts.current = Ga, Zr.current || (Zr.current = kW({
    delayMs: 500,
    save: (...b) => Ts.current?.(...b)
  }));
  const Nc = (b, k, L) => {
      b && Zr.current?.schedule(b, k, L);
    },
    ta = (b, k, L) => b && Zr.current?.flush(b, k, L) || Promise.resolve(null),
    Is = async b => {
      if (!b) {
        const k = PC();
        return Tn(k), Ke.current = k, k;
      }
      try {
        const k = await zt.get("/deduction-rule", {
          params: {
            shopId: b
          },
          showLoading: false
        });
        if (k.data?.code !== 0 || !k.data?.data) return null;
        const L = k.data.data,
          F = UW(L);
        let Ce = L.lightBrandFirst ?? false,
          me = L.onlyLightBrand ?? false;
        Ce && me && (Ce = false);
        const Fe = {
          ...Ke.current,
          printRule: L.printRule || "anyNumber",
          ...F,
          keyword1: L.keyword1 || "",
          keyword2: L.keyword2 || "",
          keyword3: L.keyword3 || "",
          customKeywordDeductMode: L.customKeywordDeductMode || F.customKeywordDeductMode || "numberWithKeyword",
          customKeywordMatchMode: L.customKeywordMatchMode || F.customKeywordMatchMode || "exact",
          gridKeywordDeductMode: L.gridKeywordDeductMode || F.gridKeywordDeductMode || "numberWithKeyword",
          gridKeywordMatchMode: L.gridKeywordMatchMode || F.gridKeywordMatchMode || "exact",
          antiDuplicateEnabled: L.antiDuplicateEnabled ?? false,
          antiDuplicateSeconds: L.antiDuplicateSeconds ?? 60,
          enableLimitOrder: L.enableLimitOrder ?? false,
          limitOrderCount: L.limitOrderCount ?? 10,
          enableQuickPass: L.enableQuickPass ?? false,
          enableLuckyBagQuickPass: L.enableLuckyBagQuickPass ?? false,
          quickPassSeconds: L.quickPassSeconds ?? 30,
          serialMode: L.serialMode || "round",
          serialResetTime: L.serialResetTime ?? 0,
          enableLightBrandFirst: Ce,
          lightBrandPrintDelay: L.lightBrandDelay ?? 30,
          onlyLightBrand: me,
          luckyBagEnabled: L.luckyBagEnabled ?? false,
          luckyBagEffectiveCount: L.luckyBagEffectiveCount ?? 100,
          luckyBagPrizeCount: L.luckyBagPrizeCount ?? 5,
          luckyBagMaxWinsPerUser: L.luckyBagMaxWinsPerUser ?? "",
          luckyBagMaxParticipationsPerUser: L.luckyBagMaxParticipationsPerUser ?? "",
          sizeRuleOptions: MW(L.sizeRules)
        };
        return Tn(Fe), Ke.current = Fe, Fe;
      } catch (k) {
        console.error("加载扣数规则失败", k);
      }
    };
  function _c(b) {
    Ar("deductionMode", b);
  }
  function Al(b) {
    Ar("gridCount", Vl(b, Ke.current.gridCount || 12));
  }
  function kl(b, k, L) {
    const F = $W(Ke.current[b], k, L);
    if (!F.length) {
      tt("请至少选择一种扣数格式");
      return;
    }
    Ar(b, F);
  }
  const Gu = b => {
      qe(b), b && Xt(iM(Se.sizeRuleOptions));
    },
    Bo = (b, k) => {
      Xt(L => L.map(F => F.id === b ? {
        ...F,
        checked: !!k
      } : F));
    },
    Vf = (b, k) => {
      Xt(L => L.map(F => F.id === b ? {
        ...F,
        label: k
      } : F));
    },
    jc = () => {
      const b = {
        id: `custom-${Date.now()}`,
        label: "",
        checked: false,
        isCustom: true,
        removable: true
      };
      Xt(k => [...k, b]);
    },
    Ei = b => {
      Xt(k => k.filter(L => L.id !== b));
    },
    sg = () => {
      const b = lM(yt);
      Ar("sizeRuleOptions", b), qe(false);
    },
    la = b => {
      const k = b === "grid",
        L = Ke.current[k ? "gridKeywordDeductMode" : "customKeywordDeductMode"] || "numberWithKeyword",
        F = Ke.current[k ? "gridKeywordMatchMode" : "customKeywordMatchMode"] || "exact";
      Qt(b), Jt({
        deductMode: L,
        matchMode: k && Ke.current.gridAutoAssign && L === "onlyKeyword" && F === "exact" ? "fuzzy" : F
      }), le(true);
    },
    Yu = () => {
      const b = Ye === "grid",
        k = b ? "gridKeywordDeductMode" : "customKeywordDeductMode",
        L = b ? "gridKeywordMatchMode" : "customKeywordMatchMode",
        F = b && Ke.current.gridAutoAssign && pt.deductMode === "onlyKeyword" && pt.matchMode === "exact" ? "fuzzy" : pt.matchMode,
        Ce = {
          ...Ke.current,
          [k]: pt.deductMode,
          [L]: F
        },
        me = Id.has(k) || Id.has(L),
        Fe = (Bt.current || en.current) && me ? "flush" : "debounced";
      Cl(Ce, {
        saveMode: Fe
      }).then(() => El(Ke.current, {
        isLiveRuleField: me
      })), le(false);
    },
    Kf = (Se.sizeRuleOptions?.length ? Se.sizeRuleOptions : bu()).filter(b => b.checked && b.label?.trim()).length,
    Rl = !!Se.luckyBagEnabled,
    Ho = d && $t ? v : Tt ? Ot.won : 0,
    Cc = () => yn().format("YYYYMMDDHHmmss") + Math.floor(1e3 + Math.random() * 9e3);
  function Xu(b = Ke.current, k = {}) {
    const {
      resetLuckyBag: L = false
    } = k;
    b.serialMode === "round" && (H.current = 0), ye.current = Cc(), Va.current = 0, Qe.current = [], bn(0), _n({}), L && (Ie.current = ye.current, Ze.current = "", mn({
      participated: 0,
      won: 0
    }));
  }
  async function co(b = null, k = null, L = null) {
    const F = b || W?.platform_code,
      Ce = k || Ge.current,
      me = L || Ke.current;
    if (en.current) {
      Xu(me);
      return;
    }
    if (d && !en.current) {
      const Fe = await E(F, Ce);
      Fe?.success || console.warn("Electron 下一轮切换失败:", Fe?.error);
    }
    me.serialMode === "round" && (O.current = 0), je.current = "", Qr.current = 0, rr.current = /* @__PURE__ */new Set(), Rs(0), Kn({});
  }
  async function Tl(b = null, k = null) {
    const L = b || W?.platform_code,
      F = k || Ge.current;
    if (en.current) {
      Ie.current = Cc(), Ze.current = "", mn({
        participated: 0,
        won: 0
      });
      return;
    }
    if (d) {
      const Ce = await A(L, F);
      Ce?.success || console.warn("Electron 福袋下一轮切换失败:", Ce?.error);
    }
    Xe.current = "", Ro.current = "";
  }
  function Ea() {
    const b = tG(Ke.current);
    Cl(b, {
      saveMode: "flush"
    }).then(() => {
      El(Ke.current, {
        isLiveRuleField: true
      });
    });
  }
  async function ms({
    stopElectronSession: b = false
  } = {}) {
    console.log("stop任务开始"), Le.current && (clearInterval(Le.current), Le.current = null), zu(), Wt(false), ds(), b && d && x0(), ya.current || us(null), localStorage.setItem(Of, JSON.stringify({
      endTime: yn(),
      index: O.current
    }));
    const k = [];
    Ge.current && k.push(zt.put(`/shops/${Ge.current}/toggle-printing`, {
      enable: false
    }).catch(L => console.warn("关闭打印状态失败:", L))), b && d && k.push(w(W?.platform_code, Ge.current).catch(L => console.warn("关闭弹幕会话失败:", L))), k.length > 0 && (await Promise.allSettled(k)), d && Ge.current && $s({
      page: 1
    });
  }
  async function Ai() {
    if (ar.current !== "idle") return;
    if (Bt.current) {
      jr.current += 1, ar.current = "stopping", hn("stopping");
      try {
        await ms({
          stopElectronSession: d
        });
      } catch (k) {
        console.error("停止自动打印失败", k), tt(k?.message || "停止自动打印失败，请稍后重试");
      } finally {
        Wa();
      }
      return;
    }
    if (!de) {
      tt("账号已过期，请先续费");
      return;
    }
    const b = jr.current + 1;
    jr.current = b, ar.current = "starting", hn("starting");
    try {
      await Mf({
        startAttemptId: b
      });
    } catch (k) {
      console.error("启动自动打印失败", k), tt(k?.message || "启动自动打印失败，请稍后重试"), Wa();
    }
  }
  function ki(b, k, L, F, Ce) {
    Xe.current || (Xe.current = yn().format("YYYYMMDDHHmmss") + Math.floor(1e3 + Math.random() * 9e3));
    const me = {
      ...Ke.current,
      shopId: Ge.current,
      hasDeductedCount: L,
      startTime: b.format("YYYY-MM-DD HH:mm:ss"),
      endTime: k.format("YYYY-MM-DD HH:mm:ss"),
      currentIndex: F,
      batchNo: Ce,
      luckyBagBatchNo: Xe.current
    };
    me.printRule = me.deductionMode === "grid" ? "grid" : "customCombined", me.numberSpecified = ri(me.numberSpecified), me.customKeywords = ri(me.customKeywords), me.gridKeywords = ri(me.gridKeywords), me.sizeRules = OC(Ke.current.sizeRuleOptions), me.luckyBagEnabled = !!me.luckyBagEnabled, me.luckyBagEffectiveCount = Number(me.luckyBagEffectiveCount || 100), me.luckyBagPrizeCount = Number(me.luckyBagPrizeCount || 0), me.luckyBagMaxWinsPerUser = me.luckyBagMaxWinsPerUser === "" ? null : Number(me.luckyBagMaxWinsPerUser), me.luckyBagMaxParticipationsPerUser = me.luckyBagMaxParticipationsPerUser === "" ? null : Number(me.luckyBagMaxParticipationsPerUser), zt.post("/danmu/print", me, {
      showLoading: false
    }).then(Fe => {
      const {
        list: ht,
        total: bt,
        currentIndex: kt,
        hasData: jn,
        hasPendingDelay: Mt
      } = Fe.data.data;
      if (ht.length) {
        if (je.current = ht[0].batch_no, O.current = kt, Qr.current += ht.length, Rs(Qr.current), !d && Ke.current.luckyBagEnabled && Ke.current.enableLuckyBagQuickPass) {
          const Sn = Xe.current,
            Hn = Number(Ke.current.luckyBagEffectiveCount || 0);
          Sn && Hn > 0 && ht.some(Dt => {
            const Jn = Dt?.luckyBagBatchNo ?? Dt?.lucky_bag_batch_no,
              mo = Number(Dt?.luckyBagPosition ?? Dt?.lucky_bag_position);
            return Jn === Sn && Number.isFinite(mo) && mo >= Hn;
          }) && Ro.current !== Sn && (Ro.current = Sn, Tl(W?.platform_code, Ge.current));
        }
        Kn(Sn => {
          const Hn = {
            ...Sn
          };
          return ht.forEach(Cn => {
            const Dt = om(Cn, Ke.current.gridCount, Ke.current.gridAutoAssign);
            Dt && (Hn[Dt] = (Hn[Dt] || 0) + 1);
          }), Hn;
        });
      }
      bt > 0 && (bt > 50 ? Le.current && (clearInterval(Le.current), Le.current = null) : (Mt || (Qn.current = k), Le.current || (ki(Qn.current, yn(), Qr.current, O.current, je.current), Le.current = setInterval(() => {
        ki(Qn.current, yn(), Qr.current, O.current, je.current);
      }, 2e3)))), ht.length > 0 && xa(ht), jn && $s({
        page: 1
      });
    });
  }
  function Ri(b) {
    const k = () => Qu(b.dataList),
      L = Ms.current.catch(() => {}).then(k);
    return Ms.current = L.catch(() => {}), L;
  }
  function xa(b) {
    return Ri({
      dataList: b
    });
  }
  async function Aa() {
    if (ar.current !== "idle") return;
    if (!de) {
      tt("账号已过期，请先续费");
      return;
    }
    if (!Ke.current.templateId) {
      tt("请选择打印模板");
      return;
    }
    const b = Ge.current || W?.id;
    if (!b) {
      tt("请选择开播店铺");
      return;
    }
    if (d && !e) {
      tt("客户端登录状态异常，请重新登录后再试");
      return;
    }
    ar.current = "starting", hn("starting");
    try {
      ao.current = b, Ke.current.selectPrinter || vt(false), d && (await ta(b, {
        ...Ke.current
      }, {
        silent: true
      })), Qn.current = yn(), hr.current = Date.now(), gr.current = false, ds(), vn([]), Mo([]), mc(0), Xu(Ke.current, {
        resetLuckyBag: true
      }), en.current = true, Vt(true), Ds(Date.now(), {
        skipRuntimeSync: true
      }), ct(true);
    } catch (k) {
      console.error("启动模拟开播测试失败", k), tt(k?.message || "启动模拟开播测试失败，请稍后重试");
    } finally {
      Wa();
    }
  }
  function Ls() {
    zu({
      skipRuntimeSync: true
    }), ye.current = "", Ie.current = "", Ze.current = "", Va.current = 0, H.current = 0, Qe.current = [], Qn.current = null, bn(0), _n({}), vn([]), mn({
      participated: 0,
      won: 0
    }), en.current = false, Vt(false), ct(false), dt(Os.current);
  }
  function ps() {
    vn([]);
  }
  async function gs() {
    if (en.current) {
      Ls();
      return;
    }
    Os.current = xt, await Aa(), Pr.current?.checked && dt(false);
  }
  async function Bs() {
    const b = ZW(Bu);
    if (!b.length) {
      tt("请输入要模拟的弹幕");
      return;
    }
    if (!en.current) {
      tt("请先开启模拟开播测试");
      return;
    }
    if (Bt.current) {
      tt("请先关闭自动打印后再模拟测试");
      return;
    }
    if (d && !e) {
      tt("客户端登录状态异常，请重新登录后再试");
      return;
    }
    $u(true);
    try {
      const k = Date.now();
      await ta(ao.current, {
        ...Ke.current
      }, {
        silent: true
      });
      const F = (await zt.post("/api/electron/danmaku/simulate", {
          shop_id: ao.current,
          batch_no: ye.current,
          lucky_bag_batch_no: Ie.current,
          simulation_context: Qe.current.filter(bt => bt?.status === "matched" || bt?.print_status || bt?.printStatus).map(bt => ({
            nickname: bt.nickname,
            content: bt.content,
            matched_content: bt.matched_content ?? bt.matchedContent,
            grid_no: bt.grid_no ?? bt.gridNo,
            batch_no: bt.batch_no ?? bt.batchNo,
            comment_time: bt.comment_time ?? bt.commentTime,
            status: bt.status,
            print_status: bt.print_status ?? bt.printStatus
          })),
          messages: b.map((bt, kt) => ({
            nickname: bt.nickname,
            content: bt.content,
            uid: `simulate_user_${kt + 1}`,
            comment_id: `simulate_${k}_${H.current + kt + 1}`,
            timestamp: k + kt
          }))
        }, {
          showLoading: false,
          headers: d ? {
            Authorization: `Bearer ${e}`
          } : void 0
        })).data || {},
        Ce = Array.isArray(F.displayItems) ? F.displayItems : [],
        me = Array.isArray(F.printItems) ? F.printItems : [],
        Fe = eG(Ce, me),
        ht = me.length;
      if (H.current += Fe.length, Va.current += ht, bn(Va.current), Ke.current.deductionMode === "grid" && _n(bt => {
        const kt = {
          ...bt
        };
        return Fe.forEach(jn => {
          if (!(jn?.status === "matched" || jn?.print_status || jn?.printStatus)) return;
          const Sn = om(jn, Ke.current.gridCount, Ke.current.gridAutoAssign);
          Sn && (kt[Sn] = (kt[Sn] || 0) + 1);
        }), kt;
      }), en.current) {
        const bt = Fe.map(Mt => ({
          ...Mt,
          id: Mt.id || Mt.comment_id,
          num_index: Mt.index,
          shop_name: Mt.shop_name || Mt.shopName,
          matched_content: Mt.matched_content || Mt.matchedContent,
          batch_no: Mt.batch_no || Mt.batchNo,
          comment_time: Mt.comment_time,
          item_code: Mt.item_code || Mt.itemCode,
          is_simulated: true
        }));
        Qe.current = [...bt, ...Qe.current], vn(Mt => [...bt, ...Mt]);
        const kt = bt.reduce((Mt, Sn) => {
            const Hn = Number(Sn?.luckyBagPosition ?? Sn?.lucky_bag_position);
            return Number.isFinite(Hn) && Hn > Mt ? Hn : Mt;
          }, 0),
          jn = bt.filter(Mt => !!(Mt?.luckyBagWon ?? Mt?.lucky_bag_won)).length;
        mn(Mt => ({
          participated: Math.max(Mt.participated, kt),
          won: Mt.won + jn
        }));
      } else if (lr) {
        const kt = vr()?.danmakuState;
        if (kt) {
          const jn = Qb(kt, Fe),
            Mt = Zb(jn, JW(Fe));
          lv({
            danmakuState: Mt
          });
        }
      } else Mo(bt => [...Fe.map(kt => ({
        ...kt,
        id: kt.id || kt.comment_id,
        num_index: kt.index,
        shop_name: kt.shop_name || kt.shopName,
        matched_content: kt.matched_content || kt.matchedContent,
        batch_no: kt.batch_no || kt.batchNo,
        comment_time: kt.comment_time,
        item_code: kt.item_code || kt.itemCode,
        is_simulated: true
      })), ...bt]);
      Te && Ke.current.selectPrinter && me.length > 0 && (lr ? await NV(me) : await xa(me)), Hu(""), Sl(`发送完成：${Ce.length} 条弹幕，命中 ${ht} 条${Te && Ke.current.selectPrinter ? "" : "，未打印"}`);
    } catch (k) {
      console.error("模拟开播测试失败", k), tt(k?.response?.data?.message || "模拟开播测试失败");
    } finally {
      $u(false);
    }
  }
  async function Qu(b) {
    console.log("[dashboard] 收到 printResults，准备打印数据:", pv(QW(b)));
    const k = Ke.current,
      L = Vr.current || [],
      F = L.find(Fe => Fe.id === k.templateId),
      Ce = k.selectPrinter;
    if (console.log("[dashboard] 当前解析到的模板/打印机:", pv({
      templateId: k.templateId,
      printer: Ce,
      templateName: F?.name
    })), !F) {
      console.error("[dashboard] 打印中止，未找到模板", {
        templateId: k.templateId,
        templateCount: L.length
      }), tt("当前打印模板不存在，请重新选择模板");
      return;
    }
    if (!Ce) {
      console.error("[dashboard] 打印中止，未选择打印机"), tt("请选择打印机");
      return;
    }
    if (!(await oo())) {
      cn.isElectronProvider() || cn.showPrinterGuide(hs, () => Ca(true, true, true));
      return;
    }
    const me = cn.getPrint(hs);
    if (!cn.isElectronProvider() && !me) {
      if (console.error("[dashboard] 打印中止，打印通道不存在"), await oo()) return Qu(b);
      cn.isElectronProvider() || cn.showPrinterGuide(hs, () => Ca(true, true, true));
      return;
    }
    console.log("[dashboard] 调用 setPrinterForTag/printForTag 前的摘要:", pv({
      printer: Ce,
      templateId: F.id,
      templateName: F.name,
      count: b.length
    }));
    try {
      const Fe = await nw(b, F);
      await cn.printForTag(hs, Ce, Fe, 1, b.length, F);
    } catch (Fe) {
      console.log("标签打印失败", Fe), tt(Fm(Fe));
    }
  }
  function Ti(b) {
    return b?.comment_id || b?.commentId || "";
  }
  function Fo(b) {
    return b?.id || Ti(b) || "";
  }
  function Wf(b) {
    return b?.status === "matched" || !!b?.print_status || !!b?.printStatus;
  }
  function zr(b) {
    if (Mo(F => F.map(Ce => Ti(Ce) === b ? {
      ...Ce,
      print_status: true,
      printStatus: true
    } : Ce)), !d) return;
    const k = vr(),
      L = k?.danmakuState?.items;
    Array.isArray(L) && lv({
      danmakuState: {
        ...k.danmakuState,
        items: L.map(F => Ti(F) === b ? {
          ...F,
          print_status: true,
          printStatus: true
        } : F)
      }
    });
  }
  function Bn(b) {
    return PW[b] || null;
  }
  function tn(b) {
    return b?.platform_type || Bn(W?.platform_code) || null;
  }
  function Hs(b) {
    const k = Fo(b);
    return k && Object.prototype.hasOwnProperty.call(Lu, k) ? !!Lu[k] : !!b?.black;
  }
  async function va(b) {
    const k = Fo(b),
      L = (b?.nickname || "").trim(),
      F = tn(b),
      Ce = !Hs(b);
    if (!L) {
      tt("当前记录缺少昵称");
      return;
    }
    if (!F) {
      tt("当前记录缺少平台类型");
      return;
    }
    Si(k);
    try {
      await zt.post("/blacklists/toggle", {
        nickname: L,
        platform_type: F,
        enabled: Ce
      }, {
        showLoading: false
      }), Mo(me => me.map(Fe => Fe.nickname === L ? {
        ...Fe,
        black: Ce
      } : Fe)), Df(me => {
        const Fe = {
          ...me
        };
        return Ya.forEach(ht => {
          (ht?.nickname || "").trim() === L && (Fe[Fo(ht)] = Ce);
        }), Fe;
      }), d && D?.().catch(() => {}), Sl(Ce ? "已加入黑名单" : "已取消黑名单");
    } catch (me) {
      tt(me?.response?.data?.message || "黑名单操作失败");
    } finally {
      Si(null);
    }
  }
  const Ec = m.useCallback(b => {
    const k = Fo(b);
    if (b?.is_simulated || b?.simulated) return <span className="text-xs text-muted-foreground">模拟记录</span>;
    const L = Hs(b),
      F = yc === k,
      Ce = b?.status === "matched" || b?.status === "processed",
      me = Iu.includes(k);
    return <div className="flex items-center gap-3">{Ce ? <Button variant="link" size="sm" className="h-auto p-0 text-blue-500 cursor-pointer" loading={me} loadingText="打印中..." disabled={Ka} onClick={() => Fs(b)}>{Wf(b) ? "重新打印" : "打印"}</Button> : null}<Button variant="link" size="sm" className={`h-auto p-0 cursor-pointer ${L ? "text-orange-500" : "text-blue-500"}`} loading={F} loadingText={L ? "取消中..." : "拉黑中..."} onClick={() => va(b)}>{L ? "取消拉黑" : "拉黑"}</Button></div>;
  }, [yc, Iu, Lu, Fs, va]);
  async function Fs(b) {
    const k = Ti(b),
      L = Fo(b);
    if (!k) {
      tt("当前记录缺少打印标识");
      return;
    }
    if (!Ke.current.templateId) {
      tt("请选择打印模板");
      return;
    }
    if (!Ke.current.selectPrinter) {
      tt("请选择打印机");
      return;
    }
    if (!Iu.includes(L)) {
      if (ar.current !== "idle") {
        tt("自动打印启动完成后才能重新打印");
        return;
      }
      if (!(await oo())) {
        cn.isElectronProvider() || cn.showPrinterGuide(hs, () => Ca(true, true, true));
        return;
      }
      if (d && !e) {
        tt("客户端登录状态异常，请重新登录后再试");
        return;
      }
      Pf(F => F.includes(L) ? F : [...F, L]);
      try {
        const F = {
            templateId: Ke.current.templateId,
            commentId: k
          },
          Ce = d ? {
            showLoading: false,
            headers: {
              Authorization: `Bearer ${e}`
            }
          } : {
            showLoading: false
          },
          Fe = (await zt.post(d ? "/api/electron/danmaku/reprint" : "/danmu/rePrint", F, Ce)).data?.data || [];
        if (!Fe.length) {
          tt("未获取到可打印数据");
          return;
        }
        await Ri({
          source: "reprint",
          dataList: Fe,
          reprintKey: L
        }), zr(k);
      } catch (F) {
        console.error("弹幕重新打印失败", F), tt(F?.response?.data?.message || Fm(F));
      } finally {
        Pf(F => F.filter(Ce => Ce !== L));
      }
    }
  }
  function $s(b = {}) {
    if (en.current) return;
    const k = {
      ...Ln,
      ...b
    };
    if (k.shopId = Ge.current, !k.shopId) {
      Mo([]), mc(0), Kn({});
      return;
    }
    zt.post("/danmu/list", k).then(L => {
      const {
        list: F,
        total: Ce
      } = L.data.data;
      Mo(F), mc(Ce || 0), d || Kn(Bt.current ? (F || []).reduce((me, Fe) => {
        const ht = om(Fe, Ke.current.gridCount, Ke.current.gridAutoAssign);
        return ht && (me[ht] = (me[ht] || 0) + 1), me;
      }, {}) : {}), qa("page", k.page || 1), qa("size", k.size || Ln.size);
    });
  }
  function Gf() {
    const b = Ni(Rt);
    Pr.current = b, gt(b), ft(false), localStorage.setItem(pc, JSON.stringify(b)), Bf(b.checked), se(Po({
      compareMode: b.compareMode
    }));
  }
  const {
      state: Mi,
      open: $o
    } = vi(),
    Ml = Mi === "collapsed" || !$o ? "457px" : "645px",
    Ac = b => {
      if (!b) return {
        label: "待授权",
        dotClassName: "bg-gray-300",
        badgeClassName: "bg-gray-50 text-gray-500 border-gray-200"
      };
      const k = J(b, "live");
      return Fr(W) === Fr(b) && f?.isLiving ? {
        label: "直播可用",
        dotClassName: "bg-green-500",
        badgeClassName: "bg-green-50 text-green-600 border-green-100"
      } : Fr(W) === Fr(b) && j ? {
        label: "会话中",
        dotClassName: "bg-blue-500",
        badgeClassName: "bg-blue-50 text-blue-600 border-blue-100"
      } : oi(k) ? {
        label: "待恢复",
        dotClassName: "bg-red-500",
        badgeClassName: "bg-red-50 text-red-600 border-red-100"
      } : k.state === "pending" ? {
        label: "检测中",
        dotClassName: "bg-yellow-400",
        badgeClassName: "bg-yellow-50 text-yellow-600 border-yellow-100"
      } : k.state !== "ready" ? {
        label: "待恢复",
        dotClassName: "bg-red-500",
        badgeClassName: "bg-red-50 text-red-600 border-red-100"
      } : {
        label: "直播可用",
        dotClassName: "bg-blue-500",
        badgeClassName: "bg-blue-50 text-blue-600 border-blue-100"
      };
    },
    ys = b => {
      const k = Ac(b);
      return <Badge variant="outline" className={`text-[10px] scale-90 ${k.badgeClassName}`}>{k.label}</Badge>;
    },
    xs = b => {
      if (!b) return {
        label: "待绑定",
        dotClassName: "bg-orange-400",
        badgeClassName: "bg-orange-50 text-orange-600 border-orange-100"
      };
      const k = J(b, "remark");
      return oi(k) ? {
        label: "待恢复",
        dotClassName: "bg-red-500",
        badgeClassName: "bg-red-50 text-red-600 border-red-100"
      } : k.state === "pending" ? {
        label: "检测中",
        dotClassName: "bg-yellow-400",
        badgeClassName: "bg-yellow-50 text-yellow-600 border-yellow-100"
      } : k.state !== "ready" ? {
        label: "待恢复",
        dotClassName: "bg-red-500",
        badgeClassName: "bg-red-50 text-red-600 border-red-100"
      } : {
        label: "店铺可用",
        dotClassName: "bg-blue-500",
        badgeClassName: "bg-blue-50 text-blue-600 border-blue-100"
      };
    },
    uo = b => {
      const k = xs(b);
      return <Badge variant="outline" className={`text-[10px] scale-90 ${k.badgeClassName}`}>{k.label}</Badge>;
    },
    Us = J(W, "live"),
    Zu = $t || j || Us.state === "ready",
    vs = d && Tt,
    lr = d && ($t || j),
    fo = lr || vs,
    Ya = vs ? Zt : lr ? vV(g, Ln) : wl,
    Ir = lr ? x : vs ? pr : fa,
    kc = vs ? Yn : ha,
    Oi = $t || Tt || Ka,
    Xf = fo ? Ya.length : wi || 0,
    ka = m.useMemo(() => {
      if (!Se.luckyBagEnabled || !fo) return null;
      const b = Math.max(0, Number(Se.luckyBagEffectiveCount || 0)),
        k = Math.max(0, Number(Se.luckyBagPrizeCount || 0)),
        L = vs ? Zt : lr ? g : wl,
        F = vs ? Ie.current : lr ? _ : Xe.current,
        Ce = F ? (L || []).filter(Cn => (Cn?.luckyBagBatchNo ?? Cn?.lucky_bag_batch_no) === F) : [],
        me = Ce.reduce((Cn, Dt) => {
          const Jn = Number(Dt?.luckyBagPosition ?? Dt?.lucky_bag_position);
          return Number.isFinite(Jn) && Jn > Cn ? Jn : Cn;
        }, 0),
        Fe = vs ? Number(Ot.participated || 0) : lr ? Number(S || 0) : me,
        ht = b > 0 ? Math.min(Fe, b) : Fe,
        bt = Math.min(lr ? v : vs ? Number(Ot.won || 0) : Ce.filter(Cn => !!(Cn?.luckyBagWon ?? Cn?.lucky_bag_won)).length, k),
        kt = Math.max(0, b - ht),
        jn = b > 0 ? Math.min(100, Math.round(ht / b * 100)) : 0,
        Mt = b > 0 && k > 0 ? Math.min(k, Math.max(1, Math.ceil(Math.max(1, ht) * k / b))) : 0,
        Sn = Mt > 0 ? Math.floor((Mt - 1) * b / k) + 1 : 0,
        Hn = Mt > 0 ? Math.floor(Mt * b / k) : 0;
      return {
        effectiveTotal: b,
        prizeTotal: k,
        currentCount: ht,
        wonCount: bt,
        remainingCount: kt,
        progressPercent: jn,
        segmentStart: Sn,
        segmentEnd: Hn
      };
    }, [Se.luckyBagEnabled, Se.luckyBagEffectiveCount, Se.luckyBagPrizeCount, lr, fo, _, S, v, g, wl, Zt, Ot]),
    Ju = b => {
      qa(k => ({
        ...k,
        ...b
      }));
    },
    cr = b => {
      Ju({
        status: b,
        page: 1
      }), lr || $s({
        page: 1,
        status: b
      });
    },
    ed = b => {
      Ju({
        nickname: b
      });
    },
    Ol = () => {
      if (lr) {
        Ju({
          page: 1
        });
        return;
      }
      $s({
        page: 1
      });
    },
    Pi = (b, k = "live") => b === "douyin" && k === "live" ? "/logo/dyLive.png" : za(b),
    Di = (b, k = "live", L = "请选择", F = false) => {
      const Ce = Gr(W),
        me = b?.platform_code || (k === "store" ? W?.store_platform_code || Jj(Ce) || "wxstore" : W?.platform_code || l0(Ce) || "channels"),
        Fe = Pi(me, k),
        ht = b?.shop_name || L,
        bt = k === "live" ? Ac(b) : xs(b);
      return <div className="flex min-w-0 items-center gap-2">{Fe ? <img src={Fe} alt="" className="w-4 h-4 object-cover shrink-0" /> : <div className="w-4 h-4 rounded-sm bg-gray-100 shrink-0" />}<span className={`truncate text-[13px] ${b ? "text-gray-900 font-medium" : "text-gray-400"}`}>{ht}</span>{F ? k === "live" ? ys(b) : uo(b) : <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${bt.dotClassName}`} />}</div>;
    },
    zi = () => {
      const b = W?.store_platform_code || Jj(Gr(W)) || "wxstore",
        k = Pi(b, "store");
      return <div className="flex min-w-0 items-center gap-2">{k ? <img src={k} alt="" className="w-4 h-4 object-cover shrink-0" /> : <div className="w-4 h-4 rounded-sm bg-gray-100 shrink-0" />}<span className="truncate text-[13px] text-gray-400">暂不选择</span></div>;
    },
    Uo = Gs(Gr(W)),
    Rc = zo(W),
    Tc = Uo === "dual" && !Xd(W),
    Qf = Zn?.storeShopId ? Zn.storeShop : null,
    Mc = Qf?.id ? Qf : Ue?.id ? Rc.find(b => b?.id === Ue.id) || Ue : null,
    ho = jl(W, Ue),
    Oc = !!(f?.isLiving || j),
    Pc = {
      trigger: Lt(It.toolbar, "template-trigger"),
      content: Lt(It.toolbar, "template-content"),
      getItemAttrs: (b, k) => Lt(It.toolbar, "template-item", `template-${b?.id ?? k}`),
      helpItem: Lt(It.toolbar, "template-help-item", "create")
    },
    Zf = {
      trigger: Lt(It.toolbar, "printer-trigger"),
      content: Lt(It.toolbar, "printer-content"),
      getItemAttrs: (b, k) => Lt(It.toolbar, "printer-item", `printer-${k}`),
      helpItem: Lt(It.toolbar, "printer-help-item", "help")
    };
  return <div>{Rn === "starting" && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl"><div className="relative w-20 h-20 mb-4"><div className="absolute inset-0 border-4 border-blue-200 rounded-full" /><div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" /><div className="absolute inset-2 bg-white rounded-full flex items-center justify-center"><span className="text-3xl">📺</span></div></div><h3 className="text-xl font-semibold text-gray-800 mb-2">正在启动直播监控</h3><p className="text-gray-500 text-center max-w-xs mb-4 mt-2">正在检测开播状态并连接弹幕服务，请耐心等待...</p></div></div>}<div className="grid grid-cols-[360px_1fr] gap-7"><div className="flex flex-col gap-3.5 h-screen min-h-0" style={{
        height: "calc(100vh - 90px)"
      }}><div className="p-2.5">{Uo === "dual" ? <div className={`${Tc ? "grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto]"} grid items-center gap-2`}><div className="min-w-0"><Select value={W ? Fr(W) ?? void 0 : void 0} onValueChange={b => {
                if (Oi) return;
                const k = P.find(L => Fr(L) === b);
                k && (Wu(k), d && ie(k.id));
              }} disabled={!P.length || Oi}><SelectTrigger className="w-full h-9 text-[13px] min-w-0" {...Lt(It.selection, "live-shop-trigger", W?.id ? `shop-${W.id}` : null, W?.platform_code ?? null)}>{Di(W?.id ? W : null, "live", "选择直播授权", false)}</SelectTrigger><SelectContent {...Lt(It.selection, "live-shop-content")}>{P.map((b, k) => <SelectItem value={String(Fr(b))} {...Lt(It.selection, "live-shop-item", `shop-${b.id ?? k}`, b.platform_code ?? null)}>{Di(b, "live", "选择直播授权", true)}</SelectItem>)}</SelectContent></Select></div>{Tc && <div className="min-w-0"><Select value={Mc?.id ? String(Mc.id) : Qd} onValueChange={b => {
                if (Oi || Oc) return;
                if (b === Qd) {
                  DC(W?.id, null), nt(null);
                  return;
                }
                const k = Rc.find(L => String(L.id) === b) || null;
                DC(W?.id, k?.id), nt(k);
              }} disabled={!W || Oi || Oc}><SelectTrigger className="w-full h-9 text-[13px] min-w-0" {...Lt(It.selection, "store-shop-trigger")}>{Di(Mc, "store", W ? "未绑定店铺" : "选择店铺授权", false)}</SelectTrigger><SelectContent {...Lt(It.selection, "store-shop-content")}><SelectItem value={Qd} {...Lt(It.selection, "store-shop-item", "none")}>{zi()}</SelectItem>{Rc.map((b, k) => <SelectItem value={String(b.id)} {...Lt(It.selection, "store-shop-item", `shop-${b.id ?? k}`)}>{Di(b, "store", "选择店铺授权", true)}</SelectItem>)}</SelectContent></Select></div>}<div onClick={() => Et.visit("/shops")} className="inline-flex items-center gap-1 text-blue-500 text-[13px] cursor-pointer hover:text-blue-600 shrink-0"><Wv className="h-3 w-3" />{!W || Tc && !Rc.length ? "去绑定店铺" : "去授权"}</div></div> : <div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1 space-y-2"><div className="flex items-center gap-3 flex-wrap min-w-0"><div className="text-sm font-semibold shrink-0">直播店铺：</div>{W?.id ? P.length > 1 && !Oi ? <CR><ER asChild={true}><div className="text-[14px] cursor-pointer hover:text-blue-500 font-medium flex items-center gap-1 min-w-0" {...Lt(It.selection, "live-shop-trigger", W?.id ? `shop-${W.id}` : null, W?.platform_code ?? null)}><img src={za(W.platform_code)} className="w-4 h-4 object-cover shrink-0" /><span className="truncate">{W?.shop_name}</span>{ys(W)}<TB className="h-3 w-3 opacity-50 shrink-0" /></div></ER><AR align="start" {...Lt(It.selection, "live-shop-content")}>{P.map((b, k) => <LU onClick={() => {
                      Wu(b), d && ie(b.id);
                    }} className="flex items-center gap-2" {...Lt(It.selection, "live-shop-item", `shop-${b.id ?? k}`, b.platform_code ?? null)}><img src={za(b.platform_code)} alt="" className="w-4 h-4" />{b.shop_name}{ys(b)}</LU>)}</AR></CR> : <div className="text-[14px] cursor-pointer hover:text-blue-500 font-medium flex items-center gap-1 min-w-0" {...Lt(It.selection, "live-shop-current", W?.id ? `shop-${W.id}` : null, W?.platform_code ?? null)}><img src={za(W.platform_code)} className="w-4 h-4 object-cover shrink-0" /><span className="truncate">{W?.shop_name}</span>{ys(W)}</div> : <span className="text-[14px] text-gray-500">{$ ? "请点击右侧去授权" : "加载店铺中..."}</span>}</div></div><div className="shrink-0 pt-0.5"><div onClick={() => Et.visit("/shops")} className="inline-flex items-center gap-1 text-blue-500 text-[13px] cursor-pointer hover:text-blue-600"><Wv className="h-3 w-3" />去授权</div></div></div>}</div><div className="shadow-sm rounded-lg bg-[#ffffff] p-2.5 min-h-[340px] max-h-[50%] overflow-auto shrink-0"><div className="border-gray-100"><div className="flex justify-between items-center mb-1.5"><span className="text-sm font-semibold">当前统计</span><Button variant="outline" disabled={!fo || Se.enableQuickPass} className="h-7 px-3 bg-white border-gray-200 text-gray-600 hover:bg-gray-50 text-xs" onClick={() => {
                !fo || Se.enableQuickPass || co(W?.platform_code, Ge.current);
              }}>{Se.enableQuickPass ? fr + "s" : "下一轮"}</Button></div>{Se.deductionMode !== "grid" && <div className={`grid ${Rl ? "grid-cols-3" : "grid-cols-2"} gap-3 px-1`}><div className="flex items-baseline gap-1"><span className="text-3xl font-semibold text-gray-900">{Ir}</span><span className="text-gray-500 text-sm pb-1">扣中</span></div>{Rl && <div className="flex items-baseline gap-1"><span className="text-3xl font-semibold text-amber-600">{Ho}</span><span className="text-gray-500 text-sm pb-1">中奖</span></div>}<div className="flex items-baseline gap-1"><span className="text-3xl font-semibold text-gray-900">{Se.enableLimitOrder ? Se.limitOrderCount : "无"}</span><span className="text-gray-500 text-sm pb-1">限量</span></div></div>}{Se.deductionMode === "grid" && <div className="grid grid-cols-4 gap-2 mt-3">{Array.from({
                length: Vl(Se.gridCount)
              }, (b, k) => {
                const L = k + 1;
                return s.jsxs("div", {
                  className: "rounded-md bg-gray-100 px-2.5 py-2 flex items-center justify-between gap-1",
                  children: [s.jsx("span", {
                    className: "text-base font-semibold text-gray-900",
                    children: L
                  }), s.jsxs("span", {
                    className: "text-xs text-gray-500",
                    children: ["(", kc[L] || 0, Se.enableLimitOrder ? `/${Se.limitOrderCount || 0}` : "", ")"]
                  })]
                }, L);
              })}</div>}</div><div className="border-t border-gray-100 my-3" /><div className="text-sm font-semibold mt-4">限量抢单</div><div className="flex items-center mt-1"><div className="flex items-center gap-2"><Checkbox id="limited-rush" checked={Se.enableLimitOrder} onCheckedChange={b => Ar("enableLimitOrder", b)} className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" {...Lt(It.rules, "limit-order-toggle")} /><Label htmlFor="limited-rush" className="font-normal text-sm">只打前</Label><Input type="number" value={Se.limitOrderCount} className="w-20 h-8 text-center text-sm" onChange={b => ea("limitOrderCount", b.target.value)} onBlur={b => ia("limitOrderCount", b.target.value, "number")} onKeyDown={Kr} {...Lt(It.rules, "limit-order-count-input")} /><span className="text-sm text-gray-700">个扣数的买家</span></div><div className="ml-auto"><TooltipProvider><TooltipTrigger asChild={true}><Button variant="link" onClick={() => Ea()} className="text-blue-500 h-auto p-0 flex items-center gap-1 font-normal text-xs cursor-pointer"><HelpCircle className="w-3.5 h-3.5" />孤品模式</Button></TooltipTrigger><TooltipContent side="top" className="w-[200px] bg-white text-gray-600 text-sm border shadow-lg [&>svg]:fill-white [&>svg]:bg-white"><p>孤品模式将自动勾选限量抢单和快速过款，并将限量抢单的数值设置为1</p></TooltipContent></TooltipProvider></div></div><div className="text-sm font-semibold mt-4">快速过款</div><div className="flex items-center gap-2 mt-1 flex-nowrap"><Checkbox id="quick-checkout" checked={Se.enableQuickPass} onCheckedChange={b => Ar("enableQuickPass", b)} className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" {...Lt(It.rules, "quick-pass-toggle")} /><Label htmlFor="quick-checkout" className="font-normal text-sm whitespace-nowrap">开启后每过</Label><Input type="number" value={Se.quickPassSeconds} className="w-20 h-8 text-center text-sm shrink-0" onChange={b => ea("quickPassSeconds", b.target.value)} onBlur={b => ia("quickPassSeconds", b.target.value, "number")} onKeyDown={Kr} {...Lt(It.rules, "quick-pass-seconds-input")} /><span className="text-sm text-gray-700 whitespace-nowrap">秒，自动按原规则开始下一轮</span></div><div className="text-sm font-semibold mt-4">灯牌优先</div><div className="flex items-center gap-2 mt-1"><Checkbox id="non-light-board-delay" checked={Se.enableLightBrandFirst} onCheckedChange={b => {
              const k = {
                ...Ke.current,
                enableLightBrandFirst: b
              };
              b && (k.onlyLightBrand = false);
              const L = Id.has("enableLightBrandFirst"),
                F = (Bt.current || en.current) && L ? "flush" : "debounced";
              Cl(k, {
                saveMode: F
              }).then(() => El(Ke.current, {
                field: "enableLightBrandFirst",
                isLiveRuleField: L
              }));
            }} className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" {...Lt(It.rules, "light-brand-toggle")} /><Label htmlFor="non-light-board-delay" className="font-normal text-sm">非灯牌延时打印</Label><Input type="number" value={Se.lightBrandPrintDelay} disabled={!Se.enableLightBrandFirst} className="w-20 h-8 text-center text-sm" onChange={b => ea("lightBrandPrintDelay", b.target.value)} onBlur={b => ia("lightBrandPrintDelay", b.target.value, "number")} onKeyDown={Kr} {...Lt(It.rules, "light-brand-delay-input")} /><span className="text-sm text-gray-700">秒</span></div><div className="flex items-center gap-2 mt-1.5"><Checkbox id="only-light-board" checked={Se.onlyLightBrand} onCheckedChange={b => {
              const k = {
                ...Ke.current,
                onlyLightBrand: b
              };
              b && (k.enableLightBrandFirst = false);
              const L = Id.has("onlyLightBrand"),
                F = (Bt.current || en.current) && L ? "flush" : "debounced";
              Cl(k, {
                saveMode: F
              }).then(() => El(Ke.current, {
                field: "onlyLightBrand",
                isLiveRuleField: L
              }));
            }} className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" {...Lt(It.rules, "only-light-brand-toggle")} /><Label htmlFor="only-light-board" className="font-normal text-sm">只打印灯牌</Label></div></div><div className="shadow-sm rounded-lg bg-[#ffffff] p-2.5 flex-1 min-h-0 overflow-auto"><div className="flex items-center gap-1 mt-2 rounded-md bg-gray-100 p-1 w-fit"><Button type="button" variant={Se.deductionMode === "custom" ? "outline" : "ghost"} className="h-7 px-3 text-sm" onClick={() => _c("custom")}>自定义</Button><Button type="button" variant={Se.deductionMode === "grid" ? "outline" : "ghost"} className="h-7 px-3 text-sm" onClick={() => _c("grid")}>宫格</Button></div>{Se.deductionMode === "custom" ? <div className="mt-4 space-y-4"><div className="flex items-start gap-4"><Label className="text-sm font-normal w-14 pt-1">数字范围</Label><div className="flex-1 space-y-3"><RadioGroup value={Se.numberMode} className="flex items-center gap-5" onValueChange={b => Ar("numberMode", b)}><div className="flex items-center gap-2"><RadioGroupItem value="range" id="number-range" /><Label htmlFor="number-range" className="text-sm font-normal">区间</Label></div><div className="flex items-center gap-2"><RadioGroupItem value="specified" id="number-specified" /><Label htmlFor="number-specified" className="text-sm font-normal">指定</Label></div></RadioGroup>{Se.numberMode === "range" ? <div className="space-y-2"><div className="flex items-center gap-3"><Input className="w-32 h-9" type="number" value={Se.numberMin} onChange={b => ea("numberMin", b.target.value)} onBlur={b => ia("numberMin", b.target.value, "number")} onKeyDown={Kr} /><Input className="w-32 h-9" type="number" value={Se.numberMax} onChange={b => ea("numberMax", b.target.value)} onBlur={b => ia("numberMax", b.target.value, "number")} onKeyDown={Kr} /></div><div className="flex items-center gap-2"><Checkbox id="number-decimal" checked={Se.numberIncludeDecimal} onCheckedChange={b => Ar("numberIncludeDecimal", !!b)} className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" /><Label htmlFor="number-decimal" className="text-sm font-normal text-gray-500">包含小数</Label></div></div> : <Input className="w-full h-9 max-w-[520px]" value={Se.numberSpecified} placeholder="填写数字，多个数字用逗号隔开" onChange={b => ea("numberSpecified", Yl(b.target.value))} onBlur={b => ia("numberSpecified", b.target.value)} onKeyDown={Kr} />}</div></div><div className="flex items-start gap-4"><Label className="text-sm font-normal w-14 pt-1">扣数格式</Label><div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1">{zW.map(b => <div className={`min-h-8 flex items-center gap-2 ${b.value === "numberWithSize" || b.value === "numberWithKeyword" ? "col-span-2" : ""}`}><Checkbox id={`custom-format-${b.value}`} checked={Se.customFormats?.includes(b.value)} onCheckedChange={k => kl("customFormats", b.value, !!k)} className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" /><Label htmlFor={`custom-format-${b.value}`} className="text-sm font-normal whitespace-nowrap">{b.value === "numberWithKeyword" && Se.customKeywordDeductMode === "onlyKeyword" ? "仅关键词" : b.label}</Label>{b.value === "numberWithKeyword" && Se.customFormats?.includes("numberWithKeyword") && <Button type="button" variant="link" className="h-auto p-0 text-blue-600 font-normal text-sm whitespace-nowrap" onClick={() => la("custom")}>关键词匹配规则</Button>}{b.value === "numberWithSize" && <><Dialog open={be} onOpenChange={Gu}><SF asChild={true}><Button variant="link" className="text-blue-500 h-auto p-0 px-1 font-normal text-xs cursor-pointer">设置尺码</Button></SF><DialogContent className="max-w-4xl p-0 rounded-2xl shadow-2xl"><div className="p-6 pb-4 space-y-4"><DialogHeader className="mb-2"><DialogTitle className="text-xl font-semibold text-gray-900">请选择要打印的尺码（不区分大小写）</DialogTitle></DialogHeader><div className="rounded-xl bg-[#f6f7fb] border border-gray-100 px-3 py-4"><div className="flex flex-wrap gap-3">{yt.map(k => <div className="flex items-center gap-2 h-10 rounded-lg border border-gray-200 bg-white px-3"><Checkbox checked={k.checked} onCheckedChange={L => Bo(k.id, L)} className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" />{k.isCustom ? <Input placeholder="输入尺码" value={k.label} className="h-8 w-24 text-sm bg-gray-50" onChange={L => Vf(k.id, L.target.value)} /> : <span className="text-sm text-gray-800 min-w-[28px]">{k.label}</span>}{k.removable && <Button type="button" variant="ghost" size="icon" onClick={() => Ei(k.id)} className="h-7 w-7 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>}</div>)}</div><Button type="button" variant="ghost" onClick={jc} className="mt-4 text-gray-700 hover:bg-gray-100"><p8 className="h-4 w-4 mr-2" />添加自定义尺码</Button></div></div><DA className="border-t px-6 py-4"><DialogClose asChild={true}><Button variant="outline">取消</Button></DialogClose><Button onClick={sg}>确定</Button></DA></DialogContent></Dialog><span className="text-gray-500 text-xs whitespace-nowrap">已选 <span className="font-semibold text-gray-700 text-lg">{Kf}</span> 个尺码</span></>}</div>)}{Se.customFormats?.includes("numberWithKeyword") && <div className="col-span-2"><Input className="w-full h-10 max-w-[440px]" value={Se.customKeywords} placeholder="填写关键词，多个关键词用逗号隔开" onChange={b => ea("customKeywords", Yl(b.target.value))} onBlur={b => ia("customKeywords", b.target.value)} onKeyDown={Kr} /></div>}</div></div></div> : <div className="mt-4 space-y-3"><div className="flex items-start gap-2"><Label className="text-sm font-normal w-16 pt-1">宫格数量</Label><div className="flex-1 space-y-2"><div className="flex flex-wrap items-center gap-x-3 gap-y-2"><RadioGroup value={String(Se.gridCount)} className="flex flex-wrap items-center gap-x-3 gap-y-2" onValueChange={b => Al(b)}>{LW.map(b => <div className="flex items-center gap-1.5"><RadioGroupItem value={String(b)} id={`grid-count-${b}`} /><Label htmlFor={`grid-count-${b}`} className="text-sm font-normal whitespace-nowrap">{b}宫格</Label></div>)}</RadioGroup><div className="flex items-center gap-1.5"><Label htmlFor="grid-count-custom" className="text-sm font-normal text-gray-700 whitespace-nowrap">自定义</Label><Input id="grid-count-custom" type="number" min={dM} max={fM} value={Se.gridCount} className="w-16 h-8 text-center text-sm" onChange={b => ea("gridCount", b.target.value)} onBlur={b => Al(b.target.value)} onKeyDown={Kr} /><span className="text-xs text-gray-400 whitespace-nowrap">最多50</span></div></div><div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"><div className="min-h-8 rounded-md bg-gray-50 text-gray-500 px-3 py-1.5 flex items-center">{Se.gridAutoAssign ? `本轮按首次出现顺序入格，最多 ${Vl(Se.gridCount)} 个扣数` : `只匹配纯数字 ${HW(Se.gridCount)}`}</div><div className="flex items-center gap-2 min-h-8"><Checkbox id="grid-auto-assign" checked={Se.gridAutoAssign} onCheckedChange={b => Ar("gridAutoAssign", !!b)} className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" /><Label htmlFor="grid-auto-assign" className="text-sm font-normal whitespace-nowrap">按扣数内容自动入格</Label></div></div></div></div><div className="flex items-start gap-2"><Label className="text-sm font-normal w-16 pt-1">扣数格式</Label><div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1">{IW.map(b => <div className="min-h-8 flex items-center gap-2"><Checkbox id={`grid-format-${b.value}`} checked={Se.gridFormats?.includes(b.value)} onCheckedChange={k => kl("gridFormats", b.value, !!k)} className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" /><Label htmlFor={`grid-format-${b.value}`} className="text-sm font-normal">{b.value === "numberWithKeyword" && Se.gridKeywordDeductMode === "onlyKeyword" ? "仅关键词" : b.label}</Label></div>)}{Se.gridFormats?.includes("numberWithKeyword") && <div className="col-span-2 flex items-center gap-3"><Button type="button" variant="link" className="h-auto p-0 text-blue-600 font-normal text-sm whitespace-nowrap" onClick={() => la("grid")}>关键词匹配规则</Button><Input className="flex-1 h-9" value={Se.gridKeywords} placeholder="填写关键词，多个关键词用逗号隔开" onChange={b => ea("gridKeywords", Yl(b.target.value))} onBlur={b => ia("gridKeywords", b.target.value)} onKeyDown={Kr} /></div>}</div></div><div className="flex items-start gap-2"><Label className="text-sm font-normal w-16 pt-1">扣数规则</Label><RadioGroup value={Se.gridDedupMode} className="flex-1 grid grid-cols-1 gap-y-1" onValueChange={b => Ar("gridDedupMode", b)}><div className="flex items-center gap-2 min-h-8"><RadioGroupItem value="buyerEachGridOnce" id="grid-each-once" /><Label htmlFor="grid-each-once" className="text-sm font-normal whitespace-nowrap">同一个买家每轮一个宫格仅匹配一次</Label></div><div className="flex items-center gap-2 min-h-8"><RadioGroupItem value="buyerAllGridOnce" id="grid-all-once" /><Label htmlFor="grid-all-once" className="text-sm font-normal whitespace-nowrap">同一个买家每轮所有宫格仅匹配一次</Label></div></RadioGroup></div></div>}<div className="text-sm font-semibold mt-4">福袋中奖</div><div className="mt-2 space-y-4 rounded-md border border-gray-100 bg-gray-50 p-4"><div className="flex items-center gap-2"><Checkbox id="lucky-bag-enabled" checked={Se.luckyBagEnabled} onCheckedChange={b => Ar("luckyBagEnabled", !!b)} className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" /><Label htmlFor="lucky-bag-enabled" className="font-normal text-sm">开启福袋中奖</Label></div><div className="space-y-3"><div className="grid grid-cols-[auto_80px_auto_80px] items-center gap-x-2 gap-y-2"><div className="contents"><span className="text-sm text-gray-700 whitespace-nowrap">有效参与总数</span><Input type="number" disabled={!Se.luckyBagEnabled} value={Se.luckyBagEffectiveCount} className="h-9 w-full text-center text-sm" onChange={b => ea("luckyBagEffectiveCount", b.target.value)} onBlur={b => ia("luckyBagEffectiveCount", b.target.value, "number")} onKeyDown={Kr} /></div><div className="contents"><span className="text-sm text-gray-700 whitespace-nowrap">，中奖数</span><Input type="number" disabled={!Se.luckyBagEnabled} value={Se.luckyBagPrizeCount} className="h-9 w-full text-center text-sm" onChange={b => ea("luckyBagPrizeCount", b.target.value)} onBlur={b => ia("luckyBagPrizeCount", b.target.value, "number")} onKeyDown={Kr} /></div></div><div className="grid grid-cols-[108px_1fr_24px] items-center gap-3"><span className="text-sm text-gray-700 whitespace-nowrap">每人最多中奖</span><Input type="number" disabled={!Se.luckyBagEnabled} value={Se.luckyBagMaxWinsPerUser} placeholder="不限" className="h-9 w-full text-center text-sm" onChange={b => ea("luckyBagMaxWinsPerUser", b.target.value)} onBlur={b => ia("luckyBagMaxWinsPerUser", b.target.value, "number")} onKeyDown={Kr} /><span className="text-sm text-gray-700 whitespace-nowrap">次</span></div><div className="grid grid-cols-[108px_1fr_24px] items-center gap-3"><span className="text-sm text-gray-700 whitespace-nowrap">每人最多参与</span><Input type="number" disabled={!Se.luckyBagEnabled} value={Se.luckyBagMaxParticipationsPerUser} placeholder="不限" className="h-9 w-full text-center text-sm" onChange={b => ea("luckyBagMaxParticipationsPerUser", b.target.value)} onBlur={b => ia("luckyBagMaxParticipationsPerUser", b.target.value, "number")} onKeyDown={Kr} /><span className="text-sm text-gray-700 whitespace-nowrap">次</span></div><div className="flex items-center gap-2"><Checkbox id="lucky-bag-quick-pass" checked={Se.enableLuckyBagQuickPass} disabled={!Se.luckyBagEnabled} onCheckedChange={b => Ar("enableLuckyBagQuickPass", !!b)} className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" /><Label htmlFor="lucky-bag-quick-pass" className={`font-normal text-sm whitespace-nowrap ${Se.luckyBagEnabled ? "" : "text-gray-400"}`}>福袋有效参与数达到时，自动开启下一轮福袋中奖</Label></div><Button type="button" variant="outline" disabled={!$t || !Se.luckyBagEnabled} className="h-8 w-full bg-white border-gray-200 text-gray-600 hover:bg-gray-50 text-xs" onClick={() => {
                !$t || !Se.luckyBagEnabled || Tl(W?.platform_code, Ge.current);
              }}>下一轮福袋中奖</Button></div></div><div className="text-sm font-semibold mt-4">防多打</div><div className="flex items-center gap-2 mt-2"><Checkbox id="prevent-duplicate" checked={Se.antiDuplicateEnabled} onCheckedChange={b => Ar("antiDuplicateEnabled", b)} className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" {...Lt(It.rules, "anti-duplicate-toggle")} /><Label htmlFor="prevent-duplicate" className="font-normal text-sm">同一个买家</Label><Input type="number" value={Se.antiDuplicateSeconds} className="w-20 h-8 text-center text-sm" onChange={b => ea("antiDuplicateSeconds", b.target.value)} onBlur={b => ia("antiDuplicateSeconds", b.target.value, "number")} onKeyDown={Kr} {...Lt(It.rules, "anti-duplicate-seconds")} /><span className="text-sm text-gray-700">秒内重复扣数不打单</span></div><div className="text-sm font-semibold mt-4">序号规则</div><div className="mt-3"><RadioGroup value={Se.serialMode} className="gap-2" onValueChange={b => Ar("serialMode", b)}><div className="flex items-center space-x-2"><RadioGroupItem value="round" id="round" className="text-blue-500 border-gray-300" /><Label htmlFor="round" className="font-normal text-sm">轮次序号 (每一轮规则改动后序号重置)</Label></div><div className="flex items-start space-x-2"><RadioGroupItem value="flow" id="flow" className="mt-1 text-blue-500 border-gray-300" /><div className="space-y-1"><div className="flex items-center flex-wrap gap-1"><Label htmlFor="flow" className="font-normal text-sm">流水序号 (序号在每次关闭自动打印后</Label></div><div className="flex items-center gap-1 ml-16"><Select value={Se.serialResetTime} onValueChange={b => Ar("serialResetTime", b)}><SelectTrigger className="!h-[32px] px-2 text-xs w-[80px]"><SelectValue /></SelectTrigger><SelectContent>{DW.map(b => <SelectItem value={b.value}>{b.label}</SelectItem>)}</SelectContent></Select><span className="text-sm text-gray-700">重置)</span></div></div></div></RadioGroup></div></div></div><div className="min-h-0 min-w-0" style={{
        height: "calc(100vh - 160px)"
      }}><Ab className="border-none shadow-sm h-full flex flex-col"><Sb className="pt-4 px-4"><div className="flex items-center justify-between"><div><Ob>直播弹幕</Ob><Ib className="text-xs mt-1">数据保存72小时</Ib></div>{!ho && !jt && <div className="flex items-center gap-2 relative"><span className="text-sm flex items-center gap-1 cursor-pointer select-none text-gray-700">跑单提醒</span><Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => _l(true)}>设置</Button><Switch checked={st.checked} onCheckedChange={b => rg(b)} />{p && <span className="max-w-[240px] truncate text-xs text-red-600" title={p.reason}>{p.code === "nickname_app_id_missing" ? "昵称应用未配置" : `订单同步失败 ${p.failedCount} 条：${p.reason}`}</span>}{st.checked && <div className="absolute right-0 top-10 z-30 w-[280px]"><div className="bg-white rounded-xl shadow-xl border overflow-hidden"><div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50"><span className="text-sm font-semibold text-gray-800">{ee.length} 单</span><div className="flex items-center gap-4 text-sm"><button type="button" className="text-blue-500 hover:text-blue-600" onClick={Hf}>清空</button><button type="button" className="text-blue-500 hover:text-blue-600" onClick={() => dt(b => !b)}>{xt ? "收起" : "展开"}</button></div></div>{xt && <div className="max-h-[260px] overflow-auto divide-y">{ee.length === 0 && <div className="px-4 py-3 text-sm text-gray-500">暂无提醒</div>}{ee.map(b => <div className="px-4 py-3 flex items-start justify-between hover:bg-gray-50"><div className="space-y-1"><div className="text-sm font-semibold text-gray-900">{xV(b, st.displayField)}</div><div className="text-xs text-gray-500">[{b.commentTime || "-"}]</div></div><button type="button" className="text-sm text-blue-500 hover:text-blue-600" onClick={() => Ff(b.id)}>删除</button></div>)}</div>}</div></div>}</div>}</div></Sb><Lb className="px-4 pb-4 flex-1 min-h-0"><div className="space-y-4 h-full flex flex-col min-h-0">{d && !$t && jt && <div className="rounded-md border bg-blue-50/40 p-3"><div className="flex items-start gap-2"><textarea value={Bu} onChange={b => Hu(b.target.value)} placeholder="模拟弹幕，每行一条。格式：昵称,弹幕内容；也可以只填弹幕内容" className="min-h-[74px] flex-1 resize-y rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" /><Button size="sm" className="h-9 shrink-0 bg-blue-500 hover:bg-blue-600" disabled={Fu} onClick={Bs}>{Fu ? "发送中..." : "发送"}</Button></div><div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground"><label className="flex items-center gap-2 text-gray-700"><Checkbox checked={Te && !!Se.selectPrinter} disabled={!Se.selectPrinter} onCheckedChange={b => vt(b === true && !!Ke.current.selectPrinter)} />是否打印</label><span>模拟弹幕只显示在当前列表，{Te && Se.selectPrinter ? "本次命中的会按当前模板和打印机真实打印，" : "本次命中的只展示不打印，"}不写入打印日志。</span></div></div>}{ka && <div className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2"><div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"><span className="font-semibold text-amber-700">福袋中奖</span><span className="text-gray-300">|</span><span className="text-gray-700">本轮 <span className="font-semibold tabular-nums text-gray-950">{ka.currentCount}/{ka.effectiveTotal}</span></span><span className="text-gray-300">|</span><span className="text-gray-700">已中奖 <span className="font-semibold tabular-nums text-amber-700">{ka.wonCount}/{ka.prizeTotal}</span></span><span className="text-gray-300">|</span><span className="text-gray-700">剩余 <span className="font-semibold tabular-nums text-gray-950">{ka.remainingCount}</span></span>{ka.segmentStart > 0 && <><span className="text-gray-300">|</span><span className="text-gray-700">当前区间 <span className="font-semibold tabular-nums text-gray-950">{ka.segmentStart}-{ka.segmentEnd}</span></span></>}<span className="text-gray-300">|</span><span className="text-gray-700">规则 <span className="font-semibold tabular-nums text-gray-950">{ka.effectiveTotal}中{ka.prizeTotal}</span></span><Button type="button" variant="outline" size="sm" className="ml-auto h-7 border-amber-300 bg-white px-3 text-xs text-amber-700 hover:bg-amber-100 hover:text-amber-800" disabled={Tt || !$t || !Se.luckyBagEnabled} onClick={() => Tl(W?.platform_code, Ge.current)}>下一轮</Button></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-100"><div className="h-full rounded-full bg-amber-500 transition-all" style={{
                    width: `${ka.progressPercent}%`
                  }} /></div></div>}{!jt && <div className="relative"><div className="flex items-center gap-3"><div className="flex items-center gap-2"><Button variant={Ln.status ? "outline" : "default"} size="sm" className="h-8 text-xs" onClick={() => cr("")} {...Lt(It.list, "status-filter-button", "all")}>全部</Button><Button variant={Ln.status === "matched" ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => cr("matched")}>已扣中</Button><Button variant={Ln.status === "processed" ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => cr("processed")} {...Lt(It.list, "status-filter-button", "processed")}>未扣中</Button></div><Input placeholder="请输入昵称" onChange={b => ed(b.target.value)} className="w-40 h-8 text-sm" value={Ln.nickname} {...Lt(It.list, "nickname-filter-input")} /><Button size="sm" className="h-8 text-xs" onClick={Ol} {...Lt(It.list, "query-button")}>查询</Button>{lr && <Button variant="outline" size="sm" className="h-8 text-xs" onClick={R}>清空弹幕</Button>}</div></div>}<div className="border rounded-md flex-1 min-h-0 overflow-auto"><Table className="table-fixed w-full min-w-[760px]"><TableHeader className="sticky top-0 z-20"><TableRow className="sticky top-0 z-20 bg-white"><TableHead className="w-[52px]">序号</TableHead><TableHead className="w-[110px]">直播店铺</TableHead><TableHead className="w-[110px]">昵称</TableHead><TableHead className="w-[150px]">公屏内容</TableHead><TableHead className="w-[150px]">已匹配内容</TableHead><TableHead className="w-[110px]">批次号</TableHead><TableHead className="w-[130px]">公屏时间</TableHead><TableHead className="w-[70px]">状态</TableHead>{!Tt && <TableHead className="w-[100px] sticky right-0 bg-white z-10 text-center shadow-[-2px_0_4px_rgba(0,0,0,0.02)]">操作</TableHead>}</TableRow></TableHeader><TableBody>{Ya?.length === 0 ? <TableRow><TableCell colSpan={Tt ? 8 : 9} className="py-12 text-center text-gray-500"><div className="flex flex-col items-center gap-3"><div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center"><PackageOpen className="w-8 h-8 text-gray-400" /></div><p className="text-sm text-gray-500">暂无数据</p></div></TableCell></TableRow> : lr ? Ya.map((b, k) => <TableRow className={LC(b.luckyBagWon)}><TableCell><div className="grid grid-cols-[20px_24px] items-center gap-1"><span className="text-right tabular-nums">{b.index || "-"}</span><span className="flex justify-center">{IC(b.luckyBagWon)}</span></div></TableCell><TableCell className="truncate max-w-0" title={b.shopName}>{b.shopName}</TableCell><TableCell className="truncate max-w-0" title={b.nickname}><span className="inline-flex max-w-full items-center gap-1">{(b.is_simulated || b.simulated) && <Badge variant="outline" className="shrink-0 border-blue-200 bg-blue-50 text-[10px] text-blue-700">模拟</Badge>}<span className="truncate">{b.nickname}</span></span></TableCell><TableCell className="truncate max-w-0" title={b.content}>{b.content}</TableCell><TableCell className="truncate max-w-0" title={b.matchedContent || "-"}>{b.matchedContent || "-"}</TableCell><TableCell className="text-xs text-muted-foreground font-mono">{b.batchNo}</TableCell><TableCell>{eV(b.commentTime)}</TableCell><TableCell><div className="flex items-center gap-1"><Badge variant="outline" className={`text-xs ${(sm[b.status] || sm.processed).className}`}>{(sm[b.status] || sm.processed).label}</Badge></div></TableCell>{!Tt && <TableCell className={BC(b.luckyBagWon)}>{Ec(b)}</TableCell>}</TableRow>) : Ya?.map(b => s.jsxs(Yt, {
                      className: LC(b.lucky_bag_won),
                      children: [s.jsx(Oe, {
                        children: s.jsxs("div", {
                          className: "grid grid-cols-[20px_24px] items-center gap-1",
                          children: [s.jsx("span", {
                            className: "text-right tabular-nums",
                            children: b.num_index || "-"
                          }), s.jsx("span", {
                            className: "flex justify-center",
                            children: IC(b.lucky_bag_won)
                          })]
                        })
                      }), s.jsx(Oe, {
                        className: "truncate max-w-0",
                        title: b.shop_name,
                        children: b.shop_name
                      }), s.jsx(Oe, {
                        className: "truncate max-w-0",
                        title: b.nickname,
                        children: s.jsxs("span", {
                          className: "inline-flex max-w-full items-center gap-1",
                          children: [(b.is_simulated || b.simulated) && s.jsx(Da, {
                            variant: "outline",
                            className: "shrink-0 border-blue-200 bg-blue-50 text-[10px] text-blue-700",
                            children: "模拟"
                          }), s.jsx("span", {
                            className: "truncate",
                            children: b.nickname
                          })]
                        })
                      }), s.jsx(Oe, {
                        className: "truncate max-w-0",
                        title: b.content,
                        children: b.content
                      }), s.jsx(Oe, {
                        className: "truncate max-w-0",
                        title: b.matched_content || "-",
                        children: b.matched_content || "-"
                      }), s.jsx(Oe, {
                        className: "text-xs text-muted-foreground font-mono",
                        children: b.batch_no
                      }), s.jsx(Oe, {
                        children: b.comment_time
                      }), s.jsx(Oe, {
                        children: s.jsx("div", {
                          className: "flex items-center gap-1",
                          children: s.jsx(Da, {
                            variant: "outline",
                            className: `text-xs ${b.status === "matched" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`,
                            children: b.status === "matched" ? "已扣中" : "未扣中"
                          })
                        })
                      }), !Tt && s.jsx(Oe, {
                        className: BC(b.lucky_bag_won),
                        children: Ec(b)
                      })]
                    }, b.id))}</TableBody></Table></div><div className="flex items-center justify-between"><span className="text-xs text-gray-500">{lr ? `当前会话 ${Xf} 条` : `共 ${Xf} 条，每页 ${Ln.size} 条`}</span>{!lr && wi > 0 && <div className="flex items-center gap-2"><Button variant="outline" size="sm" className="h-8 text-xs" disabled={(Ln.page || 1) <= 1} onClick={() => $s({
                    page: Math.max(1, (Ln.page || 1) - 1)
                  })}>上一页</Button><span className="text-xs text-gray-700">{Ln.page || 1} / {Math.max(1, Math.ceil(wi / (Ln.size || 100)))}</span><Button variant="outline" size="sm" className="h-8 text-xs" disabled={(Ln.page || 1) >= Math.ceil(wi / (Ln.size || 100))} onClick={() => $s({
                    page: Math.min(Math.ceil(wi / (Ln.size || 100)), (Ln.page || 1) + 1)
                  })}>下一页</Button></div>}{Tt && <Button type="button" variant="outline" size="sm" className="h-7 px-3 text-xs" onClick={ps}>清空弹幕列表</Button>}</div></div></Lb></Ab></div></div><div className="rounded-lg shadow-sm p-2.5 pl-4 ml-[425px] bg-white" style={{
      position: "fixed",
      bottom: "10px",
      width: `calc(100% - ${Ml})`
    }}><div className="flex items-center"><div className="flex items-center"><TemplateSelect value={Se.templateId} onValueChange={b => Ar("templateId", b)} templateList={xn} width="200px" disabled={Ka} onAddTemplate={Ku} fullScale={{
            ...Pc
          }} /></div><div className="flex items-center ml-4"><PrinterSelect value={Se.selectPrinter} onValueChange={b => Ar("selectPrinter", b)} printerList={we} width="200px" disabled={Ka} refreshing={Me} onRefresh={() => Ca(true, true, true)} fullScale={{
            ...Zf
          }} /></div>{d && $t && <div className="ml-auto flex items-center gap-2 mr-3"><Button type="button" variant={dr ? "outline" : "secondary"} className="h-10 px-6" onClick={Yp} disabled={Ka} {...Lt(It.toolbar, "pause-auto-print")}>{dr ? "恢复" : "暂停"}</Button>{dr && <span className="text-sm text-amber-600 whitespace-nowrap">暂停中</span>}</div>}{d && !$t && <Button type="button" variant="outline" className={`ml-auto h-10 px-6 shadow-inner ${Tt ? "mr-[8px] border-red-200 bg-red-50/60 text-red-600 hover:bg-red-50 hover:text-red-700" : "mr-3 border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700"}`} onClick={gs} loading={Tt && Ka} loadingText="启动中..." disabled={$t || !Tt && Ka}>{Tt ? "结束开播测试" : "模拟开播测试"}</Button>}<Button className={`${d ? "" : "ml-auto"} h-10 px-6 mr-[8px] ${$t ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}`} onClick={Ai} loading={!Tt && Ka} loadingText={Rn === "stopping" ? "关闭中..." : Rn === "starting" ? "启动中..." : ""} disabled={Tt || Ka || !$t && !Zu} title={!$t && !de ? "账号已过期，请先续费" : void 0} {...Lt(It.toolbar, "start-auto-print")}>{$t ? "关闭自动打印" : "开启自动打印"}</Button></div></div><HT open={Mu} phase={yl} qrCodeUrl={Ps} errorMessage={Pu} onOpenChange={eg} /><SizeDialog open={mt} onOpenChange={Pt} onConfirm={$f} onInvalid={tt} /><Dialog open={nr} onOpenChange={le}><DialogContent className="sm:max-w-[630px] rounded-lg"><DialogHeader><DialogTitle className="text-xl font-semibold text-gray-800">关键词匹配规则</DialogTitle></DialogHeader><div className="space-y-8 py-4 text-gray-800"><div className="flex items-center gap-6"><Label className="w-24 text-base font-normal text-gray-700">扣数规则：</Label><RadioGroup value={pt.deductMode} onValueChange={b => Jt(k => ({
              ...k,
              deductMode: b,
              matchMode: Ye === "grid" && Se.gridAutoAssign && b === "onlyKeyword" && k.matchMode === "exact" ? "fuzzy" : k.matchMode
            }))} className="flex items-center gap-16"><div className="flex items-center gap-2"><RadioGroupItem value="numberWithKeyword" id="keyword-rule-number" /><Label htmlFor="keyword-rule-number" className="text-base font-normal">数字+关键词</Label></div><div className="flex items-center gap-2"><RadioGroupItem value="onlyKeyword" id="keyword-rule-only" /><Label htmlFor="keyword-rule-only" className="text-base font-normal">仅关键词</Label></div></RadioGroup></div><div className="flex items-start gap-6"><Label className="w-24 text-base font-normal text-gray-700 pt-1">匹配规则：</Label><RadioGroup value={pt.matchMode} onValueChange={b => Jt(k => ({
              ...k,
              matchMode: b
            }))} className="space-y-6"><div className="flex items-center gap-2"><RadioGroupItem value="exact" id="keyword-match-exact" disabled={Ye === "grid" && Se.gridAutoAssign && pt.deductMode === "onlyKeyword"} /><Label htmlFor="keyword-match-exact" className={`text-base font-normal ${Ye === "grid" && Se.gridAutoAssign && pt.deductMode === "onlyKeyword" ? "text-gray-400" : ""}`}>精确匹配关键词</Label></div><div className="flex items-center gap-2"><RadioGroupItem value="fuzzy" id="keyword-match-fuzzy" /><Label htmlFor="keyword-match-fuzzy" className="text-base font-normal">模糊匹配关键词</Label></div></RadioGroup></div></div><DA className="gap-3"><Button variant="outline" className="w-24" onClick={() => le(false)}>取消</Button><Button className="w-24 bg-blue-600 hover:bg-blue-700" onClick={Yu}>保存</Button></DA></DialogContent></Dialog>{!ho && <Dialog open={He} onOpenChange={_l}><DialogContent className="sm:max-w-[640px]" {...Lt(It.orderAlert, "order-alert-dialog")}><DialogHeader><DialogTitle className="text-xl font-semibold">跑单提醒设置</DialogTitle></DialogHeader><div className="space-y-5 pt-2"><div className="flex items-center gap-3"><Label className="w-24 text-right text-gray-700 font-medium">跑单规则：</Label><div className="flex items-center gap-2 text-gray-700"><span>扣中后超过</span><Input type="number" min={0} className="w-20 h-9" value={Rt.minutes} onChange={b => Oo("minutes", b.target.value)} {...Lt(It.orderAlert, "order-alert-minutes-input")} /><span>分钟未下单，提醒跑单</span></div></div><div className="space-y-2"><div className="flex items-center gap-3"><Label className="w-24 text-right text-gray-700 font-medium">比对方式：</Label><Select value={Rt.compareMode} onValueChange={b => Oo("compareMode", b)}><SelectTrigger className="w-[360px]" {...Lt(It.orderAlert, "order-alert-compare-trigger")}><SelectValue placeholder="请选择比对方式" /></SelectTrigger><SelectContent {...Lt(It.orderAlert, "order-alert-compare-content")}>{Gs(Gr(W)) === "dual" ? <SelectItem value="nickname" {...Lt(It.orderAlert, "order-alert-compare-item", "nickname")}>通过订单里的买家昵称比对</SelectItem> : <SelectItem value="identity" {...Lt(It.orderAlert, "order-alert-compare-item", "identity")}>订单关联</SelectItem>}<SelectItem value="remark" {...Lt(It.orderAlert, "order-alert-compare-item", "remark")}>通过订单里的买家备注比对</SelectItem></SelectContent></Select></div></div><div className="space-y-3"><div className="flex items-center gap-2"><Label className="w-24 text-right text-gray-700 font-medium">跑单显示：</Label><span className="text-sm text-gray-500">显示内容需在模板内设置打印出来才能核对</span></div><RadioGroup value={Rt.displayField} onValueChange={b => Oo("displayField", b)} className="ml-[96px] space-y-3 text-sm text-gray-800"><div className="flex items-center gap-2"><RadioGroupItem value="nickname" id="alert-nickname" {...Lt(It.orderAlert, "order-alert-display-radio", "nickname")} /><Label htmlFor="alert-nickname" className="font-normal text-gray-800">昵称</Label></div><div className="flex items-center gap-2"><RadioGroupItem value="cargoCode" id="alert-cargo" {...Lt(It.orderAlert, "order-alert-display-radio", "cargo-code")} /><Label htmlFor="alert-cargo" className="font-normal text-gray-800">对货编号</Label></div><div className="flex items-center gap-2"><RadioGroupItem value="permanentCode" id="alert-permanent" {...Lt(It.orderAlert, "order-alert-display-radio", "permanent-code")} /><Label htmlFor="alert-permanent" className="font-normal text-gray-800">永久编号</Label></div><div className="flex items-center gap-2"><RadioGroupItem value="serialNumber" id="alert-serial" {...Lt(It.orderAlert, "order-alert-display-radio", "serial-number")} /><Label htmlFor="alert-serial" className="font-normal text-gray-800">序号</Label></div></RadioGroup></div></div><DA className="pt-4 justify-center gap-3"><DialogClose asChild={true}><Button className="w-24" variant="outline">取消</Button></DialogClose><Button onClick={Gf} className="bg-blue-600 hover:bg-blue-700 w-24">确定</Button></DA></DialogContent></Dialog>}<Dialog open={uc} onOpenChange={xl}><DialogContent className="sm:max-w-[440px]"><DialogHeader><DialogTitle>授权失效</DialogTitle><DialogDescription className="text-sm leading-6 text-gray-600">{dc}</DialogDescription></DialogHeader><DA className="gap-3 pt-2"><Button variant="outline" onClick={() => xl(false)}>暂不处理</Button><Button className="bg-blue-600 hover:bg-blue-700" onClick={Af}>立即授权</Button></DA></DialogContent></Dialog><ErrToast /></div>;
}

export default gM
