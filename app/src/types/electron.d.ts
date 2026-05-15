import type { AppInvoke } from '../../electron/ipc/contracts'

export {}

declare global {
  interface Window {
    electronAPI: {
      invoke: AppInvoke
      windowControls: {
        minimize: () => Promise<void>
        toggleMaximize: () => Promise<boolean>
        close: () => Promise<void>
        isMaximized: () => Promise<boolean>
        onMaximizedChange: (callback: (maximized: boolean) => void) => () => void
      }
    }
  }
}
