<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const appWindow = getCurrentWindow()
const isMaximized = ref(false)
let unlistenResize: (() => void) | null = null

const titlebarLabel = computed(() => (isMaximized.value ? '还原窗口' : '最大化窗口'))

const syncMaximized = async () => {
  isMaximized.value = await appWindow.isMaximized()
}

const minimize = async () => {
  try {
    await appWindow.minimize()
  } catch (error) {
    console.error('Failed to minimize window', error)
  }
}

const toggleMaximize = async () => {
  try {
    const maximized = await appWindow.isMaximized()
    if (maximized) {
      await appWindow.unmaximize()
    } else {
      await appWindow.maximize()
    }
    await syncMaximized()
  } catch (error) {
    console.error('Failed to toggle maximize state', error)
  }
}

const closeWindow = async () => {
  try {
    await appWindow.close()
  } catch (error) {
    console.error('Failed to close window', error)
  }
}

onMounted(async () => {
  await syncMaximized()
  unlistenResize = await appWindow.onResized(async () => {
    await syncMaximized()
  })
})

onUnmounted(() => {
  unlistenResize?.()
  unlistenResize = null
})
</script>

<template>
  <header class="window-titlebar" data-tauri-drag-region @dblclick="toggleMaximize">
    <div class="window-titlebar__drag" data-tauri-drag-region>
      <div class="window-titlebar__brand" data-tauri-drag-region>
        <span class="window-dot" data-tauri-drag-region />
        <strong data-tauri-drag-region>Chromium Profile Manager</strong>
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
