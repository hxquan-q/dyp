// @ts-nocheck
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Loader2, PackageOpen, Info } from 'lucide-react'
import {   Xr, Co, gl, Et, m, s, at, zt, yn, cm, o2, CM, za, jv, oY, rY, aY, mv, s2, eY, tY, CG, EG, ii, Bm, jW, Em, cnService as cn, nc, vi, bG, fq, RR, Un, $n, EC, Jp, Fp, ap, yv, Gp, dG, dn, un, Hp, xM, UC, vM, xG, Aq, NO, qC, cf, l0, sG, bW, wW, SW, NW, MC, qd, rp, xW, KC, NG, Nq, Kb, GC, gG, lm, wG, SG, rG, rT, oi, aG, VC, vG, cu, da, CU, DA, Ob } from '@/lib/reverse-runtime'
import { Sf } from '@/lib/reverse-runtime'

// 页面: Deduction/Notes
// 模块: _G -> 组件函数: SM
function SM() {
  // ══════════ Deduction/Blacklists 黑名单页 ══════════
  const {
      apiToken: e,
      subscriptionSummary: t = null
    } = Xr().props,
    [a, o] = m.useState([]),
    {
      showError: l,
      ErrorToastRenderer: u,
      showSuccess: d
    } = gl(),
    f = !!t?.is_active,
    p = Bm(),
    g = p ? {
      deviceId: p.deviceId,
      deviceName: p.deviceName,
      appVersion: p.appVersion,
      clientPlatform: p.platform
    } : {},
    [x, v] = m.useState([]),
    [_, S] = m.useState([]),
    [j, N] = m.useState(false),
    [w, E] = m.useState(0),
    [A, R] = m.useState(1),
    [D, V] = m.useState(bG),
    [U, I] = m.useState(false),
    [B, J] = m.useState(false),
    [ie, de] = m.useState(false),
    [te, Q] = m.useState(false),
    [Z, ne] = m.useState("店铺授权失效，请重新授权后再试"),
    [P, q] = m.useState(false),
    [M, G] = m.useState(null),
    [fe, z] = m.useState("sync_only"),
    [$, re] = m.useState(null),
    {
      getShopCapabilityStatus: oe,
      bootstrapShops: ge
    } = Fp(),
    [_e, X] = m.useState({
      mode: "append",
      content: {
        permanent: true,
        nickname: true,
        serial: false
      },
      skipLuckyBagSerialMatch: false
    }),
    [we, Re] = m.useState({
      shopId: 0,
      shop: {},
      startTime: "",
      endTime: ""
    });
  function Me() {
    I(false), localStorage.setItem(qC, JSON.stringify(_e));
  }
  const Pe = H => {
      W(H), H && jt(yv());
    },
    W = H => {
      const ye = !!H;
      X(Ie => ({
        ...Ie,
        content: {
          ...Ie.content,
          serial: ye
        },
        skipLuckyBagSerialMatch: ye ? !!Ie.skipLuckyBagSerialMatch : false
      })), ye && J(true);
    },
    et = (H = "店铺授权失效，请重新授权后再试") => {
      ne(H), Q(true);
    },
    Ue = () => {
      Q(false), window.location.href = "/shops";
    };
  m.useEffect(() => {
    ha();
  }, [A, D]);
  const [nt, be] = m.useState(() => {
      const H = yn();
      return {
        shopId: 0,
        startTime: H.subtract(7, "day").format("YYYY-MM-DD"),
        endTime: H.format("YYYY-MM-DD"),
        status: 0
      };
    }),
    [qe, mt] = m.useState(false),
    [Pt, yt] = m.useState(false),
    [Xt, nr] = m.useState(null),
    [le, Ye] = m.useState([]),
    [Qt, pt] = m.useState(false),
    [Jt, xn] = m.useState(false),
    [ke, He] = m.useState(false),
    [ft, st] = m.useState(null),
    [gt, Rt] = m.useState(null),
    [At, ee] = m.useState([]),
    [se, xt] = m.useState([]),
    [dt, jt] = m.useState(yv),
    [ct, Tt] = m.useState(null),
    [Vt, Zt] = m.useState(false),
    [vn, Te] = m.useState(null),
    vt = m.useMemo(() => {
      const H = {};
      return x.forEach(ye => {
        H[ye.id] = ye;
      }), H;
    }, [x]),
    Ot = m.useMemo(() => nt.shopId ? vt[nt.shopId] || null : x[0] || null, [nt.shopId, x, vt]),
    mn = H => vt[H] || null,
    pr = m.useMemo(() => {
      const H = [...new Set(le.filter(ye => a.includes(ye.id)).map(ye => ye.shop_id).filter(Boolean))];
      return H.length === 1 ? vt[H[0]] || null : H.length === 0 && nt.shopId && vt[nt.shopId] || null;
    }, [nt.shopId, le, a, vt]),
    bn = m.useMemo(() => {
      const H = /* @__PURE__ */new Map();
      return le.filter(ye => a.includes(ye.id)).forEach(ye => {
        const Ie = ye.shop_id;
        if (!Ie) return;
        const Ze = ye.shop || vt[Ie] || {},
          Qe = Ze.platform_code || ye.platform_code,
          Ge = H.get(Ie) || {
            shopId: Ie,
            shop: {
              ...Ze,
              id: Ie,
              platform_code: Qe
            },
            orderIds: [],
            platformCode: Qe,
            platformName: Ze.platform_name || Qe || "-",
            shopName: Ze.shop_name || "-"
          };
        Ge.orderIds.push(ye.id), H.set(Ie, Ge);
      }), Array.from(H.values());
    }, [le, a, vt]),
    Yn = ct?.items || [],
    _n = Yn.filter(H => H.status === "failed"),
    $t = Yn.filter(H => H.status === "pending"),
    Wt = ct?.job || null,
    dr = !!window.electronAPI?.orders?.onSyncProgress,
    Or = dG(M),
    Rn = !!(_e.content.permanent || _e.content.serial),
    hn = m.useMemo(() => {
      const H = ft?.shop || gt?.shop || null,
        ye = H?.platform_code || ft?.platformCode || gt?.platformCode;
      if (!ye) return _;
      const Ie = l0(ye),
        Ze = _.filter(Ge => Ge.platform_code === Ie),
        Qe = Ze.filter(Ge => KC(Ge, H));
      return Qe.length > 0 ? Qe : Ze;
    }, [_, ft?.platformCode, ft?.shop, gt?.platformCode, gt?.shop]);
  m.useEffect(() => {
    const H = localStorage.getItem(qC);
    H && X(NG(JSON.parse(H))), Xn();
  }, []), m.useEffect(() => {
    if (dr) return window.electronAPI.orders.onSyncProgress(H => {
      G(ye => sG(ye, H)), (H.status === "syncing" || H.status === "decrypting" || H.status === "failed") && q(true);
    });
  }, [dr]);
  const fr = () => window.crypto?.randomUUID ? window.crypto.randomUUID() : `sync-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  function Xn() {
    zt.get("/shops/list", {
      showLoading: false
    }).then(H => {
      const Ie = (H.data.data || {}).shops || [],
        Ze = Ie.filter(Ge => Nq(Ge.platform_code) && Kb(Ge)),
        Qe = Ie.filter(Ge => cf(Ge));
      v(Ze), S(Qe), ge([...Ze, ...Qe], {
        force: true
      }).catch(Ge => {
        console.warn("恢复店铺授权状态失败:", Ge);
      });
    });
  }
  const fa = H => {
      o(H ? le.map(ye => ye.id) : []);
    },
    Rs = (H, ye) => {
      o(ye ? [...a, H] : a.filter(Ie => Ie !== H));
    },
    ha = async (H = A, ye = nt, Ie = D) => {
      N(true);
      try {
        const Ze = {
            ...ye,
            page: H,
            size: Ie,
            shopId: ye.shopId === 0 ? "" : ye.shopId,
            status: ye.status === 0 ? "" : ye.status,
            endTime: yn(ye.endTime).endOf("day").format("YYYY-MM-DD HH:mm:ss")
          },
          Qe = await zt.get("/order/list", {
            params: Ze
          }),
          {
            list: Ge = [],
            total: wn = 0
          } = Qe.data.data || {};
        Ye(Ge), E(wn), o([]);
      } catch (Ze) {
        l(Ze?.response?.data?.message || "获取订单失败");
      } finally {
        N(false);
      }
    },
    Kn = () => {
      if (A !== 1) {
        R(1);
        return;
      }
      ha(1, nt);
    },
    rr = () => {
      const H = yn(),
        Ie = {
          shopId: 0,
          startTime: H.subtract(7, "day").format("YYYY-MM-DD"),
          endTime: H.format("YYYY-MM-DD"),
          status: 0
        };
      if (be(Ie), A !== 1) {
        R(1);
        return;
      }
      ha(1, Ie);
    },
    Qr = H => {
      V(Number(H)), A !== 1 && R(1);
    };
  m.useEffect(() => {
    if (!Qt || !Wt?.id || !["pending", "running"].includes(Wt.status)) return;
    const H = window.setInterval(() => {
      Qn(Wt.id);
    }, 1500);
    return () => window.clearInterval(H);
  }, [Qt, Wt?.id, Wt?.status]);
  const Qn = async H => {
      const Ie = (await zt.get(`/order/batch-remark/jobs/${H}`, {
        showLoading: false
      })).data?.data;
      return Ie && Tt(Ie), Ie;
    },
    O = (H = []) => {
      const ye = Array.isArray(H) ? H : H ? [H] : [],
        Ie = ye.map(Qe => Qe.id).filter(Boolean),
        Ze = [...new Set(ye.map(Qe => Qe.platform_code).filter(Boolean))];
      return {
        ..._e,
        live_shop_id: Ie[0] ?? null,
        live_platform_code: Ze[0] ?? null,
        live_shop_ids: Ie,
        live_platform_codes: Ze,
        skip_lucky_bag_serial_match: !!_e.skipLuckyBagSerialMatch,
        serial_match_start_time: _e.content.serial ? GC(dt.startTime) : null,
        serial_match_end_time: _e.content.serial ? GC(dt.endTime) : null
      };
    },
    je = async H => (await zt.get(`/order/batch-remark/auto-groups/${H}`, {
      showLoading: false
    })).data?.data,
    Xe = async (H, ye = [], Ie = false) => {
      const Ze = H?.pendingItems || [],
        Qe = H?.job;
      if (!Qe) return Ie || l("处理失败，请稍后重试"), {
        success: false,
        error: "处理失败，请稍后重试"
      };
      if (Tt(H), pt(true), Ze.length === 0) {
        Ie || d("没有需要处理的订单");
        const Ge = await Qn(Qe.id);
        return ha(A, nt, D), {
          success: Ge?.job?.status === "success"
        };
      }
      if (!window.electronAPI?.orders?.batchRemark) return Ie || l("请使用桌面客户端继续操作"), {
        success: false,
        error: "请使用桌面客户端继续操作"
      };
      Zt(true);
      try {
        const Ge = mn(Qe.shop_id),
          wn = await window.electronAPI.orders.batchRemark({
            jobId: Qe.id,
            remarks: Ze,
            shopId: Qe.shop_id,
            platformCode: Qe.platform_code,
            apiToken: e,
            ...g,
            shopCurl: Ge?.shop_curl ?? null
          }),
          ar = await Qn(Qe.id);
        if (ha(A, nt, D), wn.success) return Ie || (d(`处理完成：${wn.successCount}/${wn.total} 成功`), ye.length > 0 ? o(gr => gr.filter(hr => !ye.includes(hr))) : o([])), wn;
        const jr = ar?.job?.failed_count ?? wn.failedCount ?? 0;
        return wn.partialSuccess || jr > 0 ? (Ie || l(`部分处理失败：${jr} 条失败，可在弹框中重试`), wn) : (Ie || l(wn.error || "处理失败，请稍后重试"), wn);
      } catch (Ge) {
        await Qn(Qe.id).catch(() => null);
        const wn = {
          success: false,
          error: Ge?.message || "处理失败，请稍后重试"
        };
        return Ie || l(wn.error), wn;
      } finally {
        Zt(false);
      }
    },
    Le = async () => {
      if (!Wt?.id) return;
      const H = await zt.post(`/order/batch-remark/jobs/${Wt.id}/cancel`, {}, {
        showLoading: false
      });
      Tt(H.data?.data);
    },
    $e = async H => (await zt.post(`/order/batch-remark/jobs/${H}/retry-failed`, {}, {
      showLoading: false
    })).data?.data,
    Ve = async () => {
      if (!Wt?.id || Vt) return;
      const H = await $e(Wt.id);
      H && (await Xe(H));
    },
    De = async (H, ye, Ie = []) => {
      const Ze = await gG({
        orderIds: H,
        beforeCreate: async Qe => !!(await Bt(Qe, ye)),
        createJob: async Qe => (await zt.post("/order/batch-remark/jobs", {
          orderIds: Qe,
          config: O(Ie)
        })).data?.data,
        executeJob: Qe => Xe(Qe, [], true),
        refreshJob: Qn,
        retryFailedJob: $e,
        onJob: Qe => {
          Tt(Qe), pt(true);
        }
      });
      return Ze.completed ? (o(Qe => Qe.filter(Ge => !H.includes(Ge))), Ze) : (Ze.jobId && l(`批量备注已停止：${Ze.failedCount} 条失败，可在弹框中查看原因并手动重试`), Ze);
    },
    _t = async () => {
      if (!M?.decryptFailures?.length || !window.electronAPI?.orders?.retryDecryptAndRemark) return;
      const H = await window.electronAPI.orders.retryDecryptAndRemark({
        shopId: we.shopId,
        platformCode: Ot?.platform_code,
        orderNos: M.decryptFailures.map(ye => ye.orderNo),
        apiToken: e,
        ...g,
        shopCurl: Ot?.shop_curl ?? null
      });
      if (H?.autoRemarkContext?.decryptedOrders?.length) {
        const ye = $?.syncedOrders || [],
          Ie = H.autoRemarkContext.decryptedOrders.map(Ze => Ze.orderId ? Ze.orderId : ye.find(Qe => Qe.orderNo === Ze.orderNo)?.orderId || null).filter(Boolean);
        if (Ie.length > 0) {
          if (Rn && At.length === 0) {
            l("请先选择直播间后再继续备注");
            return;
          }
          await De(Ie, Ot, At);
        }
      }
    },
    Zn = async (H, ye, Ie = []) => {
      if (!ye?.platform_code) {
        l("当前订单缺少店铺平台信息");
        return;
      }
      const Ze = oe(ye, "remark");
      if (Ze.state === "pending") {
        l("当前店铺暂不可用，请稍后重试");
        return;
      }
      if (Ze.state !== "ready") {
        et("当前店铺暂不可用，请重新授权后再试");
        return;
      }
      const Qe = ye.shop_name || "当前店铺";
      if (window.confirm(`将批量备注【${Qe}】的 ${H.length} 条订单，执行过程中请勿关闭客户端。确认继续？`)) {
        xn(false), He(false), mt(true);
        try {
          await De(H, ye, Ie);
        } catch (Ge) {
          l(Ge?.response?.data?.message || "处理失败，请稍后重试");
        } finally {
          mt(false);
        }
      }
    },
    ja = async H => {
      if (!ft) {
        He(false);
        return;
      }
      lm(ft.shop, H), await Zn(ft.orderIds, ft.shop, H), st(null);
    },
    Zr = async H => {
      if (!gt) {
        He(false);
        return;
      }
      lm(gt.shop, H), ee(H), Rt(null), He(false), de(false), await Ms("sync_and_remark", H);
    },
    Ts = (H, ye) => {
      xt(Ie => ye ? [... /* @__PURE__ */new Set([...Ie, H])] : Ie.filter(Ze => Ze !== H));
    },
    Se = () => {
      if (se.length === 0) {
        l("请先选择直播间");
        return;
      }
      if (_e.content.serial) {
        if (!dt.startTime || !dt.endTime) {
          l("请选择直播时间段");
          return;
        }
        if (yn(dt.endTime).isBefore(yn(dt.startTime))) {
          l("直播结束时间不能早于开始时间");
          return;
        }
      }
      const H = hn.filter(ye => se.includes(ye.id));
      if (gt) {
        Zr(H);
        return;
      }
      ja(H);
    },
    Tn = H => {
      if (!H?.platform_code) return _;
      const ye = l0(H.platform_code),
        Ie = _.filter(Qe => Qe.platform_code === ye),
        Ze = Ie.filter(Qe => KC(Qe, H));
      return Ze.length > 0 ? Ze : Ie;
    },
    _r = (H, ye) => {
      const Ie = wG(H);
      return Ie.length === 0 ? [] : ye.filter(Ze => Ie.includes(String(Ze.id)));
    },
    In = (H, ye) => {
      const Ie = _r(H, ye);
      return (Ie.length > 0 ? Ie : ye.filter(Qe => SG(Qe, H))).map(Qe => Qe.id);
    },
    ls = () => {
      _e.content.serial && jt(yv());
    },
    Ln = async H => {
      const ye = Tn(H.shop);
      if (ye.length === 0) {
        l("请先选择直播间后再批量备注");
        return;
      }
      if (ye.length === 1 && !_e.content.serial) {
        lm(H.shop, ye), await Zn(H.orderIds, H.shop, ye);
        return;
      }
      ls(), st(H), xt(ye.length === 1 ? ye.map(Ie => Ie.id) : In(H.shop, ye)), He(true);
    },
    qa = async H => {
      const ye = Tn(H);
      if (ye.length === 0) {
        l("请先选择直播间后再同步并备注");
        return;
      }
      if (ye.length === 1 && !_e.content.serial) {
        lm(H, ye), await Ms("sync_and_remark", ye);
        return;
      }
      ls(), Rt({
        platformCode: H?.platform_code,
        shop: H
      }), xt(ye.length === 1 ? ye.map(Ie => Ie.id) : In(H, ye)), He(true);
    },
    Ke = H => {
      He(H), H || (st(null), Rt(null), xt([]));
    },
    Vr = () => {
      if (!f) {
        l("账号已过期，请先续费");
        return;
      }
      const H = !!window.electronAPI,
        ye = rG({
          shops: x,
          currentShopId: nt.shopId || Ot?.id || 0,
          isElectron: H
        }),
        Ie = yn();
      Re({
        shopId: ye?.id,
        shop: ye,
        startTime: Ie.format("YYYY-MM-DD"),
        endTime: Ie.format("YYYY-MM-DD")
      }), re(null), ee([]), Rt(null), de(true);
    },
    Ms = async (H = "sync_only", ye = []) => {
      if (!f) {
        l("账号已过期，请先续费");
        return;
      }
      if (!we.shopId || we.shopId === 0) {
        l("请先选择店铺");
        return;
      }
      const Ie = x.find(ar => ar.id === we.shopId),
        Ze = oe(Ie, "order"),
        Qe = Ie?.shop_name || "所选店铺";
      if (rT(Ie?.platform_code)) {
        if (oi(Ze)) {
          et(`${Qe}授权失效，请重新授权后再试`);
          return;
        }
        if (Ze.state === "pending") {
          l(`${Qe}暂不可用，请稍后重试`);
          return;
        }
        if (Ze.state !== "ready") {
          et(`${Qe}授权失效，请重新授权后再试`);
          return;
        }
      }
      if (!we.startTime || !we.endTime) {
        l("请选择时间范围");
        return;
      }
      const Ge = Array.isArray(ye) ? ye : ye ? [ye] : [];
      if (H === "sync_and_remark" && Rn && Ge.length === 0) {
        await qa(Ie);
        return;
      }
      const wn = dr ? fr() : void 0;
      z(H), dr && (G(aG(wn)), q(true)), yt(true);
      try {
        if (window.electronAPI?.orders?.sync) {
          const ar = yn(we.startTime).startOf("day").unix(),
            jr = yn(we.endTime).endOf("day").unix(),
            gr = {
              progressToken: dr ? wn : void 0,
              intent: H === "sync_and_remark" ? "sync_and_remark" : "sync_only",
              shopId: we.shopId,
              platformCode: Ie?.platform_code,
              startTime: ar,
              endTime: jr,
              apiToken: e,
              ...g,
              shopRawData: Ie?.raw_data ?? null,
              shopCurl: Ie?.shop_curl ?? null
            };
          console.log("[notes-order-sync] submit", {
            intent: gr.intent,
            shopId: gr.shopId,
            platformCode: gr.platformCode,
            startTime: gr.startTime,
            endTime: gr.endTime,
            hasShopRawData: !!gr.shopRawData,
            shopRawDataKeys: gr.shopRawData ? Object.keys(gr.shopRawData) : [],
            hasBizMagic: !!gr.shopRawData?.bizMagic
          });
          let hr = await window.electronAPI.orders.sync(gr);
          if (console.log("[notes-order-sync] result", hr), !hr.success && (hr.needLogin || hr.error?.includes("登录"))) {
            const sr = hr.error || "店铺授权已过期，请重新登录";
            et(sr), G(pa => pa && {
              ...pa,
              status: "failed",
              message: sr,
              error: sr
            }), q(false), yt(false);
            return;
          }
          hr.success ? (H === "sync_and_remark" && re(hr.autoRemarkContext || null), H === "sync_and_remark" && hr.autoRemarkContext?.decryptedOrders?.length && (G(sr => ({
            ...sr,
            status: sr?.status === "failed" ? sr.status : "preparing_remark",
            message: "正在继续处理"
          })), q(false), await De(hr.autoRemarkContext.decryptedOrders.map(sr => sr.orderId), Ot, Ge)), d(`同步完成：${hr.count} 条订单`), de(false), Kn()) : (H === "sync_and_remark" && re(hr.autoRemarkContext || null), H === "sync_and_remark" && hr.autoRemarkContext?.decryptedOrders?.length && (await De(hr.autoRemarkContext.decryptedOrders.map(sr => sr.orderId), Ot, Ge)), l("同步失败，请稍后重试"));
        } else l("请使用桌面客户端同步订单");
      } catch (ar) {
        console.log(ar), l("同步失败，请联系客服");
      } finally {
        yt(false);
      }
    },
    Bt = async (H, ye) => {
      if (!_e.content.nickname) return true;
      if (!window.electronAPI?.orders?.resolveIdentity) return l("请使用最新版桌面客户端解密昵称后再批量备注"), false;
      const Ie = le.filter(Qe => H.includes(Qe.id)).filter(Qe => !VC(Qe)).map(Qe => Qe.order_no || Qe.orderNo).filter(Boolean);
      if (Ie.length === 0) return true;
      const Ze = await window.electronAPI.orders.resolveIdentity({
        orderNos: Ie,
        platformCode: ye?.platform_code || "",
        shopId: ye?.id,
        apiToken: e
      });
      return Ze?.success ? true : (l(Ze?.error || Ze?.failures?.[0]?.reason || "昵称解密失败，请重试"), false);
    },
    ma = async () => {
      if (!f) {
        l("账号已过期，请先续费");
        return;
      }
      if (a.length === 0) {
        l("请先勾选需要备注的订单");
        return;
      }
      if (bn.length === 0) {
        l("当前勾选订单缺少店铺信息");
        return;
      }
      if (bn.length > 1) {
        xn(true);
        return;
      }
      const H = bn[0];
      if (Rn) {
        await Ln(H);
        return;
      }
      await Zn(H.orderIds, H.shop);
    },
    {
      state: Pr,
      open: Os
    } = vi(),
    ao = Pr === "collapsed" || !Os ? "0px" : "195px",
    Va = Math.max(1, Math.ceil(w / D));
  return m.useEffect(() => {
    if (!vn?.id || !Qt || Vt) return;
    const H = window.setInterval(async () => {
      const ye = await je(vn.id);
      ye && Tt({
        job: ye.group,
        items: ye.items
      });
    }, 1500);
    return () => window.clearInterval(H);
  }, [vn?.id, Qt, Vt]), <div><div className="space-y-6"><div className="flex flex-wrap items-center gap-4 border w-full rounded-lg p-4 bg-white"><div className="flex items-center gap-2"><Label className="text-sm text-gray-700 whitespace-nowrap">店铺：</Label><Select value={nt.shopId} onValueChange={H => be({
            ...nt,
            shopId: H
          })}><SelectTrigger className="h-9 text-sm w-[200px]" {...dn(un.filters, "shop-filter-trigger")}><SelectValue placeholder="全部店铺" /></SelectTrigger><SelectContent {...dn(un.filters, "shop-filter-content")}><SelectItem value={0} {...dn(un.filters, "shop-filter-item", "all")}>全部店铺</SelectItem>{x.map((H, ye) => {
                const Ie = za(H.platform_code);
                return <SelectItem value={H.id} {...dn(un.filters, "shop-filter-item", `shop-${H.id ?? ye}`)}><div className="flex items-center gap-2">{Ie && <img src={Ie} alt={H.platform_name ?? "shop icon"} className="w-4 h-4 object-cover" />}<span>{H.shop_name}</span></div></SelectItem>;
              })}</SelectContent></Select></div><div className="flex items-center gap-2"><Label className="text-sm text-gray-700 whitespace-nowrap">下单时间：</Label><div className="flex items-center gap-0"><div className="relative"><Input type="date" value={nt.startTime} onChange={H => be({
                ...nt,
                startTime: H.target.value
              })} className="w-[160px] h-9 pr-8 rounded-r-none" {...dn(un.filters, "start-date-input")} /><CU className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /></div><span className="px-3 h-9 flex items-center justify-center text-gray-500 border border-l-0 border-r-0 border-gray-200 -ml-px -mr-px bg-white rounded-none">→</span><div className="relative"><Input type="date" value={nt.endTime} onChange={H => be({
                ...nt,
                endTime: H.target.value
              })} className="w-[160px] h-9 pr-8 rounded-l-none border-l-0 -ml-px" {...dn(un.filters, "end-date-input")} /><CU className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /></div></div></div><div className="flex items-center gap-2"><Label className="text-sm text-gray-700 whitespace-nowrap">订单状态：</Label><Select value={nt.status} onValueChange={H => be({
            ...nt,
            status: H
          })}><SelectTrigger className="w-[160px] h-9" {...dn(un.filters, "status-filter-trigger")}><SelectValue /></SelectTrigger><SelectContent {...dn(un.filters, "status-filter-content")}>{xM.map((H, ye) => <SelectItem value={H.value} {...dn(un.filters, "status-filter-item", String(H.value || `status-${ye}`))}>{H.label}</SelectItem>)}</SelectContent></Select></div><div className="flex items-center gap-3 ml-auto"><Button className="bg-blue-500 hover:bg-blue-600 w-[90px] " onClick={Kn} disabled={j} {...dn(un.filters, "query-button")}>{j ? <Loader2 className="w-4 h-4 animate-spin" /> : "查询"}</Button><Button variant="outline" className="w-[90px]" onClick={rr} disabled={j} {...dn(un.filters, "reset-button")}>重置</Button></div><div className="hidden 2xl:block h-5 w-px bg-gray-300" /><div className="flex items-center gap-3 ml-auto 2xl:ml-0"><Button variant="outline" className="h-9 px-4 border-green-500 text-green-600 hover:bg-green-50" onClick={Vr} disabled={Pt} title={f ? void 0 : "账号已过期，请先续费"} {...dn(un.actions, "sync-open-button")}>{Pt ? <Loader2 className="w-4 h-4 animate-spin" /> : "同步订单"}</Button><Button variant="outline" className="h-9 px-4" onClick={() => I(true)} {...dn(un.actions, "remark-open-button")}>备注设置</Button></div></div><div className="bg-white rounded-lg border mb-20 overflow-hidden"><Table className="table-fixed"><TableHeader><TableRow><TableHead className="w-[44px]" /><TableHead className="w-[18%]">订单/店铺</TableHead><TableHead className="w-[15%]">状态/时间</TableHead><TableHead className="w-[13%]">买家</TableHead><TableHead className="w-[25%]">商品信息</TableHead><TableHead className="w-[9%]">实付金额</TableHead><TableHead className="w-[10%]">买家留言</TableHead><TableHead className="w-[10%]">商家备注</TableHead></TableRow></TableHeader><TableBody>{!j && le.length === 0 && <TableRow><TableCell colSpan={8} className="py-12 text-center text-gray-500"><div className="flex flex-col items-center gap-3"><div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center"><PackageOpen className="w-8 h-8 text-gray-400" /></div><p className="text-sm text-gray-500">暂无数据</p></div></TableCell></TableRow>}{le.map(H => <TableRow><TableCell><Checkbox disabled={qe || Vt} checked={a.includes(H.id)} onCheckedChange={ye => Rs(H.id, ye)} {...dn(un.table, "row-select", `row-${H.id}`)} /></TableCell><TableCell><div className="min-w-0 space-y-2"><div className="break-all font-medium text-gray-900">{H.order_no}</div><div className="flex min-w-0 items-center gap-2 text-sm text-gray-500">{vt[H.shop_id] && <img src={za(vt[H.shop_id]?.platform_code)} className="h-4 w-4 shrink-0 object-cover" />}<span className="min-w-0 break-words">{vt[H.shop_id]?.shop_name || "-"}</span></div></div></TableCell><TableCell><div className="space-y-2"><div className="font-medium text-gray-900">{vM[H.order_status]}</div><div className="break-words text-sm text-gray-500">{H.order_time}</div></div></TableCell><TableCell><div className="flex min-w-0 flex-col gap-1"><div className="flex min-w-0 items-center gap-1.5"><span className="font-medium text-gray-900">{xG(H)}</span>{H.buyer?.number && <span className="inline-flex shrink-0 items-center rounded-md border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-blue-700">NO.{H.buyer.number.number}</span>}</div><div className="flex items-center gap-1 break-all font-mono text-[11px] text-gray-400">{H.user_id}{!VC(H) && !!window.electronAPI?.orders?.resolveIdentity && <button onClick={async ye => {
                      ye.stopPropagation();
                      const Ie = H.shop_id,
                        Qe = (H.shop || vt[Ie])?.platform_code,
                        Ge = H.order_no || H.orderNo;
                      if (!Ie || !Qe || !Ge) {
                        l("订单缺少店铺或订单号，无法解密昵称");
                        return;
                      }
                      nr(H.id);
                      try {
                        const wn = await window.electronAPI.orders.resolveIdentity({
                          orderNos: [Ge],
                          platformCode: Qe,
                          shopId: Ie,
                          apiToken: e
                        });
                        if (wn?.resolved > 0) {
                          Kn();
                          return;
                        }
                        l(wn?.error || wn?.failures?.[0]?.reason || "昵称解密失败");
                      } catch (wn) {
                        l(wn?.message || "昵称解密失败");
                      } finally {
                        nr(null);
                      }
                    }} disabled={Xt !== null} className="ml-1 inline-flex items-center gap-1 text-blue-500 underline hover:text-blue-700 disabled:cursor-not-allowed disabled:text-gray-400">{Xt === H.id ? <><Loader2 className="h-3 w-3 animate-spin" />解密中</> : "解密昵称"}</button>}</div></div></TableCell><TableCell>{H.products.map((ye, Ie) => <div className="mb-1 flex min-w-0 items-start gap-3"><img src={ye.product_image} alt={ye.product_title} className="h-10 w-10 shrink-0 rounded object-cover" /><div className="flex-1 min-w-0"><p className="text-sm text-gray-900 whitespace-normal break-all leading-tight">{ye.product_title} {ye.variant}</p><span className="text-sm text-gray-500">x{ye.quantity}</span></div></div>)}</TableCell><TableCell className="text-red-600 break-all">{H.total_amount}</TableCell><TableCell className="whitespace-normal break-words"><span className="text-gray-700">{H.buyer_words || "-"}</span></TableCell><TableCell className="whitespace-normal break-words"><span className="text-gray-700">{H.merchant_note || "-"}</span></TableCell></TableRow>)}</TableBody></Table></div></div><div style={{
      position: "fixed",
      bottom: 0,
      width: `calc(100% - ${ao})`,
      marginLeft: "-16px"
    }} className="sticky bottom-4 bg-white border-t   p-4  pl-6 flex flex-col gap-4 md:flex-row md:items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20"><div className="flex items-center flex-wrap gap-3 w-[100%]"><Checkbox disabled={!le.length || qe || Vt} checked={le.length > 0 && a.length === le.length} onCheckedChange={fa} {...dn(un.table, "row-select-all")} /><span className="text-[14px]">全选</span><Button className="bg-blue-500 hover:bg-blue-600 ml-4" loading={qe} loadingText="下发中..." onClick={ma} disabled={qe || Vt || Or || a.length === 0} title={Or ? M?.error || M?.message || "处理完成后即可继续操作" : f ? bn.length > 1 ? "请选择要执行的店铺" : oe(pr, "remark").message : "账号已过期，请先续费"} {...dn(un.actions, "batch-remark-button")}>批量备注</Button><div className="flex ml-auto"><div className="flex items-center text-sm text-gray-500">共 {w} 条，每页 {D} 条</div>{w > 0 && <div className="flex items-center gap-2 ml-10"><Select value={String(D)} onValueChange={Qr} disabled={qe || Vt}><SelectTrigger className="h-8 w-[110px] text-sm" {...dn(un.table, "page-size-trigger")}><SelectValue /></SelectTrigger><SelectContent {...dn(un.table, "page-size-content")}>{vG.map(H => <SelectItem value={String(H)} {...dn(un.table, "page-size-item", String(H))}>{H} 条/页</SelectItem>)}</SelectContent></Select><Button variant="outline" size="sm" disabled={(A || 1) <= 1} onClick={() => R(H => Math.max(1, H - 1))}>上一页</Button><span className="text-sm text-gray-700">{A || 1} / {Va}</span><Button variant="outline" size="sm" disabled={(A || 1) >= Va} onClick={() => R(H => Math.min(Va, H + 1))}>下一页</Button></div>}</div></div></div><yM open={P} progress={M} onOpenChange={q} mode={fe} onRetryDecryptAndRemark={_t} onStartBatchRemark={() => {
      q(false), a.length > 0 && ma();
    }} /><u /><Dialog open={Jt} onOpenChange={xn}><DialogContent className="sm:max-w-[640px]"><DialogHeader className="pb-2"><DialogTitle className="text-xl font-semibold">选择执行店铺</DialogTitle></DialogHeader><div className="space-y-3">{bn.map(H => {
            const ye = oe(H.shop, "remark"),
              Ie = ye.state === "ready",
              Ze = za(H.platformCode);
            return <div className="flex items-center gap-3 rounded border p-3">{Ze && <img src={Ze} alt={H.platformName} className="w-5 h-5 object-cover" />}<div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-sm text-gray-500">{H.platformName}</span><span className="font-medium truncate">{H.shopName}</span></div><div className="text-sm text-gray-500">{H.orderIds.length} 条订单{Ie ? "" : ` · ${ye.message || "备注能力未就绪"}`}</div></div><Button className="bg-blue-600 hover:bg-blue-700" disabled={!Ie || qe || Vt || Or} onClick={() => {
                if (Rn) {
                  xn(false), Ln(H);
                  return;
                }
                Zn(H.orderIds, H.shop);
              }}>执行</Button></div>;
          })}</div></DialogContent></Dialog><Dialog open={ke} onOpenChange={Ke}><DialogContent className="sm:max-w-[640px]"><DialogHeader className="pb-2"><DialogTitle className="text-xl font-semibold">匹配设置</DialogTitle></DialogHeader><div className="space-y-4">{_e.content.serial && <div className="rounded-md border bg-gray-50 p-3"><div className="text-sm font-medium text-gray-900">选择时间段</div><div className="mt-1 mb-3 text-sm text-gray-500">用于按直播时间段匹配弹幕序号。</div><div className="flex flex-wrap items-center gap-3"><div className="space-y-1"><Label className="text-xs text-gray-500">开始时间</Label><Input type="datetime-local" value={dt.startTime} onChange={H => jt(ye => ({
                  ...ye,
                  startTime: H.target.value
                }))} className="h-9 w-[220px]" /></div><span className="mt-5 text-gray-400">至</span><div className="space-y-1"><Label className="text-xs text-gray-500">结束时间</Label><Input type="datetime-local" value={dt.endTime} onChange={H => jt(ye => ({
                  ...ye,
                  endTime: H.target.value
                }))} className="h-9 w-[220px]" /></div></div></div>}{hn.length > 1 && <div className="rounded-md border bg-gray-50 p-3"><div className="text-sm font-medium text-gray-900">选择直播间</div><div className="mt-1 mb-3 text-sm text-gray-500">用于匹配买家编号和序号，可多选。</div><div className="space-y-3">{hn.map(H => {
                const ye = za(H.platform_code),
                  Ie = se.includes(H.id);
                return <label className="flex cursor-pointer items-center gap-3 rounded border p-3"><Checkbox checked={Ie} onCheckedChange={Ze => Ts(H.id, !!Ze)} />{ye && <img src={ye} alt={H.platform_name || H.platform_code} className="w-5 h-5 object-cover" />}<div className="min-w-0 flex-1"><div className="font-medium truncate">{Aq(H)}</div></div></label>;
              })}</div></div>}</div><DA className="pt-2"><Button variant="outline" className="w-24" onClick={() => Ke(false)}>取消</Button><Button className="w-24 bg-blue-600 hover:bg-blue-700" disabled={se.length === 0 || qe || Vt || !ft && !gt} onClick={Se}>确定</Button></DA></DialogContent></Dialog><Dialog open={Qt} onOpenChange={pt}><DialogContent className="sm:max-w-[720px]"><DialogHeader className="pb-2"><DialogTitle className="text-xl font-semibold">批量备注进度</DialogTitle></DialogHeader><div className="space-y-4"><div className="grid grid-cols-5 gap-3 text-sm"><div className="rounded border p-3"><div className="text-gray-500">总数</div><div className="text-lg font-semibold">{Wt?.total_count ?? 0}</div></div><div className="rounded border p-3"><div className="text-gray-500">成功</div><div className="text-lg font-semibold text-green-600">{Wt?.success_count ?? 0}</div></div><div className="rounded border p-3"><div className="text-gray-500">失败</div><div className="text-lg font-semibold text-red-600">{Wt?.failed_count ?? 0}</div></div><div className="rounded border p-3"><div className="text-gray-500">跳过</div><div className="text-lg font-semibold">{Wt?.skipped_count ?? 0}</div></div><div className="rounded border p-3"><div className="text-gray-500">剩余</div><div className="text-lg font-semibold">{$t.length}</div></div></div><div className="h-2 rounded bg-gray-100 overflow-hidden"><div className="h-full bg-blue-500 transition-all" style={{
              width: `${Wt?.total_count ? Math.round((Wt.success_count + Wt.failed_count + Wt.skipped_count) / Wt.total_count * 100) : 0}%`
            }} /></div><div className="text-sm text-gray-600">状态：{UC[Wt?.status] || Wt?.status || "-"}</div><div className="space-y-2"><div className="text-sm font-medium text-gray-900">失败订单明细</div>{_n.length === 0 ? <div className="rounded border border-dashed py-8 text-center text-sm text-gray-500">暂无失败订单</div> : <div className="max-h-[260px] w-full overflow-auto rounded border"><Table className="w-full table-fixed"><TableHeader><TableRow><TableHead className="w-[190px]">订单编号</TableHead><TableHead className="w-[88px] whitespace-nowrap">状态</TableHead><TableHead>失败原因</TableHead></TableRow></TableHeader><TableBody>{_n.map(H => <TableRow><TableCell className="break-all">{H.order_no}</TableCell><TableCell className="whitespace-nowrap">{UC[H.status] || H.status}</TableCell><TableCell className="whitespace-normal break-words text-red-600">{H.error || "-"}</TableCell></TableRow>)}</TableBody></Table></div>}</div></div><DA className="gap-3 pt-2">{["pending", "running"].includes(Wt?.status) && <Button variant="outline" onClick={Le}>停止后续执行</Button>}{_n.length > 0 && <Button className="bg-blue-600 hover:bg-blue-700" disabled={Vt} onClick={Ve}>重试失败订单</Button>}</DA></DialogContent></Dialog><Dialog open={U} onOpenChange={I}><DialogContent className="sm:max-w-[600px]" {...dn(un.remarkDialog, "remark-dialog")}><DialogHeader className="pb-2"><DialogTitle className="text-xl font-semibold">备注设置</DialogTitle></DialogHeader><div className="space-y-6"><div className="flex items-start gap-3"><span className="text-sm text-gray-700 mt-1 whitespace-nowrap">备注模式：</span><RadioGroup value={_e.mode} onValueChange={H => X(ye => ({
              ...ye,
              mode: H
            }))} className="space-y-3"><label className="flex items-center gap-2 text-base text-gray-800"><RadioGroupItem value="override" {...dn(un.remarkDialog, "remark-mode-radio", "override")} />完全覆盖原有备注</label><label className="flex items-center gap-2 text-base text-gray-800"><RadioGroupItem value="append" {...dn(un.remarkDialog, "remark-mode-radio", "append")} />原有备注后面添加新备注</label><label className="flex items-center gap-2 text-base text-gray-800"><RadioGroupItem value="appendIfEmpty" {...dn(un.remarkDialog, "remark-mode-radio", "append-if-empty")} />原有备注为空才添加新备注</label></RadioGroup></div><div className="flex items-start gap-3"><span className="text-sm text-gray-700 mt-1 whitespace-nowrap">备注内容：</span><div className="flex items-center gap-6 flex-wrap"><label className="flex items-center gap-2 text-base text-gray-800"><Checkbox checked={_e.content.permanent} onCheckedChange={H => X(ye => ({
                  ...ye,
                  content: {
                    ...ye.content,
                    permanent: !!H
                  }
                }))} {...dn(un.remarkDialog, "remark-content-toggle", "permanent")} />永久编号</label><label className="flex items-center gap-2 text-base text-gray-800"><Checkbox checked={_e.content.nickname} onCheckedChange={H => X(ye => ({
                  ...ye,
                  content: {
                    ...ye.content,
                    nickname: !!H
                  }
                }))} {...dn(un.remarkDialog, "remark-content-toggle", "nickname")} />昵称</label><label className="flex items-center gap-2 text-base text-gray-800"><Checkbox checked={_e.content.serial} onCheckedChange={Pe} {...dn(un.remarkDialog, "remark-content-toggle", "serial")} />序号</label></div></div>{_e.content.serial && <div className="flex items-start gap-3"><span className="text-sm text-gray-700 mt-1 whitespace-nowrap">序号设置：</span><label className="flex items-center gap-2 text-base text-gray-800"><Checkbox checked={!!_e.skipLuckyBagSerialMatch} onCheckedChange={H => X(ye => ({
                ...ye,
                skipLuckyBagSerialMatch: !!H
              }))} />中奖评论跳过序号匹配</label></div>}</div><DA className="flex justify-end gap-3 pt-2"><Button variant="outline" className="w-24" onClick={() => I(false)}>取消</Button><Button className="w-24 bg-blue-600 hover:bg-blue-700" onClick={() => Me()}>确定</Button></DA></DialogContent></Dialog><Dialog open={B} onOpenChange={J}><DialogContent className="top-[38%] sm:max-w-[520px]"><div className="flex gap-4 py-2"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50"><Info className="h-7 w-7 text-blue-600" /></div><div className="flex-1 space-y-4"><DialogTitle className="text-xl font-semibold">提示</DialogTitle><div className="space-y-4 text-base leading-8 text-gray-700"><p>序号备注说明（需知悉）：</p><p>同一个用户短时间内下多单，受用户下单顺序的影响，这些订单备注的序号可能错误对应。 这些订单发货请核对下金额和商品，避免错发。</p></div><div className="flex justify-end pt-4"><Button className="w-24 bg-blue-600 hover:bg-blue-700" onClick={() => J(false)}>知道了</Button></div></div></div></DialogContent></Dialog><Dialog open={te} onOpenChange={Q}><DialogContent className="sm:max-w-[440px]"><DialogHeader><DialogTitle>授权失效</DialogTitle><DialogDescription className="text-sm leading-6 text-gray-600">{Z}</DialogDescription></DialogHeader><DA className="gap-3 pt-2"><Button variant="outline" onClick={() => Q(false)}>暂不处理</Button><Button className="bg-blue-600 hover:bg-blue-700" onClick={Ue}>立即授权</Button></DA></DialogContent></Dialog><Dialog open={ie} onOpenChange={de}><DialogContent className="sm:max-w-[600px]" {...dn(un.syncDialog, "sync-dialog")}><DialogHeader className="pb-2"><DialogTitle className="text-xl font-semibold">同步订单</DialogTitle></DialogHeader><div className="space-y-6"><div className="flex items-start gap-3"><span className="text-sm text-gray-700 mt-1 whitespace-nowrap">同步店铺：</span><Select value={we.shopId} onValueChange={H => {
              ee([]), xt([]), Rt(null), Re({
                ...we,
                shopId: H
              });
            }}><SelectTrigger className="h-9 text-sm w-[356px]" {...dn(un.syncDialog, "sync-shop-trigger")}><SelectValue placeholder="选择需要同步的店铺" /></SelectTrigger><SelectContent {...dn(un.syncDialog, "sync-shop-content")}>{x.map((H, ye) => {
                  const Ie = za(H.platform_code);
                  return <SelectItem value={H.id} {...dn(un.syncDialog, "sync-shop-item", `shop-${H.id ?? ye}`)}><div className="flex items-center gap-2">{Ie && <img src={Ie} alt={H.platform_name ?? "shop icon"} className="w-4 h-4 object-cover" />}<span>{H.shop_name}</span></div></SelectItem>;
                })}</SelectContent></Select></div><div className="flex items-start gap-3"><span className="text-sm text-gray-700 mt-1 whitespace-nowrap">下单时间：</span><div className="flex items-center gap-0"><div className="relative"><Input type="date" value={we.startTime} onChange={H => Re({
                  ...we,
                  startTime: H.target.value
                })} className="w-[160px] h-9 pr-8 rounded-r-none" {...dn(un.syncDialog, "sync-start-date-input")} /><CU className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /></div><span className="px-3 h-9 flex items-center justify-center text-gray-500 border border-l-0 border-r-0 border-gray-200 -ml-px -mr-px bg-white rounded-none">→</span><div className="relative"><Input type="date" value={we.endTime} onChange={H => Re({
                  ...we,
                  endTime: H.target.value
                })} className="w-[160px] h-9 pr-8 rounded-l-none border-l-0 -ml-px" {...dn(un.syncDialog, "sync-end-date-input")} /><CU className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /></div></div></div></div><DA className="flex justify-end gap-3 pt-2"><Button variant="outline" className="w-24" onClick={() => de(false)}>取消</Button><Button className="bg-blue-600 hover:bg-blue-700 w-24" onClick={() => Ms("sync_only")} disabled={Pt} title={f ? void 0 : "账号已过期，请先续费"} {...dn(un.syncDialog, "sync-submit-button")}>{Pt && fe === "sync_only" ? <Loader2 className="w-4 h-4 animate-spin" /> : "同步订单"}</Button><Button className="bg-teal-600 hover:bg-teal-700 w-28" onClick={() => Ms("sync_and_remark")} disabled={Pt} title={f ? void 0 : "账号已过期，请先续费"} {...dn(un.syncDialog, "sync-and-remark-submit-button")}>{Pt && fe === "sync_and_remark" ? <Loader2 className="w-4 h-4 animate-spin" /> : "同步并备注"}</Button></DA></DialogContent></Dialog></div>;
}

export default SM
