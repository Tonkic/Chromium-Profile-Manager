import { defineStore } from 'pinia'
import * as automationApi from '../services/automation'
import type { AutomationRuntimeState, AutomationScriptEntry } from '../types/automation'

const keyOf = (profileId: string, scriptName: string) => `${profileId}::${scriptName}`

export const useAutomationStore = defineStore('automation', {
  state: () => ({
    scripts: [] as AutomationScriptEntry[],
    states: {} as Record<string, AutomationRuntimeState>,
    loadingScripts: false,
    loadingStates: false,
    error: '',
  }),
  actions: {
    async refreshScripts() {
      this.loadingScripts = true
      this.error = ''
      try {
        this.scripts = await automationApi.listAutomationScripts()
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
      } finally {
        this.loadingScripts = false
      }
    },
    async refreshProfileStates(profileId: string) {
      this.loadingStates = true
      this.error = ''
      try {
        const items = await automationApi.getAutomationRuntimeStates(profileId)
        for (const item of items) {
          this.states[keyOf(item.profileId, item.scriptName)] = item
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
      } finally {
        this.loadingStates = false
      }
    },
    getState(profileId: string, scriptName: string) {
      return this.states[keyOf(profileId, scriptName)]
    },
    async start(profileId: string, scriptName: string) {
      this.error = ''
      try {
        const state = await automationApi.startAutomationScript(profileId, scriptName)
        this.states[keyOf(profileId, scriptName)] = state
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
      }
    },
    async stop(profileId: string, scriptName: string) {
      this.error = ''
      try {
        const state = await automationApi.stopAutomationScript(profileId, scriptName)
        this.states[keyOf(profileId, scriptName)] = state
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
      }
    },
    async openScriptsDir() {
      this.error = ''
      try {
        await automationApi.openAutomationScriptsDir()
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
      }
    },
    renameProfile(oldId: string, newId: string) {
      if (oldId === newId) {
        return
      }
      const nextStates: Record<string, AutomationRuntimeState> = {}
      for (const state of Object.values(this.states)) {
        const profileId = state.profileId === oldId ? newId : state.profileId
        const normalized: AutomationRuntimeState = {
          ...state,
          profileId,
        }
        nextStates[keyOf(normalized.profileId, normalized.scriptName)] = normalized
      }
      this.states = nextStates
    },
  },
})
