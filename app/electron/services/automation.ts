import { spawn } from 'node:child_process'
import { mkdir, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { AutomationRuntimeRecord, AutomationRuntimeState, AutomationScriptEntry } from './types.js'
import { automationScriptsDir, projectRoot } from './paths.js'
import { getProfile } from './profiles.js'

const states = new Map<string, AutomationRuntimeRecord>()

const keyOf = (profileId: string, scriptName: string) => `${profileId}::${scriptName}`

const publicState = (state: AutomationRuntimeRecord): AutomationRuntimeState => {
  const { child: _child, ...rest } = state
  return rest
}

const idleState = (profileId: string, scriptName: string): AutomationRuntimeState => ({
  profileId,
  scriptName,
  status: 'idle',
  runner: 'python',
})

const validateScriptName = (scriptName: string) => {
  if (!scriptName.trim()) {
    throw new Error('script name is required')
  }
  if (scriptName.includes('/') || scriptName.includes('\\') || scriptName.includes('..')) {
    throw new Error('invalid script name')
  }
  if (!scriptName.toLowerCase().endsWith('.py')) {
    throw new Error('only .py scripts are allowed')
  }
}

const resolveScriptPath = async (scriptName: string) => {
  validateScriptName(scriptName)
  const root = automationScriptsDir()
  await mkdir(root, { recursive: true })
  const candidate = path.join(root, scriptName)
  if (!existsSync(candidate)) {
    throw new Error('script file not found')
  }
  const rootResolved = path.resolve(root)
  const candidateResolved = path.resolve(candidate)
  if (!candidateResolved.startsWith(rootResolved)) {
    throw new Error('script path is outside automation directory')
  }
  return candidateResolved
}

export const listAutomationScripts = async (): Promise<AutomationScriptEntry[]> => {
  const root = automationScriptsDir()
  await mkdir(root, { recursive: true })
  const entries = await readdir(root, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.py')
    .map((entry) => {
      const absolutePath = path.join(root, entry.name)
      return {
        name: entry.name,
        relativePath: entry.name,
        absolutePath,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const getAutomationRuntimeStates = async (profileId: string): Promise<AutomationRuntimeState[]> =>
  [...states.values()].filter((state) => state.profileId === profileId).map(publicState)

export const startAutomationScript = async (profileId: string, scriptName: string): Promise<AutomationRuntimeState> => {
  await getProfile(profileId)
  const scriptPath = await resolveScriptPath(scriptName)
  const key = keyOf(profileId, scriptName)
  const existing = states.get(key)
  if (existing?.child && existing.status === 'running') {
    throw new Error('script is already running')
  }

  states.set(key, {
    profileId,
    scriptName,
    status: 'starting',
    runner: 'python',
  })

  try {
    const child = spawn('python', [scriptPath], { cwd: projectRoot(), windowsHide: true })
    const pid = child.pid
    if (!pid) {
      throw new Error('failed to start automation script')
    }
    const runningState: AutomationRuntimeRecord = {
      profileId,
      scriptName,
      status: 'running',
      pid,
      startedAt: new Date().toISOString(),
      runner: 'python',
      child,
    }
    states.set(key, runningState)

    child.once('exit', (code) => {
      const latest = states.get(key)
      if (!latest || latest.pid !== pid) {
        return
      }
      states.set(key, {
        ...latest,
        child: undefined,
        status: 'stopped',
        pid: undefined,
        exitCode: code ?? undefined,
        stoppedAt: new Date().toISOString(),
      })
    })

    child.once('error', (error) => {
      states.set(key, {
        profileId,
        scriptName,
        status: 'error',
        lastError: error.message,
        stoppedAt: new Date().toISOString(),
        runner: 'python',
      })
    })

    return publicState(runningState)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const errorState: AutomationRuntimeRecord = {
      profileId,
      scriptName,
      status: 'error',
      lastError: message,
      stoppedAt: new Date().toISOString(),
      runner: 'python',
    }
    states.set(key, errorState)
    throw new Error(message)
  }
}

export const stopAutomationScript = async (profileId: string, scriptName: string): Promise<AutomationRuntimeState> => {
  validateScriptName(scriptName)
  const key = keyOf(profileId, scriptName)
  const current: AutomationRuntimeRecord = states.get(key) ?? idleState(profileId, scriptName)
  current.child?.kill()
  const stoppedState: AutomationRuntimeRecord = {
    ...current,
    child: undefined,
    status: 'stopped',
    pid: undefined,
    stoppedAt: new Date().toISOString(),
  }
  states.set(key, stoppedState)
  return publicState(stoppedState)
}

export const openAutomationScriptsDir = async () => {
  const dir = automationScriptsDir()
  await mkdir(dir, { recursive: true })
  const { shell } = await import('electron')
  await shell.openPath(dir)
  return dir
}

export const renameAutomationProfile = (oldProfileId: string, newProfileId: string) => {
  if (oldProfileId === newProfileId) {
    return
  }
  for (const [key, state] of [...states.entries()]) {
    if (state.profileId !== oldProfileId) {
      continue
    }
    states.delete(key)
    states.set(keyOf(newProfileId, state.scriptName), { ...state, profileId: newProfileId })
  }
}
