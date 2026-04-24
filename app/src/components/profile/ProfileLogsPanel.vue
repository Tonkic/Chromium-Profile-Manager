<script setup lang="ts">
import type { LogEntry } from '../../types/logs'

defineProps<{
  entries?: LogEntry[]
}>()
</script>

<template>
  <section class="card logs-panel">
    <div class="card-header">
      <div>
        <h3>日志</h3>
        <p class="muted">启动命令、解析后的路径和错误会写在这里。</p>
      </div>
    </div>
    <ul v-if="entries?.length" class="log-list">
      <li
        v-for="entry in entries"
        :key="`${entry.timestamp}-${entry.message}`"
        :class="['log-entry', `level-${entry.level}`]"
      >
        <div class="log-meta">
          <strong class="log-level">{{ entry.level }}</strong>
          <span class="log-time">{{ entry.timestamp }}</span>
        </div>
        <p class="log-message">{{ entry.message }}</p>
        <code v-if="entry.command?.length" class="log-command">{{ entry.command.join('\n') }}</code>
        <p v-if="entry.exitCode !== undefined" class="log-exit">exit code: {{ entry.exitCode }}</p>
      </li>
    </ul>
    <p v-else class="muted">暂无日志</p>
  </section>
</template>
