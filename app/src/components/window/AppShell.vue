<script setup lang="ts">
import WindowTitlebar from './WindowTitlebar.vue'
import ProfilesPage from '../../pages/ProfilesPage.vue'
</script>

<template>
  <div class="app-shell">
    <WindowTitlebar />
    <main class="app-shell__content">
      <ProfilesPage />
    </main>
  </div>
</template>
