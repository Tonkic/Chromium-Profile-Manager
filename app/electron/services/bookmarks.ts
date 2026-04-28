import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { BookmarkEntry, QuickLink } from './types.js'
import { profilesRoot } from './paths.js'

const profileDir = (profileId: string) => path.join(profilesRoot(), profileId)
const bookmarksPath = (profileId: string) => path.join(profileDir(profileId), 'bookmarks.json')
const quickLinksPath = (profileId: string) => path.join(profileDir(profileId), 'quick-links.json')

const readJsonArray = async <T>(filePath: string): Promise<T[]> => {
  if (!existsSync(filePath)) {
    return []
  }
  return JSON.parse(await readFile(filePath, 'utf-8')) as T[]
}

const writeJsonArray = async <T>(filePath: string, items: T[]) => {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(items, null, 2), 'utf-8')
}

export const getBookmarks = (profileId: string) => readJsonArray<BookmarkEntry>(bookmarksPath(profileId))
export const saveBookmarks = (profileId: string, bookmarks: BookmarkEntry[]) => writeJsonArray(bookmarksPath(profileId), bookmarks)
export const getQuickLinks = (profileId: string) => readJsonArray<QuickLink>(quickLinksPath(profileId))
export const saveQuickLinks = (profileId: string, quickLinks: QuickLink[]) => writeJsonArray(quickLinksPath(profileId), quickLinks)
