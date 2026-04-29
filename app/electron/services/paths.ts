import { existsSync } from 'node:fs'
import path from 'node:path'

export const projectRoot = () => {
  const cwd = process.cwd()
  if (cwd.endsWith('app')) {
    return path.dirname(cwd)
  }
  if (existsSync(path.join(cwd, 'app', 'package.json'))) {
    return cwd
  }
  return path.dirname(cwd)
}

export const appRoot = () => path.join(projectRoot(), 'app')
export const resolveFromProjectRoot = (value: string) => (path.isAbsolute(value) ? value : path.join(projectRoot(), value))
export const profilesRoot = () => path.join(projectRoot(), 'data', 'profiles')
export const logsRoot = () => path.join(projectRoot(), 'data', 'logs')
export const extensionsRoot = () => path.join(projectRoot(), 'data', 'extensions')
export const runtimeRoot = () => path.join(projectRoot(), 'runtime')
export const automationScriptsDir = () => path.join(projectRoot(), 'scripts', 'automation')
export const toDisplayPath = (value: string) => path.relative(projectRoot(), value).replace(/\\/g, '/') || value.replace(/\\/g, '/')
