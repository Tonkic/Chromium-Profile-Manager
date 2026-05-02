import { defineStore } from 'pinia'
import type { DownloadableRuntimeKind, InstalledRuntimeEntry, RuntimeInstallState, RuntimeKind, RuntimeReleaseAsset, RuntimeInstallResult } from '../services/runtime_manager'
import * as runtimeManagerApi from '../services/runtime_manager'

let installStatePollingTimer: ReturnType<typeof window.setInterval> | undefined

const runtimeProviderLabels: Record<RuntimeKind, string> = {
  fingerprint: '指纹浏览器',
  normal: '普通浏览器',
  unknown: '未识别 Runtime',
}

const runtimeProviderOrder: DownloadableRuntimeKind[] = ['fingerprint', 'normal']

const unavailableRelease = (kind: DownloadableRuntimeKind, error: string): RuntimeReleaseAsset => ({
  id: kind,
  kind,
  label: runtimeProviderLabels[kind],
  repo: kind === 'fingerprint' ? 'adryfish/fingerprint-chromium' : 'ungoogled-software/ungoogled-chromium-windows',
  name: '',
  size: 0,
  downloadUrl: '',
  releaseName: '',
  tagName: '',
  publishedAt: null,
  available: false,
  error,
})

const normalizeRelease = (asset: RuntimeReleaseAsset): RuntimeReleaseAsset => ({
  ...asset,
  label: asset.label || runtimeProviderLabels[asset.kind],
  available: asset.available ?? Boolean(asset.downloadUrl && asset.name),
  error: asset.error || (asset.available === false ? `${asset.label || runtimeProviderLabels[asset.kind]} 当前不可用` : undefined),
})

const normalizeReleases = (assets: RuntimeReleaseAsset[]) => {
  const byKind = new Map<DownloadableRuntimeKind, RuntimeReleaseAsset>()
  assets.map(normalizeRelease).forEach((asset) => byKind.set(asset.kind, asset))
  return runtimeProviderOrder.map((kind) => byKind.get(kind) ?? unavailableRelease(kind, `${runtimeProviderLabels[kind]} latest release 未返回`))
}

const normalizeInstalledRuntime = (entry: InstalledRuntimeEntry): InstalledRuntimeEntry => ({
  ...entry,
  label: entry.label || runtimeProviderLabels[entry.kind],
  displayName: entry.displayName || entry.browserPath,
})

export const useRuntimeManagerStore = defineStore('runtimeManager', {
  state: () => ({
    releases: [] as RuntimeReleaseAsset[],
    installedRuntimes: [] as InstalledRuntimeEntry[],
    installState: { status: 'idle' } as RuntimeInstallState,
    loading: false,
    loadingInstalled: false,
    installing: false,
    error: '',
  }),
  actions: {
    async refreshReleases() {
      this.loading = true
      this.error = ''
      try {
        this.releases = normalizeReleases(await runtimeManagerApi.listRuntimeReleases())
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
      } finally {
        this.loading = false
      }
    },
    async refreshInstalledRuntimes() {
      this.loadingInstalled = true
      this.error = ''
      try {
        this.installedRuntimes = (await runtimeManagerApi.listInstalledRuntimes()).map(normalizeInstalledRuntime)
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
      } finally {
        this.loadingInstalled = false
      }
    },
    async refreshInstallState() {
      this.installState = await runtimeManagerApi.getRuntimeInstallState()
    },
    startInstallStatePolling() {
      this.stopInstallStatePolling()
      installStatePollingTimer = window.setInterval(() => {
        void this.refreshInstallState()
      }, 300)
    },
    stopInstallStatePolling() {
      if (!installStatePollingTimer) {
        return
      }
      window.clearInterval(installStatePollingTimer)
      installStatePollingTimer = undefined
    },
    async install(asset: RuntimeReleaseAsset): Promise<RuntimeInstallResult | undefined> {
      if (!asset.available) {
        this.error = asset.error || `${asset.label} 当前不可安装`
        return undefined
      }
      this.installing = true
      this.error = ''
      this.startInstallStatePolling()
      try {
        const result = await runtimeManagerApi.installRuntimeRelease(asset)
        await Promise.all([this.refreshInstallState(), this.refreshInstalledRuntimes()])
        return result
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        await this.refreshInstallState()
        return undefined
      } finally {
        this.installing = false
        this.stopInstallStatePolling()
      }
    },
  },
})
