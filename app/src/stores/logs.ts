import { defineStore } from 'pinia'
import type { LogEntry } from '../types/logs'
import * as logsApi from '../services/logs'

export const useLogsStore = defineStore('logs', {
  state: () => ({
    entries: {} as Record<string, LogEntry[]>,
  }),
  actions: {
    async refresh(profileId: string) {
      this.entries[profileId] = await logsApi.getLogs(profileId)
    },
  },
})
