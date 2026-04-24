import { defineStore } from 'pinia'
import type { ExtensionEntry } from '../types/extension'
import * as extensionsApi from '../services/extensions'

export const useExtensionsStore = defineStore('extensions', {
  state: () => ({
    items: [] as ExtensionEntry[],
  }),
  actions: {
    async fetchAll() {
      this.items = await extensionsApi.listExtensions()
    },
    async importDir(id: string, sourcePath: string) {
      await extensionsApi.importExtensionDir(id, sourcePath)
      await this.fetchAll()
    },
    async importCrx(id: string, sourcePath: string) {
      await extensionsApi.importExtensionCrx(id, sourcePath)
      await this.fetchAll()
    },
  },
})
