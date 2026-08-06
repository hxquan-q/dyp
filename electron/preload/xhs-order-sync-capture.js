"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PAGE_SCRIPT = String.raw `
(() => {
  if (window.__KDB_XHS_ORDER_PAGE_CAPTURE__) return;
  window.__KDB_XHS_ORDER_PAGE_CAPTURE__ = true;

  const XHS_ORDER_BATCH_PREFIX = '__XHS_ORDER_BATCH__';
  const XHS_ORDER_SYNC_STATE_KEY = '__KDB_XHS_ORDER_SYNC__';

  function summarizeBody(body) {
    if (body == null) return '';
    if (typeof body === 'string') return body.slice(0, 500);
    if (body instanceof URLSearchParams) return body.toString().slice(0, 500);
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      var pairs = [];
      body.forEach(function (value, key) {
        pairs.push(key + '=' + (typeof value === 'string' ? value : '[blob]'));
      });
      return pairs.join('&').slice(0, 500);
    }
    try {
      return JSON.stringify(body).slice(0, 500);
    } catch {
      return String(body).slice(0, 500);
    }
  }

  function extractXhsOrdersFromSyncPayload(payload) {
    if (Array.isArray(payload && payload.data && payload.data.list)) return payload.data.list;
    if (Array.isArray(payload && payload.data && payload.data.packages)) return payload.data.packages;
    if (Array.isArray(payload && payload.data && payload.data.merge_orders)) return payload.data.merge_orders;
    if (Array.isArray(payload && payload.data && payload.data.orders)) return payload.data.orders;
    if (Array.isArray(payload && payload.data && payload.data.result && payload.data.result.list)) return payload.data.result.list;
    if (Array.isArray(payload && payload.data && payload.data.result && payload.data.result.orders)) return payload.data.result.orders;
    if (Array.isArray(payload && payload.data && payload.data.result && payload.data.result.data)) return payload.data.result.data;
    if (Array.isArray(payload && payload.packages)) return payload.packages;
    if (Array.isArray(payload && payload.merge_orders)) return payload.merge_orders;
    if (Array.isArray(payload && payload.orders)) return payload.orders;
    if (Array.isArray(payload && payload.data)) return payload.data;
    if (Array.isArray(payload && payload.list)) return payload.list;
    return [];
  }

  function summarizePayload(payload) {
    var topKeys = payload && typeof payload === 'object' ? Object.keys(payload).slice(0, 12) : [];
    var data = payload && payload.data;
    var result = data && data.result;
    return {
      topKeys: topKeys,
      dataKeys: data && typeof data === 'object' ? Object.keys(data).slice(0, 12) : [],
      resultKeys: result && typeof result === 'object' ? Object.keys(result).slice(0, 12) : [],
      orderCount: extractXhsOrdersFromSyncPayload(payload).length,
      code: payload && Object.prototype.hasOwnProperty.call(payload, 'code') ? payload.code : null,
      success: payload && Object.prototype.hasOwnProperty.call(payload, 'success') ? payload.success : null,
      resultCode: payload && Object.prototype.hasOwnProperty.call(payload, 'result') ? payload.result : null,
    };
  }

  function logCapture(event, detail) {
    console.log('[xhs-order-sync] ' + event + ' ' + JSON.stringify(detail));
  }

  function isXhsApiCall(url) {
    if (!url) return false;
    try {
      var parsed = new URL(url, window.location.href);
      if (!/xiaohongshu\.com$/i.test(parsed.hostname)) return false;
      if (!parsed.pathname.includes('/api/')) return false;
      if (parsed.hostname.startsWith('spider-tracker.')) return false;
      return true;
    } catch {
      return false;
    }
  }

  function isLikelyXhsOrderPayload(payload, url) {
    var orders = extractXhsOrdersFromSyncPayload(payload);
    if (orders.length > 0) return true;

    var lowerUrl = String(url || '').toLowerCase();
    var data = payload && payload.data;
    if (!data || typeof data !== 'object') return false;

    if (Array.isArray(data.list) || Array.isArray(data.packages) || Array.isArray(data.merge_orders) || Array.isArray(data.orders)) {
      return true;
    }

    var result = data.result;
    if (result && typeof result === 'object') {
      if (Array.isArray(result.list) || Array.isArray(result.orders) || Array.isArray(result.data)) {
        return true;
      }
      if (lowerUrl.includes('/order/') || lowerUrl.includes('/package/') || lowerUrl.includes('/merge/')) {
        return Object.prototype.hasOwnProperty.call(result, 'total')
          || Object.prototype.hasOwnProperty.call(result, 'total_count')
          || Object.prototype.hasOwnProperty.call(result, 'totalCount');
      }
    }

    if (lowerUrl.includes('/order/') || lowerUrl.includes('/package/') || lowerUrl.includes('/merge/')) {
      return Object.prototype.hasOwnProperty.call(data, 'total')
        || Object.prototype.hasOwnProperty.call(data, 'total_count')
        || Object.prototype.hasOwnProperty.call(data, 'totalCount');
    }

    return false;
  }

  function getSharedState(targetWindow) {
    var owner = targetWindow;
    try {
      if (targetWindow.top && targetWindow.top.location && /xiaohongshu\.com$/i.test(targetWindow.top.location.hostname)) {
        owner = targetWindow.top;
      }
    } catch {}
    var state = owner[XHS_ORDER_SYNC_STATE_KEY] || {
      hooked: false,
      lastOrders: [],
      lastUrl: '',
      seenCount: 0,
    };
    owner[XHS_ORDER_SYNC_STATE_KEY] = state;
    try {
      targetWindow[XHS_ORDER_SYNC_STATE_KEY] = state;
    } catch {}
    return state;
  }

  function emitOrderBatch(state, url, payload) {
    state.seenCount += 1;
    var summary = summarizePayload(payload);
    var matched = isLikelyXhsOrderPayload(payload, url);
    logCapture(matched ? 'response:match' : 'response:miss', Object.assign({
      url: url,
      seenCount: state.seenCount,
    }, summary));
    if (!matched) return;
    var orders = extractXhsOrdersFromSyncPayload(payload);
    state.lastOrders = orders;
    state.lastUrl = url;
    console.log(XHS_ORDER_BATCH_PREFIX + JSON.stringify({ count: orders.length, url: url }));
  }

  function installHooks(targetWindow, label) {
    if (!targetWindow) return false;
    try {
      if (!targetWindow.location || !/xiaohongshu\.com$/i.test(targetWindow.location.hostname)) return false;
    } catch {
      return false;
    }
    if (targetWindow.__KDB_XHS_ORDER_CAPTURE_HOOKED__) return true;

    var state = getSharedState(targetWindow);
    targetWindow.__KDB_XHS_ORDER_CAPTURE_HOOKED__ = true;
    state.hooked = true;

    if (targetWindow.fetch && typeof targetWindow.fetch === 'function') {
      var originalFetch = targetWindow.fetch.bind(targetWindow);
      targetWindow.fetch = async function patchedFetch() {
        var input = arguments[0];
        var init = arguments[1];
        var url = typeof input === 'string'
          ? input
          : (input && typeof input === 'object' && input.url ? input.url : String(input || ''));
        if (isXhsApiCall(url)) {
          logCapture('fetch:request', {
            label: label,
            url: url,
            method: String((init && init.method) || (input && input.method) || 'GET'),
            body: summarizeBody(init && init.body),
          });
        }
        var response = await originalFetch.apply(this, arguments);
        if (isXhsApiCall(url)) {
          var contentType = response.headers.get('content-type') || '';
          logCapture('fetch:response', {
            label: label,
            url: url,
            status: response.status,
            contentType: contentType,
          });
          if (contentType.includes('json')) {
            response.clone().json().then(function (payload) {
              emitOrderBatch(state, url, payload);
            }).catch(function (error) {
              logCapture('fetch:parse-error', {
                label: label,
                url: url,
                message: error && error.message ? error.message : String(error),
              });
            });
          }
        }
        return response;
      };
    }

    if (targetWindow.XMLHttpRequest && targetWindow.XMLHttpRequest.prototype) {
      var originalOpen = targetWindow.XMLHttpRequest.prototype.open;
      var originalSend = targetWindow.XMLHttpRequest.prototype.send;

      targetWindow.XMLHttpRequest.prototype.open = function patchedOpen(method, url) {
        this.__kdbXhsUrl = typeof url === 'string' ? url : String(url);
        this.__kdbXhsMethod = method;
        return originalOpen.apply(this, arguments);
      };

      targetWindow.XMLHttpRequest.prototype.send = function patchedSend(body) {
        var xhr = this;
        var url = xhr.__kdbXhsUrl || '';
        if (isXhsApiCall(url)) {
          logCapture('xhr:request', {
            label: label,
            url: url,
            method: xhr.__kdbXhsMethod || 'GET',
            body: summarizeBody(body),
          });
          xhr.addEventListener('load', function () {
            try {
              var contentType = xhr.getResponseHeader('content-type') || '';
              logCapture('xhr:response', {
                label: label,
                url: url,
                status: xhr.status,
                contentType: contentType,
                responseType: xhr.responseType || 'text',
              });
              if (!contentType.includes('json') && xhr.responseType !== 'json') return;
              var payload = xhr.responseType === 'json' && xhr.response && typeof xhr.response === 'object'
                ? xhr.response
                : JSON.parse(xhr.responseText);
              emitOrderBatch(state, url, payload);
            } catch (error) {
              logCapture('xhr:parse-error', {
                label: label,
                url: url,
                message: error && error.message ? error.message : String(error),
              });
            }
          });
          xhr.addEventListener('error', function () {
            logCapture('xhr:error', {
              label: label,
              url: url,
              status: xhr.status,
            });
          });
        }
        return originalSend.apply(this, arguments);
      };
    }

    logCapture('capture armed', {
      label: label,
      href: String(targetWindow.location && targetWindow.location.href || ''),
      readyState: String(targetWindow.document && targetWindow.document.readyState || ''),
    });
    return true;
  }

  function tryHookIframe(frame, index) {
    try {
      var frameWindow = frame && frame.contentWindow;
      if (!frameWindow) return false;
      return installHooks(frameWindow, 'iframe[' + index + ']');
    } catch {
      return false;
    }
  }

  function hookAccessibleIframes() {
    var frames = document.querySelectorAll ? document.querySelectorAll('iframe') : [];
    for (var i = 0; i < frames.length; i += 1) {
      tryHookIframe(frames[i], i);
    }
  }

  installHooks(window, 'top');
  hookAccessibleIframes();

  var observerTarget = document.documentElement || document.body;
  if (observerTarget && typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(function () {
      hookAccessibleIframes();
    });
    observer.observe(observerTarget, { childList: true, subtree: true });
  }

  var retries = 0;
  var timer = setInterval(function () {
    retries += 1;
    hookAccessibleIframes();
    if (retries >= 60) clearInterval(timer);
  }, 1000);
})();
`;
if (!window.__KDB_XHS_ORDER_RUNTIME_PRELOAD__) {
    window.__KDB_XHS_ORDER_RUNTIME_PRELOAD__ = true;
    const inject = () => {
        try {
            const script = document.createElement('script');
            script.textContent = PAGE_SCRIPT;
            ;
            (document.documentElement || document.head || document.body).appendChild(script);
            script.remove();
        }
        catch (error) {
            console.error('[xhs-order-sync] inject failed:', error);
        }
    };
    if (document.documentElement) {
        inject();
    }
    else {
        window.addEventListener('DOMContentLoaded', inject, { once: true });
    }
}
//# sourceMappingURL=xhs-order-sync-capture.js.map