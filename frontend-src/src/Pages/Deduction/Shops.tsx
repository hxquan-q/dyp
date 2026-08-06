// @ts-nocheck
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, AlertCircle, PackageOpen, Radio, ShoppingBag, Shield, Store, Headset } from 'lucide-react'
import {   Xr, Co, gl, Et, m, s, at, zt, yn, cm, o2, CM, za, jv, oY, rY, aY, mv, s2, eY, tY, CG, EG, ii, Bm, jW, Em, cnService as cn, nc, vi, bG, fq, RR, Un, $n, EC, Jp, Fp, ap, yv, Gp, dG, dn, un, Hp, xM, UC, vM, xG, Aq, NO, qC, cf, l0, sG, bW, wW, SW, NW, MC, qd, rp, xW, Nq, Kb, PC, RG, TG, xv, wq, T0, MG, OG, PG, FG, bv, fw, HG, ZC, QC, e2, jq, mi, c0, vv, Vb, Xd, UG, $G, Nv, Sv, YC, GG, RM, TM, VG, UE, Yv, JC, Hr, wv, n2, t2, xo, _v, iu, r2, KG, bq, hw, a2, Zj, da, nj, tj, TJ, DA, NJ } from '@/lib/reverse-runtime'
import { Sf } from '@/lib/reverse-runtime'

function MM() {
  // ══════════ Deduction/Buyers 买家管理页 ══════════
  const {
      showError: e,
      showSuccess: t,
      ErrorToastRenderer: a
    } = gl(),
    {
      shops: o = [],
      shopDisplayRows: l = [],
      platforms: u = [],
      flash: d = {},
      accountInfo: f = {},
      auth: p = {},
      subscriptionSummary: g = null
    } = Xr().props,
    {
      isElectron: x,
      shopStatusesReady: v,
      connectionStatus: _,
      authorizeShop: S,
      openCloudPrintAuthorization: j,
      collectCloudPrintAuthorization: N,
      getRuntimeShopStatus: w,
      getShopAuthorizationDisplay: E,
      bootstrapShops: A,
      rebindShop: R,
      commitAuthorization: D,
      markAuthorizationScopeReady: V,
      deauthorizeShop: U
    } = Fp(),
    I = x && _?.status && _.status !== "disconnected",
    B = p?.user ?? {
      name: "未登录",
      email: ""
    },
    [J, ie] = m.useState(false),
    [de, te] = m.useState(false),
    [Q, Z] = m.useState(false),
    [ne, P] = m.useState({
      newPassword: "",
      confirmPassword: ""
    }),
    [q, M] = m.useState(1),
    [G, fe] = m.useState({
      oldCode: "",
      newPhone: "",
      newCode: ""
    }),
    [z, $] = m.useState(0),
    [re, oe] = m.useState(0),
    [ge, _e] = m.useState(false),
    [X, we] = m.useState(false),
    [Re, Me] = m.useState(false),
    [Pe, W] = m.useState(false),
    [et, Ue] = m.useState(o),
    [nt, be] = m.useState(l),
    [qe, mt] = m.useState(false),
    [Pt, yt] = m.useState({}),
    [Xt, nr] = m.useState(null),
    [le, Ye] = m.useState(false),
    [Qt, pt] = m.useState("正在授权..."),
    [Jt, xn] = m.useState(false),
    [ke, He] = m.useState(false),
    ft = m.useRef(null),
    st = g?.end_time || null,
    gt = st ? `${CM(st)}${g.is_active ? "" : "（已过期）"}` : "未订购",
    Rt = st ? "续费" : "开通",
    At = et.reduce((O, je) => (O[je.id] = je, O), {}),
    se = u.filter(O => wq(O.code)).map(O => {
      const je = TG[O.code] || [],
        Xe = je.length ? je.map(Le => {
          const $e = xv[Le];
          return {
            ...O,
            option_code: `${O.code}_${Le}`,
            display_name: `${T0(O)}${$e.label}`,
            subject_label: $e.label,
            subject_description: $e.description,
            subject_icon: $e.icon,
            auth_subject: $e.authSubject,
            step_keys: $e.stepKeys
          };
        }) : [O];
      return {
        code: O.code,
        label: T0(O),
        logo: O.logo,
        options: Xe
      };
    }),
    xt = [{
      key: "order_shop",
      title: "订单店铺",
      description: xv.order_shop.description
    }, {
      key: "live_room",
      title: "主播账号",
      description: xv.live_room.description
    }].map(O => {
      const je = se.flatMap(Xe => Xe.options.filter(Le => Le.auth_subject === O.key).map(Le => ({
        ...Le,
        platform_label: OG(Le, O.key),
        platform_logo: MG(Le, O.key),
        platform_card_description: PG(Le, O.key),
        platform_notice: O.key === "order_shop" && Le.code === "douyin" ? "授权前需先订购「贝壳打单」，可联系客服帮忙付款！" : ""
      })));
      return {
        ...O,
        options: je
      };
    }).filter(O => O.options.length > 0),
    dt = nt.length ? nt : et.map(O => ({
      row_id: `${O.platform_code}-${O.id}`,
      row_type: "single",
      platform_code: O.platform_code,
      platform_label: O.platform_name,
      store_shop_id: O.id,
      live_shop_id: O.id,
      binding_id: null,
      shop_name: O.shop_name,
      live_name: O.live_room_name || O.shop_name,
      connection: {
        [O.platform_code]: O.is_connected ? "ready" : "action_required"
      },
      actions: {
        delete: true
      },
      notes: O.notes
    })),
    jt = async (O, je) => {
      pt(O), Ye(true);
      try {
        return await je();
      } finally {
        Ye(false);
      }
    },
    ct = () => new Promise(O => {
      ft.current = O, Ye(false), He(false), window.setTimeout(() => {
        ft.current && xn(true);
      }, 0);
    }),
    Tt = O => {
      const je = ft.current;
      ft.current = null, xn(false), He(false), je?.(O);
    };
  m.useEffect(() => {
    Ue(o);
  }, [o]), m.useEffect(() => {
    be(l);
  }, [l]), m.useEffect(() => {
    if (x && o.length > 0) {
      const O = /* @__PURE__ */new Map(),
        je = o.filter(De => {
          const _t = FG(De);
          return O.set(De.id, _t), bv.get(De.id) !== _t;
        });
      bv.clear(), O.forEach((De, _t) => {
        bv.set(_t, De);
      });
      const Xe = fw(),
        Le = o.filter(De => Xe.has(Number(De.id))).map(De => {
          const _t = Xe.get(Number(De.id)) || [];
          return _t.length ? {
            ...De,
            authorization_scope: {
              stepKeys: _t
            }
          } : De;
        }),
        Ve = new Set(Le.map(De => Number(De.id))).size > 0 ? [] : je.filter(De => !Xe.has(Number(De.id)));
      if (je.length === 0 && Le.length === 0) return;
      Ve.length > 0 && A(Ve, {
        force: false
      }).catch(De => {
        console.warn("恢复店铺授权状态失败:", De);
      }), Le.length > 0 && A(Le, {
        force: true
      }).then(() => HG(Le.map(De => De.id))).catch(De => {
        console.warn("恢复店铺授权状态失败:", De);
      });
    }
  }, [x, o, A]), m.useEffect(() => {
    const O = Number(localStorage.getItem(ZC)),
      je = Number(localStorage.getItem(e2));
    O && O > Date.now() && $(Math.ceil((O - Date.now()) / 1e3)), je && je > Date.now() && oe(Math.ceil((je - Date.now()) / 1e3));
  }, []), m.useEffect(() => {
    if (z <= 0) return;
    const O = setInterval(() => {
      $(je => je <= 1 ? 0 : je - 1);
    }, 1e3);
    return () => clearInterval(O);
  }, [z]), m.useEffect(() => {
    if (re <= 0) return;
    const O = setInterval(() => {
      oe(je => je <= 1 ? 0 : je - 1);
    }, 1e3);
    return () => clearInterval(O);
  }, [re]);
  const Vt = () => {
      M(1), fe({
        oldCode: "",
        newPhone: "",
        newCode: ""
      }), _e(false), we(false), te(true);
    },
    Zt = () => {
      te(false), M(1), fe({
        oldCode: "",
        newPhone: "",
        newCode: ""
      }), _e(false), we(false);
    },
    vn = async () => {
      if (!(z > 0 || ge)) {
        _e(true);
        try {
          await zt.post("/sms/send", {
            phone: B.phone,
            type: 2
          });
          const O = Date.now() + QC * 1e3;
          localStorage.setItem(ZC, String(O)), $(QC), t("验证码发送成功");
        } catch (O) {
          e(O.response.data.message || "验证码发送失败，请稍后重试");
        } finally {
          _e(false);
        }
      }
    },
    Te = async () => {
      if (!G.newPhone) return e("请填写新手机号");
      if (!(re > 0 || X)) {
        we(true);
        try {
          await zt.post("/sms/send", {
            phone: G.newPhone,
            type: 3
          });
          const O = Date.now() + JC * 1e3;
          localStorage.setItem(e2, String(O)), oe(JC), t("验证码发送成功");
        } catch (O) {
          e(O.response.data.message || "验证码发送失败，请稍后重试");
        } finally {
          we(false);
        }
      }
    };
  function vt() {
    Zt(), Et.reload({
      only: ["auth", "shops"]
    });
  }
  const Ot = async () => {
    if (q === 1) {
      if (!G.oldCode) return e("请填写验证码");
      try {
        await zt.post("/old/phone/judge", {
          phone: B.phone,
          code: G.oldCode
        }), M(2);
      } catch (O) {
        e(O.response.data.message || "验证失败");
      }
      return;
    }
    if (q === 2) {
      if (!G.newPhone) return e("请填写新手机号");
      if (!G.newCode) return e("请填写验证码");
      try {
        await zt.post("/phone/update", {
          phone: B.phone,
          code: G.newCode,
          newPhone: G.newPhone
        }), M(3);
      } catch (O) {
        e(O.response.data.message || "修改失败");
      }
      return;
    }
    Zt();
  };
  function mn() {
    P(O => ({
      ...O,
      newPassword: "",
      confirmPassword: ""
    })), ie(false);
  }
  function pr() {
    const O = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/;
    if (!ne.newPassword) return e("请输入新密码");
    if (!O.test(ne.newPassword)) return e("8～20位密码，必须包含字母和数字");
    if (!ne.confirmPassword) return e("请再次输入新密码");
    if (ne.newPassword !== ne.confirmPassword) return e("两次输入的密码不一致");
    zt.post("/pwd/update", {
      ...ne,
      id: B.id
    }).then(je => {
      je.data.success ? (t(je.data.data), mn()) : e("修改密码失败，请稍后重试！");
    });
  }
  const bn = async (O, je) => {
      Hr("[shops-auth] connectAuthorizedShop:start", {
        shopId: O.id,
        platformCode: O.platform_code,
        authorizeResult: je
      });
      const Xe = Number(je?.runtimeShopId ?? null),
        Le = O.platform_code === "douyin" && Number.isFinite(Xe) && Xe !== Number(O.id);
      if (Le) {
        Hr("[shops-auth] connectAuthorizedShop:commit-before-save:start", {
          platformCode: O.platform_code,
          runtimeShopId: Xe,
          shopId: Number(O.id),
          authorizationScope: je?.authorizationScope ?? null
        });
        const De = await D?.(O.platform_code, Xe, Number(O.id), je?.authorizationScope);
        if (Hr("[shops-auth] connectAuthorizedShop:commit-before-save:result", {
          platformCode: O.platform_code,
          runtimeShopId: Xe,
          shopId: Number(O.id),
          commitResult: De
        }), De && !De.success) return e(De.error || "本地授权数据提交失败，请重新授权"), null;
      }
      const $e = await zt.post("/shops/connect", RM(O.id, je), {
        showLoading: false
      });
      if (Hr("[shops-auth] connectAuthorizedShop:response", {
        shopId: O.id,
        platformCode: O.platform_code,
        response: $e?.data ?? null
      }), !$e.data?.success) return e($e.data?.message || "授权成功，但店铺连接状态保存失败，请刷新后重试"), null;
      const Ve = Number($e.data?.shop_id ?? O.id);
      if (O.platform_code === "douyin" && Number.isFinite(Xe) && Xe !== Ve && !Le) {
        Hr("[shops-auth] connectAuthorizedShop:commit-after-save:start", {
          platformCode: O.platform_code,
          runtimeShopId: Xe,
          canonicalShopId: Ve,
          authorizationScope: je?.authorizationScope ?? null
        });
        const De = await D?.(O.platform_code, Xe, Ve, je?.authorizationScope);
        if (Hr("[shops-auth] connectAuthorizedShop:commit-after-save:result", {
          platformCode: O.platform_code,
          runtimeShopId: Xe,
          canonicalShopId: Ve,
          commitResult: De
        }), De && !De.success) return e(De.error || "授权已保存，但本地授权数据提交失败，请重新授权"), null;
      } else if (Number.isFinite(Ve) && Ve !== O.id) {
        const De = await R?.(O.platform_code, O.id, Ve);
        if (De && !De.success) return e(De.error || "店铺授权已保存，但运行态迁移失败，请刷新后重试"), null;
      }
      return wv(O.platform_code, Ve, je), V?.({
        ...O,
        id: Ve
      }, je?.authorizationScope), n2(O.platform_code, je?.authorizationScope) || t2(Ve, je?.authorizationScope), Ve;
    },
    Yn = async (O, je) => {
      Hr("[shops-auth] finalizeAuthorizedAttempt:start", {
        platformCode: O,
        runtimeShopId: je?.runtimeShopId ?? null,
        attemptId: je?.attemptId ?? null,
        metadata: je?.shopMetadata ?? null
      });
      const Xe = await zt.post("/shops/finalize-authorization", TM(O, je), {
        showLoading: false
      });
      Hr("[shops-auth] finalizeAuthorizedAttempt:response", {
        platformCode: O,
        runtimeShopId: je?.runtimeShopId ?? null,
        response: Xe?.data ?? null
      }), xo(Xe, "授权成功，但店铺创建失败，请重试");
      const Le = Number(Xe.data?.shop_id ?? null),
        $e = Number(je?.runtimeShopId ?? null);
      if (!Number.isFinite(Le)) throw new Error("授权成功，但未返回店铺 ID");
      if (Number.isFinite($e) && $e !== Le) {
        Hr("[shops-auth] finalizeAuthorizedAttempt:rebind:start", {
          platformCode: O,
          runtimeShopId: $e,
          canonicalShopId: Le
        });
        const Ve = await R?.(O, $e, Le);
        if (Hr("[shops-auth] finalizeAuthorizedAttempt:rebind:result", {
          platformCode: O,
          runtimeShopId: $e,
          canonicalShopId: Le,
          rebindResult: Ve ?? null
        }), Ve && !Ve.success) throw new Error(Ve.error || "店铺授权已保存，但运行态迁移失败，请刷新后重试");
      }
      return wv(O, Le, je), n2(O, je?.authorizationScope) || t2(Le, je?.authorizationScope), {
        canonicalShopId: Le,
        shop: Xe.data?.shop ?? null
      };
    },
    _n = async (O, je) => {
      const Xe = Number(je?.runtimeShopId ?? null);
      if (Number.isFinite(Xe)) try {
        await U?.(Xe, O);
      } catch (Le) {
        console.warn("[shops] releaseAuthorizationAttempt failed", {
          platformCode: O,
          runtimeShopId: Xe,
          error: Le
        });
      }
    },
    $t = async ({
      bindingId: O = null,
      channelsShopId: je,
      wxstoreShopId: Xe
    }) => {
      const Le = async () => O ? zt.put(`/wechat-bindings/${O}`, {
        channels_shop_id: Number(je),
        wxstore_shop_id: Number(Xe)
      }) : zt.post("/wechat-bindings", {
        channels_shop_id: Number(je),
        wxstore_shop_id: Number(Xe)
      });
      try {
        const $e = await Le();
        return xo($e, "微信授权关系保存失败，请重试"), $e;
      } catch ($e) {
        console.warn("[shops] persistWechatBinding retrying after failure", {
          bindingId: O,
          channelsShopId: je,
          wxstoreShopId: Xe,
          error: $e,
          response: $e?.response?.data ?? null
        });
        const Ve = await Le();
        return xo(Ve, "微信授权关系保存失败，请重试"), Ve;
      }
    },
    Wt = async (O = null, je = {}, Xe = {}) => {
      const {
        authorizeFail: Le = "抖店订单店铺授权失败，请重试",
        requestFail: $e = "抖店订单店铺授权失败，请重试"
      } = je;
      if (O && (!O.id || O.platform_code !== "douyin")) return e("未找到抖音订单店铺，请刷新后重试"), null;
      if (!j || !N) return e("当前桌面端不支持订单店铺授权，请升级客户端后重试"), null;
      const Ve = Sv(Xe.stepKeys || ["store"]);
      let De = null,
        _t = null;
      try {
        Hr("[shops-auth] douyinCloudPrint:start", {
          shopId: O?.id ?? null,
          authorizationScope: Ve
        });
        const Zn = await zt.post("/shops/platform-app/oauth-url", {
          platform_code: "douyin"
        }, {
          showLoading: false
        });
        xo(Zn, "订单店铺授权链接获取失败，请重试");
        const ja = Zn.data?.url,
          Zr = Zn.data?.state;
        if (!ja || !Zr) throw new Error("订单店铺授权链接返回异常，请重试");
        if (De = await j({
          platformCode: "douyin",
          ...(O?.id ? {
            shopId: Number(O.id)
          } : {}),
          url: ja
        }), !De?.success) return e(De?.error || Le), false;
        if (Ye(false), !(await ct())) return await _n("douyin", De), e("已取消授权"), false;
        if (He(true), pt("正在确认订单店铺授权..."), Ye(true), _t = await N({
          platformCode: "douyin",
          runtimeShopId: De.runtimeShopId,
          attemptId: De.attemptId,
          authorizationScope: Ve
        }), !_t?.success) return await _n("douyin", De), e(_t?.error || "未获取到抖店登录信息，请完成授权后重试"), false;
        _t.authorizationScope = Ve, O?.id && (_t.shopSnapshot = Nv(O)), _t.authSubject = "order_shop";
        const Se = await zt.post("/shops/platform-app/authorization", VG(O?.id ?? null, Zr, _t), {
          showLoading: false
        });
        xo(Se, "订单店铺授权确认失败，请重新授权");
        const Tn = Number(Se.data?.shop_id ?? O?.id ?? null);
        if (!Number.isFinite(Tn)) throw new Error("授权成功，但未返回店铺 ID");
        const _r = Number(De.runtimeShopId ?? _t.runtimeShopId ?? null),
          In = await D?.("douyin", _r, Tn, Ve);
        return In && !In.success ? (await _n("douyin", De), e(In.error || "授权已保存，但本地授权数据提交失败，请重新授权恢复本地运行态"), null) : (wv("douyin", Tn, _t), V?.({
          ...(O || {}),
          id: Tn,
          platform_code: "douyin",
          auth_subject: "order_shop"
        }, Ve), Hr("[shops-auth] douyinCloudPrint:success", {
          shopId: O?.id ?? null,
          canonicalShopId: Tn,
          runtimeShopId: _r
        }), Tn);
      } catch (Zn) {
        return _v("[shops] authorizeDouyinCloudPrintOrderShop failed", {
          shopId: O?.id ?? null,
          error: Zn,
          response: Zn?.response?.data ?? null,
          openedResult: De,
          collectResult: _t
        }), De?.success && (await _n("douyin", De)), e(iu(Zn, $e)), null;
      } finally {
        He(false), xn(false), Ye(false);
      }
    },
    dr = async (O, je = {}, Xe = {}) => {
      const {
        authorizeFail: Le = "授权失败，请重试",
        requestFail: $e = "授权失败，请重试"
      } = je;
      if (!O) return e("未找到店铺信息，请刷新后重试"), null;
      if (GG(O, Xe)) return Wt(O, je, Xe);
      let Ve = null;
      try {
        Hr("[shops-auth] authorizeAndConnectShop:start", {
          shopId: O.id,
          platformCode: O.platform_code
        });
        const De = Sv(Xe.stepKeys);
        if (Ve = await S(O.platform_code, O.id, void 0, Nv(O), {
          authorizationMode: "reconnect",
          ...(De ? {
            authorizationScope: De
          } : {}),
          ...(O.platform_code === "douyin" && !De ? {
            enableTwoStepAuth: true
          } : {})
        }), Ve && (Ve.authorizationScope = De, Ve.shopSnapshot = Nv(O)), Ye(false), Hr("[shops-auth] authorizeAndConnectShop:authorize-result", {
          shopId: O.id,
          platformCode: O.platform_code,
          result: Ve
        }), !Ve?.success) return r2(Ve) ? (e(Ve?.error || "已取消授权"), false) : (e(Ve?.error || Le), false);
        const _t = await bn(O, Ve);
        return _t || (await _n(O.platform_code, Ve)), _t;
      } catch (De) {
        return Ve?.success && (await _n(O.platform_code, Ve)), _v("[shops] authorizeAndConnectShop failed", {
          shopId: O?.id ?? null,
          platformCode: O?.platform_code ?? null,
          error: De,
          response: De?.response?.data ?? null
        }), e(iu(De, $e)), null;
      }
    },
    Or = async (O, je = {}, Xe = {}) => {
      const {
          authorizeFail: Le = "授权失败，请重试",
          requestFail: $e = "授权失败，请重试"
        } = je,
        Ve = KG();
      let De = null;
      try {
        Hr("[shops-auth] authorizeNewShopAttempt:start", {
          platformCode: O,
          attemptId: Ve,
          authorizationMode: "new"
        });
        const _t = Sv(Xe.stepKeys || bq(O));
        return De = await S(O, void 0, void 0, void 0, {
          attemptId: Ve,
          authorizationMode: "new",
          ...(_t ? {
            authorizationScope: _t
          } : {}),
          ...(O === "douyin" && !_t ? {
            enableTwoStepAuth: true
          } : {})
        }), De && (De.authorizationScope = _t, De.authSubject = Xe.authSubject || hw(_t)), Hr("[shops-auth] authorizeNewShopAttempt:authorize-result", {
          platformCode: O,
          attemptId: Ve,
          authorizeResult: De
        }), De?.success ? (Hr("[shops-auth] authorizeNewShopAttempt:finalize:start", {
          platformCode: O,
          attemptId: Ve,
          runtimeShopId: De?.runtimeShopId ?? null
        }), await Yn(O, De)) : r2(De) ? (Hr("[shops-auth] authorizeNewShopAttempt:cancelled", {
          platformCode: O,
          attemptId: Ve,
          authorizeResult: De
        }), e(De?.error || "已取消授权"), null) : (Hr("[shops-auth] authorizeNewShopAttempt:authorize-failed", {
          platformCode: O,
          attemptId: Ve,
          authorizeResult: De
        }), e(De?.error || Le), null);
      } catch (_t) {
        return _v("[shops] authorizeNewShopAttempt failed", {
          platformCode: O,
          attemptId: Ve,
          error: _t,
          response: _t?.response?.data ?? null,
          authorizeResult: De
        }), e(iu(_t, $e)), De?.success && (await _n(O, De)), null;
      }
    },
    Rn = async (O, je = {}) => {
      const {
        closeSelectionDialog: Xe = false
      } = je;
      return jt("正在新增授权...", async () => {
        try {
          if (Xe && mt(false), O.code === "wechat_ecosystem") {
            t("正在授权视频号...");
            const $e = await Or("channels", {
              authorizeFail: "直播授权失败，请重试",
              requestFail: "直播授权失败，请重试"
            });
            if (!$e?.canonicalShopId) return;
            t("直播授权成功，正在授权微信小店...");
            const Ve = await hn();
            if (!Ve?.id) {
              Et.reload({
                only: ["shops", "shopDisplayRows"]
              });
              return;
            }
            await $t({
              channelsShopId: Number($e.canonicalShopId),
              wxstoreShopId: Number(Ve.id)
            }), t("授权成功"), Et.reload({
              only: ["shops", "shopDisplayRows"]
            });
            return;
          }
          if (O.auth_subject) {
            if (t(`正在授权${O.display_name}...`), O.code === "douyin" && O.auth_subject === "order_shop") {
              if (!(await Wt(null, {
                authorizeFail: "抖店订单店铺授权失败，请重试",
                requestFail: "抖店订单店铺授权失败，请重试"
              }, {
                stepKeys: O.step_keys || ["store"],
                authSubject: "order_shop"
              }))) return;
              t("授权成功"), Et.reload({
                only: ["shops", "shopDisplayRows"]
              });
              return;
            }
            if (!(await Or(O.code, {
              authorizeFail: "授权失败，请重试",
              requestFail: "操作失败"
            }, {
              stepKeys: O.step_keys || [],
              authSubject: O.auth_subject
            }))?.canonicalShopId) return;
            t("授权成功"), Et.reload({
              only: ["shops", "shopDisplayRows"]
            });
            return;
          }
          if (t(`正在授权${O.display_name}...`), !(await Or(O.code, {
            authorizeFail: "授权失败，请重试",
            requestFail: "操作失败"
          }))?.canonicalShopId) return;
          t("授权成功"), Et.reload({
            only: ["shops", "shopDisplayRows"]
          });
        } catch (Le) {
          console.error("[shops] createAndAuthorizeShop failed", {
            platformCode: O?.code ?? null,
            error: Le,
            response: Le?.response?.data ?? null
          }), e(iu(Le, "操作失败"));
        }
      });
    },
    hn = async () => {
      const O = await Or("wxstore", {
        authorizeFail: "微信小店授权失败，请重试",
        requestFail: "微信小店授权失败，请重试"
      });
      return O?.canonicalShopId ? {
        id: O.canonicalShopId
      } : null;
    },
    fr = async O => {
      if (!O?.live_shop_id) {
        e("未找到待绑定的视频号授权");
        return;
      }
      nr(O.binding_id ?? O.live_shop_id);
      try {
        const je = await hn();
        if (!je?.id) return;
        await $t({
          bindingId: O.binding_id ?? null,
          channelsShopId: Number(O.live_shop_id),
          wxstoreShopId: Number(je.id)
        }), t("微信小店授权成功"), Et.reload({
          only: ["shops", "shopDisplayRows"]
        });
      } catch (je) {
        console.error("[shops] authorizeWechatDraftStore failed", {
          bindingId: O?.binding_id ?? null,
          liveShopId: O?.live_shop_id ?? null,
          error: je,
          response: je?.response?.data ?? null
        }), e(iu(je, "微信小店授权失败，请重试"));
      } finally {
        nr(null);
      }
    },
    Xn = async O => {
      const je = O?.platform_code === "wechat_ecosystem" ? `${O.live_name || "直播侧授权"} / ${O.shop_name || "店铺侧授权"}` : O?.shop_name || O?.live_name || "当前授权",
        Xe = O?.is_legacy_shop_subject ? O?.delete_target === "live" ? `确认删除直播间「${O.live_name || je}」吗？

该授权会同时删除订单店铺「${O.shop_name || "当前订单店铺"}」。` : `确认删除订单店铺「${O.shop_name || je}」吗？

该授权会同时删除直播间「${O.live_name || "当前直播间"}」。` : `确认删除「${je}」吗？`;
      if (window.confirm(Xe)) try {
        if (O?.delete_target === "live" && O?.live_shop_id) {
          const $e = await zt.delete(`/shops/${O.live_shop_id}`);
          xo($e, "删除失败，请重试");
        } else if (O?.delete_target === "store" && O?.store_shop_id) {
          const $e = await zt.delete(`/shops/${O.store_shop_id}`);
          xo($e, "删除失败，请重试");
        } else if (O?.platform_code === "wechat_ecosystem" && O?.binding_id) {
          const $e = await zt.delete(`/wechat-bindings/${O.binding_id}`);
          xo($e, "删除失败，请重试");
        } else if (O?.platform_code === "wechat_ecosystem" && O?.live_shop_id) {
          const $e = await zt.delete(`/shops/${O.live_shop_id}`);
          xo($e, "删除失败，请重试");
        } else if (O?.store_shop_id) {
          const $e = await zt.delete(`/shops/${O.store_shop_id}`);
          xo($e, "删除失败，请重试");
        } else {
          e("未找到可删除的授权");
          return;
        }
        t("删除成功"), Et.reload({
          only: ["shops", "shopDisplayRows"]
        });
      } catch ($e) {
        console.error("[shops] deleteAuthorizationRow failed", {
          rowId: O?.row_id ?? null,
          bindingId: O?.binding_id ?? null,
          storeShopId: O?.store_shop_id ?? null,
          error: $e,
          response: $e?.response?.data ?? null
        }), e(iu($e, "删除失败，请重试"));
      }
    },
    fa = async (O, je) => {
      const Xe = O.live_shop_id ? At[O.live_shop_id] : null,
        Le = O.store_shop_id ? At[O.store_shop_id] : null;
      if (je === "channels" && !Xe) {
        e("未找到视频号店铺");
        return;
      }
      if (je === "wxstore" && !Le) {
        e("未找到微信小店店铺");
        return;
      }
      return !!(await dr(je === "channels" ? Xe : Le, {
        authorizeFail: "授权失败，请重试",
        requestFail: "授权失败，请重试"
      }, {
        stepKeys: [je === "channels" ? "live" : "store"]
      }));
    },
    Rs = async ({
      row: O,
      isWechatDisplay: je,
      isSplitDisplay: Xe,
      splitConfig: Le,
      liveSideShop: $e,
      storeSideShop: Ve,
      primaryShop: De,
      targetShop: _t = null,
      targetStepKeys: Zn = null,
      targetSide: ja = null,
      liveSideAccessStatus: Zr,
      storeSideAccessStatus: Ts,
      liveCapabilityStatus: Se,
      orderCapabilityStatus: Tn,
      remarkCapabilityStatus: _r
    }) => jt("正在重新授权...", async () => {
      if (_t && Array.isArray(Zn) && Zn.length > 0) {
        if (!(await dr(_t, {}, {
          stepKeys: Zn
        }))) return;
        t("重新授权成功"), a2();
        return;
      }
      if (Xe) {
        if (Vr === "live" && $e) {
          await fa(O, Le.livePlatformCode);
          return;
        }
        if (Vr === "store" && Ve) {
          await fa(O, Le.storePlatformCode);
          return;
        }
        const Ln = Zj(O.platform_code, {
            live: Se,
            order: Tn,
            remark: _r
          }),
          qa = $e && (Ln.includes("live") || !Ve || Zr?.actionRequired),
          Vr = Ve && (Ln.includes("store") || Ts?.actionRequired) && !qa ? Le.storePlatformCode : $e ? Le.livePlatformCode : Le.storePlatformCode;
        if (Vr === Le.livePlatformCode && $e) {
          await fa(O, Le.livePlatformCode);
          return;
        }
        if (Vr === Le.storePlatformCode && Ve) {
          await fa(O, Le.storePlatformCode);
          return;
        }
        e("未找到可重新授权的店铺");
        return;
      }
      const In = Zj(De?.platform_code || O.platform_code, {
        live: Se,
        order: Tn,
        remark: _r
      });
      (await dr(De, {}, {
        stepKeys: In
      })) && (t("重新授权成功"), a2());
    }),
    ha = O => {
      const je = O.platform_code === "wechat_ecosystem",
        Xe = jq(O.platform_code),
        Le = !!Xe,
        $e = At[O.store_shop_id] || At[O.live_shop_id] || null,
        Ve = O.live_shop_id ? At[O.live_shop_id] : null,
        De = O.store_shop_id ? At[O.store_shop_id] : null,
        _t = $e ? w($e) : null,
        Zn = Ve ? w(Ve) : null,
        ja = De ? w(De) : null,
        Zr = _t ? {
          ...$e,
          ..._t
        } : null,
        Ts = Zn ? {
          ...Ve,
          ...Zn
        } : null,
        Se = ja ? {
          ...De,
          ...ja
        } : null,
        Tn = De || Ve || $e,
        _r = $e?.auth_subject || "shop",
        In = !Le && _r === "live_room",
        ls = !Le && _r === "order_shop",
        Ln = !Le && Xd($e),
        qa = ls ? "-" : O.live_name || $e?.live_room_name || $e?.shop_name || "-",
        Ke = In ? "-" : O.shop_name || $e?.shop_name || "-",
        Vr = In ? $e?.live_avatar_url : Ve?.live_avatar_url,
        Ms = ls ? $e?.avatar_url : De?.avatar_url,
        Bt = Le ? Xe?.livePlatformCode : $e?.platform_code || O.platform_code,
        ma = za(Bt),
        Pr = za(O.platform_code || $e?.platform_code || Ve?.platform_code || De?.platform_code),
        Os = Le ? Ve : $e,
        en = Le ? De : $e,
        ao = en?.platform_code === "douyin" ? $G(en?.service_expire_time) : "",
        Va = en?.platform_code === "douyin" ? UG(en?.service_expire_time) : false,
        H = !x || v,
        ye = _t ? E(Zr, {
          allowLegacyFallback: H
        }) : x && (!v || $e?.is_connected) ? vv : {
          message: "需要重新授权店铺"
        },
        Ie = Zn ? E(Ts, {
          allowLegacyFallback: H
        }) : x && (!v || Ve?.is_connected) ? vv : {
          state: c0.reauthorization_required,
          label: "需要重新授权",
          message: "需要重新授权店铺",
          actionRequired: true
        },
        Ze = ja ? E(Se, {
          allowLegacyFallback: H
        }) : x && (!v || De?.is_connected) ? vv : {
          state: c0.reauthorization_required,
          label: "需要重新授权",
          message: "需要重新授权店铺",
          actionRequired: true
        },
        Qe = Le ? Ie : ye,
        Ge = Le ? Ze : ye;
      return {
        row: O,
        isLegacyShopAuthSubject: Ln,
        isWechatDisplay: je,
        isSplitDisplay: Le,
        splitConfig: Xe,
        primaryShop: $e,
        liveSideShop: Ve,
        storeSideShop: De,
        liveTargetShop: Os,
        storeTargetShop: en,
        liveSideAccessStatus: Ie,
        storeSideAccessStatus: Ze,
        live: {
          show: !ls,
          name: qa,
          avatar: Vr || ma || Tn?.avatar_url,
          id: Ve?.live_id || (In ? $e?.live_id : null),
          status: YC(Qe, !!Os)
        },
        store: {
          show: !In,
          name: Ke,
          avatar: Ms || Pr,
          id: De?.platform_account_id || (ls ? $e?.platform_account_id : null),
          serviceExpireTime: ao,
          serviceExpireUrgent: Va,
          status: YC(Ge, !!en),
          missingText: je && !O.store_shop_id ? "待绑定订单店铺" : "未绑定订单店铺"
        }
      };
    },
    Kn = dt.map(ha),
    rr = Kn.filter(O => O.live.show),
    Qr = Kn.filter(O => O.store.show),
    Qn = rr.length === 0 && Qr.length === 0;
  return <div className="space-y-6"><a /><Dialog open={le}><DialogContent className="sm:max-w-[320px]" showCloseButton={false} onEscapeKeyDown={O => O.preventDefault()} onInteractOutside={O => O.preventDefault()}><div className="flex flex-col items-center gap-4 py-4"><Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden="true" /><DialogTitle className="text-base font-medium text-gray-900">{Qt}</DialogTitle></div></DialogContent></Dialog><Dialog open={Jt}><DialogContent className="sm:max-w-[540px]" showCloseButton={false} onEscapeKeyDown={O => O.preventDefault()} onInteractOutside={O => O.preventDefault()}><DialogHeader><DialogTitle className="flex items-center gap-2 text-lg font-semibold"><AlertCircle className="h-5 w-5 fill-orange-500 text-white" aria-hidden="true" />店铺绑定</DialogTitle></DialogHeader><div className="text-sm text-gray-600"><p>是否绑定成功?</p></div><DA className="gap-3"><Button type="button" variant="outline" className="h-10 min-w-[112px] text-sm" disabled={ke} onClick={() => Tt(false)}>绑定失败</Button><Button type="button" className="h-10 min-w-[112px] bg-blue-600 text-sm hover:bg-blue-700" disabled={ke} onClick={() => Tt(true)}>{ke && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}绑定成功</Button></DA></DialogContent></Dialog><div className="bg-white rounded-lg border px-6 py-5 shadow-sm"><div className="flex items-start justify-between"><div className="space-y-4"><h2 className="text-1xl font-semibold">账户信息</h2><div className="grid grid-cols-1 lg:grid-cols-2 gap-y-3 gap-x-12 text-base text-gray-800 text-[14px]"><div className="flex items-center gap-2"><span className="text-gray-600">登录手机：</span><span>{B.phone}</span><Button variant="link" className="text-blue-600 p-0 h-auto cursor-pointer" onClick={Vt}>修改</Button></div><div className="flex items-center gap-2"><span className="text-gray-600">用户名：</span><span>{B.name}</span></div><div className="flex items-center gap-2"><span className="text-gray-600">登录密码：</span><span>已设置</span><Button variant="link" className="text-blue-600 p-0 h-auto cursor-pointer" onClick={() => {
                ie(true);
              }}>修改</Button></div><div className="flex items-center gap-2 flex-wrap"><span className="text-gray-600">到期时间：</span><span>{gt}</span><Button variant="link" className="text-blue-600 p-0 h-auto cursor-pointer" onClick={() => Z(true)}>{Rt}</Button><Button variant="link" className="text-blue-600 p-0 h-auto cursor-pointer" onClick={() => {
                Et.visit("/settings/order-subscriptions");
              }}>订购记录</Button></div></div></div><div><Button variant="outline" className="px-5 h-10" onClick={() => {
            Et.post("/logout");
          }}>退出登录</Button></div></div></div>{d?.success && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm">{d.success}</div>}<div className="bg-white rounded-lg border">{Qn ? <div><div className="px-6 pt-4 pb-3 flex items-center justify-between gap-4"><div><h2 className="text-base font-semibold text-gray-900">授权账号管理</h2></div></div><div className="px-6 pb-6"><div className="rounded-lg border border-blue-100 bg-blue-50/50 px-5 py-5"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 ring-1 ring-blue-100"><PackageOpen className="h-6 w-6" /></div><div><h3 className="text-base font-semibold text-gray-900">先完成授权，开始自动打单</h3><p className="mt-1 text-sm leading-6 text-gray-600">需要授权主播账号和订单店铺，系统才能读取直播互动并同步订单。</p></div></div><div className="shrink-0">{x ? <Button className="h-9 px-4" onClick={() => mt(true)}>新增授权<c6 className="ml-2 h-4 w-4" /></Button> : <span className="text-sm text-gray-500">请下载桌面客户端进行平台授权</span>}</div></div><div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2"><div className="flex items-center justify-between gap-4 rounded-lg border border-blue-100 bg-white px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Radio className="h-5 w-5" /></span><div><div className="text-sm font-medium text-gray-900">主播账号</div><div className="mt-0.5 text-xs text-gray-500">用于直播间弹幕、互动识别</div></div></div><span className="shrink-0 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs text-orange-600">未授权</span></div><div className="flex items-center justify-between gap-4 rounded-lg border border-blue-100 bg-white px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><ShoppingBag className="h-5 w-5" /></span><div><div className="text-sm font-medium text-gray-900">订单店铺</div><div className="mt-0.5 text-xs text-gray-500">用于订单同步、订单备注</div></div></div><span className="shrink-0 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs text-orange-600">未授权</span></div></div>{x ? null : <div className="mt-4 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">当前浏览器环境不能直接授权，请使用桌面客户端完成平台授权。</div>}</div></div></div> : <div><div className="px-6 pt-4 pb-3 flex items-center justify-between gap-4"><div><h2 className="text-base font-semibold text-gray-900">授权账号管理</h2></div><div className="shrink-0">{x ? <Button variant="outline" className="h-9 px-4" onClick={() => mt(true)}>新增授权</Button> : <span className="text-sm text-gray-500">请下载桌面客户端进行平台授权</span>}</div></div><div className="space-y-4 px-6 pb-6"><div className="overflow-hidden rounded-lg border border-gray-200"><div className="border-b border-gray-100 bg-gray-50 px-4 py-3"><h3 className="text-sm font-semibold text-gray-900">主播账号</h3></div><div className="max-h-[240px] overflow-y-auto"><Table className="table-fixed"><TableHeader><TableRow><TableHead className="w-[44%]">账号名称</TableHead><TableHead className="w-[14%] text-center">平台</TableHead><TableHead className="w-[18%] text-center">连接状态</TableHead><TableHead className="w-[14%] text-center">操作</TableHead></TableRow></TableHeader><TableBody>{rr.map(O => <TableRow><TableCell><div className="flex items-start gap-3">{O.live.avatar ? <img src={O.live.avatar} alt={O.live.name} className="mt-0.5 h-9 w-9 rounded-full border object-cover" /> : null}<div><div className="font-medium text-gray-900">{O.live.name}</div><div className="mt-1 text-xs text-gray-500">{O.live.id ? `ID：${O.live.id}` : "直播侧授权"}{I && <span className="ml-2 inline-flex items-center gap-1 text-green-600" title="WebSocket 已连接"><span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />WS</span>}</div></div></div></TableCell><TableCell className="text-center">{O.row.platform_label ?? O.primaryShop?.platform_name ?? "-"}</TableCell><TableCell className="text-center"><div className="flex justify-center"><Shield status={O.live.status} /></div></TableCell><TableCell><div className="flex items-center justify-center gap-3">{x && O.liveTargetShop ? <Button variant="link" className="h-auto p-0 text-blue-600 hover:text-blue-700" onClick={() => Rs({
                          ...O,
                          targetShop: O.liveTargetShop,
                          targetStepKeys: ["live"],
                          targetSide: "live"
                        })}>重新授权</Button> : null}{O.row.actions?.delete ? <Button variant="link" className="h-auto p-0 text-red-500 hover:text-red-600" onClick={() => Xn({
                          ...O.row,
                          is_legacy_shop_subject: O.isLegacyShopAuthSubject,
                          delete_target: "live"
                        })}>删除</Button> : null}</div></TableCell></TableRow>)}</TableBody></Table></div></div><div className="overflow-hidden rounded-lg border border-gray-200"><div className="border-b border-gray-100 bg-gray-50 px-4 py-3"><div className="flex items-center gap-4"><h3 className="text-sm font-semibold text-gray-900">订单店铺</h3><span className="text-xs font-medium text-red-500">抖音订单店铺授权前需先订购「贝壳打单」，可联系客服帮忙付款！</span></div></div><div className="max-h-[240px] overflow-y-auto"><Table className="table-fixed"><TableHeader><TableRow><TableHead className="w-[44%]">店铺名称</TableHead><TableHead className="w-[14%] text-center">平台</TableHead><TableHead className="w-[18%] text-center">连接状态</TableHead><TableHead className="w-[14%] text-center">操作</TableHead></TableRow></TableHeader><TableBody>{Qr.map(O => <TableRow><TableCell><div className="flex items-start gap-3">{O.store.avatar ? <img src={O.store.avatar} alt={O.store.name} className="mt-0.5 h-9 w-9 rounded-full border object-cover" /> : null}<div>{O.isWechatDisplay && !O.row.store_shop_id && x ? <Button variant="link" className="h-auto p-0 text-orange-500 hover:text-orange-600" disabled={Xt === O.row.binding_id} onClick={() => fr(O.row)}>{Xt === O.row.binding_id ? "授权中..." : O.store.missingText}</Button> : <div className="font-medium text-gray-900">{O.store.name}</div>}<div className="mt-1 text-xs text-gray-500">{O.store.id ? `ID：${O.store.id}` : O.store.missingText}</div>{O.store.serviceExpireTime ? <div className={`mt-1 text-xs ${O.store.serviceExpireUrgent ? "font-medium text-red-500" : "text-gray-500"}`}>服务到期：{O.store.serviceExpireTime}</div> : null}</div></div></TableCell><TableCell className="text-center">{O.row.platform_label ?? O.primaryShop?.platform_name ?? "-"}</TableCell><TableCell className="text-center"><div className="flex justify-center"><Shield status={O.store.status} /></div></TableCell><TableCell><div className="flex items-center justify-center gap-3">{x && O.storeTargetShop ? <Button variant="link" className="h-auto p-0 text-blue-600 hover:text-blue-700" onClick={() => Rs({
                          ...O,
                          targetShop: O.storeTargetShop,
                          targetStepKeys: ["store"],
                          targetSide: "store"
                        })}>重新授权</Button> : null}{O.row.actions?.delete ? <Button variant="link" className="h-auto p-0 text-red-500 hover:text-red-600" onClick={() => Xn({
                          ...O.row,
                          is_legacy_shop_subject: O.isLegacyShopAuthSubject,
                          delete_target: "store"
                        })}>删除</Button> : null}</div></TableCell></TableRow>)}</TableBody></Table></div></div></div></div>}</div><Dialog open={qe} onOpenChange={mt}><DialogContent className="sm:max-w-[760px] p-0"><DialogHeader className="p-6 pb-3"><DialogTitle className="text-lg font-semibold">选择授权平台</DialogTitle></DialogHeader><div className="px-6 pb-6">{x ? <div className="space-y-4">{xt.map(O => <div className="rounded-lg border border-gray-200 bg-white"><div className="border-b border-gray-100 bg-gray-50 px-4 py-3"><div className="flex items-baseline gap-3"><div className="font-medium text-gray-900">{O.title}</div><div className="text-xs text-gray-500">{O.description}</div></div></div><div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[repeat(auto-fill,240px)]">{O.options.map(je => {
                  const Xe = je.subject_icon || Yv;
                  return <button type="button" onClick={() => Rn(je, {
                    closeSelectionDialog: true
                  })} disabled={!je.authorization_url} className={`flex min-h-[86px] w-full items-center gap-3 rounded-lg border p-4 text-left transition-all sm:w-[240px]
                                                        ${je.authorization_url ? "border-gray-200 hover:border-blue-200 hover:bg-blue-50" : "cursor-not-allowed border-gray-200 bg-gray-50 opacity-50"}`}>{je.platform_logo ? <img src={je.platform_logo} alt={je.platform_label} className="h-9 w-9 rounded-md object-cover" /> : <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700"><Store className="h-5 w-5" /></span>}<span className="min-w-0 space-y-1"><span className="block whitespace-nowrap text-sm font-medium leading-5 text-gray-900">{je.platform_label || je.display_name}</span>{je.platform_card_description ? <span className="block whitespace-nowrap text-xs leading-5 text-gray-500">{je.platform_card_description}</span> : null}{je.platform_notice ? <span className="block whitespace-normal text-xs font-medium leading-5 text-red-500">{je.platform_notice}</span> : null}</span></button>;
                })}</div></div>)}</div> : <p className="text-sm text-gray-500">请下载桌面客户端进行平台授权</p>}</div></DialogContent></Dialog><Dialog open={J} onOpenChange={ie}><DialogContent className="sm:max-w-[500px]"><DialogHeader className="pb-2"><DialogTitle className="text-xl font-semibold">修改登录密码</DialogTitle></DialogHeader><div className="space-y-6"><div className="space-y-2"><Label className="text-base font-medium flex items-center gap-1"><span className="text-red-500">*</span> 新密码</Label><div className="relative"><Input type={Re ? "text" : "password"} placeholder="请输入新密码" value={ne.newPassword} onChange={O => P(je => ({
                ...je,
                newPassword: O.target.value
              }))} className="pr-10 h-11" /><button type="button" className="absolute inset-y-0 right-3 flex items-center text-gray-500" onClick={() => Me(!Re)}>{Re ? <TJ className="w-4 h-4" /> : <NJ className="w-4 h-4" />}</button></div><p className="text-sm text-gray-500">8~20位密码，包含字母和数字</p></div><div className="space-y-2"><Label className="text-base font-medium flex items-center gap-1"><span className="text-red-500">*</span> 重新新密码</Label><div className="relative"><Input type={Pe ? "text" : "password"} placeholder="请重复输入新密码" value={ne.confirmPassword} onChange={O => P(je => ({
                ...je,
                confirmPassword: O.target.value
              }))} className="pr-10 h-11" /><button type="button" className="absolute inset-y-0 right-3 flex items-center text-gray-500" onClick={() => W(!Pe)}>{Pe ? <TJ className="w-4 h-4" /> : <NJ className="w-4 h-4" />}</button></div></div></div><DA className="flex justify-end gap-3 pt-4"><Button variant="outline" className="w-28" onClick={() => mn()}>取消</Button><Button className="w-28" onClick={() => pr()}>确定</Button></DA></DialogContent></Dialog><Dialog open={de} onOpenChange={O => {
      O ? te(true) : Zt();
    }}><DialogContent className="sm:max-w-[780px]"><DialogHeader className="pb-2"><DialogTitle className="text-xl font-semibold">修改手机号</DialogTitle></DialogHeader><div className="flex items-center justify-center gap-6 text-base"><div className="flex items-center gap-3"><div className={`h-8 w-8 rounded-full border flex items-center justify-center text-sm ${q === 1 ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-500"}`}>1</div><span className={`${q === 1 ? "text-blue-600 font-medium" : "text-gray-500"}`}>原手机号码</span></div><div className="h-px w-24 bg-gray-200" /><div className="flex items-center gap-3"><div className={`h-8 w-8 rounded-full border flex items-center justify-center text-sm ${q === 2 ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-500"}`}>2</div><span className={`${q === 2 ? "text-blue-600 font-medium" : "text-gray-500"}`}>修改手机号码</span></div><div className="h-px w-24 bg-gray-200" /><div className="flex items-center gap-3"><div className={`h-8 w-8 rounded-full border flex items-center justify-center text-sm ${q === 3 ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-500"}`}>3</div><span className={`${q === 3 ? "text-blue-600 font-medium" : "text-gray-500"}`}>修改成功</span></div></div>{q === 1 && <div className="mt-10 space-y-6"><div className="flex items-center gap-6"><Label className="w-32 text-right text-base text-gray-700"><span className="text-red-500">*</span> 当前绑定手机号</Label><Input value={B.phone} readOnly={true} className="w-[360px] bg-gray-100" /></div><div className="flex items-center gap-6"><Label className="w-32 text-right text-base text-gray-700"><span className="text-red-500">*</span> 验证码</Label><div className="flex items-center gap-3"><Input value={G.oldCode} onChange={O => fe(je => ({
                ...je,
                oldCode: O.target.value
              }))} className="w-[260px]" placeholder="输入手机验证码" /><Button type="button" variant="link" className="text-blue-600 p-0" onClick={vn} disabled={z > 0 || ge}>{z > 0 ? `${z}s` : "获取验证码"}</Button></div></div><div className="flex justify-center pt-6"><Button className="w-28" onClick={Ot}>提交</Button></div></div>}{q === 2 && <div className="mt-10 space-y-6"><div className="flex items-center gap-6"><Label className="w-32 text-right text-base text-gray-700"><span className="text-red-500">*</span> 新手机号</Label><Input value={G.newPhone} onChange={O => fe(je => ({
              ...je,
              newPhone: O.target.value
            }))} className="w-[360px]" placeholder="请输入新手机号" /></div><div className="flex items-center gap-6"><Label className="w-32 text-right text-base text-gray-700"><span className="text-red-500">*</span> 验证码</Label><div className="flex items-center gap-3"><Input value={G.newCode} onChange={O => fe(je => ({
                ...je,
                newCode: O.target.value
              }))} className="w-[260px]" placeholder="输入手机验证码" /><Button type="button" variant="link" className="text-blue-600 p-0" onClick={Te} disabled={re > 0 || X}>{re > 0 ? `${re}s` : "获取验证码"}</Button></div></div><div className="flex justify-center pt-6"><Button className="w-28" onClick={Ot}>提交</Button></div></div>}{q === 3 && <div className="mt-12 flex flex-col items-center gap-6"><div className="text-base text-gray-700">手机号修改成功</div><Button className="w-28" onClick={vt}>完成</Button></div>}</DialogContent></Dialog><Headset open={Q} onOpenChange={Z} /></div>;
}

export default MM
