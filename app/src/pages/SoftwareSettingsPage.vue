<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRuntimeManagerStore } from '../stores/runtime_manager'
import { useSoftwareSettingsStore } from '../stores/software_settings'

const softwareSettingsStore = useSoftwareSettingsStore()
const runtimeManagerStore = useRuntimeManagerStore()
const { releases, installedRuntimes, loading, loadingInstalled, installing, error, installState } = storeToRefs(runtimeManagerStore)

const draft = reactive({
  themeId: softwareSettingsStore.themeId,
  fontId: softwareSettingsStore.fontId,
  defaultBrowserPath: softwareSettingsStore.defaultBrowserPath,
  defaultRuntimeKind: softwareSettingsStore.defaultRuntimeKind,
  defaultRuntimeRepo: softwareSettingsStore.defaultRuntimeRepo,
  defaultRuntimeTagName: softwareSettingsStore.defaultRuntimeTagName,
  defaultRuntimeAssetName: softwareSettingsStore.defaultRuntimeAssetName,
})
const selectedRuntimeAssetName = ref('')
const selectedInstalledRuntimeId = ref('')
const runtimeAssetKey = (asset: { kind: string; id: number | string }) => `${asset.kind}:${asset.id}`
const installedRuntimeKey = (runtime: { id: string }) => runtime.id
const selectedRuntimeAsset = computed(() => releases.value.find((asset) => runtimeAssetKey(asset) === selectedRuntimeAssetName.value))
const selectedInstalledRuntime = computed(() => installedRuntimes.value.find((runtime) => installedRuntimeKey(runtime) === selectedInstalledRuntimeId.value))
const isRuntimeAssetAvailable = (asset?: { available?: boolean; downloadUrl?: string; name?: string }) =>
  Boolean(asset && (asset.available ?? Boolean(asset.downloadUrl && asset.name)))
const selectedRuntimeAssetError = computed(() =>
  selectedRuntimeAsset.value && !isRuntimeAssetAvailable(selectedRuntimeAsset.value)
    ? selectedRuntimeAsset.value.error || `${runtimeKindLabel(selectedRuntimeAsset.value.kind)} 当前不可用`
    : '',
)
const canInstallSelectedRuntime = computed(() => Boolean(selectedRuntimeAsset.value && isRuntimeAssetAvailable(selectedRuntimeAsset.value)))
const installProgressPercent = computed(() => Math.max(0, Math.min(100, installState.value.progressPercent ?? 0)))
const showRuntimeInstallModal = computed(() => installing.value || installState.value.status === 'installing')

watch(
  () => [
    softwareSettingsStore.themeId,
    softwareSettingsStore.fontId,
    softwareSettingsStore.defaultBrowserPath,
    softwareSettingsStore.defaultRuntimeKind,
    softwareSettingsStore.defaultRuntimeRepo,
    softwareSettingsStore.defaultRuntimeTagName,
    softwareSettingsStore.defaultRuntimeAssetName,
  ],
  () => {
    if (draft.themeId !== softwareSettingsStore.themeId) {
      draft.themeId = softwareSettingsStore.themeId
    }
    if (draft.fontId !== softwareSettingsStore.fontId) {
      draft.fontId = softwareSettingsStore.fontId
    }
    if (draft.defaultBrowserPath !== softwareSettingsStore.defaultBrowserPath) {
      draft.defaultBrowserPath = softwareSettingsStore.defaultBrowserPath
    }
    draft.defaultRuntimeKind = softwareSettingsStore.defaultRuntimeKind
    draft.defaultRuntimeRepo = softwareSettingsStore.defaultRuntimeRepo
    draft.defaultRuntimeTagName = softwareSettingsStore.defaultRuntimeTagName
    draft.defaultRuntimeAssetName = softwareSettingsStore.defaultRuntimeAssetName
  },
)

watch(
  () => [draft.themeId, draft.fontId],
  ([themeId, fontId]) => {
    softwareSettingsStore.preview(themeId, fontId)
  },
)

watch(
  releases,
  (value) => {
    if (!selectedRuntimeAssetName.value && value.length > 0) {
      selectedRuntimeAssetName.value = runtimeAssetKey(value[0])
    }
  },
  { immediate: true },
)

watch(
  installedRuntimes,
  (value) => {
    if (!selectedInstalledRuntimeId.value && value.length > 0) {
      selectedInstalledRuntimeId.value = installedRuntimeKey(value[0])
    }
  },
  { immediate: true },
)

onMounted(() => {
  void softwareSettingsStore.loadRuntimeSettings()
  if (!window.electronAPI) {
    return
  }
  if (runtimeManagerStore.releases.length === 0) {
    void runtimeManagerStore.refreshReleases()
  }
  void runtimeManagerStore.refreshInstalledRuntimes()
  void runtimeManagerStore.refreshInstallState()
})

onUnmounted(() => {
  runtimeManagerStore.stopInstallStatePolling()
})

const runtimeKindLabel = (kind: string) => {
  if (kind === 'fingerprint') {
    return '指纹浏览器'
  }
  if (kind === 'normal') {
    return '普通浏览器'
  }
  return '未识别 Runtime'
}

const formatBytes = (value: number) => {
  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`
  }
  return `${Math.round(value / 1024 / 1024)} MB`
}

const installPhaseLabel = computed(() => {
  if (installState.value.phase === 'extracting') {
    return '正在解压 runtime'
  }
  if (installState.value.phase === 'installed') {
    return 'runtime 已安装'
  }
  if (installState.value.phase === 'error') {
    return '安装失败'
  }
  return '正在下载 runtime'
})

const installProgressLabel = computed(() => {
  const downloadedBytes = installState.value.downloadedBytes ?? 0
  const totalBytes = installState.value.totalBytes
  if (!totalBytes) {
    return downloadedBytes > 0 ? `已下载 ${formatBytes(downloadedBytes)}` : '正在准备下载'
  }
  return `${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)}`
})

const refreshRuntimeReleases = () => runtimeManagerStore.refreshReleases()
const refreshInstalledRuntimes = () => runtimeManagerStore.refreshInstalledRuntimes()

const selectInstalledRuntimeAsDefault = () => {
  if (!selectedInstalledRuntime.value) {
    return
  }
  draft.defaultBrowserPath = selectedInstalledRuntime.value.browserPath
  draft.defaultRuntimeKind = selectedInstalledRuntime.value.kind
  draft.defaultRuntimeRepo = selectedInstalledRuntime.value.repo ?? ''
  draft.defaultRuntimeTagName = selectedInstalledRuntime.value.tagName ?? ''
  draft.defaultRuntimeAssetName = selectedInstalledRuntime.value.assetName ?? ''
}

const installSelectedRuntime = async () => {
  if (!selectedRuntimeAsset.value || !canInstallSelectedRuntime.value) {
    return
  }
  const result = await runtimeManagerStore.install(selectedRuntimeAsset.value)
  if (result) {
    draft.defaultBrowserPath = result.browserPath
    draft.defaultRuntimeKind = result.kind
    draft.defaultRuntimeRepo = result.repo
    draft.defaultRuntimeTagName = result.tagName
    draft.defaultRuntimeAssetName = result.assetName
  }
}

const save = async () => {
  softwareSettingsStore.themeId = draft.themeId
  softwareSettingsStore.fontId = draft.fontId
  softwareSettingsStore.defaultBrowserPath = draft.defaultBrowserPath
  softwareSettingsStore.defaultRuntimeKind = draft.defaultRuntimeKind
  softwareSettingsStore.defaultRuntimeRepo = draft.defaultRuntimeRepo
  softwareSettingsStore.defaultRuntimeTagName = draft.defaultRuntimeTagName
  softwareSettingsStore.defaultRuntimeAssetName = draft.defaultRuntimeAssetName
  await softwareSettingsStore.save()
}

const reset = () => {
  softwareSettingsStore.reset()
}
</script>

<template>
  <section class="software-settings-page">
    <section class="hero-card settings-hero-card">
      <div>
        <p class="eyebrow">Preferences</p>
        <h2>Software Settings</h2>
      </div>
      <div class="theme-preview-surface compact-preview">
        <div class="theme-preview-cardlet">
          <strong>Theme</strong>
          <span class="muted">{{ softwareSettingsStore.themeOptions.find((item) => item.id === draft.themeId)?.label }}</span>
        </div>
      </div>
    </section>

    <div v-if="showRuntimeInstallModal" class="settings-modal-backdrop runtime-install-modal-backdrop">
      <section class="settings-modal runtime-install-modal" role="dialog" aria-modal="true" aria-labelledby="runtime-install-title">
        <div class="runtime-install-modal-content">
          <div>
            <p class="eyebrow">Runtime Installer</p>
            <h3 id="runtime-install-title">{{ installPhaseLabel }}</h3>
          </div>
          <p class="muted">{{ installState.message || selectedRuntimeAsset?.name || '正在安装 runtime' }}</p>
          <div class="runtime-install-progress" aria-label="runtime 安装进度">
            <div class="runtime-install-progress-bar" :style="{ width: `${installProgressPercent}%` }"></div>
          </div>
          <div class="runtime-install-progress-meta">
            <span>{{ installProgressLabel }}</span>
            <strong>{{ installProgressPercent }}%</strong>
          </div>
        </div>
      </section>
    </div>

    <section class="card software-settings-form-card">
      <form class="profile-form" @submit.prevent="save">
        <div class="grid">
          <label>
            主题
            <select v-model="draft.themeId">
              <option v-for="theme in softwareSettingsStore.themeOptions" :key="theme.id" :value="theme.id">
                {{ theme.label }}
              </option>
            </select>
          </label>

          <label>
            字体
            <select v-model="draft.fontId">
              <option v-for="font in softwareSettingsStore.fontOptions" :key="font.id" :value="font.id">
                {{ font.label }}
              </option>
            </select>
          </label>

          <label class="runtime-manager-field full-row">
            <span class="field-label">
              默认 Runtime Browser Path
              <span class="help-tooltip" tabindex="0" aria-label="所有未启用单独覆盖的 Profile 都会使用这里的 runtime。" data-tooltip="所有未启用单独覆盖的 Profile 都会使用这里的 runtime。">?</span>
            </span>
            <input v-model="draft.defaultBrowserPath" required />
            <small class="muted">当前类型：{{ runtimeKindLabel(draft.defaultRuntimeKind) }}</small>
            <div class="runtime-manager-card">
              <div class="runtime-manager-actions">
                <button class="secondary-button" type="button" :disabled="loadingInstalled" @click="refreshInstalledRuntimes">
                  {{ loadingInstalled ? '读取中...' : '读取本地 Runtime' }}
                </button>
                <select v-model="selectedInstalledRuntimeId" :disabled="loadingInstalled || installedRuntimes.length === 0">
                  <option v-if="installedRuntimes.length === 0" value="">未找到本地 runtime</option>
                  <option v-for="runtime in installedRuntimes" :key="installedRuntimeKey(runtime)" :value="installedRuntimeKey(runtime)">
                    {{ `${runtimeKindLabel(runtime.kind)} · ${runtime.displayName} · ${runtime.browserPath}` }}
                  </option>
                </select>
                <button type="button" :disabled="!selectedInstalledRuntime" @click="selectInstalledRuntimeAsDefault">
                  设为默认
                </button>
              </div>
              <div class="runtime-manager-actions">
                <button class="secondary-button" type="button" :disabled="loading" @click="refreshRuntimeReleases">
                  {{ loading ? '读取中...' : '读取 Release Runtime' }}
                </button>
                <select v-model="selectedRuntimeAssetName" :disabled="loading || installing || releases.length === 0">
                  <option v-if="releases.length === 0" value="">暂无 runtime 资产</option>
                  <option v-for="asset in releases" :key="runtimeAssetKey(asset)" :value="runtimeAssetKey(asset)">
                    {{ isRuntimeAssetAvailable(asset) ? `${runtimeKindLabel(asset.kind)} · ${asset.tagName} · ${asset.name} · ${formatBytes(asset.size)}` : `${runtimeKindLabel(asset.kind)} · 获取失败：${asset.error || 'latest release 未返回'}` }}
                  </option>
                </select>
                <button type="button" :disabled="!canInstallSelectedRuntime || installing" @click="installSelectedRuntime">
                  {{ installing ? '安装中...' : canInstallSelectedRuntime ? '下载并设为默认' : '不可下载' }}
                </button>
              </div>
              <small v-if="installState.message" class="muted">{{ installState.message }}</small>
              <small v-if="selectedRuntimeAssetError || error || softwareSettingsStore.runtimeSettingsError" class="error-text">
                {{ selectedRuntimeAssetError || error || softwareSettingsStore.runtimeSettingsError }}
              </small>
            </div>
          </label>
        </div>

        <div class="hero-actions">
          <button type="submit" :disabled="softwareSettingsStore.savingRuntimeSettings">
            {{ softwareSettingsStore.savingRuntimeSettings ? '保存中...' : '保存软件设置' }}
          </button>
          <button type="button" class="secondary-button" @click="reset">恢复默认</button>
        </div>
      </form>
    </section>
  </section>
</template>
