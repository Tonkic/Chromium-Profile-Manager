import { defineStore } from 'pinia'
import type { RuntimeState } from '../types/runtime'
import * as launcherApi from '../services/launcher'

export const useRuntimeStore = defineStore('runtime', {
  state: () => ({
    states: {} as Record<string, RuntimeState>,
  }),
  actions: {
    async launch(profileId: string) {
      this.states[profileId] = {
        profileId,
        status: 'starting',
      }
      this.states[profileId] = await launcherApi.launchProfile(profileId)
    },
    async refresh(profileId: string) {
      this.states[profileId] = await launcherApi.getRuntimeState(profileId)
    },
    async stop(profileId: string) {
      await launcherApi.stopProfile(profileId)
      await this.refresh(profileId)
    },
    renameProfile(oldId: string, newId: string) {
      if (oldId === newId) {
        return
      }
      const state = this.states[oldId]
      if (!state) {
        return
      }
      this.states[newId] = { ...state, profileId: newId }
      delete this.states[oldId]
    },
  },
})
