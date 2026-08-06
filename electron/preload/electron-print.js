"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronPrintBridge', {
    onLoadContent: (cb) => {
        const handler = (_event, payload) => cb(payload);
        electron_1.ipcRenderer.on('electron-print:load-content', handler);
        return () => electron_1.ipcRenderer.removeListener('electron-print:load-content', handler);
    },
    contentLoaded: (jobId) => electron_1.ipcRenderer.invoke(`electron-print:content-loaded:${jobId}`),
    contentFailed: (jobId, message) => electron_1.ipcRenderer.invoke(`electron-print:content-failed:${jobId}`, message),
});
//# sourceMappingURL=electron-print.js.map