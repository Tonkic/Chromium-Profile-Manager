import type { BookmarkEntry, QuickLink } from '../types/bookmark'
import { tauriInvoke } from './tauri'

export const getBookmarks = (profileId: string) =>
  tauriInvoke('get_bookmarks', { profileId })

export const saveBookmarks = (profileId: string, bookmarks: BookmarkEntry[]) =>
  tauriInvoke('save_bookmarks', { profileId, bookmarks })

export const getQuickLinks = (profileId: string) =>
  tauriInvoke('get_quick_links', { profileId })

export const saveQuickLinks = (profileId: string, quickLinks: QuickLink[]) =>
  tauriInvoke('save_quick_links', { profileId, quickLinks })
