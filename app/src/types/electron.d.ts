export {}

declare global {
  interface Window {
    electronAPI: {
      invoke: <T>(command: string, payload?: Record<string, unknown>) => Promise<T>
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
