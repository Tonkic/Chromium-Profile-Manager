<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { ExtensionEntry } from '../../types/extension'
import type { DisableSpoofingTarget, FingerprintLaunchSettings, FingerprintSettings, Profile } from '../../types/profile'
import { emptyProfile } from '../../types/profile'
import { testFingerprintUserAgentUrl } from '../../services/fingerprint'

const props = defineProps<{
  modelValue?: Profile | null
  availableExtensions?: ExtensionEntry[]
  section?: 'general' | 'fingerprint'
}>()

const emit = defineEmits<{
  submit: [profile: Profile, originalId: string]
  dirtyChange: [dirty: boolean]
}>()

const disableSpoofingTargets: DisableSpoofingTarget[] = ['font', 'audio', 'canvas', 'clientrects', 'gpu']

const defaultFingerprintLaunch = (): FingerprintLaunchSettings => ({
  seed: '',
  platform: '',
  platformVersion: '',
  brand: '',
  brandVersion: '',
  hardwareConcurrency: '',
  disableNonProxiedUdp: true,
  disableSpoofing: [],
})

const defaultFingerprint = (): FingerprintSettings => ({
  enabled: false,
  source: 'none',
  userAgentUrl: '',
  userAgentText: '',
  jsonText: '',
  launch: defaultFingerprintLaunch(),
})

const cloneProfile = (profile: Profile): Profile => {
  const sourceFingerprint = profile.fingerprint ?? {}
  const sourceLaunch = sourceFingerprint.launch ?? {}
  return {
    ...profile,
    windowSize: profile.windowSize ? ([...profile.windowSize] as [number, number]) : undefined,
    extensions: profile.extensions.map((item) => ({ ...item })),
    extraArgs: [...profile.extraArgs],
    fingerprint: {
      ...defaultFingerprint(),
      ...sourceFingerprint,
      launch: {
        ...defaultFingerprintLaunch(),
        ...sourceLaunch,
        disableSpoofing: [...(sourceLaunch.disableSpoofing ?? [])],
      },
    },
  }
}

const form = reactive<Profile>(emptyProfile())
const originalId = ref('')
const baseline = ref('')
const runtimeOverrideEnabled = ref(false)
const fingerprintTestLoading = ref(false)
const fingerprintTestResult = ref('')
const fingerprintTestError = ref('')

const activeSection = computed(() => props.section ?? 'general')

const fingerprint = computed({
  get: () => {
    form.fingerprint ??= defaultFingerprint()
    return form.fingerprint
  },
  set: (value: FingerprintSettings) => {
    form.fingerprint = value
  },
})

const fingerprintLaunch = computed(() => {
  fingerprint.value.launch ??= defaultFingerprintLaunch()
  fingerprint.value.launch.disableSpoofing ??= []
  return fingerprint.value.launch
})

const toggleDisableSpoofing = (target: DisableSpoofingTarget, enabled: boolean) => {
  const current = fingerprintLaunch.value.disableSpoofing ?? []
  fingerprintLaunch.value.disableSpoofing = enabled
    ? Array.from(new Set([...current, target]))
    : current.filter((item) => item !== target)
}

const normalizedFingerprintLaunch = (): FingerprintLaunchSettings => {
  const launch = fingerprintLaunch.value
  return {
    seed: launch.seed?.trim() ?? '',
    platform: launch.platform ?? '',
    platformVersion: launch.platformVersion?.trim() ?? '',
    brand: launch.brand?.trim() ?? '',
    brandVersion: launch.brandVersion?.trim() ?? '',
    hardwareConcurrency: launch.hardwareConcurrency?.trim() ?? '',
    disableNonProxiedUdp: Boolean(launch.disableNonProxiedUdp),
    disableSpoofing: disableSpoofingTargets.filter((target) => launch.disableSpoofing?.includes(target)),
  }
}

const normalizedFingerprint = (): FingerprintSettings => {
  const settings = fingerprint.value
  return {
    enabled: Boolean(settings.enabled),
    source: settings.enabled ? (settings.source || 'text') : 'none',
    userAgentUrl: settings.userAgentUrl?.trim() ?? '',
    userAgentText: settings.userAgentText?.trim() ?? '',
    jsonText: settings.jsonText?.trim() ?? '',
    launch: normalizedFingerprintLaunch(),
  }
}

const comparableDraft = () => ({
  id: form.id,
  name: form.name,
  note: form.note ?? '',
  browserPath: form.browserPath,
  browserPathOverride: runtimeOverrideEnabled.value ? form.browserPathOverride?.trim() ?? '' : '',
  userDataDir: form.userDataDir,
  proxy: form.proxy ?? '',
  lang: form.lang ?? '',
  timezone: form.timezone ?? '',
  windowSize: form.windowSize ?? [1400, 900],
  extensions: form.extensions.map((item) => ({ id: item.id, enabled: Boolean(item.enabled) })),
  extraArgs: [...form.extraArgs],
  fingerprint: normalizedFingerprint(),
  bookmarkSetId: form.bookmarkSetId ?? '',
  createdAt: form.createdAt,
})

const serializeDraft = () => JSON.stringify(comparableDraft())
const isDirty = computed(() => serializeDraft() !== baseline.value)

watch(
  () => props.modelValue,
  (value) => {
    const next = cloneProfile(value ?? emptyProfile())
    Object.assign(form, next)
    form.extensions = next.extensions
    form.extraArgs = next.extraArgs
    form.windowSize = next.windowSize
    form.fingerprint = next.fingerprint
    form.browserPathOverride = next.browserPathOverride
    originalId.value = value?.id ?? form.id
    runtimeOverrideEnabled.value = Boolean(form.browserPathOverride)
    fingerprintTestResult.value = ''
    fingerprintTestError.value = ''
    baseline.value = serializeDraft()
  },
  { immediate: true },
)

watch(isDirty, (dirty) => emit('dirtyChange', dirty), { immediate: true })

const validatePositiveInteger = (value: string | undefined, message: string) => {
  if (value && !/^[1-9]\d*$/.test(value)) {
    window.alert(message)
    return false
  }
  return true
}

const validateFingerprint = (settings: FingerprintSettings) => {
  if (!validatePositiveInteger(settings.launch?.seed, '指纹 Seed 必须是正整数')) {
    return false
  }
  if (!validatePositiveInteger(settings.launch?.hardwareConcurrency, 'CPU 核心数必须是正整数')) {
    return false
  }
  if (!settings.enabled) {
    return true
  }
  if (settings.source === 'url') {
    try {
      const parsed = new URL(settings.userAgentUrl ?? '')
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error()
      }
      return true
    } catch {
      window.alert('User-Agent URL 必须是有效的 http 或 https 地址')
      return false
    }
  }
  if (settings.source === 'text' && !settings.userAgentText) {
    window.alert('请填写 User-Agent 文本')
    return false
  }
  if (settings.source === 'json') {
    try {
      JSON.parse(settings.jsonText ?? '')
      return true
    } catch {
      window.alert('指纹 JSON 格式无效')
      return false
    }
  }
  return true
}

const testFingerprintUrl = async () => {
  fingerprintTestLoading.value = true
  fingerprintTestResult.value = ''
  fingerprintTestError.value = ''
  try {
    const result = await testFingerprintUserAgentUrl(fingerprint.value.userAgentUrl ?? '')
    fingerprintTestResult.value = result.userAgent
  } catch (error) {
    fingerprintTestError.value = error instanceof Error ? error.message : String(error)
  } finally {
    fingerprintTestLoading.value = false
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
  const nextFingerprint = normalizedFingerprint()
  if (!validateFingerprint(nextFingerprint)) {
    return
  }
  const profile: Profile = {
    ...form,
    extensions: form.extensions.map((item) => ({ ...item })),
    extraArgs: [...form.extraArgs],
    fingerprint: nextFingerprint,
    browserPathOverride: runtimeOverrideEnabled.value ? form.browserPathOverride?.trim() : undefined,
    windowSize: form.windowSize ? ([...form.windowSize] as [number, number]) : [1400, 900],
    createdAt: form.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  emit('submit', profile, originalId.value)
}

defineExpose({ submit })
</script>

<template>
  <form class="profile-form" @submit.prevent="submit">
    <div v-if="activeSection === 'general'" class="grid">
      <label>
        名称
        <input v-model="form.name" required />
      </label>
      <label>
        <span class="field-label">
          ID
          <span class="help-tooltip" tabindex="0" aria-label="ID 用作目录名（data/profiles/<id>）并关联日志（data/logs/<id>.log）。" data-tooltip="ID 用作目录名（data/profiles/<id>）并关联日志（data/logs/<id>.log）。">?</span>
        </span>
        <input v-model="form.id" required />
      </label>
      <label class="runtime-manager-field">
        <span class="field-label">
          Runtime
          <span class="help-tooltip" tabindex="0" aria-label="默认使用软件设置里的全局 runtime；只有少数 Profile 需要不同 runtime 时才启用覆盖。" data-tooltip="默认使用软件设置里的全局 runtime；只有少数 Profile 需要不同 runtime 时才启用覆盖。">?</span>
        </span>
        <label class="extension-checkbox-row runtime-override-toggle">
          <input v-model="runtimeOverrideEnabled" type="checkbox" />
          <span>为这个 Profile 单独覆盖默认 runtime</span>
        </label>
        <input v-if="runtimeOverrideEnabled" v-model="form.browserPathOverride" placeholder="./runtime/.../chrome.exe" required />
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

    <div v-if="activeSection === 'fingerprint'" class="grid">
      <fieldset class="extensions-fieldset">
        <legend>指纹 / User-Agent</legend>
        <label class="extension-checkbox-row">
          <input v-model="fingerprint.enabled" type="checkbox" />
          <span class="field-label">
            启用这个 Profile 的 User-Agent 设置
            <span class="help-tooltip" tabindex="0" aria-label="只控制 User-Agent 来源；下方指纹启动参数会独立保存。" data-tooltip="只控制 User-Agent 来源；下方指纹启动参数会独立保存。">?</span>
          </span>
        </label>
        <label v-if="fingerprint.enabled">
          <span class="field-label">
            来源
            <span class="help-tooltip" tabindex="0" aria-label="text 使用固定文本，URL 会在每次启动时请求，JSON 支持 userAgent/ua 和 args/extraArgs。" data-tooltip="text 使用固定文本，URL 会在每次启动时请求，JSON 支持 userAgent/ua 和 args/extraArgs。">?</span>
          </span>
          <select v-model="fingerprint.source">
            <option value="text">手动文本</option>
            <option value="url">URL 每次启动获取</option>
            <option value="json">JSON</option>
          </select>
        </label>
        <label v-if="fingerprint.enabled && fingerprint.source === 'url'">
          <span class="field-label">
            User-Agent URL
            <span class="help-tooltip" tabindex="0" aria-label="启动浏览器时由 Electron 后端请求；URL 会保存在 profile.json，导出 Profile 时也会包含。" data-tooltip="启动浏览器时由 Electron 后端请求；URL 会保存在 profile.json，导出 Profile 时也会包含。">?</span>
          </span>
          <div class="inline-action-row">
            <input v-model="fingerprint.userAgentUrl" placeholder="http://111.231.98.57/ua.php?key=..." required />
            <button type="button" class="secondary-button" :disabled="fingerprintTestLoading" @click="testFingerprintUrl">
              {{ fingerprintTestLoading ? '测试中...' : '测试 URL' }}
            </button>
          </div>
          <small v-if="fingerprintTestResult" class="success-text text-rect">{{ fingerprintTestResult }}</small>
          <small v-if="fingerprintTestError" class="error-text">{{ fingerprintTestError }}</small>
        </label>
        <label v-if="fingerprint.enabled && fingerprint.source === 'text'">
          User-Agent 文本
          <textarea v-model="fingerprint.userAgentText" rows="3" required />
        </label>
        <label v-if="fingerprint.enabled && fingerprint.source === 'json'">
          <span class="field-label">
            JSON
            <span class="help-tooltip" tabindex="0" aria-label="支持 userAgent/ua 和 args/extraArgs；这些参数会在结构化指纹参数之前追加。" data-tooltip="支持 userAgent/ua 和 args/extraArgs；这些参数会在结构化指纹参数之前追加。">?</span>
          </span>
          <textarea v-model="fingerprint.jsonText" rows="5" placeholder='{ "userAgent": "Mozilla/5.0 ...", "args": ["--fingerprint=1000"] }' required />
        </label>
      </fieldset>

      <fieldset class="extensions-fieldset">
        <legend>基础指纹</legend>
        <label>
          <span class="field-label">
            指纹 Seed
            <span class="help-tooltip" tabindex="0" aria-label="生成 --fingerprint=<seed>，填写正整数后多数指纹特性会生效。" data-tooltip="生成 --fingerprint=<seed>，填写正整数后多数指纹特性会生效。">?</span>
          </span>
          <input v-model="fingerprintLaunch.seed" inputmode="numeric" placeholder="1000" />
        </label>
        <label>
          <span class="field-label">
            平台
            <span class="help-tooltip" tabindex="0" aria-label="生成 --fingerprint-platform，可选 windows、linux、macos。" data-tooltip="生成 --fingerprint-platform，可选 windows、linux、macos。">?</span>
          </span>
          <select v-model="fingerprintLaunch.platform">
            <option value="">默认</option>
            <option value="windows">windows</option>
            <option value="linux">linux</option>
            <option value="macos">macos</option>
          </select>
        </label>
        <label>
          <span class="field-label">
            平台版本
            <span class="help-tooltip" tabindex="0" aria-label="生成 --fingerprint-platform-version；留空时使用 runtime 默认版本。" data-tooltip="生成 --fingerprint-platform-version；留空时使用 runtime 默认版本。">?</span>
          </span>
          <input v-model="fingerprintLaunch.platformVersion" placeholder="15.2.0" />
        </label>
      </fieldset>

      <fieldset class="extensions-fieldset">
        <legend>浏览器品牌</legend>
        <label>
          <span class="field-label">
            品牌
            <span class="help-tooltip" tabindex="0" aria-label="生成 --fingerprint-brand，影响 User-Agent 和 User-Agent Data；留空时默认为 Chromium。" data-tooltip="生成 --fingerprint-brand，影响 User-Agent 和 User-Agent Data；留空时默认为 Chromium。">?</span>
          </span>
          <select v-model="fingerprintLaunch.brand">
            <option value="">默认 Chromium</option>
            <option value="Chrome">Chrome</option>
            <option value="Edge">Edge</option>
            <option value="Opera">Opera</option>
            <option value="Vivaldi">Vivaldi</option>
          </select>
        </label>
        <label>
          <span class="field-label">
            品牌版本
            <span class="help-tooltip" tabindex="0" aria-label="生成 --fingerprint-brand-version；留空时使用 runtime 默认版本。" data-tooltip="生成 --fingerprint-brand-version；留空时使用 runtime 默认版本。">?</span>
          </span>
          <input v-model="fingerprintLaunch.brandVersion" placeholder="144.0.7559.132" />
        </label>
      </fieldset>

      <fieldset class="extensions-fieldset">
        <legend>硬件 / WebRTC / 反检测</legend>
        <label>
          <span class="field-label">
            CPU 核心数
            <span class="help-tooltip" tabindex="0" aria-label="生成 --fingerprint-hardware-concurrency；留空时根据 seed 随机生成。" data-tooltip="生成 --fingerprint-hardware-concurrency；留空时根据 seed 随机生成。">?</span>
          </span>
          <input v-model="fingerprintLaunch.hardwareConcurrency" inputmode="numeric" placeholder="8" />
        </label>
        <label class="extension-checkbox-row">
          <input v-model="fingerprintLaunch.disableNonProxiedUdp" type="checkbox" />
          <span class="field-label">
            禁用非代理 UDP
            <span class="help-tooltip" tabindex="0" aria-label="生成 --disable-non-proxied-udp，用于限制 WebRTC 非代理 UDP 连接。" data-tooltip="生成 --disable-non-proxied-udp，用于限制 WebRTC 非代理 UDP 连接。">?</span>
          </span>
        </label>
        <div class="full-row">
          <span class="field-label">
            Disable spoofing
            <span class="help-tooltip" tabindex="0" aria-label="生成 --disable-spoofing=...，可选择 font、audio、canvas、clientrects、gpu。" data-tooltip="生成 --disable-spoofing=...，可选择 font、audio、canvas、clientrects、gpu。">?</span>
          </span>
          <label v-for="target in disableSpoofingTargets" :key="target" class="extension-checkbox-row">
            <input
              type="checkbox"
              :checked="fingerprintLaunch.disableSpoofing?.includes(target)"
              @change="toggleDisableSpoofing(target, ($event.target as HTMLInputElement).checked)"
            />
            <span>{{ target }}</span>
          </label>
        </div>
      </fieldset>

      <fieldset class="extensions-fieldset full-row">
        <legend>启动环境</legend>
        <div class="grid compact-grid">
          <label>
            <span class="field-label">
              代理
              <span class="help-tooltip" tabindex="0" aria-label="启动时生成 --proxy-server；也会同步保存到常规设置里的代理字段。" data-tooltip="启动时生成 --proxy-server；也会同步保存到常规设置里的代理字段。">?</span>
            </span>
            <input v-model="form.proxy" placeholder="http://127.0.0.1:7890" />
          </label>
          <label>
            <span class="field-label">
              语言
              <span class="help-tooltip" tabindex="0" aria-label="启动时生成 --lang 和 --accept-lang；也会同步保存到常规设置里的语言字段。" data-tooltip="启动时生成 --lang 和 --accept-lang；也会同步保存到常规设置里的语言字段。">?</span>
            </span>
            <input v-model="form.lang" placeholder="en-US" />
          </label>
          <label>
            <span class="field-label">
              时区
              <span class="help-tooltip" tabindex="0" aria-label="启动时生成 --timezone；也会同步保存到常规设置里的时区字段。" data-tooltip="启动时生成 --timezone；也会同步保存到常规设置里的时区字段。">?</span>
            </span>
            <input v-model="form.timezone" placeholder="America/Los_Angeles" />
          </label>
        </div>
      </fieldset>
    </div>
    <button type="submit">保存 Profile</button>
  </form>
</template>
