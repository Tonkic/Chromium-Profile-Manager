<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BookmarkEntry, QuickLink } from '../../types/bookmark'

const props = defineProps<{
  profileId?: string
  bookmarks?: BookmarkEntry[]
  quickLinks?: QuickLink[]
}>()

const emit = defineEmits<{
  saveBookmarks: [entries: BookmarkEntry[]]
  saveQuickLinks: [entries: QuickLink[]]
}>()

const bookmarksText = ref('')
const quickLinksText = ref('')

watch(
  () => props.bookmarks,
  (value) => {
    bookmarksText.value = (value ?? []).map((item) => `${item.title}|${item.url}`).join('\n')
  },
  { immediate: true },
)

watch(
  () => props.quickLinks,
  (value) => {
    quickLinksText.value = (value ?? []).map((item) => `${item.title}|${item.url}`).join('\n')
  },
  { immediate: true },
)

const parseLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, url] = line.split('|')
      return {
        title: title?.trim() ?? '',
        url: url?.trim() ?? '',
      }
    })
    .filter((item) => item.title && item.url)

const importJson = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) {
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result))
      const entries = Array.isArray(parsed)
        ? parsed
            .map((item) => ({ title: item.title ?? item.name ?? '', url: item.url ?? '' }))
            .filter((item) => item.title && item.url)
        : []
      emit('saveBookmarks', entries)
    } catch {
      // ignore invalid json for now
    }
  }
  reader.readAsText(file)
}

const importHtml = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) {
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const html = String(reader.result)
    const matches = [...html.matchAll(/<A[^>]*HREF="([^"]+)"[^>]*>(.*?)<\/A>/gi)]
    const entries = matches
      .map((match) => ({ title: match[2].trim(), url: match[1].trim() }))
      .filter((item) => item.title && item.url)
    emit('saveBookmarks', entries)
  }
  reader.readAsText(file)
}

const saveBookmarks = () => emit('saveBookmarks', parseLines(bookmarksText.value))
const saveQuickLinks = () => emit('saveQuickLinks', parseLines(quickLinksText.value))
</script>

<template>
  <section v-if="profileId" class="bookmarks-panel">
    <h3>书签</h3>
    <div class="actions">
      <label>
        导入 JSON
        <input type="file" accept="application/json,.json" @change="importJson" />
      </label>
      <label>
        导入 HTML
        <input type="file" accept="text/html,.html,.htm" @change="importHtml" />
      </label>
    </div>
    <textarea v-model="bookmarksText" rows="6" placeholder="标题|https://example.com" />
    <button @click="saveBookmarks">保存书签</button>
    <h3>快捷链接</h3>
    <textarea v-model="quickLinksText" rows="4" placeholder="标题|https://example.com" />
    <button @click="saveQuickLinks">保存快捷链接</button>
  </section>
</template>
