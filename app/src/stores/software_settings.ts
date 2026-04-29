import { defineStore } from 'pinia'

const STORAGE_KEY = 'software-settings-v2'
const LEGACY_STORAGE_KEY = 'software-settings-v1'

type ThemeTokens = {
  '--bg-0': string
  '--bg-1': string
  '--bg-2': string
  '--surface-base': string
  '--surface-elevated': string
  '--surface-glass': string
  '--surface-glass-strong': string
  '--text-strong': string
  '--text-body': string
  '--text-muted': string
  '--text-subtle': string
  '--text-accent': string
  '--accent': string
  '--accent-2': string
  '--accent-soft': string
  '--accent-ring': string
  '--border-soft': string
  '--border-strong': string
  '--shadow-soft': string
  '--shadow-elevated': string
}

export interface ThemePreset {
  id: string
  label: string
  tokens: ThemeTokens
}

export interface FontOption {
  id: string
  label: string
  value: string
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'dark-slate',
    label: 'Dark Slate',
    tokens: {
      '--bg-0': '#020617',
      '--bg-1': '#0b1220',
      '--bg-2': '#111827',
      '--surface-base': 'rgba(15, 23, 42, 0.82)',
      '--surface-elevated': 'rgba(15, 23, 42, 0.9)',
      '--surface-glass': 'rgba(255, 255, 255, 0.04)',
      '--surface-glass-strong': 'rgba(255, 255, 255, 0.08)',
      '--text-strong': '#f8fafc',
      '--text-body': '#e2e8f0',
      '--text-muted': 'rgba(226, 232, 240, 0.68)',
      '--text-subtle': 'rgba(226, 232, 240, 0.46)',
      '--text-accent': '#c4b5fd',
      '--accent': '#a78bfa',
      '--accent-2': '#38bdf8',
      '--accent-soft': 'rgba(167, 139, 250, 0.2)',
      '--accent-ring': 'rgba(167, 139, 250, 0.42)',
      '--border-soft': 'rgba(148, 163, 184, 0.22)',
      '--border-strong': 'rgba(148, 163, 184, 0.34)',
      '--shadow-soft': '0 10px 30px rgba(2, 6, 23, 0.5)',
      '--shadow-elevated': '0 26px 70px rgba(2, 6, 23, 0.64)',
    },
  },
  {
    id: 'dark-zinc',
    label: 'Dark Zinc',
    tokens: {
      '--bg-0': '#09090b',
      '--bg-1': '#111113',
      '--bg-2': '#18181b',
      '--surface-base': 'rgba(24, 24, 27, 0.84)',
      '--surface-elevated': 'rgba(24, 24, 27, 0.92)',
      '--surface-glass': 'rgba(255, 255, 255, 0.035)',
      '--surface-glass-strong': 'rgba(255, 255, 255, 0.075)',
      '--text-strong': '#fafafa',
      '--text-body': '#e4e4e7',
      '--text-muted': 'rgba(228, 228, 231, 0.66)',
      '--text-subtle': 'rgba(228, 228, 231, 0.42)',
      '--text-accent': '#d4d4d8',
      '--accent': '#a1a1aa',
      '--accent-2': '#71717a',
      '--accent-soft': 'rgba(161, 161, 170, 0.2)',
      '--accent-ring': 'rgba(161, 161, 170, 0.36)',
      '--border-soft': 'rgba(161, 161, 170, 0.22)',
      '--border-strong': 'rgba(161, 161, 170, 0.34)',
      '--shadow-soft': '0 10px 28px rgba(0, 0, 0, 0.46)',
      '--shadow-elevated': '0 24px 64px rgba(0, 0, 0, 0.6)',
    },
  },
  {
    id: 'dark-emerald',
    label: 'Dark Emerald',
    tokens: {
      '--bg-0': '#03130f',
      '--bg-1': '#0a1f19',
      '--bg-2': '#112b23',
      '--surface-base': 'rgba(16, 37, 31, 0.82)',
      '--surface-elevated': 'rgba(16, 37, 31, 0.9)',
      '--surface-glass': 'rgba(255, 255, 255, 0.04)',
      '--surface-glass-strong': 'rgba(255, 255, 255, 0.08)',
      '--text-strong': '#ecfdf5',
      '--text-body': '#d1fae5',
      '--text-muted': 'rgba(209, 250, 229, 0.66)',
      '--text-subtle': 'rgba(209, 250, 229, 0.42)',
      '--text-accent': '#6ee7b7',
      '--accent': '#34d399',
      '--accent-2': '#2dd4bf',
      '--accent-soft': 'rgba(52, 211, 153, 0.2)',
      '--accent-ring': 'rgba(52, 211, 153, 0.38)',
      '--border-soft': 'rgba(110, 231, 183, 0.2)',
      '--border-strong': 'rgba(110, 231, 183, 0.32)',
      '--shadow-soft': '0 10px 30px rgba(2, 20, 14, 0.5)',
      '--shadow-elevated': '0 24px 66px rgba(2, 20, 14, 0.62)',
    },
  },
  {
    id: 'dark-amber',
    label: 'Dark Amber',
    tokens: {
      '--bg-0': '#140c04',
      '--bg-1': '#211304',
      '--bg-2': '#2d1b06',
      '--surface-base': 'rgba(44, 28, 10, 0.82)',
      '--surface-elevated': 'rgba(44, 28, 10, 0.9)',
      '--surface-glass': 'rgba(255, 255, 255, 0.04)',
      '--surface-glass-strong': 'rgba(255, 255, 255, 0.08)',
      '--text-strong': '#fef3c7',
      '--text-body': '#fde68a',
      '--text-muted': 'rgba(253, 230, 138, 0.64)',
      '--text-subtle': 'rgba(253, 230, 138, 0.4)',
      '--text-accent': '#fbbf24',
      '--accent': '#f59e0b',
      '--accent-2': '#f97316',
      '--accent-soft': 'rgba(245, 158, 11, 0.2)',
      '--accent-ring': 'rgba(245, 158, 11, 0.36)',
      '--border-soft': 'rgba(251, 191, 36, 0.2)',
      '--border-strong': 'rgba(251, 191, 36, 0.32)',
      '--shadow-soft': '0 10px 30px rgba(24, 12, 3, 0.5)',
      '--shadow-elevated': '0 24px 68px rgba(24, 12, 3, 0.62)',
    },
  },
  {
    id: 'dark-rose',
    label: 'Dark Rose',
    tokens: {
      '--bg-0': '#18070f',
      '--bg-1': '#240d18',
      '--bg-2': '#311124',
      '--surface-base': 'rgba(44, 16, 33, 0.82)',
      '--surface-elevated': 'rgba(44, 16, 33, 0.9)',
      '--surface-glass': 'rgba(255, 255, 255, 0.04)',
      '--surface-glass-strong': 'rgba(255, 255, 255, 0.08)',
      '--text-strong': '#ffe4ef',
      '--text-body': '#fecdd3',
      '--text-muted': 'rgba(254, 205, 211, 0.66)',
      '--text-subtle': 'rgba(254, 205, 211, 0.42)',
      '--text-accent': '#fda4af',
      '--accent': '#fb7185',
      '--accent-2': '#f43f5e',
      '--accent-soft': 'rgba(251, 113, 133, 0.2)',
      '--accent-ring': 'rgba(251, 113, 133, 0.38)',
      '--border-soft': 'rgba(253, 164, 175, 0.2)',
      '--border-strong': 'rgba(253, 164, 175, 0.32)',
      '--shadow-soft': '0 10px 30px rgba(26, 7, 17, 0.52)',
      '--shadow-elevated': '0 24px 66px rgba(26, 7, 17, 0.64)',
    },
  },
]

export const FONT_OPTIONS: FontOption[] = [
  { id: 'inter', label: 'Inter', value: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif' },
  { id: 'pingfang', label: 'PingFang SC', value: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif' },
  { id: 'source-sans', label: 'Source Sans 3', value: '"Source Sans 3", "Segoe UI", system-ui, sans-serif' },
  { id: 'ibm-plex', label: 'IBM Plex Sans', value: '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif' },
]

const defaultThemeId = THEME_PRESETS[0]?.id ?? 'dark-slate'
const defaultFontId = FONT_OPTIONS[0]?.id ?? 'inter'

export interface SoftwareSettingsState {
  themeId: string
  fontId: string
}

interface LegacySoftwareSettingsState {
  fontFamily?: string
  accentColor?: string
  backgroundColor?: string
}

const defaultState = (): SoftwareSettingsState => ({
  themeId: defaultThemeId,
  fontId: defaultFontId,
})

const getThemeById = (id: string) => THEME_PRESETS.find((item) => item.id === id) ?? THEME_PRESETS[0]
const getFontById = (id: string) => FONT_OPTIONS.find((item) => item.id === id) ?? FONT_OPTIONS[0]

const normalizeState = (value: Partial<SoftwareSettingsState>): SoftwareSettingsState => ({
  themeId: getThemeById(value.themeId || defaultThemeId).id,
  fontId: getFontById(value.fontId || defaultFontId).id,
})

const normalizePreviewState = (themeId: string, fontId: string): SoftwareSettingsState => ({
  themeId: getThemeById(themeId).id,
  fontId: getFontById(fontId).id,
})

const mapLegacyFontToId = (fontFamily?: string) => {
  if (!fontFamily) {
    return defaultFontId
  }
  const lowered = fontFamily.toLowerCase()
  if (lowered.includes('pingfang') || lowered.includes('yahei') || lowered.includes('noto sans sc')) {
    return 'pingfang'
  }
  if (lowered.includes('source sans')) {
    return 'source-sans'
  }
  if (lowered.includes('ibm plex')) {
    return 'ibm-plex'
  }
  return 'inter'
}

const applyCssVariables = (state: SoftwareSettingsState) => {
  const root = document.documentElement
  const theme = getThemeById(state.themeId)
  const font = getFontById(state.fontId)

  root.style.setProperty('--app-font-family', font.value)
  for (const [key, value] of Object.entries(theme.tokens)) {
    root.style.setProperty(key, value)
  }
}

const loadSettings = (): SoftwareSettingsState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return normalizeState(JSON.parse(raw) as Partial<SoftwareSettingsState>)
    }

    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!legacyRaw) {
      return defaultState()
    }

    const legacy = JSON.parse(legacyRaw) as LegacySoftwareSettingsState
    return normalizeState({
      themeId: defaultThemeId,
      fontId: mapLegacyFontToId(legacy.fontFamily),
    })
  } catch {
    return defaultState()
  }
}

export const useSoftwareSettingsStore = defineStore('softwareSettings', {
  state: (): SoftwareSettingsState => defaultState(),
  getters: {
    themeOptions: () => THEME_PRESETS,
    fontOptions: () => FONT_OPTIONS,
  },
  actions: {
    initialize() {
      const loaded = loadSettings()
      this.themeId = loaded.themeId
      this.fontId = loaded.fontId
      applyCssVariables(this)
    },
    preview(themeId: string, fontId: string) {
      applyCssVariables(normalizePreviewState(themeId, fontId))
    },
    save() {
      const normalized = normalizeState(this)
      this.themeId = normalized.themeId
      this.fontId = normalized.fontId
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          themeId: this.themeId,
          fontId: this.fontId,
        }),
      )
      applyCssVariables(this)
    },
    reset() {
      const next = defaultState()
      this.themeId = next.themeId
      this.fontId = next.fontId
      this.save()
    },
  },
})
