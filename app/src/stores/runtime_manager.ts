import { defineStore } from 'pinia'
import type { RuntimeInstallState, RuntimeReleaseAsset, RuntimeInstallResult } from '../services/runtime_manager'
import * as runtimeManagerApi from '../services/runtime_manager'

export const useRuntimeManagerStore = defineStore('runtimeManager', {
  state: () => ({
    releases: [] as RuntimeReleaseAsset[],
    installState: { status: 'idle' } as RuntimeInstallState,
    loading: false,
    installing: false,
    error: '',
  }),
  actions: {
    async refreshReleases() {
      this.loading = true
      this.error = ''
      try {
        this.releases = await runtimeManagerApi.listRuntimeReleases()
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
      } finally {
        this.loading = false
      }
    },
    async refreshInstallState() {
      this.installState = await runtimeManagerApi.getRuntimeInstallState()
    },
    async install(asset: RuntimeReleaseAsset): Promise<RuntimeInstallResult | undefined> {
      this.installing = true
      this.error = ''
      try {
        const result = await runtimeManagerApi.installRuntimeRelease(asset)
        await this.refreshInstallState()
        return result
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        await this.refreshInstallState()
        return undefined
      } finally {
        this.installing = false
      }
    },
  },
})
