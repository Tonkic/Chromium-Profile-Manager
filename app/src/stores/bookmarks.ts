import { defineStore } from 'pinia'
import type { BookmarkEntry, QuickLink } from '../types/bookmark'
import * as bookmarksApi from '../services/bookmarks'

export const useBookmarksStore = defineStore('bookmarks', {
  state: () => ({
    entries: {} as Record<string, BookmarkEntry[]>,
    quickLinks: {} as Record<string, QuickLink[]>,
  }),
  actions: {
    async refresh(profileId: string) {
      const [entries, quickLinks] = await Promise.all([
        bookmarksApi.getBookmarks(profileId),
        bookmarksApi.getQuickLinks(profileId),
      ])
      this.entries[profileId] = entries
      this.quickLinks[profileId] = quickLinks
    },
    async save(profileId: string, entries: BookmarkEntry[]) {
      await bookmarksApi.saveBookmarks(profileId, entries)
      await this.refresh(profileId)
    },
    async saveQuick(profileId: string, quickLinks: QuickLink[]) {
      await bookmarksApi.saveQuickLinks(profileId, quickLinks)
      await this.refresh(profileId)
    },
    renameProfile(oldId: string, newId: string) {
      if (oldId === newId) {
        return
      }
      const entries = this.entries[oldId]
      const quickLinks = this.quickLinks[oldId]
      if (entries) {
        this.entries[newId] = entries
        delete this.entries[oldId]
      }
      if (quickLinks) {
        this.quickLinks[newId] = quickLinks
        delete this.quickLinks[oldId]
      }
    },
  },
})
