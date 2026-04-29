<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { ExportProfileArchiveResult, ImportProfileArchiveResult } from '../services/profiles'
import { useProfilesStore } from '../stores/profiles'
import { useRuntimeStore } from '../stores/runtime'

const profilesStore = useProfilesStore()
const runtimeStore = useRuntimeStore()

const { profiles } = storeToRefs(profilesStore)

const selectedIds = ref<string[]>([])
const includeUserData = ref(false)
const transferMessage = ref('')
const exporting = ref(false)
const importing = ref(false)
const exportResults = ref<ExportProfileArchiveResult[]>([])
const importResults = ref<ImportProfileArchiveResult[]>([])

const sortedProfiles = computed(() => profiles.value)
const allSelected = computed(() => sortedProfiles.value.length > 0 && selectedIds.value.length === sortedProfiles.value.length)

onMounted(async () => {
  await profilesStore.fetchProfiles()
  await Promise.all(sortedProfiles.value.map((profile) => runtimeStore.refresh(profile.id)))
})

const toggleProfile = (id: string) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((item) => item !== id)
    return
  }
  selectedIds.value = [...selectedIds.value, id]
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedIds.value = []
    return
  }
  selectedIds.value = sortedProfiles.value.map((profile) => profile.id)
}

const runExport = async () => {
  if (selectedIds.value.length === 0) {
    transferMessage.value = '请先选择至少一个 Profile。'
    return
  }
  exporting.value = true
  transferMessage.value = ''
  try {
    const result = await profilesStore.exportProfiles(selectedIds.value, includeUserData.value)
    exportResults.value = result
    transferMessage.value = result.length === 0 ? '已取消导出。' : `已导出 ${result.length} 个 Profile。`
  } catch (error) {
    transferMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    exporting.value = false
  }
}

const runImport = async () => {
  importing.value = true
  transferMessage.value = ''
  try {
    const result = await profilesStore.importProfiles()
    importResults.value = result
    if (result.length === 0) {
      transferMessage.value = '已取消导入。'
      return
    }
    const successCount = result.filter((item) => item.profile && !item.error).length
    transferMessage.value = `已处理 ${result.length} 个归档，成功 ${successCount} 个。`
    await Promise.all((profilesStore.profiles ?? []).map((profile) => runtimeStore.refresh(profile.id)))
  } catch (error) {
    transferMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <section class="profiles-detail-content transfer-page">
    <section class="card transfer-toolbar-card">
      <div class="transfer-toolbar-row">
        <h2>Profile Import / Export</h2>
        <div class="hero-actions">
          <button class="secondary-button" type="button" :disabled="importing || exporting" @click="runImport">
            {{ importing ? '导入中...' : '批量导入 ZIP' }}
          </button>
          <button type="button" :disabled="selectedIds.length === 0 || importing || exporting" @click="runExport">
            {{ exporting ? '导出中...' : `批量导出 (${selectedIds.length})` }}
          </button>
        </div>
      </div>

      <div class="transfer-toolbar-row compact">
        <button class="secondary-button" type="button" @click="toggleSelectAll">
          {{ allSelected ? '取消全选' : '全选' }}
        </button>

        <label class="transfer-switch" role="switch" :aria-checked="includeUserData">
          <input v-model="includeUserData" type="checkbox" />
          <span class="transfer-switch-track"><span class="transfer-switch-thumb" /></span>
          <span class="transfer-switch-label">包含 userData</span>
        </label>
      </div>

      <p v-if="transferMessage" class="muted">{{ transferMessage }}</p>
    </section>

    <section class="card transfer-table-card">
      <div class="transfer-table-head">
        <span></span>
        <span>Name</span>
        <span>ID</span>
        <span>Status</span>
      </div>

      <ul class="transfer-table-list">
        <li v-for="profile in sortedProfiles" :key="profile.id" :class="['transfer-table-row', { active: selectedIds.includes(profile.id) }]" @click="toggleProfile(profile.id)">
          <span>
            <input :checked="selectedIds.includes(profile.id)" type="checkbox" tabindex="-1" @click.stop @change="toggleProfile(profile.id)" />
          </span>
          <strong>{{ profile.name }}</strong>
          <span class="muted">{{ profile.id }}</span>
          <span class="runtime-badge" :data-status="runtimeStore.states[profile.id]?.status ?? 'idle'">{{ runtimeStore.states[profile.id]?.status ?? 'idle' }}</span>
        </li>
      </ul>
    </section>

    <section class="card" v-if="exportResults.length > 0">
      <h3>导出结果</h3>
      <ul class="transfer-result-list">
        <li v-for="item in exportResults" :key="item.profileId + item.filePath" class="transfer-result-item">
          <strong>{{ item.profileId }}</strong>
          <p class="muted">文件: {{ item.filePath }}</p>
          <p class="muted">包含 userData 选项: {{ item.includesUserData ? '是' : '否' }} · 实际写入 userData: {{ item.hasUserData ? '是' : '否' }}</p>
        </li>
      </ul>
    </section>

    <section class="card" v-if="importResults.length > 0">
      <h3>导入结果</h3>
      <ul class="transfer-result-list">
        <li v-for="item in importResults" :key="item.archivePath" class="transfer-result-item">
          <strong>{{ item.profile?.name ?? '导入失败' }}</strong>
          <p class="muted">归档: {{ item.archivePath }}</p>
          <p class="muted">检测到 userData: {{ item.hasUserData ? '是' : '否' }} · 已恢复 userData: {{ item.restoredUserData ? '是' : '否' }}</p>
          <p v-if="item.error" class="error-text">{{ item.error }}</p>
        </li>
      </ul>
    </section>
  </section>
</template>
