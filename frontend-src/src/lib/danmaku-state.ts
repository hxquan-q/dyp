/**
 * 弹幕会话状态（对齐官方 Fp hook 的 Cs()/Zb()/Qb()/Jb() 逻辑）
 * ------------------------------------------------------------------
 * 结构来自官方 bundle 的 Cs() 初始状态：
 *   items        弹幕展示列表（合并 display + resolved 事件）
 *   activeBatchNo        当前活跃批次号
 *   activeLuckyBagBatchNo 当前活跃福袋批次号
 *   matchedCount 本批已匹配数（按 commentId 去重）
 *   luckyBagWonCount     福袋中奖数
 *   activeLuckyBagParticipated  福袋已参与数
 */

export interface DanmakuItem {
  commentId: string;
  nickname?: string;
  content?: string;
  matchedContent?: string | null;
  gridNo?: number | null;
  batchNo?: string | null;
  luckyBagBatchNo?: string | null;
  status?: 'matched' | 'processed';
  printStatus?: boolean;
  luckyBagWon?: boolean;
  luckyBagPosition?: number | null;
  index?: number | null;
  [key: string]: any;
}

export interface DanmakuState {
  items: DanmakuItem[];
  activeBatchNo: string | null;
  activeLuckyBagBatchNo: string | null;
  activeLuckyBagParticipated: number;
  matchedCount: number;
  luckyBagWonCount: number;
  activeMatchedCommentIds: Record<string, boolean>;
  activeLuckyBagWonCommentIds: Record<string, boolean>;
  ignoredBatchNos: Record<string, boolean>;
  ignoredLuckyBagBatchNos: Record<string, boolean>;
  maxItems: number;
}

/** 初始弹幕状态（对齐 Cs()） */
export function createDanmakuState(maxItems = 200): DanmakuState {
  return {
    items: [],
    activeBatchNo: null,
    activeLuckyBagBatchNo: null,
    activeLuckyBagParticipated: 0,
    matchedCount: 0,
    luckyBagWonCount: 0,
    activeMatchedCommentIds: {},
    activeLuckyBagWonCommentIds: {},
    ignoredBatchNos: {},
    ignoredLuckyBagBatchNos: {},
    maxItems,
  };
}

/** 规范化一条弹幕项（对齐 Zb 里的字段归并） */
function normalizeDanmakuItem(raw: any): DanmakuItem {
  const commentId =
    typeof (raw?.commentId ?? raw?.comment_id) === 'string'
      ? (raw.commentId ?? raw.comment_id)
      : '';
  const gridNum = Number(raw?.gridNo ?? raw?.grid_no);
  const indexNum = Number(raw?.index ?? raw?.num_index);
  return {
    ...raw,
    commentId,
    matchedContent: raw?.matchedContent ?? raw?.matched_content ?? null,
    gridNo: Number.isFinite(gridNum) ? gridNum : null,
    status: raw?.status === 'matched' ? 'matched' : 'processed',
    printStatus: Boolean(raw?.printStatus ?? raw?.print_status),
    luckyBagWon: Boolean(raw?.luckyBagWon ?? raw?.lucky_bag_won),
    luckyBagPosition: Number.isFinite(Number(raw?.luckyBagPosition ?? raw?.lucky_bag_position))
      ? Number(raw.luckyBagPosition ?? raw.lucky_bag_position)
      : null,
    batchNo:
      typeof (raw?.batchNo ?? raw?.batch_no) === 'string' ? (raw.batchNo ?? raw.batch_no) : null,
    luckyBagBatchNo:
      typeof (raw?.luckyBagBatchNo ?? raw?.lucky_bag_batch_no) === 'string'
        ? (raw.luckyBagBatchNo ?? raw.lucky_bag_batch_no)
        : null,
    index: Number.isFinite(indexNum) ? indexNum : null,
  };
}

/** 合并 display 事件：追加实时弹幕到列表（对齐 Qb()） */
export function mergeDisplayItems(state: DanmakuState, items: DanmakuItem[]): DanmakuState {
  const list = (Array.isArray(items) ? items : [items]).map(normalizeDanmakuItem);
  // 按 commentId 去重合并
  const byId = new Map(state.items.map((it) => [it.commentId, it]));
  for (const item of list) {
    if (item.commentId) byId.set(item.commentId, { ...byId.get(item.commentId), ...item });
  }
  const merged = [...byId.values()].slice(-state.maxItems);
  return { ...state, items: merged };
}

/** 合并 resolved 事件：更新匹配状态 + 宫格号 + 计数（对齐 Zb()） */
export function mergeResolvedItems(state: DanmakuState, resolved: DanmakuItem[]): DanmakuState {
  const list = (Array.isArray(resolved) ? resolved : []).map(normalizeDanmakuItem);
  const ignored = { ...state.ignoredBatchNos };
  const ignoredLucky = { ...state.ignoredLuckyBagBatchNos };

  // 确定活跃批次号
  let activeBatchNo = state.activeBatchNo;
  if (!activeBatchNo) {
    activeBatchNo =
      list.find((it) => typeof it.batchNo === 'string' && it.batchNo && !ignored[it.batchNo!])
        ?.batchNo ?? null;
  }
  let activeLucky = state.activeLuckyBagBatchNo;
  if (!activeLucky) {
    activeLucky =
      list.find((it) => it.luckyBagBatchNo && !ignoredLucky[it.luckyBagBatchNo!])
        ?.luckyBagBatchNo ?? null;
  }

  // 用 resolved 更新现有 items 的匹配字段
  const resolvedById = new Map(list.map((it) => [it.commentId, it]));
  const items = state.items.map((it) => {
    const up = resolvedById.get(it.commentId);
    return up ? { ...it, ...up } : it;
  });

  // 新增 resolved 项
  const existingIds = new Set(items.map((it) => it.commentId).filter(Boolean));
  for (const item of list) {
    if (!existingIds.has(item.commentId)) items.push(item);
  }

  // 匹配计数（按 commentId 去重）
  let matchedCount = state.matchedCount;
  const activeMatched = { ...state.activeMatchedCommentIds };
  const currentIds = new Set(items.map((it) => it.commentId).filter(Boolean));
  for (const item of list) {
    if (!currentIds.has(item.commentId)) continue;
    if (item.batchNo && ignored[item.batchNo]) continue;
    if (activeBatchNo && item.batchNo !== activeBatchNo) continue;
    if (item.status === 'matched') {
      if (!activeMatched[item.commentId]) {
        activeMatched[item.commentId] = true;
        matchedCount += 1;
      }
    } else if (activeMatched[item.commentId]) {
      delete activeMatched[item.commentId];
      matchedCount = Math.max(0, matchedCount - 1);
    }
  }

  return {
    ...state,
    items,
    activeBatchNo,
    activeLuckyBagBatchNo: activeLucky,
    matchedCount,
    activeMatchedCommentIds: activeMatched,
  };
}

/** 重置批次（对齐 Jb()）：当前批次标记忽略，计数清零 */
export function resetBatchState(state: DanmakuState): DanmakuState {
  const ignored = { ...state.ignoredBatchNos };
  if (state.activeBatchNo) ignored[state.activeBatchNo] = true;
  for (const it of state.items) {
    if (it.batchNo) ignored[it.batchNo] = true;
  }
  return {
    ...state,
    activeBatchNo: null,
    matchedCount: 0,
    activeMatchedCommentIds: {},
    ignoredBatchNos: ignored,
  };
}

/** 清空列表（对齐 BR()） */
export function clearDanmakuList(state: DanmakuState): DanmakuState {
  return { ...state, items: [] };
}
