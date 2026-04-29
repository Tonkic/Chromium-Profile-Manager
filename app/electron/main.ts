import { app, BrowserWindow, ipcMain } from 'electron'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerIpcHandlers } from './ipc/handlers.js'
import { automationScriptsDir, extensionsRoot, logsRoot, profilesRoot } from './services/paths.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)
let mainWindow: BrowserWindow | null = null

const sendMaximizedState = (window: BrowserWindow) => {
  window.webContents.send('window:maximized-change', window.isMaximized())
}

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    title: 'Chromium Profile Manager',
    width: 1200,
    height: 820,
    minWidth: 1024,
    minHeight: 720,
    frame: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.on('maximize', () => mainWindow && sendMaximizedState(mainWindow))
  mainWindow.on('unmaximize', () => mainWindow && sendMaximizedState(mainWindow))
  mainWindow.on('resize', () => mainWindow && sendMaximizedState(mainWindow))

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    await mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'))
  }
}

const registerWindowHandlers = () => {
  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:toggle-maximize', () => {
    if (!mainWindow) {
      return false
    }
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
    return mainWindow.isMaximized()
  })
  ipcMain.handle('window:close', () => mainWindow?.close())
  ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false)
}

const ensureDataDirs = async () => {
  await Promise.all([
    mkdir(profilesRoot(), { recursive: true }),
    mkdir(logsRoot(), { recursive: true }),
    mkdir(extensionsRoot(), { recursive: true }),
    mkdir(automationScriptsDir(), { recursive: true }),
  ])
}

app.whenReady().then(async () => {
  await ensureDataDirs()
  registerIpcHandlers()
  registerWindowHandlers()
  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
