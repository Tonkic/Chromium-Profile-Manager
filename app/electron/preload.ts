import { contextBridge, ipcRenderer } from 'electron'
import { isCommandName } from './ipc/contracts.js'

const api = {
  invoke: <T>(command: string, payload?: Record<string, unknown>): Promise<T> => {
    if (!isCommandName(command)) {
      return Promise.reject(new Error(`Unknown command: ${command}`))
    }
    return ipcRenderer.invoke('app:invoke', command, payload) as Promise<T>
  },
  windowControls: {
    minimize: () => ipcRenderer.invoke('window:minimize') as Promise<void>,
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize') as Promise<boolean>,
    close: () => ipcRenderer.invoke('window:close') as Promise<void>,
    isMaximized: () => ipcRenderer.invoke('window:is-maximized') as Promise<boolean>,
    onMaximizedChange: (callback: (maximized: boolean) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, maximized: boolean) => callback(maximized)
      ipcRenderer.on('window:maximized-change', listener)
      return () => ipcRenderer.removeListener('window:maximized-change', listener)
    },
  },
}

contextBridge.exposeInMainWorld('electronAPI', api)
