<script setup lang="ts">
import { reactive } from 'vue'
import type { ExtensionEntry } from '../../types/extension'

const props = defineProps<{
  items: ExtensionEntry[]
}>()

const emit = defineEmits<{
  importDir: [id: string, sourcePath: string]
  importCrx: [id: string, sourcePath: string]
}>()

const form = reactive({
  id: '',
  sourcePath: '',
  kind: 'dir' as 'dir' | 'crx',
})

const submit = () => {
  const id = form.id.trim()
  const sourcePath = form.sourcePath.trim()
  if (!id || !sourcePath) {
    return
  }
  if (form.kind === 'dir') {
    emit('importDir', id, sourcePath)
  } else {
    emit('importCrx', id, sourcePath)
  }
  form.id = ''
  form.sourcePath = ''
}
</script>

<template>
  <section class="settings-section-stack">
    <section class="settings-subsection">
      <div class="card-header">
        <div>
          <h3>已安装扩展</h3>
          <p class="muted">这里显示当前可供 profile 勾选的受管扩展。</p>
        </div>
      </div>
      <ul v-if="props.items.length" class="settings-chip-list">
        <li v-for="item in props.items" :key="item.id" class="settings-chip-item">
          <strong>{{ item.id }}</strong>
          <span class="muted">{{ item.kind }} · {{ item.path }}</span>
        </li>
      </ul>
      <p v-else class="muted">还没有导入扩展。</p>
    </section>

    <section class="settings-subsection">
      <div class="card-header">
        <div>
          <h3>导入扩展</h3>
          <p class="muted">支持解压目录和本地 CRX。</p>
        </div>
      </div>
      <div class="import-grid">
        <label>
          导入类型
          <select v-model="form.kind">
            <option value="dir">解压目录</option>
            <option value="crx">CRX 文件</option>
          </select>
        </label>
        <label>
          扩展 ID
          <input v-model="form.id" placeholder="例如 ublock-origin" />
        </label>
        <label class="import-path">
          源路径
          <input v-model="form.sourcePath" placeholder="例如 E:/Downloads/extension 或 .crx 文件" />
        </label>
        <div class="import-actions">
          <button @click="submit">导入扩展</button>
        </div>
      </div>
    </section>
  </section>
</template>
