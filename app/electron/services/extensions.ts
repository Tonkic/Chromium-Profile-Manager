import { copyFile, cp, mkdir, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { ExtensionEntry } from './types.js'
import { extensionsRoot } from './paths.js'

export const listExtensions = async (): Promise<ExtensionEntry[]> => {
  const root = extensionsRoot()
  if (!existsSync(root)) {
    return []
  }
  const entries = await readdir(root, { withFileTypes: true })
  const items: ExtensionEntry[] = []
  for (const entry of entries) {
    const entryPath = path.join(root, entry.name)
    if (entry.isDirectory()) {
      items.push({ id: entry.name, kind: 'dir', path: entryPath })
    } else if (path.extname(entry.name).toLowerCase() === '.crx') {
      items.push({ id: entry.name.replace(/\.crx$/i, ''), kind: 'crx', path: entryPath })
    }
  }
  return items.sort((a, b) => a.id.localeCompare(b.id))
}

export const importExtensionDir = async (id: string, sourcePath: string): Promise<ExtensionEntry> => {
  await mkdir(extensionsRoot(), { recursive: true })
  const target = path.join(extensionsRoot(), id)
  if (existsSync(target)) {
    await rm(target, { recursive: true, force: true })
  }
  await cp(sourcePath, target, { recursive: true })
  return { id, kind: 'dir', path: target }
}

export const importExtensionCrx = async (id: string, sourcePath: string): Promise<ExtensionEntry> => {
  await mkdir(extensionsRoot(), { recursive: true })
  const target = path.join(extensionsRoot(), `${id}.crx`)
  await copyFile(sourcePath, target)
  return { id, kind: 'crx', path: target }
}
