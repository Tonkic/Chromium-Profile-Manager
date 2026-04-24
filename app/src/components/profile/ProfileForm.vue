<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { ExtensionEntry } from '../../types/extension'
import type { Profile } from '../../types/profile'
import { emptyProfile } from '../../types/profile'

const props = defineProps<{
  modelValue?: Profile | null
  availableExtensions?: ExtensionEntry[]
}>()

const emit = defineEmits<{
  submit: [profile: Profile]
}>()

const form = reactive<Profile>(emptyProfile())

watch(
  () => props.modelValue,
  (value) => {
    Object.assign(form, value ?? emptyProfile())
  },
  { immediate: true },
)

const extraArgsText = computed({
  get: () => form.extraArgs.join('\n'),
  set: (value: string) => {
    form.extraArgs = value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
  },
})

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
  emit('submit', {
    ...form,
    windowSize: form.windowSize ?? [1400, 900],
    createdAt: form.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
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
      </label>
      <label>
        Browser Path
        <input v-model="form.browserPath" required />
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
      <fieldset>
        <legend>扩展</legend>
        <label v-for="item in availableExtensions ?? []" :key="item.id">
          <input
            type="checkbox"
            :checked="form.extensions.some((ext) => ext.id === item.id && ext.enabled)"
            @change="toggleExtension(item.id, ($event.target as HTMLInputElement).checked)"
          />
          {{ item.id }} ({{ item.kind }})
        </label>
      </fieldset>
    </div>
    <button type="submit">保存 Profile</button>
  </form>
</template>
