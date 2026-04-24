<script setup lang="ts">
import type { RuntimeStatus } from '../../types/runtime'

defineProps<{
  status?: RuntimeStatus
}>()
</script>

<template>
  <span class="runtime-badge" :data-status="status ?? 'idle'">
    {{ status ?? 'idle' }}
  </span>
</template>
