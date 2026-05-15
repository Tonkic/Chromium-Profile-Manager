import type { Profile } from '../../shared/types'

export type {
  DisableSpoofingTarget,
  FingerprintLaunchSettings,
  FingerprintSettings,
  FingerprintSource,
  Profile,
  ProfileExtensionRef,
} from '../../shared/types'

export const emptyProfile = (): Profile => ({
  id: '',
  name: '',
  note: '',
  browserPath: './runtime/fingerprint-chromium-144/ungoogled-chromium_144.0.7559.132-1.1_windows_x64/chrome.exe',
  userDataDir: '',
  proxy: '',
  lang: 'zh-CN',
  timezone: 'Asia/Shanghai',
  windowSize: [1400, 900],
  extensions: [],
  extraArgs: [],
  fingerprint: {
    enabled: false,
    source: 'none',
    userAgentUrl: '',
    userAgentText: '',
    jsonText: '',
    launch: {
      seed: '',
      platform: '',
      platformVersion: '',
      brand: '',
      brandVersion: '',
      hardwareConcurrency: '',
      disableNonProxiedUdp: true,
      disableSpoofing: [],
    },
  },
  bookmarkSetId: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})
