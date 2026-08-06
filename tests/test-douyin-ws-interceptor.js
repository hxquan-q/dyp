/**
 * DouyinWsInterceptor 重建版行为一致性测试
 * 运行: node tests/test-douyin-ws-interceptor.js
 * 覆盖: 完整帧解码管线(外层嵌套→gzip→内层messages→decodeWebcastMessage→去重→emit)
 *       非目标WS忽略 / 去重过滤
 * 说明: 测试侧自实现 protobuf 编码构造完整 WebSocket 帧，验证 handleFrame。
 */
const path = require('path');
const zlib = require('zlib');
const { DouyinWsInterceptor } = require(
  path.join(__dirname, '..', 'electron', 'main', 'douyin-ws-interceptor.reconstructed.js')
);

let pass = 0, fail = 0;
const t = (ok, msg) => { ok ? pass++ : (fail++, console.log('FAIL:', msg)); };

// ---- protobuf 编码辅助（测试侧）----
function varintBytes(value) {
  const out = [];
  let v = value >>> 0;
  while (v >= 0x80) { out.push((v & 0x7f) | 0x80); v = Math.floor(v / 0x80); }
  out.push(v);
  return out;
}
const tag = (f, w) => varintBytes((f << 3) | w);
const encVar = (f, v) => [...tag(f, 0), ...varintBytes(v >>> 0)];
const encBytes = (f, b) => [...tag(f, 2), ...varintBytes(b.length), ...b];
const encStr = (f, s) => encBytes(f, Array.from(new TextEncoder().encode(s)));
const encUser = (uid, nick) => [...encVar(1, uid), ...encStr(3, nick)];
const U8 = (a) => new Uint8Array(a);

// 构造一条内层消息体：field1=method名, field2=该方法的 protobuf 负载
function makeInnerMessage(method, payloadBytes) {
  return U8([...encStr(1, method), ...encBytes(2, payloadBytes)]);
}
// chat 方法负载：field1=seq, field2=user, field3=content
function chatPayload(seq, uid, nick, content) {
  return U8([...encVar(1, seq), ...encBytes(2, encUser(uid, nick)), ...encStr(3, content)]);
}

(async () => {
  // ---- 1. 完整帧：gzip 外层 + 一条 chat 消息 → emit 'message' ----
  {
    const itc = new DouyinWsInterceptor();
    const received = [];
    itc.on('message', (m) => received.push(m));

    // 内层 messages 数组：field1 = [msg1, msg2]
    const inner = U8([...encBytes(1, makeInnerMessage('WebcastChatMessage', chatPayload(5, 100, '阿明', '满10了'))), ...encBytes(1, makeInnerMessage('WebcastGiftMessage', [...encBytes(2, encUser(100, '阿明')), ...encVar(11, 4)]))]);
    // 外层：field8 = inner；必须用 zlib.gzipSync() 生成真正的 gzip(0x1f 0x8b) 头。
    //（不能用 zlib.deflateSync({format:'gzip'})——Node 该选项被忽略，输出的是
    //  zlib 头 0x78 0x9c，不会命中 hasFrame 的 gzip 头判断，导致不解压。）
    //（真实抖音 webcast 帧内层即为 gzip 压缩）
    const outer = U8([...encStr(7, 'WebcastRequestMessage'), ...encBytes(8, new Uint8Array(zlib.gzipSync(inner)))]);

    itc.handleFrame(outer, 'req-1');
    t(received.length === 2, `应解码出 2 条消息, 实际 ${received.length}`);
    t(received[0]?.type === 'chat' && received[0]?.content === '满10了', `chat 解码: ${JSON.stringify(received[0]?.content)}`);
    t(received[1]?.type === 'gift' && received[1]?.content.endsWith('x4'), `gift 解码: ${JSON.stringify(received[1]?.content)}`);
    t(itc.getMessageCount() === 2, `messageCount = 2, 实际 ${itc.getMessageCount()}`);
  }

  // ---- 2. 去重：同一 commentId 重复帧只 emit 一次 ----
  {
    const itc = new DouyinWsInterceptor();
    let count = 0;
    itc.on('message', () => count++);
    const inner = U8([...encBytes(1, makeInnerMessage('WebcastChatMessage', chatPayload(9, 200, '小李', '再来一个')))]);
    const outer = U8([...encStr(7, 'WebcastRequestMessage'), ...encBytes(8, inner)]); // 未压缩
    itc.handleFrame(outer, 'r1');
    itc.handleFrame(outer, 'r1'); // 同一帧再投递 → commentId 相同 → 去重
    t(count === 1, `重复帧应去重, 实际 emit ${count}`);
    t(itc.getMessageCount() === 1, `去重后 messageCount = 1, 实际 ${itc.getMessageCount()}`);
  }

  // ---- 3. 不同 seq 的消息都 emit ----
  {
    const itc = new DouyinWsInterceptor();
    const ids = [];
    itc.on('message', (m) => ids.push(m.commentId));
    const mk = (seq, content) => makeInnerMessage('WebcastChatMessage', chatPayload(seq, 300, '老王', content));
    const inner = U8([...encBytes(1, mk(1, 'A')), ...encBytes(1, mk(2, 'B')), ...encBytes(1, mk(3, 'C'))]);
    itc.handleFrame(U8([...encStr(7, 'WebcastRequestMessage'), ...encBytes(8, inner)]));
    t(JSON.stringify(ids) === JSON.stringify(['1', '2', '3']), `三条不同消息全部 emit: ${JSON.stringify(ids)}`);
  }

  // ---- 4. 目标WS识别（isTargetWebcastUrl），非目标忽略 ----
  {
    const itc = new DouyinWsInterceptor();
    t(itc.isTargetWebcastUrl('wss://xxx.webcast.douyin.com/webcast/webcastaw/push/?room_id=123'), `webcast+douyin URL 命中`);
    t(!itc.isTargetWebcastUrl('wss://push.example.com/other?room_id=1'), `非 douyin webcast URL 不命中`);
    // 测试 handleCdpEvent 对非目标 WS 不 emit ws-connected（不抛错即可）
    itc.handleCdpEvent('Network.webSocketCreated', { url: 'wss://ignore.example.com', requestId: 'x' }, null);
    t(itc.activeRequestIds.size === 0, `非目标 WS 不入 active 集`);
  }

  // ---- 5. 空帧 / 缺外层 payload 不抛错 ----
  {
    const itc = new DouyinWsInterceptor();
    itc.handleFrame(U8([]), 'r-empty');       // 空帧
    itc.handleFrame(U8([...encStr(7, 'NoPayload')]), 'r-no8'); // 有 field7 无 field8
    t(true, `空帧/缺 payload 不抛错`);
  }

  console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
  process.exit(fail > 0 ? 1 : 0);
})();