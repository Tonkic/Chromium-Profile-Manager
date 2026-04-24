export interface ProfileExtensionRef {
  id: string
  enabled: boolean
}

export interface Profile {
  id: string
  name: string
  note?: string
  browserPath: string
  userDataDir: string
  proxy?: string
  lang?: string
  timezone?: string
  windowSize?: [number, number]
  extensions: ProfileExtensionRef[]
  extraArgs: string[]
  bookmarkSetId?: string
  createdAt: string
  updatedAt: string
}

export const emptyProfile = (): Profile => ({
  id: '',
  name: '',
  note: '',
  browserPath: './runtime/ungoogled-chromium-146/ungoogled-chromium_146.0.7680.177-1.1_windows_x64/chrome.exe',
  userDataDir: '',
  proxy: '',
  lang: 'zh-CN',
  timezone: 'Asia/Shanghai',
  windowSize: [1400, 900],
  extensions: [],
  extraArgs: [],
  bookmarkSetId: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})
