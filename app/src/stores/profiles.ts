import { defineStore } from 'pinia'
import type { Profile } from '../types/profile'
import * as profilesApi from '../services/profiles'
import { makeDefaultProfile } from '../utils/defaultProfile'

export const useProfilesStore = defineStore('profiles', {
  state: () => ({
    profiles: [] as Profile[],
    loading: false,
  }),
  actions: {
    async fetchProfiles() {
      this.loading = true
      try {
        this.profiles = await profilesApi.listProfiles()
        if (this.profiles.length === 0) {
          const profile = makeDefaultProfile()
          await profilesApi.createProfile(profile)
          this.profiles = await profilesApi.listProfiles()
        }
      } finally {
        this.loading = false
      }
    },
    async saveProfile(profile: Profile) {
      const exists = this.profiles.some((item) => item.id === profile.id)
      if (exists) {
        await profilesApi.updateProfile(profile)
      } else {
        await profilesApi.createProfile(profile)
      }
      await this.fetchProfiles()
    },
    async removeProfile(id: string) {
      await profilesApi.deleteProfile(id)
      await this.fetchProfiles()
    },
  },
})
