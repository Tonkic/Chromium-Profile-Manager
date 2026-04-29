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
    id: 'business-light',
    label: 'Business Light',
    tokens: {
      '--bg-0': '#f7f9fc',
      '--bg-1': '#edf2fb',
      '--bg-2': '#e3ebf8',
      '--surface-base': '#f9fcff',
      '--surface-elevated': '#eff6ff',
      '--surface-glass': 'rgba(241, 248, 255, 0.9)',
      '--surface-glass-strong': 'rgba(246, 251, 255, 0.98)',
      '--text-strong': '#0f172a',
      '--text-body': '#1e293b',
      '--text-muted': '#64748b',
      '--text-subtle': '#94a3b8',
      '--text-accent': '#1d4ed8',
      '--accent': '#2563eb',
      '--accent-2': '#0ea5e9',
      '--accent-soft': 'rgba(37, 99, 235, 0.15)',
      '--accent-ring': 'rgba(37, 99, 235, 0.28)',
      '--border-soft': 'rgba(148, 163, 184, 0.36)',
      '--border-strong': 'rgba(100, 116, 139, 0.48)',
      '--shadow-soft': '0 10px 28px rgba(15, 23, 42, 0.08)',
      '--shadow-elevated': '0 24px 64px rgba(15, 23, 42, 0.14)',
    },
  },
  {
    id: 'pearl',
    label: 'Pearl Gray',
    tokens: {
      '--bg-0': '#f6f7fb',
      '--bg-1': '#eceff7',
      '--bg-2': '#e2e7f3',
      '--surface-base': '#f5f8ff',
      '--surface-elevated': '#eaf0ff',
      '--surface-glass': 'rgba(236, 242, 255, 0.9)',
      '--surface-glass-strong': 'rgba(243, 247, 255, 0.98)',
      '--text-strong': '#111827',
      '--text-body': '#1f2937',
      '--text-muted': '#6b7280',
      '--text-subtle': '#9ca3af',
      '--text-accent': '#4338ca',
      '--accent': '#4f46e5',
      '--accent-2': '#6366f1',
      '--accent-soft': 'rgba(79, 70, 229, 0.15)',
      '--accent-ring': 'rgba(79, 70, 229, 0.3)',
      '--border-soft': 'rgba(148, 163, 184, 0.36)',
      '--border-strong': 'rgba(107, 114, 128, 0.48)',
      '--shadow-soft': '0 10px 26px rgba(15, 23, 42, 0.08)',
      '--shadow-elevated': '0 22px 58px rgba(15, 23, 42, 0.12)',
    },
  },
  {
    id: 'sand',
    label: 'Sand Stone',
    tokens: {
      '--bg-0': '#fcfaf6',
      '--bg-1': '#f6f1e7',
      '--bg-2': '#ece2d2',
      '--surface-base': '#fff4df',
      '--surface-elevated': '#fcead0',
      '--surface-glass': 'rgba(255, 243, 222, 0.9)',
      '--surface-glass-strong': 'rgba(255, 248, 235, 0.98)',
      '--text-strong': '#1f2937',
      '--text-body': '#334155',
      '--text-muted': '#78716c',
      '--text-subtle': '#a8a29e',
      '--text-accent': '#0b5f8a',
      '--accent': '#0284c7',
      '--accent-2': '#0ea5e9',
      '--accent-soft': 'rgba(2, 132, 199, 0.16)',
      '--accent-ring': 'rgba(2, 132, 199, 0.3)',
      '--border-soft': 'rgba(168, 162, 158, 0.4)',
      '--border-strong': 'rgba(120, 113, 108, 0.5)',
      '--shadow-soft': '0 10px 26px rgba(41, 37, 36, 0.08)',
      '--shadow-elevated': '0 24px 64px rgba(41, 37, 36, 0.12)',
    },
  },
  {
    id: 'mint',
    label: 'Mint Air',
    tokens: {
      '--bg-0': '#f1fbf8',
      '--bg-1': '#e6f5f1',
      '--bg-2': '#d7ebe6',
      '--surface-base': '#ecfaf6',
      '--surface-elevated': '#def3ec',
      '--surface-glass': 'rgba(229, 247, 240, 0.92)',
      '--surface-glass-strong': 'rgba(236, 250, 244, 0.98)',
      '--text-strong': '#0f172a',
      '--text-body': '#1f2937',
      '--text-muted': '#64748b',
      '--text-subtle': '#94a3b8',
      '--text-accent': '#0f766e',
      '--accent': '#0d9488',
      '--accent-2': '#14b8a6',
      '--accent-soft': 'rgba(13, 148, 136, 0.16)',
      '--accent-ring': 'rgba(13, 148, 136, 0.28)',
      '--border-soft': 'rgba(129, 167, 159, 0.36)',
      '--border-strong': 'rgba(91, 125, 118, 0.48)',
      '--shadow-soft': '0 10px 28px rgba(15, 23, 42, 0.08)',
      '--shadow-elevated': '0 24px 64px rgba(15, 23, 42, 0.12)',
    },
  },
  {
    id: 'rose',
    label: 'Rose Quartz',
    tokens: {
      '--bg-0': '#fcf7fb',
      '--bg-1': '#f7edf7',
      '--bg-2': '#f0e2f2',
      '--surface-base': '#fff1fa',
      '--surface-elevated': '#fbe5f4',
      '--surface-glass': 'rgba(252, 233, 246, 0.92)',
      '--surface-glass-strong': 'rgba(255, 241, 251, 0.98)',
      '--text-strong': '#3f1d3a',
      '--text-body': '#57294f',
      '--text-muted': '#8f5c86',
      '--text-subtle': '#b687ae',
      '--text-accent': '#9d174d',
      '--accent': '#be185d',
      '--accent-2': '#db2777',
      '--accent-soft': 'rgba(190, 24, 93, 0.16)',
      '--accent-ring': 'rgba(190, 24, 93, 0.3)',
      '--border-soft': 'rgba(182, 135, 174, 0.38)',
      '--border-strong': 'rgba(143, 92, 134, 0.5)',
      '--shadow-soft': '0 10px 24px rgba(95, 35, 79, 0.1)',
      '--shadow-elevated': '0 24px 58px rgba(95, 35, 79, 0.16)',
    },
  },
  {
    id: 'slate',
    label: 'Slate Mist',
    tokens: {
      '--bg-0': '#f3f6fb',
      '--bg-1': '#e9eff8',
      '--bg-2': '#dde6f2',
      '--surface-base': '#eaf1fb',
      '--surface-elevated': '#dce7f5',
      '--surface-glass': 'rgba(226, 236, 248, 0.9)',
      '--surface-glass-strong': 'rgba(234, 241, 251, 0.98)',
      '--text-strong': '#0b1b34',
      '--text-body': '#1b304d',
      '--text-muted': '#4c6384',
      '--text-subtle': '#7e93b2',
      '--text-accent': '#0f3d7a',
      '--accent': '#1d4f91',
      '--accent-2': '#2d6ab0',
      '--accent-soft': 'rgba(29, 79, 145, 0.16)',
      '--accent-ring': 'rgba(29, 79, 145, 0.3)',
      '--border-soft': 'rgba(126, 147, 178, 0.42)',
      '--border-strong': 'rgba(76, 99, 132, 0.54)',
      '--shadow-soft': '0 10px 22px rgba(14, 32, 61, 0.1)',
      '--shadow-elevated': '0 24px 56px rgba(14, 32, 61, 0.16)',
    },
  },
]

export const FONT_OPTIONS: FontOption[] = [
  { id: 'inter', label: 'Inter', value: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif' },
  { id: 'pingfang', label: 'PingFang SC', value: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif' },
  { id: 'source-sans', label: 'Source Sans 3', value: '"Source Sans 3", "Segoe UI", system-ui, sans-serif' },
  { id: 'ibm-plex', label: 'IBM Plex Sans', value: '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif' },
]

const defaultThemeId = THEME_PRESETS[0]?.id ?? 'business-light'
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
