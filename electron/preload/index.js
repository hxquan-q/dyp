"use strict";
/**
 * [INPUT]: depends on ipcRenderer channels registered by the Electron main process.
 * [OUTPUT]: exposes the renderer-facing electronAPI bridge for session lifecycle, batch reset, status events, and resolved danmaku updates.
 * [POS]: preload bridge boundary between the Electron main process and the Inertia renderer.
 * [PROTOCOL]: change this header when the file's responsibilities or I/O shape changes, then check CLAUDE.md.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const onIpc = (channel, cb) => {
    const handler = (_event, data) => cb(data);
    electron_1.ipcRenderer.on(channel, handler);
    return () => electron_1.ipcRenderer.removeListener(channel, handler);
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // 平台操作
    openPlatformLogin: (platform, shopId, loginUrl) => electron_1.ipcRenderer.invoke('platform:login', platform, shopId, loginUrl),
    disconnectPlatform: (params) => electron_1.ipcRenderer.invoke('platform:disconnect', typeof params === 'string' ? undefined : params),
    // 弹幕会话
    startDanmakuSession: (cfg) => electron_1.ipcRenderer.invoke('danmaku:startSession', cfg),
    stopDanmakuSession: (params) => electron_1.ipcRenderer.invoke('danmaku:stopSession', params),
    resetDanmakuBatch: (params) => electron_1.ipcRenderer.invoke('danmaku:resetBatch', params),
    resetLuckyBagBatch: (params) => electron_1.ipcRenderer.invoke('danmaku:resetLuckyBagBatch', params),
    setDanmakuSessionPaused: (params) => electron_1.ipcRenderer.invoke('danmaku:setPaused', params),
    reloadDanmakuConfig: () => electron_1.ipcRenderer.invoke('danmaku:reloadConfig'),
    // 状态监听
    onConnectionStatus: (cb) => {
        return onIpc('connection:status', cb);
    },
    onDanmakuStats: (cb) => {
        return onIpc('danmaku:stats', cb);
    },
    onLiveRoomInfo: (cb) => {
        return onIpc('live:room-info', cb);
    },
    onLiveStatus: (cb) => {
        return onIpc('live:status', cb);
    },
    onSupportWindowClosed: (cb) => {
        return onIpc('support-window:closed', cb);
    },
    // Channel 1: 弹幕展示
    onDanmakuDisplay: (cb) => {
        return onIpc('danmaku:display', cb);
    },
    onDanmakuResolved: (cb) => {
        return onIpc('danmaku:resolved', cb);
    },
    onLuckyBagBatchReset: (cb) => {
        return onIpc('danmaku:lucky-bag-batch-reset', cb);
    },
    // Channel 2: 打印结果
    onPrintResults: (cb) => {
        return onIpc('print:results', cb);
    },
    // 直播期间订单自动同步通知
    onLiveOrdersSynced: (cb) => {
        return onIpc('orders:live-synced', cb);
    },
    onLiveOrderSyncStatus: (cb) => {
        return onIpc('orders:live-sync-status', cb);
    },
    // 订单同步
    orders: {
        sync: (params) => electron_1.ipcRenderer.invoke('orders:sync', params),
        onSyncProgress: (cb) => {
            return onIpc('orders:sync-progress', cb);
        },
        onLiveSyncStatus: (cb) => {
            return onIpc('orders:live-sync-status', cb);
        },
        retryDecryptAndRemark: (params) => electron_1.ipcRenderer.invoke('orders:retry-decrypt-and-remark', params),
        batchRemark: (params) => electron_1.ipcRenderer.invoke('orders:batch-remark', params),
        resolveIdentity: (params) => electron_1.ipcRenderer.invoke('orders:resolve-identity', params),
        // 兼容旧远程页面；最低支持桌面版本统一使用 resolveIdentity 后删除，禁止新增调用。
        getNickname: (params) => electron_1.ipcRenderer.invoke('orders:get-nickname', params),
        // 兼容旧远程页面；最低支持桌面版本统一使用 resolveIdentity 后删除，禁止新增调用。
        decryptNickname: (params) => electron_1.ipcRenderer.invoke('orders:decrypt-nickname', params),
    },
    printer: {
        diagnose: (params) => electron_1.ipcRenderer.invoke('printer:diagnose', params),
    },
    electronPrint: {
        getPrinters: () => electron_1.ipcRenderer.invoke('electron-print:get-printers'),
        printLabels: (payload) => electron_1.ipcRenderer.invoke('electron-print:print-labels', payload),
        diagnose: () => electron_1.ipcRenderer.invoke('electron-print:diagnose'),
        getSettings: () => electron_1.ipcRenderer.invoke('electron-print:get-settings'),
        updateSettings: (settings) => electron_1.ipcRenderer.invoke('electron-print:update-settings', settings),
    },
    // Shop management (multi-shop)
    shop: {
        authorize: (params) => electron_1.ipcRenderer.invoke('shop:authorize', params),
        authorizeWechat: (params) => electron_1.ipcRenderer.invoke('shop:authorizeWechat', params),
        openCloudPrintAuthorization: (params) => electron_1.ipcRenderer.invoke('shop:openCloudPrintAuthorization', params),
        collectCloudPrintAuthorization: (params) => electron_1.ipcRenderer.invoke('shop:collectCloudPrintAuthorization', params),
        channelsGetQr: () => electron_1.ipcRenderer.invoke('shop:channelsGetQr'),
        channelsCheckLogin: (params) => electron_1.ipcRenderer.invoke('shop:channelsCheckLogin', params),
        channelsBindSession: (params) => electron_1.ipcRenderer.invoke('shop:channelsBindSession', params),
        switch: (params) => electron_1.ipcRenderer.invoke('shop:switch', params),
        rebind: (params) => electron_1.ipcRenderer.invoke('shop:rebind', params),
        commitAuthorization: (params) => electron_1.ipcRenderer.invoke('shop:commitAuthorization', params),
        status: (params) => electron_1.ipcRenderer.invoke('shop:status', params),
        bootstrap: (params) => electron_1.ipcRenderer.invoke('shop:bootstrap', params),
        deauthorize: (params) => electron_1.ipcRenderer.invoke('shop:deauthorize', params),
    },
    // Shop status change events
    onShopStatusChanged: (cb) => {
        return onIpc('shop:status-changed', cb);
    },
    onAuthorizationExpired: (cb) => {
        return onIpc('authorization:expired', cb);
    },
    // 应用信息
    getAppVersion: () => electron_1.ipcRenderer.invoke('app:version'),
    getDeviceInfo: () => electron_1.ipcRenderer.invoke('app:device-info'),
    uploadLogs: (params) => electron_1.ipcRenderer.invoke('logs:upload', params),
    clientSettings: {
        get: () => electron_1.ipcRenderer.invoke('client-settings:get'),
        update: (settings) => electron_1.ipcRenderer.invoke('client-settings:update', settings),
    },
    onAppUpdateAvailable: (cb) => {
        return onIpc('app:update-available', cb);
    },
    onAppUpdateProgress: (cb) => {
        return onIpc('app:update-download-progress', cb);
    },
    onAppUpdateDownloaded: (cb) => {
        return onIpc('app:update-downloaded', cb);
    },
    onAppUpdateError: (cb) => {
        return onIpc('app:update-error', cb);
    },
    retryAppUpdateDownload: () => electron_1.ipcRenderer.invoke('app:download-update'),
    installAppUpdate: () => electron_1.ipcRenderer.invoke('app:quit-and-install'),
    quitApp: () => electron_1.ipcRenderer.invoke('app:quit'),
    openDesktopDownloadPage: (url) => electron_1.ipcRenderer.invoke('app:open-desktop-download-page', url),
    setAlwaysOnTop: (enabled) => electron_1.ipcRenderer.invoke('app:set-always-on-top', enabled),
});
//# sourceMappingURL=index.js.map