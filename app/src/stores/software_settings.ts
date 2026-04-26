import { defineStore } from 'pinia'

const STORAGE_KEY = 'software-settings-v1'

export interface SoftwareSettingsState {
  fontFamily: string
  accentColor: string
  backgroundColor: string
}

const defaultState = (): SoftwareSettingsState => ({
  fontFamily: 'Inter, system-ui, sans-serif',
  accentColor: '#3b82f6',
  backgroundColor: '#0f172a',
})

const applyCssVariables = (state: SoftwareSettingsState) => {
  const root = document.documentElement
  root.style.setProperty('--app-font-family', state.fontFamily)
  root.style.setProperty('--accent', state.accentColor)
  root.style.setProperty('--bg-1', state.backgroundColor)
}

const loadSettings = (): SoftwareSettingsState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultState()
    }
    const parsed = JSON.parse(raw) as Partial<SoftwareSettingsState>
    return {
      fontFamily: parsed.fontFamily || defaultState().fontFamily,
      accentColor: parsed.accentColor || defaultState().accentColor,
      backgroundColor: parsed.backgroundColor || defaultState().backgroundColor,
    }
  } catch {
    return defaultState()
  }
}

export const useSoftwareSettingsStore = defineStore('softwareSettings', {
  state: (): SoftwareSettingsState => defaultState(),
  actions: {
    initialize() {
      const loaded = loadSettings()
      this.fontFamily = loaded.fontFamily
      this.accentColor = loaded.accentColor
      this.backgroundColor = loaded.backgroundColor
      applyCssVariables(this)
    },
    save() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          fontFamily: this.fontFamily,
          accentColor: this.accentColor,
          backgroundColor: this.backgroundColor,
        }),
      )
      applyCssVariables(this)
    },
    reset() {
      const next = defaultState()
      this.fontFamily = next.fontFamily
      this.accentColor = next.accentColor
      this.backgroundColor = next.backgroundColor
      this.save()
    },
  },
})
