<script setup lang="ts">
defineProps<{
  running?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button class="launch-button" @click="$emit('click')">
    {{ running ? '停止' : '启动' }}
  </button>
</template>
