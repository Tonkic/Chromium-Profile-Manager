import type { BookmarkEntry, QuickLink } from './types.js'
import { bookmarksPath, quickLinksPath, readJsonArrayFile, writeJsonArrayFile } from './profile_workspace.js'

export const getBookmarks = (profileId: string) => readJsonArrayFile<BookmarkEntry>(bookmarksPath(profileId))
export const saveBookmarks = (profileId: string, bookmarks: BookmarkEntry[]) =>
  writeJsonArrayFile(bookmarksPath(profileId), bookmarks)
export const getQuickLinks = (profileId: string) => readJsonArrayFile<QuickLink>(quickLinksPath(profileId))
export const saveQuickLinks = (profileId: string, quickLinks: QuickLink[]) =>
  writeJsonArrayFile(quickLinksPath(profileId), quickLinks)
