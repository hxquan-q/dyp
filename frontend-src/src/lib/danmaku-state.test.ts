/**
 * danmaku-state 弹幕会话状态机测试
 * ==================================================================
 * 覆盖：初始状态 / display 合并去重截断 / resolved 更新+计数 /
 *       批次重置 / 清空列表
 */
import { describe, expect, it } from 'vitest'
import {
  createDanmakuState,
  mergeDisplayItems,
  mergeResolvedItems,
  resetBatchState,
  clearDanmakuList,
} from './danmaku-state'

describe('createDanmakuState', () => {
  it('返回对齐官方的初始状态', () => {
    const s = createDanmakuState()
    expect(s.items).toEqual([])
    expect(s.activeBatchNo).toBeNull()
    expect(s.activeLuckyBagBatchNo).toBeNull()
    expect(s.activeLuckyBagParticipated).toBe(0)
    expect(s.matchedCount).toBe(0)
    expect(s.luckyBagWonCount).toBe(0)
    expect(s.maxItems).toBe(200)
  })

  it('支持自定义 maxItems', () => {
    expect(createDanmakuState(50).maxItems).toBe(50)
  })
})

describe('mergeDisplayItems', () => {
  it('追加实时弹幕并规范化 snake_case 字段', () => {
    const s = mergeDisplayItems(createDanmakuState(), [
      { commentId: 'c1', nickname: '小明', content: '1', matched_content: '1', grid_no: 1, num_index: 3 },
    ])
    expect(s.items).toHaveLength(1)
    expect(s.items[0].commentId).toBe('c1')
    expect(s.items[0].matchedContent).toBe('1')
    expect(s.items[0].gridNo).toBe(1)
    expect(s.items[0].index).toBe(3)
    expect(s.items[0].status).toBe('processed')
  })

  it('同 commentId 去重合并（后到覆盖先到）', () => {
    let s = createDanmakuState()
    s = mergeDisplayItems(s, [{ commentId: 'c1', content: '旧' }])
    s = mergeDisplayItems(s, [{ commentId: 'c1', content: '新' }])
    expect(s.items).toHaveLength(1)
    expect(s.items[0].content).toBe('新')
  })

  it('超过 maxItems 截断保留最新', () => {
    let s = createDanmakuState(3)
    for (let i = 1; i <= 5; i++) s = mergeDisplayItems(s, [{ commentId: `c${i}` }])
    expect(s.items).toHaveLength(3)
    expect(s.items.map((it) => it.commentId)).toEqual(['c3', 'c4', 'c5'])
  })

  it('兼容单条非数组输入', () => {
    const s = mergeDisplayItems(createDanmakuState(), { commentId: 'single' } as any)
    expect(s.items).toHaveLength(1)
  })
})

describe('mergeResolvedItems', () => {
  it('用 resolved 更新既有条目的匹配字段', () => {
    let s = mergeDisplayItems(createDanmakuState(), [{ commentId: 'c1', content: '1' }])
    s = mergeResolvedItems(s, [{ commentId: 'c1', status: 'matched', gridNo: 5, batchNo: 'B1' }])
    expect(s.items[0].status).toBe('matched')
    expect(s.items[0].gridNo).toBe(5)
  })

  it('新增 resolved 中不存在的条目', () => {
    let s = createDanmakuState()
    s = mergeResolvedItems(s, [{ commentId: 'c9', status: 'matched', batchNo: 'B1' }])
    expect(s.items.some((it) => it.commentId === 'c9')).toBe(true)
  })

  it('matchedCount 按 commentId 去重累加，未匹配回退递减', () => {
    let s = createDanmakuState()
    s = mergeResolvedItems(s, [{ commentId: 'a', status: 'matched', batchNo: 'B1' }])
    s = mergeResolvedItems(s, [{ commentId: 'a', status: 'matched', batchNo: 'B1' }]) // 重复不累加
    expect(s.matchedCount).toBe(1)
    s = mergeResolvedItems(s, [{ commentId: 'b', status: 'matched', batchNo: 'B1' }])
    expect(s.matchedCount).toBe(2)
    s = mergeResolvedItems(s, [{ commentId: 'b', status: 'processed', batchNo: 'B1' }])
    expect(s.matchedCount).toBe(1)
  })

  it('自动确定活跃批次号', () => {
    let s = createDanmakuState()
    s = mergeResolvedItems(s, [{ commentId: 'x', status: 'matched', batchNo: 'B7' }])
    expect(s.activeBatchNo).toBe('B7')
  })

  it('忽略已重置批次（不参与计数）', () => {
    let s = createDanmakuState()
    s = mergeResolvedItems(s, [{ commentId: 'a', status: 'matched', batchNo: 'B1' }])
    s = resetBatchState(s)
    expect(s.activeBatchNo).toBeNull()
    s = mergeResolvedItems(s, [{ commentId: 'b', status: 'matched', batchNo: 'B1' }])
    expect(s.activeBatchNo).not.toBe('B1') // B1 已忽略
    expect(s.matchedCount).toBe(0)
  })
})

describe('resetBatchState / clearDanmakuList', () => {
  it('resetBatchState 忽略当前批次并清零计数', () => {
    let s = createDanmakuState()
    s = mergeResolvedItems(s, [
      { commentId: 'a', status: 'matched', batchNo: 'B1' },
      { commentId: 'b', status: 'matched', batchNo: 'B1' },
    ])
    expect(s.matchedCount).toBe(2)
    s = resetBatchState(s)
    expect(s.matchedCount).toBe(0)
    expect(s.activeBatchNo).toBeNull()
    expect(s.ignoredBatchNos['B1']).toBe(true)
  })

  it('clearDanmakuList 清空 items', () => {
    let s = mergeDisplayItems(createDanmakuState(), [{ commentId: 'c1' }])
    s = clearDanmakuList(s)
    expect(s.items).toEqual([])
  })
})
