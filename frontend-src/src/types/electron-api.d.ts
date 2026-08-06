export {}

type ElectronApiCallback = (...args: any[]) => void

declare global {
  interface Window {
    electronAPI?: {
      openPlatformLogin?: (...args: any[]) => Promise<any>
      disconnectPlatform?: (...args: any[]) => Promise<any>
      startDanmakuSession?: (...args: any[]) => Promise<any>
      stopDanmakuSession?: (...args: any[]) => Promise<any>
      resetDanmakuBatch?: (...args: any[]) => Promise<any>
      resetLuckyBagBatch?: (...args: any[]) => Promise<any>
      setDanmakuSessionPaused?: (...args: any[]) => Promise<any>
      reloadDanmakuConfig?: (...args: any[]) => Promise<any>
      onConnectionStatus?: (callback: ElectronApiCallback) => (() => void)
      onDanmakuStats?: (callback: ElectronApiCallback) => (() => void)
      onLiveRoomInfo?: (callback: ElectronApiCallback) => (() => void)
      onLiveStatus?: (callback: ElectronApiCallback) => (() => void)
      onSupportWindowClosed?: (callback: ElectronApiCallback) => (() => void)
      onDanmakuDisplay?: (callback: ElectronApiCallback) => (() => void)
      onDanmakuResolved?: (callback: ElectronApiCallback) => (() => void)
      onLuckyBagBatchReset?: (callback: ElectronApiCallback) => (() => void)
      onPrintResults?: (callback: ElectronApiCallback) => (() => void)
      onLiveOrdersSynced?: (callback: ElectronApiCallback) => (() => void)
      onLiveOrderSyncStatus?: (callback: ElectronApiCallback) => (() => void)
      orders?: Record<string, (...args: any[]) => Promise<any>>
      printer?: Record<string, (...args: any[]) => Promise<any>>
      electronPrint?: Record<string, (...args: any[]) => Promise<any>>
      shop?: Record<string, (...args: any[]) => Promise<any>>
      onShopStatusChanged?: (callback: ElectronApiCallback) => (() => void)
      onAuthorizationExpired?: (callback: ElectronApiCallback) => (() => void)
      getAppVersion?: () => Promise<string>
      getDeviceInfo?: () => Promise<any>
      uploadLogs?: (...args: any[]) => Promise<any>
      clientSettings?: Record<string, (...args: any[]) => Promise<any>>
      onAppUpdateAvailable?: (callback: ElectronApiCallback) => (() => void)
      onAppUpdateProgress?: (callback: ElectronApiCallback) => (() => void)
      onAppUpdateDownloaded?: (callback: ElectronApiCallback) => (() => void)
      onAppUpdateError?: (callback: ElectronApiCallback) => (() => void)
      retryAppUpdateDownload?: (...args: any[]) => Promise<any>
      installAppUpdate?: (...args: any[]) => Promise<any>
      quitApp?: (...args: any[]) => Promise<any>
      openDesktopDownloadPage?: (...args: any[]) => Promise<any>
      setAlwaysOnTop?: (...args: any[]) => Promise<any>
      [key: string]: any
    }
  }
}
