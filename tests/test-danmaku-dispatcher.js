/**
 * DanmakuDispatcher 重建版行为一致性测试
 * 运行: node tests/test-danmaku-dispatcher.js
 * 覆盖: 11 种规则匹配 / 去重 / 宫格去重 / 限购 / 自动入格 / 延迟 / 黑名单 / 类型过滤
 */
const path = require('path');
const { DanmakuDispatcher } = require(path.join(__dirname, '..', 'electron', 'main', 'danmaku-dispatcher.reconstructed.js'));

let pass = 0, fail = 0;
const t = (ok, msg) => { ok ? pass++ : (fail++, console.log('FAIL:', msg)); };

function makeDispatcher(rules) {
  const d = new DanmakuDispatcher(
    { shopId: '1002', apiToken: 't', device: { deviceId: 'd1' } },
    { baseUrl: 'http://x', batchInterval: 3000, buildDeviceHeaders: () => ({}) }
  );
  d.deductionRules = rules;
  d.running = true; // 模拟 start()（不启动真实定时器）
  return d;
}
const dm = (commentId, nickname, content, extra = {}) => ({
  commentId, nickname, content, type: 'chat', timestamp: '2026-08-01 12:00:00', badges: {}, ...extra,
});

// ---- 规则匹配（matchSingleRule）----
const d = makeDispatcher([]);
function testRule(rule, content, expected) {
  const result = d.matchSingleRule(rule, content);
  const ok = expected === null ? result === null : (result !== null && result.value === expected);
  if (!ok) console.log(`FAIL: ${rule.rule_type} "${content}" => ${JSON.stringify(result)} (期望 ${expected})`);
  return ok;
}
t(testRule({ id:1, rule_type:'anyNumber' }, 'abc12', 'abc12'));
t(testRule({ id:1, rule_type:'anyNumber' }, '你好', null));
t(testRule({ id:1, rule_type:'anyNumber' }, '1.9', '1.9'));
t(testRule({ id:1, rule_type:'onlyPureNumber' }, '12', '12'));
t(testRule({ id:1, rule_type:'onlyPureNumber' }, '1.9', null));
t(testRule({ id:1, rule_type:'only12' }, '1', '1'));
t(testRule({ id:1, rule_type:'only12' }, '3', null));
t(testRule({ id:1, rule_type:'exclude12' }, '5', '5'));
t(testRule({ id:1, rule_type:'exclude12' }, '1', null));
t(testRule({ id:1, rule_type:'letter3Digit1' }, 'ABC1', 'ABC1'));
t(testRule({ id:1, rule_type:'letter3Digit1' }, 'ABCD1', null));
t(testRule({ id:1, rule_type:'onlyKeyword', keywords:['上'] }, '上', '上'));
t(testRule({ id:1, rule_type:'numberIncludeKeyword', keywords:['','','号'] }, '6号', '6号'));
t(testRule({ id:1, rule_type:'numberIncludeKeyword', keywords:['','','号'] }, '号', null));
t(testRule({ id:1, rule_type:'numberWithSize', dt: /^\d+(码|号)$/i }, '42码', '42码'));
t(testRule({ id:1, rule_type:'grid', gridCount:12, gridFormats:['pureNumber'] }, '6', '6'));
t(testRule({ id:1, rule_type:'grid', gridCount:12, gridFormats:['pureNumber'] }, '13', null));
t(testRule({ id:1, rule_type:'grid', gridCount:12, gridFormats:['pureNumber'] }, '1.9', null));
t(testRule({ id:1, rule_type:'grid', gridCount:12, gridFormats:['numberWithKeyword'], gridKeywords:'号' }, '6号', '6'));
t(testRule({ id:1, rule_type:'customCombined', customFormats:['includeNumber'] }, '6号', '6'));
t(testRule({ id:1, rule_type:'customCombined', customFormats:['includeNumber'] }, 'abc', null));
t(testRule({ id:1, rule_type:'customCombined', customFormats:['includeNumber'], numberIncludeDecimal:true }, '1.9', '1.9'));
t(testRule({ id:1, rule_type:'customCombined', customFormats:['includeNumber'], numberIncludeDecimal:false }, '1.9', null));

// ---- 状态机 ----
// 去重
{
  const d = makeDispatcher([{ id:1, rule_type:'anyNumber', anti_duplicate_enabled:true, anti_duplicate_seconds:5 }]);
  d.handleDanmaku(dm('c1','小明','6'));
  d.handleDanmaku(dm('c2','小明','6'));
  t(d.matchedBuffer.length === 1, `去重 matched: 期望 1, 实际 ${d.matchedBuffer.length}`);
  t(d.processBuffer.length === 2, `去重 process: 期望 2, 实际 ${d.processBuffer.length}`);
}
// 宫格去重 buyerEachGridOnce
{
  const d = makeDispatcher([{ id:1, rule_type:'grid', gridCount:12, gridFormats:['pureNumber'], gridDedupMode:'buyerEachGridOnce' }]);
  d.handleDanmaku(dm('c1','小红','6'));
  d.handleDanmaku(dm('c2','小红','6'));
  d.handleDanmaku(dm('c3','小红','7'));
  t(d.matchedBuffer.length === 2, `buyerEachGridOnce: 期望 2, 实际 ${d.matchedBuffer.length}`);
}
// 宫格去重 buyerAllGridOnce
{
  const d = makeDispatcher([{ id:1, rule_type:'grid', gridCount:12, gridFormats:['pureNumber'], gridDedupMode:'buyerAllGridOnce' }]);
  d.handleDanmaku(dm('c1','小红','6'));
  d.handleDanmaku(dm('c2','小红','7'));
  t(d.matchedBuffer.length === 1, `buyerAllGridOnce: 期望 1, 实际 ${d.matchedBuffer.length}`);
}
// 限购
{
  const d = makeDispatcher([{ id:1, rule_type:'anyNumber', limit_order_enabled:true, limit_order_count:2 }]);
  d.handleDanmaku(dm('c1','A','1'));
  d.handleDanmaku(dm('c2','B','2'));
  d.handleDanmaku(dm('c3','C','3'));
  t(d.matchedBuffer.length === 2, `限购: 期望 2, 实际 ${d.matchedBuffer.length}`);
}
// 宫格限购
{
  const d = makeDispatcher([{ id:1, rule_type:'grid', gridCount:12, gridFormats:['pureNumber'], limit_order_enabled:true, limit_order_count:1 }]);
  d.handleDanmaku(dm('c1','A','6'));
  d.handleDanmaku(dm('c2','B','6'));
  d.handleDanmaku(dm('c3','C','7'));
  t(d.matchedBuffer.length === 2, `宫格限购: 期望 2, 实际 ${d.matchedBuffer.length}`);
}
// 自动入格
{
  const d = makeDispatcher([{ id:1, rule_type:'grid', gridCount:12, gridFormats:['numberWithKeyword'], gridKeywords:'号', gridAutoAssign:true }]);
  d.handleDanmaku(dm('c1','A','3号'));
  d.handleDanmaku(dm('c2','B','9号'));
  const grids = d.matchedBuffer.map(m => m.preMatch.gridNo);
  t(JSON.stringify(grids) === JSON.stringify([1,2]), `自动入格: 期望 [1,2], 实际 ${JSON.stringify(grids)}`);
}
// 延迟(亮牌优先)
{
  const d = makeDispatcher([{ id:1, rule_type:'anyNumber', light_brand_first:true, light_brand_delay:2 }]);
  d.handleDanmaku(dm('c1','路人','6', { badges:{} }));
  d.handleDanmaku(dm('c2','亮牌','7', { badges:{lightBadge:1} }));
  t(d.delayedMatchedBuffer.length === 1, `延迟: 期望 1 delayed, 实际 ${d.delayedMatchedBuffer.length}`);
  t(d.matchedBuffer.length === 1, `延迟: 期望 1 matched, 实际 ${d.matchedBuffer.length}`);
  d.delayedMatchedBuffer[0].releaseAt = 0;
  d.releaseDelayedMatches();
  t(d.matchedBuffer.length === 2, `释放延迟: 期望 2, 实际 ${d.matchedBuffer.length}`);
}
// 黑名单
{
  const d = makeDispatcher([{ id:1, rule_type:'anyNumber' }]);
  d.blacklist = ['拉黑用户'];
  d.handleDanmaku(dm('c1','拉黑用户','6'));
  t(d.displayBuffer.length === 1 && d.displayBuffer[0].black === true, `黑名单: 期望 black=true`);
}
// 非 chat / hiddenTypes
{
  const d = makeDispatcher([{ id:1, rule_type:'anyNumber' }]);
  d.handleDanmaku(dm('c1','A','6', { type:'gift' }));
  t(d.matchedBuffer.length === 0, `非chat matched: 期望 0, 实际 ${d.matchedBuffer.length}`);
}
{
  const d = makeDispatcher([{ id:1, rule_type:'anyNumber' }]);
  d.displayFilter = { hiddenTypes:['gift'] };
  d.handleDanmaku(dm('c1','A','6', { type:'gift' }));
  t(d.displayBuffer.length === 0, `hiddenTypes: 期望 0 display, 实际 ${d.displayBuffer.length}`);
}

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail > 0 ? 1 : 0);
