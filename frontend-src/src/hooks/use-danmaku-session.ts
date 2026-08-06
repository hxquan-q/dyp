import * as React from 'react';
import {
  createDanmakuState,
  mergeDisplayItems,
  mergeResolvedItems,
  resetBatchState,
  clearDanmakuList as clearStateList,
  type DanmakuState,
  type DanmakuItem,
} from '@/lib/danmaku-state';

/**
 * 弹幕会话 hook（对齐官方 Fp hook 的会话部分）
 * ------------------------------------------------------------------
 * 封装 Electron 主进程的弹幕会话控制与事件订阅：
 *   - startSession / stopSession / resetBatch
 *   - 订阅 onDanmakuDisplay（实时弹幕）/ onDanmakuResolved（匹配+宫格计数）
 *   - 维护 DanmakuState（items/matchedCount/gridNo）
 *
 * 浏览器（无 electronAPI）环境：返回空实现 + 提示。
 */
export function useDanmakuSession() {
  const [isElectron] = React.useState(
    () => typeof window !== 'undefined' && Boolean((window as any).electronAPI),
  );
  const [sessionActive, setSessionActive] = React.useState(false);
  const [starting, setStarting] = React.useState(false);
  const [liveStatus, setLiveStatus] = React.useState<any>(null);
  const [state, setState] = React.useState<DanmakuState>(() => createDanmakuState());
  const [printItems, setPrintItems] = React.useState<DanmakuItem[] | null>(null);

  const electronAPI = isElectron ? (window as any).electronAPI : null;

  /** 订阅主进程弹幕事件 */
  React.useEffect(() => {
    if (!electronAPI) return;

    const unsubs: Array<() => void> = [];

    // 注册事件监听：onXxx(cb) 返回取消函数，保存到 unsubs
    const subscribe = (register: ((cb: any) => (() => void) | void) | undefined, cb: any) => {
      if (typeof register !== 'function') return;
      const unsub = register(cb);
      if (typeof unsub === 'function') unsubs.push(unsub);
    };

    subscribe(electronAPI.onDanmakuDisplay, (items: any[]) => {
      setState((prev) => mergeDisplayItems(prev, items));
    });
    subscribe(electronAPI.onDanmakuResolved, (items: any[]) => {
      setState((prev) => mergeResolvedItems(prev, items));
    });
    subscribe(electronAPI.onLiveStatus, (status: any) => {
      setLiveStatus(status);
      if (status && 'active' in status) setSessionActive(Boolean(status.active));
    });
    subscribe(electronAPI.onLuckyBagBatchReset, (payload: any) => {
      // 福袋批次重置：清空福袋相关计数
      setState((prev) => ({
        ...prev,
        activeLuckyBagBatchNo: payload?.batchNo ?? null,
        luckyBagWonCount: 0,
        activeLuckyBagParticipated: 0,
        activeLuckyBagWonCommentIds: {},
      }));
    });
    subscribe(electronAPI.onPrintResults, (items: any[]) => {
      setPrintItems(items);
    });

    return () => unsubs.forEach((u) => u());
  }, [electronAPI]);

  /** 开始弹幕会话（对齐 Fp startSession，传完整参数） */
  const startSession = React.useCallback(
    async (params: {
      shopId: number | string;
      shopName?: string;
      apiToken?: string;
      platformCode?: string;
      storeShopId?: number | string | null;
      storeShopRawData?: any;
      orderAlertEnabled?: boolean;
    }) => {
      if (!electronAPI) return { success: false, error: '非 Electron 环境' };
      setStarting(true);
      try {
        const result = await electronAPI.startDanmakuSession({
          shopId: params.shopId,
          shopName: params.shopName ?? '',
          apiToken: params.apiToken ?? '',
          platformCode: params.platformCode ?? 'unknown',
          storeShopId: params.storeShopId ?? null,
          storeShopRawData: params.storeShopRawData ?? null,
          orderAlertEnabled: params.orderAlertEnabled ?? false,
          deviceId: undefined,
          deviceName: undefined,
          appVersion: undefined,
          clientPlatform: undefined,
        });
        if (result?.success) {
          setSessionActive(true);
          setState(createDanmakuState());
          if (result.recovered) {
            // 检测到未结束的直播，恢复开播
            console.info('[danmaku-session] 直播状态已恢复');
          }
        }
        return result;
      } catch (err: any) {
        return { success: false, error: err?.message || '弹幕会话启动失败' };
      } finally {
        setStarting(false);
      }
    },
    [electronAPI],
  );

  /** 停止弹幕会话 */
  const stopSession = React.useCallback(
    async (params: { platformCode?: string; shopId?: number | string }) => {
      if (!electronAPI) return null;
      const result = await electronAPI.stopDanmakuSession({
        platformCode: params.platformCode ?? 'unknown',
        shopId: params.shopId,
      });
      if (result?.success) setSessionActive(false);
      return result;
    },
    [electronAPI],
  );

  /** 下一轮（重置本批） */
  const resetBatch = React.useCallback(
    async (params: { platformCode?: string; shopId?: number | string }) => {
      setState((prev) => resetBatchState(prev));
      if (electronAPI?.resetDanmakuBatch) {
        return await electronAPI.resetDanmakuBatch({
          platformCode: params.platformCode ?? 'unknown',
          shopId: params.shopId,
        });
      }
      return null;
    },
    [electronAPI],
  );

  /** 清空弹幕列表 */
  const clearDanmakuList = React.useCallback(() => {
    setState((prev) => clearStateList(prev));
  }, []);

  return {
    isElectron,
    sessionActive,
    starting,
    liveStatus,
    danmakuState: state,
    printItems,
    startSession,
    stopSession,
    resetBatch,
    clearDanmakuList,
  };
}
