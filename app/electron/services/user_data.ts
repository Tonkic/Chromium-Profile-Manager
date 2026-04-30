import { existsSync } from 'node:fs'
import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'

const lastBrowserPath = (userDataDir: string) => path.join(userDataDir, 'Last Browser')
const lastVersionPath = (userDataDir: string) => path.join(userDataDir, 'Last Version')
const defaultSessionsPath = (userDataDir: string) => path.join(userDataDir, 'Default', 'Sessions')
const defaultSyncDataPath = (userDataDir: string) => path.join(userDataDir, 'Default', 'Sync Data')

const decodeLastBrowser = async (filePath: string) => {
  const bytes = await readFile(filePath)
  const utf16 = bytes.toString('utf16le')
  if (utf16.includes('chrome.exe') || utf16.includes('chromium')) {
    return utf16
  }
  return bytes.toString('utf-8')
}

const removeRuntimeState = async (userDataDir: string) => {
  await Promise.all([
    rm(lastBrowserPath(userDataDir), { force: true }),
    rm(lastVersionPath(userDataDir), { force: true }),
    rm(defaultSessionsPath(userDataDir), { recursive: true, force: true }),
    rm(defaultSyncDataPath(userDataDir), { recursive: true, force: true }),
  ])
}

export const clearImportedRuntimeState = async (userDataDir: string) => {
  await removeRuntimeState(userDataDir)
}

export const clearStaleRuntimeState = async (userDataDir: string) => {
  const filePath = lastBrowserPath(userDataDir)
  if (!existsSync(filePath)) {
    return
  }
  const lastBrowser = await decodeLastBrowser(filePath)
  if (lastBrowser.includes('runtime\\ungoogled-chromium-146') || lastBrowser.includes('runtime/ungoogled-chromium-146')) {
    await removeRuntimeState(userDataDir)
  }
}
