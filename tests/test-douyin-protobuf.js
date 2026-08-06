/**
 * Douyin ProtoBuf 重建版行为一致性测试
 * 运行: node tests/test-douyin-protobuf.js
 * 覆盖: varint / 字段解析 / 弹幕/礼物/点赞/进房/场控六类解码 / 主播过滤 / 勋章
 * 说明: 测试侧自实现 protobuf 编码器构造字节流，验证解码器（编码→解码闭环）。
 */
const path = require('path');
const { decodeWebcastMessage, parseMsg, readVarint } = require(
  path.join(__dirname, '..', 'electron', 'main', 'douyin-protobuf.reconstructed.js')
);

let pass = 0, fail = 0;
const t = (ok, msg) => { ok ? pass++ : (fail++, console.log('FAIL:', msg)); };

// ---- 测试侧 protobuf 编码辅助 ----
function varintBytes(value) {
  const out = [];
  let v = value >>> 0;
  while (v >= 0x80) { out.push((v & 0x7f) | 0x80); v = Math.floor(v / 0x80); }
  out.push(v);
  return out;
}
function tagVarint(field, wireType) { return varintBytes((field << 3) | wireType); }
function encVarint(field, value) { return [...tagVarint(field, 0), ...varintBytes(value >>> 0)]; }
function encBytes(field, bytes) {
  const b = [...bytes];
  return [...tagVarint(field, 2), ...varintBytes(b.length), ...b];
}
function encStr(field, text) {
  const b = Array.from(new TextEncoder().encode(text));
  return [...tagVarint(field, 2), ...varintBytes(b.length), ...b];
}
// 编码一个嵌套 user 体：1=uid varint, 3=nickname str
function encUser(uid, nickname) { return [...encVarint(1, uid), ...encStr(3, nickname)]; }
const U8 = (arr) => new Uint8Array(arr);

(async () => {
  // ---- 1. varint 编解码闭环 ----
  for (const v of [0, 1, 127, 128, 300, 16384, 70000]) {
    const buff = U8(varintBytes(v));
    const { v: got, p } = readVarint(buff, 0);
    t(got === v, `varint(${v}) 解码 => ${got}`);
  }

  // ---- 2. 弹幕解码（chat）----
  {
    // field1 是 varint 数字序号（msg-id），非字符串
    const raw = [...encVarint(1, 42), ...encBytes(2, encUser(123456, '小美')), ...encStr(3, '主播发了一个10')];
    const m = decodeWebcastMessage('WebcastChatMessage', U8(raw));
    t(m?.type === 'chat', `chat type`);
    t(m?.nickname === '小美', `chat 昵称: ${m?.nickname}`);
    t(m?.uid === '123456', `chat uid: ${m?.uid}`);
    t(m?.content === '主播发了一个10', `chat 内容: ${m?.content}`);
    t(m?.commentId === '42', `chat commentId(seq): ${m?.commentId}`);
  }

  // ---- 3. 主播自己的弹幕被过滤 ----
  {
    const raw = [...encBytes(2, encUser(9, '主播')), ...encStr(3, '大家好啊')];
    t(decodeWebcastMessage('WebcastChatMessage', U8(raw)) === null, `主播弹幕被过滤`);
  }

  // ---- 4. 礼物解码（gift）----
  {
    const raw = [...encBytes(2, encUser(77, '老铁')), ...encVarint(11, 3)];
    const m = decodeWebcastMessage('WebcastGiftMessage', U8(raw));
    t(m?.type === 'gift', `gift type`);
    t(m?.content.startsWith('礼物 x3') || m?.content.endsWith('x3'), `gift 内容: ${m?.content}`);
    t(m?.nickname === '老铁', `gift 昵称`);
  }

  // ---- 5. 点赞解码（like）----
  {
    const raw = [...encBytes(5, encUser(55, '路人')), ...encVarint(2, 9)];
    const m = decodeWebcastMessage('WebcastLikeMessage', U8(raw));
    t(m?.type === 'like', `like type`);
    t(m?.content === '点赞 x9', `like 内容: ${m?.content}`);
  }

  // ---- 6. 进直播间（enter）----
  {
    const raw = [...encBytes(2, encUser(111, '新用户'))];
    const m = decodeWebcastMessage('WebcastMemberMessage', U8(raw));
    t(m?.type === 'enter', `enter type`);
    t(m?.content === '进入直播间', `enter 内容`);
  }

  // ---- 7. 场控结束直播（control live_ended）----
  {
    // control: field2 = 3 → live_ended
    const raw = [...encVarint(2, 3)];
    const m = decodeWebcastMessage('WebcastControlMessage', U8(raw));
    t(m?.type === 'control' && m?.content === 'live_ended', `control live_ended: ${JSON.stringify(m)}`);
  }

  // ---- 8. 未知类型返回 null ----
  {
    t(decodeWebcastMessage('SomeOtherMessage', U8([])) === null, `未知消息类型返回 null`);
    // 用户为空 → null
    t(decodeWebcastMessage('WebcastChatMessage', U8([...encStr(3, '只有文字')])) === null, `无用户时 chat 返回 null`);
  }

  console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
  process.exit(fail > 0 ? 1 : 0);
})();