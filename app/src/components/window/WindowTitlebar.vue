<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const isMaximized = ref(false)
let unlistenMaximized: (() => void) | null = null

const titlebarLabel = computed(() => (isMaximized.value ? '还原窗口' : '最大化窗口'))

const syncMaximized = async () => {
  isMaximized.value = await window.electronAPI.windowControls.isMaximized()
}

const minimize = async () => {
  try {
    await window.electronAPI.windowControls.minimize()
  } catch (error) {
    console.error('Failed to minimize window', error)
  }
}

const toggleMaximize = async () => {
  try {
    isMaximized.value = await window.electronAPI.windowControls.toggleMaximize()
  } catch (error) {
    console.error('Failed to toggle maximize state', error)
  }
}

const closeWindow = async () => {
  try {
    await window.electronAPI.windowControls.close()
  } catch (error) {
    console.error('Failed to close window', error)
  }
}

onMounted(async () => {
  await syncMaximized()
  unlistenMaximized = window.electronAPI.windowControls.onMaximizedChange((maximized) => {
    isMaximized.value = maximized
  })
})

onUnmounted(() => {
  unlistenMaximized?.()
  unlistenMaximized = null
})
</script>

<template>
  <header class="window-titlebar" @dblclick="toggleMaximize">
    <div class="window-titlebar__drag">
      <div class="window-titlebar__brand">
        <img class="window-app-icon" src="/build/icons/icon-32.png" alt="" />
        <strong>Chromium Profile Manager</strong>
      </div>
    </div>

    <div class="window-titlebar__actions" @mousedown.stop @dblclick.stop>
      <button class="window-control is-minimize" type="button" title="最小化窗口" @mousedown.stop @click.stop="minimize">
        <span />
      </button>
      <button class="window-control is-maximize" type="button" :title="titlebarLabel" @mousedown.stop @click.stop="toggleMaximize">
        <span v-if="!isMaximized" class="window-control-box" />
        <span v-else class="window-control-restore">
          <i />
          <i />
        </span>
      </button>
      <button class="window-control is-close" type="button" title="关闭窗口" @mousedown.stop @click.stop="closeWindow">
        <span class="window-control-close" />
      </button>
    </div>
  </header>
</template>
