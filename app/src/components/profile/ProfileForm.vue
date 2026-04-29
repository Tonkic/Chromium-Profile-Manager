<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { ExtensionEntry } from '../../types/extension'
import type { Profile } from '../../types/profile'
import { emptyProfile } from '../../types/profile'
import { useRuntimeManagerStore } from '../../stores/runtime_manager'

const props = defineProps<{
  modelValue?: Profile | null
  availableExtensions?: ExtensionEntry[]
}>()

const emit = defineEmits<{
  submit: [profile: Profile, originalId: string]
}>()

const runtimeManagerStore = useRuntimeManagerStore()
const { releases, loading, installing, error, installState } = storeToRefs(runtimeManagerStore)

const form = reactive<Profile>(emptyProfile())
const originalId = computed(() => props.modelValue?.id ?? form.id)
const selectedRuntimeAssetName = ref('')
const selectedRuntimeAsset = computed(() => releases.value.find((asset) => asset.name === selectedRuntimeAssetName.value))

watch(
  () => props.modelValue,
  (value) => {
    Object.assign(form, value ?? emptyProfile())
  },
  { immediate: true },
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
  if (!window.electronAPI) {
    return
  }
  if (runtimeManagerStore.releases.length === 0) {
    void runtimeManagerStore.refreshReleases()
  }
  void runtimeManagerStore.refreshInstallState()
})

const extraArgsText = computed({
  get: () => form.extraArgs.join('\n'),
  set: (value: string) => {
    form.extraArgs = value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
  },
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
    form.browserPath = result.browserPath
  }
}

const toggleExtension = (id: string, enabled: boolean) => {
  const existing = form.extensions.find((item) => item.id === id)
  if (enabled) {
    if (!existing) {
      form.extensions.push({ id, enabled: true })
    } else {
      existing.enabled = true
    }
    return
  }
  form.extensions = form.extensions.filter((item) => item.id !== id)
}

const submit = () => {
  emit(
    'submit',
    {
      ...form,
      windowSize: form.windowSize ?? [1400, 900],
      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    originalId.value,
  )
}
</script>

<template>
  <form class="profile-form" @submit.prevent="submit">
    <div class="grid">
      <label>
        名称
        <input v-model="form.name" required />
      </label>
      <label>
        ID
        <input v-model="form.id" required />
        <small class="muted">ID 用作目录名（data/profiles/&lt;id&gt;）并关联日志（data/logs/&lt;id&gt;.log）。</small>
      </label>
      <label class="runtime-manager-field">
        Browser Path
        <input v-model="form.browserPath" required />
        <small class="muted">需要 chrome.exe 所在的完整 runtime，不是 source code。Lite 版本可从 Release 下载，Full 版本会内置。</small>
        <div class="runtime-manager-card">
          <div class="runtime-manager-actions">
            <button class="secondary-button" type="button" :disabled="loading" @click="refreshRuntimeReleases">
              {{ loading ? '读取中...' : '读取 Release Runtime' }}
            </button>
            <select v-model="selectedRuntimeAssetName" :disabled="loading || installing || releases.length === 0">
              <option v-if="releases.length === 0" value="">暂无 runtime 资产</option>
              <option v-for="asset in releases" :key="asset.id" :value="asset.name">
                {{ asset.name }} · {{ formatBytes(asset.size) }}
              </option>
            </select>
            <button type="button" :disabled="!selectedRuntimeAsset || installing" @click="installSelectedRuntime">
              {{ installing ? '安装中...' : '下载并使用' }}
            </button>
          </div>
          <small v-if="installState.message" class="muted">{{ installState.message }}</small>
          <small v-if="error" class="error-text">{{ error }}</small>
        </div>
      </label>
      <label>
        User Data Dir
        <input v-model="form.userDataDir" required />
      </label>
      <label>
        代理
        <input v-model="form.proxy" />
      </label>
      <label>
        语言
        <input v-model="form.lang" />
      </label>
      <label>
        时区
        <input v-model="form.timezone" />
      </label>
      <label>
        备注
        <input v-model="form.note" />
      </label>
      <label>
        启动参数
        <textarea v-model="extraArgsText" rows="4" />
      </label>
      <fieldset class="extensions-fieldset">
        <legend>扩展</legend>
        <label v-for="item in availableExtensions ?? []" :key="item.id" class="extension-checkbox-row">
          <input
            type="checkbox"
            :checked="form.extensions.some((ext) => ext.id === item.id && ext.enabled)"
            @change="toggleExtension(item.id, ($event.target as HTMLInputElement).checked)"
          />
          <span class="text-rect">{{ item.id }} ({{ item.kind }})</span>
        </label>
      </fieldset>
    </div>
    <button type="submit">保存 Profile</button>
  </form>
</template>
