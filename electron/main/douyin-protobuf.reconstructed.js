/**
 * ============================================================
 *  Douyin ProtoBuf — 抖音直播消息解码器（语义化重建版）
 * ============================================================
 *  从扣单宝主进程逆向还原，重写为带语义命名、可独立运行的模块。
 *  逻辑与原版完全一致（保留全部字段号/解析/过滤语义）。
 *
 *  职责：
 *    解码抖音直播 WebSocket 推送的 protobuf 二进制消息，产出
 *    统一的消息对象供上层 DanmakuDispatcher 扣数匹配使用。
 *    支持 6 类消息：
 *      - WebcastChatMessage    聊天弹幕   → { type:'chat',    uid, nickname, content, commentId, badges }
 *      - WebcastGiftMessage    礼物       → { type:'gift',    …, content:'礼物名 xN', badges }
 *      - WebcastLikeMessage    点赞       → { type:'like',    …, content:'点赞 xN', badges }
 *      - WebcastMemberMessage  进直播间   → { type:'enter',   …, content:'进入直播间', badges }
 *      - WebcastSocialMessage  关注       → { type:'follow',  …, content:'关注了主播', badges }
 *      - WebcastControlMessage 场控       → { type:'control', …, content:'live_ended' }
 *
 *  关键字段号（proto schema 逆向自 tag > 3）：
 *    - 用户消息(nested User)：1=uid(数字), 3=nickname(字符串)
 *    - 消息顶层：1=消息类型序号, 2/3/5/14=用户或内容字段
 *    - 勋章扩展(field 21 数组)：内嵌图片名含 fansclub_level/user_grade_level/webcast_admin_badge
 *
 *  原版上下文：
 *    原函数名压缩为 n2/r/o/i/s/a/c（readVarint/parseMsg/getStr/getBytes/getNum/
 *    parseUserFull/extractBadges），本版语义化 + 中文注释，逐行对齐。
 *
 *  运行方式：纯逻辑、无 Node 依赖：
 *    const { decodeWebcastMessage } = require('./douyin-protobuf.reconstructed');
 *    decodeWebcastMessage('WebcastChatMessage', bytes);  // bytes 为 Uint8Array
 * ============================================================
 */

/** varint 多字节按 7-bit 小端迭代码值。 @private */
function readVarint(bytes, offset) {
  let value = 0;
  let shift = 0;
  let b0;
  do {
    if (offset >= bytes.length) return { v: 0, p: offset }; // 读到末尾保护
    b0 = bytes[offset++];
    value += (bytes2raw(b0) & 0x7f) * Math.pow(2, shift);
    shift += 7;
  } while (bytes2raw(b0) & 0x80);
  return { v: value, p: offset };
}
/** 兼容普通数组/类数组取字节。@private */
function rawByte(x) { return x; }
function bytes2raw(x) { return typeof x === 'number' ? x : x & 0xff; }

/**
 * 解析一段 protobuf 二进制为「字段号 → 值数组」映射。
 * wire type: 0=varint, 1=64bit, 2=length-delimited(bytes), 5=32bit。
 * 对重复字段（如 21 数组）累积为数组。
 * @param {Uint8Array|number[]} bytes
 * @param {number} start 起始偏移
 * @param {number} end 结束偏移
 * @returns {Object<number, Array<number|Uint8Array>>}
 */
function parseMsg(bytes, start, end) {
  const fields = {};
  let cursor = start;
  while (cursor < end) {
    const tag = readVarint(bytes, cursor);
    cursor = tag.p;
    const fieldNumber = tag.v >>> 3;
    const wireType = tag.v & 7;
    if (wireType === 0) {
      // varint 值
      const v0 = readVarint(bytes, cursor);
      cursor = v0.p;
      (fields[fieldNumber] || (fields[fieldNumber] = [])).push(v0.v);
    } else if (wireType === 2) {
      // length-delimited 值（字节/字符串）
      const len = readVarint(bytes, cursor);
      cursor = len.p;
      const chunk = bytes.slice(cursor, cursor + len.v);
      cursor += len.v;
      (fields[fieldNumber] || (fields[fieldNumber] = [])).push(chunk);
    } else if (wireType === 1) {
      cursor += 8; // fixed64
    } else if (wireType === 5) {
      cursor += 4; // fixed32
    } else {
      break; // 未知 wire type 停止
    }
  }
  return fields;
}

/** 取字段首个值并解码为字符串（Uint8Array 用 TextDecoder）。@private */
function getStr(fields, fieldNumber) {
  const arr = fields[fieldNumber];
  if (!arr || !arr.length) return "";
  const first = arr[0];
  return first instanceof Uint8Array ? new TextDecoder().decode(first) : String(first);
}

/** 取字段首个值并保证返回 Uint8Array（若不是则 null）。@private */
function getBytes(fields, fieldNumber) {
  const arr = fields[fieldNumber];
  if (!arr || !arr.length) return null;
  const first = arr[0];
  return first instanceof Uint8Array ? first : null;
}

/** 取字段首个数字值。@private */
function getNum(fields, fieldNumber) {
  const arr = fields[fieldNumber];
  if (!arr || !arr.length) return 0;
  const first = arr[0];
  return typeof first === 'number' ? first : 0;
}

/**
 * 解析消息中的用户体：昵称(3) + uid(1 数字或字符串)。
 * @param {Uint8Array} [userBytes]
 * @returns {{nickname:string, uid:string, fields:Object}}
 */
function parseUserFull(userBytes) {
  if (!userBytes) return { nickname: "", uid: "", fields: {} };
  const fields = parseMsg(userBytes, 0, userBytes.length);
  const numUid = getNum(fields, 1) || getStr(fields, 1);
  return { nickname: getStr(fields, 3), uid: String(numUid), fields };
}

/**
 * 从用户体字段 21 数组提取勋章：粉丝团等级、荣誉等级、管理员标记。
 * @param {Object} userFields
 * @returns {Object} { fanBadge?{level,name}, lightBadge?, honorLevel?, isAdmin? }
 */
function extractBadges(userFields) {
  const result = {};
  const badgeImages = (userFields[21] ?? []).filter((b) => b instanceof Uint8Array);
  for (const badgeBytes of badgeImages) {
    const fields = parseMsg(badgeBytes, 0, badgeBytes.length);
    const imageUrl = getStr(fields, 1);
    if (imageUrl.includes('fansclub_level')) {
      const m = /fansclub_level_v\d+_(\d+)\.png/.exec(imageUrl);
      if (!m) continue;
      const level = parseInt(m[1]);
      const nameBytes = getBytes(fields, 8);
      let name;
      if (nameBytes) {
        try {
          const decoded = new TextDecoder().decode(nameBytes);
          const nameMatch = /([一-鿿]+)粉丝团等级\d+级/.exec(decoded);
          if (nameMatch?.[1]) name = nameMatch[1];
        } catch { /* ignore decode error */ }
      }
      if (name) result.fanBadge = { level, name };
      else result.lightBadge = level;
    } else if (imageUrl.includes('user_grade_level')) {
      const gradeMatch = /grade_level_v\d+_(\d+)\.png/.exec(imageUrl);
      if (gradeMatch) result.honorLevel = parseInt(gradeMatch[1]);
    } else if (imageUrl.includes('webcast_admin_badge')) {
      result.isAdmin = true;
    }
  }
  return result;
}

/**
 * 解码一条直播消息。返回 null 表示无法识别/被过滤。
 * @param {'WebcastChatMessage'|'WebcastGiftMessage'|'WebcastLikeMessage'|'WebcastMemberMessage'|'WebcastSocialMessage'|'WebcastControlMessage'} messageType
 * @param {Uint8Array} payload 消息体字节
 * @returns {object|null}
 */
function decodeWebcastMessage(messageType, payload) {
  const fields = parseMsg(payload, 0, payload.length);
  const seq = getNum(fields, 1) || 0;
  const commentId = seq ? String(seq) : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (messageType === 'WebcastChatMessage') {
    const user = parseUserFull(getBytes(fields, 2));
    const content = getStr(fields, 3);
    if (!user.nickname || !content) return null;
    if (user.nickname.trim() === '主播') return null; // 过滤主播自己的弹幕
    const badges = extractBadges(user.fields);
    return { type: 'chat', uid: user.uid, nickname: user.nickname, content, commentId, badges };
  }

  if (messageType === 'WebcastGiftMessage') {
    const user = parseUserFull(getBytes(fields, 2));
    if (!user.nickname) return null;
    const giftBytes = getBytes(fields, 14);
    let giftName = '礼物';
    if (giftBytes) {
      const giftFields = parseMsg(giftBytes, 0, giftBytes.length);
      const name = getStr(giftFields, 14);
      if (name) giftName = name;
    }
    const count = getNum(fields, 11) || 1;
    const badges = extractBadges(user.fields);
    return { type: 'gift', uid: user.uid, nickname: user.nickname, content: `${giftName} x${count}`, commentId, badges };
  }

  if (messageType === 'WebcastLikeMessage') {
    const user = parseUserFull(getBytes(fields, 5));
    if (!user.nickname) return null;
    const count = getNum(fields, 2) || 1;
    const badges = extractBadges(user.fields);
    return { type: 'like', uid: user.uid, nickname: user.nickname, content: `点赞 x${count}`, commentId, badges };
  }

  if (messageType === 'WebcastMemberMessage') {
    const user = parseUserFull(getBytes(fields, 2));
    if (!user.nickname) return null;
    const badges = extractBadges(user.fields);
    return { type: 'enter', uid: user.uid, nickname: user.nickname, content: '进入直播间', commentId, badges };
  }

  if (messageType === 'WebcastSocialMessage') {
    const user = parseUserFull(getBytes(fields, 2));
    if (!user.nickname) return null;
    const badges = extractBadges(user.fields);
    return { type: 'follow', uid: user.uid, nickname: user.nickname, content: '关注了主播', commentId, badges };
  }

  if (messageType === 'WebcastControlMessage') {
    const status = getNum(fields, 2);
    // 2/3 表示直播结束
    if (status === 3 || status === 2) {
      return { type: 'control', uid: '', nickname: '', content: 'live_ended', commentId };
    }
  }

  return null;
}

module.exports = {
  readVarint,
  parseMsg,
  getStr,
  getBytes,
  getNum,
  parseUserFull,
  extractBadges,
  decodeWebcastMessage,
};
