<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRuntimeManagerStore } from '../stores/runtime_manager'
import { useSoftwareSettingsStore } from '../stores/software_settings'

const softwareSettingsStore = useSoftwareSettingsStore()
const runtimeManagerStore = useRuntimeManagerStore()
const { releases, loading, installing, error, installState } = storeToRefs(runtimeManagerStore)

const draft = reactive({
  themeId: softwareSettingsStore.themeId,
  fontId: softwareSettingsStore.fontId,
  defaultBrowserPath: softwareSettingsStore.defaultBrowserPath,
})
const selectedRuntimeAssetName = ref('')
const selectedRuntimeAsset = computed(() => releases.value.find((asset) => asset.name === selectedRuntimeAssetName.value))

watch(
  () => [softwareSettingsStore.themeId, softwareSettingsStore.fontId, softwareSettingsStore.defaultBrowserPath],
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
      selectedRuntimeAssetName.value = value[0].name
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
  void runtimeManagerStore.refreshInstallState()
})

const formatBytes = (value: number) => {
  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`
  }
  return `${Math.round(value / 1024 / 1024)} MB`
}

const refreshRuntimeReleases = () => runtimeManagerStore.refreshReleases()

const installSelectedRuntime = async () => {
  if (!selectedRuntimeAsset.value) {
    return
  }
  const result = await runtimeManagerStore.install(selectedRuntimeAsset.value)
  if (result) {
    draft.defaultBrowserPath = result.browserPath
  }
}

const save = async () => {
  softwareSettingsStore.themeId = draft.themeId
  softwareSettingsStore.fontId = draft.fontId
  softwareSettingsStore.defaultBrowserPath = draft.defaultBrowserPath
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
            默认 Runtime Browser Path
            <input v-model="draft.defaultBrowserPath" required />
            <small class="muted">所有未启用单独覆盖的 Profile 都会使用这里的 runtime。</small>
            <div class="runtime-manager-card">
              <div class="runtime-manager-actions">
                <button class="secondary-button" type="button" :disabled="loading" @click="refreshRuntimeReleases">
                  {{ loading ? '读取中...' : '读取 Release Runtime' }}
                </button>
                <select v-model="selectedRuntimeAssetName" :disabled="loading || installing || releases.length === 0">
                  <option v-if="releases.length === 0" value="">暂无 runtime 资产</option>
                  <option v-for="asset in releases" :key="asset.id" :value="asset.name">
                    {{ asset.releaseName }} · {{ asset.name }} · {{ formatBytes(asset.size) }}
                  </option>
                </select>
                <button type="button" :disabled="!selectedRuntimeAsset || installing" @click="installSelectedRuntime">
                  {{ installing ? '安装中...' : '下载并设为默认' }}
                </button>
              </div>
              <small v-if="installState.message" class="muted">{{ installState.message }}</small>
              <small v-if="error || softwareSettingsStore.runtimeSettingsError" class="error-text">
                {{ error || softwareSettingsStore.runtimeSettingsError }}
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
