import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { useSoftwareSettingsStore } from './stores/software_settings'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

const softwareSettingsStore = useSoftwareSettingsStore(pinia)
softwareSettingsStore.initialize()

app.mount('#app')
