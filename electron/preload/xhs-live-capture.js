"use strict";
/**
 * [INPUT]: 依赖浏览器页面内的 WebSocket、DOM、console 桥接能力，注入到小红书直播页面。
 * [OUTPUT]: 对外提供页面侧弹幕捕获脚本，向主进程输出 __XHS_DANMAKU__ 控制台消息。
 * [POS]: preload 层的小红书直播采集注入器，与 xhs consumer 规则保持镜像一致。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
const PAGE_SCRIPT = String.raw `
(() => {
  if (window.__KDB_XHS_PAGE_CAPTURE__) return;
  window.__KDB_XHS_PAGE_CAPTURE__ = true;

  const dedup = Object.create(null);

  function emit(msg) {
    try {
      console.log('__XHS_DANMAKU__' + JSON.stringify(msg));
    } catch {}
  }

  function trimText(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function cleanupDedup(now) {
    const keys = Object.keys(dedup);
    if (keys.length <= 200) return;
    for (let i = 0; i < keys.length; i += 1) {
      if (now - dedup[keys[i]] > 5000) {
        delete dedup[keys[i]];
      }
    }
  }

  function shouldEmit(nickname, content) {
    const key = nickname + '|' + content;
    const now = Date.now();
    if (dedup[key] && now - dedup[key] < 3000) return false;
    dedup[key] = now;
    cleanupDedup(now);
    return true;
  }

  function shouldIgnoreSystemMessage(content) {
    const normalized = trimText(content)
      .replace(/\s+/g, '')
      .replace(/[!！。．…~～]+$/u, '');
    return normalized === '分享了直播'
      || normalized === '分享了直播间'
      || normalized === '分享直播'
      || normalized === '分享直播间';
  }

  function normalizeBridgeMessage(message) {
    if (!message) return null;

    const customData = typeof message.customData === 'string'
      ? (() => { try { return JSON.parse(message.customData); } catch { return null; } })()
      : (message.customData && typeof message.customData === 'object' ? message.customData : null);
    const customDataSnake = typeof message.custom_data === 'string'
      ? (() => { try { return JSON.parse(message.custom_data); } catch { return null; } })()
      : (message.custom_data && typeof message.custom_data === 'object' ? message.custom_data : null);
    const payload = customData || customDataSnake || message;
    const profile = payload.profile || payload.user || message.sender || {};
    const rawType = trimText(payload.type) || trimText(message.command) || trimText(message.type);
    const nickname = trimText(profile.nickname) || trimText(profile.name) || trimText(message.nickname) || trimText(message.sender && (message.sender.nickname || message.sender.name));
    if (!nickname) return null;
    const uid = trimText(profile.userId) || trimText(profile.user_id) || trimText(profile.uid) || trimText(profile.id) || trimText(message.sender && (message.sender.userId || message.sender.user_id || message.sender.uid || message.sender.id)) || nickname;

    let type = 'chat';
    let content = trimText(payload.desc)
      || trimText(typeof payload.content === 'string' ? payload.content : '')
      || trimText(payload.text)
      || trimText(payload.content && payload.content.text)
      || trimText(message.content && message.content.text);

    switch (rawType) {
      case 'text':
      case 'text_message':
        type = 'chat';
        break;
      case 'audience_join_v2':
        type = 'enter';
        content = '进入直播间';
        break;
      case 'follow_emcee':
        type = 'follow';
        content = '关注了主播';
        break;
      case 'share':
        type = 'like';
        content = '分享了直播';
        break;
      case 'praise':
        type = 'like';
        content = '点赞';
        break;
      case 'combo_praise':
        type = 'like';
        content = '连击点赞';
        break;
      case 'light':
        type = 'like';
        content = '点亮了';
        break;
      case 'gift_comment':
        type = 'gift';
        content = trimText(payload.gift_name) || trimText(payload.content && payload.content.gift_name) || trimText(message.content && message.content.gift_name) || '礼物';
        break;
      case 'join_fans_group':
        type = 'follow';
        content = '加入了粉丝团';
        break;
      case 'fans_group_up_level':
        type = 'follow';
        content = '粉丝团升级';
        break;
      case 'batch_cart':
        type = 'gift';
        content = '加入购物车';
        break;
      default:
        if (rawType === 'refresh' || rawType === 'letter_refresh') return null;
    }

    if (!content) return null;
    if (shouldIgnoreSystemMessage(content)) return null;
    if (!shouldEmit(nickname, content)) return null;

    const result = { source: 'ws', type, nickname, uid, content };
    const fansGroup = profile.fans_group || profile.fansGroup;
    if (fansGroup && typeof fansGroup.fans_group_level === 'number') {
      result.badges = {
        fanBadge: {
          level: fansGroup.fans_group_level,
          name: trimText(fansGroup.fans_group_name),
        },
      };
    } else if (profile.role === 1) {
      result.badges = { fanBadge: { level: 0, name: '主播' } };
    } else if (profile.role === 2 || profile.role === 3) {
      result.badges = { fanBadge: { level: 0, name: '管理' } };
    }
    return result;
  }

  function parseXhsWsFrame(rawData) {
    let text = '';
    if (typeof rawData === 'string') {
      text = rawData;
    } else if (rawData instanceof ArrayBuffer) {
      try { text = new TextDecoder().decode(rawData); } catch { return; }
    } else if (rawData instanceof Blob) {
      const reader = new FileReader();
      reader.onload = function () { parseXhsWsFrame(reader.result); };
      reader.readAsText(rawData);
      return;
    } else {
      return;
    }

    if (!text) return;

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return;
    }

    if (typeof json.t === 'number') {
      if (json.t === 2) return;
      if (json.t === 4 && json.b && json.b.d && Array.isArray(json.b.d.b)) {
        json.b.d.b.forEach((item) => {
          try {
            const decoded = atob(item.d);
            const bytes = new Uint8Array(decoded.length);
            for (let i = 0; i < decoded.length; i += 1) bytes[i] = decoded.charCodeAt(i);
            const message = JSON.parse(new TextDecoder().decode(bytes));
            const normalized = normalizeBridgeMessage(message);
            if (normalized) emit(normalized);
          } catch {}
        });
      }
      return;
    }

    if (typeof json.type === 'number') {
      if (json.type === 4 || json.ack !== undefined) return;
      if (json.clientId) return;
      const payload = json.data || json.body || json.payload || json.content;
      const parsed = typeof payload === 'string'
        ? (() => { try { return JSON.parse(payload); } catch { return null; } })()
        : payload;
      const normalized = normalizeBridgeMessage(parsed || json);
      if (normalized) emit(normalized);
    }
  }

  function isXhsWsUrl(url) {
    try {
      const host = new URL(url).hostname;
      return host.includes('xiaohongshu') || host.includes('xhscdn');
    } catch {
      return false;
    }
  }

  const OriginalWebSocket = window.WebSocket;
  function InterceptedWebSocket(url, protocols) {
    const ws = protocols !== undefined ? new OriginalWebSocket(url, protocols) : new OriginalWebSocket(url);
    const urlStr = String(url);
    if (isXhsWsUrl(urlStr)) {
      console.log('[xhs-preload] websocket hooked:', urlStr.slice(0, 120));
      ws.addEventListener('message', (event) => {
        parseXhsWsFrame(event.data);
      });
    }
    return ws;
  }
  InterceptedWebSocket.prototype = OriginalWebSocket.prototype;
  InterceptedWebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
  InterceptedWebSocket.OPEN = OriginalWebSocket.OPEN;
  InterceptedWebSocket.CLOSING = OriginalWebSocket.CLOSING;
  InterceptedWebSocket.CLOSED = OriginalWebSocket.CLOSED;
  window.WebSocket = InterceptedWebSocket;

  function parseDomItem(el) {
    if (!el || el.nodeType !== 1) return null;

    let nickname = '';
    let uid = '';
    const nickEl = el.querySelector('.nickname, [class*="nickname"], [class*="nick-name"]');
    if (nickEl && nickEl.textContent) {
      nickname = nickEl.textContent.trim().replace(/[:：]$/, '');
      uid = nickEl.getAttribute('data-userid') || nickEl.getAttribute('data-user-id') || nickname;
    }

    let content = '';
    const descEl = el.querySelector('.desc, [class*="desc"], [class*="content"], [class*="message"]');
    if (descEl && descEl.textContent) {
      content = descEl.textContent.trim();
    }

    if ((!nickname || !content) && el.getElementsByTagName) {
      const spans = el.getElementsByTagName('span');
      const meaningfulSpans = [];
      for (let i = 0; i < spans.length; i += 1) {
        const spanText = (spans[i].textContent || '').trim();
        if (!spanText) continue;
        if (spans[i].closest && spans[i].closest('.live-tag, [class*="live-tag"]')) continue;
        meaningfulSpans.push(spans[i]);
      }
      if (meaningfulSpans.length >= 2) {
        nickname = nickname || (meaningfulSpans[meaningfulSpans.length - 2].textContent || '').trim().replace(/[:：]$/, '');
        uid = uid || nickname;
        content = content || (meaningfulSpans[meaningfulSpans.length - 1].textContent || '').trim();
      }
    }

    if ((!nickname || !content) && el.querySelectorAll) {
      const plainSpans = [];
      const allSpans = el.querySelectorAll('span');
      for (let i = 0; i < allSpans.length; i += 1) {
        if (allSpans[i].closest && allSpans[i].closest('.live-tag, [class*="live-tag"]')) continue;
        if (allSpans[i].classList && allSpans[i].classList.length === 0) {
          plainSpans.push(allSpans[i]);
        }
      }
      if (plainSpans.length >= 2) {
        nickname = nickname || (plainSpans[0].textContent || '').trim().replace(/[:：]$/, '');
        uid = uid || nickname;
        content = content || (plainSpans[1].textContent || '').trim();
      }
    }

    if (!nickname || !content) {
      const missCount = window.__KDB_XHS_PARSE_MISS_COUNT__ || 0;
      if (missCount < 5) {
        window.__KDB_XHS_PARSE_MISS_COUNT__ = missCount + 1;
        console.log('[xhs-dom] parse miss #' + (missCount + 1) + ': ' + ((el.textContent || '').trim().slice(0, 120)));
      }
      return null;
    }

    if (shouldIgnoreSystemMessage(content)) return null;
    if (!shouldEmit(nickname, content)) return null;

    let badges;
    const tagEl = el.querySelector('.live-tag, [class*="live-tag"]');
    if (tagEl && tagEl.textContent) {
      let tagText = tagEl.textContent.trim();
      if (tagText.endsWith(':') || tagText.endsWith('：')) tagText = tagText.slice(0, -1);
      if (tagText) {
        badges = {
          fanBadge: {
            level: 0,
            name: tagText,
          },
        };
      }
    }

    return { source: 'dom', type: 'chat', nickname, uid: uid || nickname, content, badges };
  }

  function observeContainer(container) {
    if (!container || container.__KDB_XHS_DOM_OBSERVER__) return false;
    container.__KDB_XHS_DOM_OBSERVER__ = true;
    console.log('[xhs-dom] observer attaching');
    const ITEM_SELECTORS = '.comment-list-item, .comment-item, [class*="comment-list-item"], [class*="comment-item"]';
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const addedNodes = mutation.addedNodes || [];
        for (const node of addedNodes) {
          if (!node || node.nodeType !== 1) continue;
          const candidates = [];
          if (node.matches && node.matches(ITEM_SELECTORS)) {
            candidates.push(node);
          } else if (node.closest) {
            const nearestItem = node.closest(ITEM_SELECTORS);
            if (nearestItem && nearestItem !== container) {
              candidates.push(nearestItem);
            }
          } else if (node.querySelectorAll) {
            const subItems = node.querySelectorAll(ITEM_SELECTORS);
            for (let i = 0; i < subItems.length; i += 1) {
              candidates.push(subItems[i]);
            }
          }

          for (let i = 0; i < candidates.length; i += 1) {
            const parsed = parseDomItem(candidates[i]);
            if (parsed) emit(parsed);
          }
        }
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    const existingItems = container.querySelectorAll ? container.querySelectorAll(ITEM_SELECTORS) : [];
    for (let i = 0; i < existingItems.length; i += 1) {
      const parsed = parseDomItem(existingItems[i]);
      if (parsed) emit(parsed);
    }

    console.log('[xhs-dom] observer attached');
    return true;
  }

  function tryAttachDomObserver() {
    const container = document.querySelector('.comments')
      || document.querySelector('.comment-list')
      || document.querySelector('[class*="comment-list"]')
      || document.querySelector('[class*="comments"]');
    return observeContainer(container);
  }

  function waitForDomObserver() {
    if (tryAttachDomObserver()) return;
    let retries = 0;
    const timer = setInterval(() => {
      retries += 1;
      console.log('[xhs-dom] waiting for container #' + retries);
      if (tryAttachDomObserver() || retries >= 60) clearInterval(timer);
    }, 2000);

    const root = document.body || document.documentElement;
    if (root) {
      const observer = new MutationObserver(() => {
        if (tryAttachDomObserver()) {
          observer.disconnect();
          clearInterval(timer);
        }
      });
      observer.observe(root, { childList: true, subtree: true });
    }
  }

  if (location.hostname.includes('ark.xiaohongshu.com')) {
    console.log('[xhs-preload] seller capture armed');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', waitForDomObserver, { once: true });
    } else {
      waitForDomObserver();
    }
  }
})();
`;
if (!window.__KDB_XHS_RUNTIME_PRELOAD__) {
    window.__KDB_XHS_RUNTIME_PRELOAD__ = true;
    const inject = () => {
        try {
            const script = document.createElement('script');
            script.textContent = PAGE_SCRIPT;
            (document.documentElement || document.head || document.body).appendChild(script);
            script.remove();
        }
        catch (error) {
            console.error('[xhs-preload] inject failed:', error);
        }
    };
    if (document.documentElement) {
        inject();
    }
    else {
        window.addEventListener('DOMContentLoaded', inject, { once: true });
    }
}
//# sourceMappingURL=xhs-live-capture.js.map