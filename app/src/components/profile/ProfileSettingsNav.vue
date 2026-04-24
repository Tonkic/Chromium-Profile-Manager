<script setup lang="ts">
export type SettingsSection = 'general' | 'launch' | 'extensions' | 'bookmarks' | 'logs'

const props = defineProps<{
  modelValue: SettingsSection
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SettingsSection]
}>()

const sections: Array<{
  key: SettingsSection
  label: string
  children?: string[]
}> = [
  { key: 'general', label: '常规' },
  { key: 'launch', label: '启动', children: ['路径配置', '启动参数'] },
  { key: 'extensions', label: '扩展', children: ['已安装扩展', '导入扩展'] },
  { key: 'bookmarks', label: '书签', children: ['书签导入', '快捷链接'] },
  { key: 'logs', label: '日志', children: ['运行日志', '错误定位'] },
]
</script>

<template>
  <nav class="settings-nav" aria-label="设置分类导航">
    <button
      v-for="section in sections"
      :key="section.key"
      :class="['settings-nav-item', { active: props.modelValue === section.key }]"
      @click="emit('update:modelValue', section.key)"
    >
      <span>{{ section.label }}</span>
      <small v-if="section.children?.length" class="settings-nav-children">
        {{ section.children.join(' · ') }}
      </small>
    </button>
  </nav>
</template>
