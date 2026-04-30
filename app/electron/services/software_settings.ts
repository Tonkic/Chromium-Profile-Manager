import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { SoftwareSettings } from './types.js'
import { projectRoot } from './paths.js'

export const DEFAULT_BROWSER_PATH =
  './runtime/fingerprint-chromium-144/ungoogled-chromium_144.0.7559.132-1.1_windows_x64/chrome.exe'

const settingsPath = () => path.join(projectRoot(), 'data', 'software-settings.json')

const defaultSettings = (): SoftwareSettings => ({
  defaultBrowserPath: DEFAULT_BROWSER_PATH,
})

const normalizeSettings = (value: Partial<SoftwareSettings>): SoftwareSettings => ({
  defaultBrowserPath: value.defaultBrowserPath?.trim() || DEFAULT_BROWSER_PATH,
})

export const getSoftwareSettings = async (): Promise<SoftwareSettings> => {
  const filePath = settingsPath()
  if (!existsSync(filePath)) {
    return defaultSettings()
  }

  try {
    return normalizeSettings(JSON.parse(await readFile(filePath, 'utf-8')) as Partial<SoftwareSettings>)
  } catch {
    return defaultSettings()
  }
}

export const saveSoftwareSettings = async (settings: SoftwareSettings): Promise<SoftwareSettings> => {
  const normalized = normalizeSettings(settings)
  const filePath = settingsPath()
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(normalized, null, 2), 'utf-8')
  return normalized
}
