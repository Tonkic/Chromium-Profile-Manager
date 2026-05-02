import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { Profile, RuntimeKind, RuntimeState } from './types.js'
import { extensionsRoot, resolveFromProjectRoot, toDisplayPath } from './paths.js'
import { appendLog } from './logs.js'
import { getProfile } from './profiles.js'
import { getSoftwareSettings, DEFAULT_BROWSER_PATH } from './software_settings.js'
import { clearStaleRuntimeState } from './user_data.js'
import { resolveFingerprintArgs, resolveStructuredFingerprintArgs } from './fingerprint.js'
import { inferRuntimeKindFromPath, supportsFingerprintSettings } from './runtime_capabilities.js'

const states = new Map<string, RuntimeState>()

const idleState = (profileId: string): RuntimeState => ({ profileId, status: 'idle' })

const getState = (profileId: string) => states.get(profileId) ?? idleState(profileId)

const buildLaunchSpec = async (profile: Profile, extensionPaths: string[], runtimeKind: RuntimeKind) => {
  const args = [`--user-data-dir=${profile.userDataDir}`, '--disable-session-crashed-bubble', '--restore-last-session=false']
  if (profile.proxy) {
    args.push(`--proxy-server=${profile.proxy}`)
  }
  if (profile.lang) {
    args.push(`--lang=${profile.lang}`, `--accept-lang=${profile.lang}`)
  }
  if (profile.timezone) {
    args.push(`--timezone=${profile.timezone}`)
  }
  if (profile.windowSize) {
    args.push(`--window-size=${profile.windowSize[0]},${profile.windowSize[1]}`)
  }
  const enabledExtensions = extensionPaths.filter(Boolean)
  if (enabledExtensions.length > 0) {
    args.push(`--load-extension=${enabledExtensions.join(',')}`)
  }
  if (supportsFingerprintSettings(runtimeKind)) {
    args.push(...await resolveFingerprintArgs(profile))
    args.push(...resolveStructuredFingerprintArgs(profile))
    args.push(...profile.extraArgs)
  }
  return { program: profile.browserPath, args }
}

const extensionPaths = (profile: Profile) =>
  profile.extensions
    .filter((item) => item.enabled)
    .map((item) => path.join(extensionsRoot(), item.id))

const resolveProfile = async (profile: Profile) => {
  const settings = await getSoftwareSettings()
  const overridePath = profile.browserPathOverride?.trim()
  const globalPath = settings.defaultBrowserPath.trim()
  const preferredPath = overridePath || globalPath || DEFAULT_BROWSER_PATH
  const fallbackPath = DEFAULT_BROWSER_PATH
  const browserPath = !overridePath && preferredPath !== fallbackPath && !existsSync(resolveFromProjectRoot(preferredPath))
    ? fallbackPath
    : preferredPath
  const runtimeKind = overridePath
    ? inferRuntimeKindFromPath(overridePath)
    : browserPath === fallbackPath && preferredPath !== fallbackPath
      ? inferRuntimeKindFromPath(fallbackPath)
      : settings.defaultRuntimeKind ?? inferRuntimeKindFromPath(browserPath)
  const browserPathSource = overridePath
    ? 'override'
    : browserPath === fallbackPath && preferredPath !== fallbackPath
      ? 'fallback'
      : globalPath
        ? 'global'
        : 'fallback'

  return {
    profile: {
      ...profile,
      browserPath: resolveFromProjectRoot(browserPath),
      userDataDir: resolveFromProjectRoot(profile.userDataDir),
    },
    browserPathSource,
    runtimeKind,
  }
}

export const getRuntimeState = async (profileId: string): Promise<RuntimeState> => getState(profileId)

export const stopProfile = async (profileId: string) => {
  const stoppedAt = new Date().toISOString()
  const state = getState(profileId)
  states.set(profileId, {
    ...state,
    status: 'stopped',
    pid: undefined,
    stoppedAt,
  })
  await appendLog(profileId, {
    timestamp: stoppedAt,
    level: 'info',
    message: 'profile stopped',
  })
}

export const launchProfile = async (profileId: string): Promise<RuntimeState> => {
  const profile = await getProfile(profileId)
  const current = getState(profileId)
  if (current.status === 'running' || current.status === 'starting') {
    throw new Error('profile is already running')
  }

  const { profile: resolvedProfile, browserPathSource, runtimeKind } = await resolveProfile(profile)
  const browserPath = resolvedProfile.browserPath
  const userDataDir = resolvedProfile.userDataDir
  const spec = await buildLaunchSpec(resolvedProfile, extensionPaths(profile), runtimeKind)
  const commandPreview = [spec.program, ...spec.args]
  const resolvedCommandPreview = [
    `runtime source: ${browserPathSource}`,
    `runtime kind: ${runtimeKind}`,
    `resolved browser path: ${toDisplayPath(browserPath)}`,
    `resolved user data dir: ${toDisplayPath(userDataDir)}`,
  ]

  await clearStaleRuntimeState(userDataDir)

  if (!existsSync(browserPath)) {
    const message = `浏览器路径不存在: ${toDisplayPath(browserPath)}`
    states.set(profileId, {
      ...current,
      status: 'error',
      pid: undefined,
      lastError: message,
    })
    await appendLog(profileId, {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      command: [...resolvedCommandPreview, ...commandPreview],
    })
    throw new Error(message)
  }

  states.set(profileId, {
    profileId,
    status: 'starting',
    lastCommand: commandPreview,
  })

  await appendLog(profileId, {
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'launch requested',
    command: [...resolvedCommandPreview, ...commandPreview],
  })

  let child
  try {
    child = spawn(spec.program, spec.args, { windowsHide: false })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    states.set(profileId, {
      ...getState(profileId),
      status: 'error',
      pid: undefined,
      lastError: message,
    })
    await appendLog(profileId, {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      command: [...resolvedCommandPreview, ...commandPreview],
    })
    throw new Error(message)
  }

  const startedAt = new Date().toISOString()
  const pid = child.pid
  if (!pid) {
    const message = 'failed to start browser process'
    states.set(profileId, {
      ...getState(profileId),
      status: 'error',
      pid: undefined,
      lastError: message,
    })
    await appendLog(profileId, {
      timestamp: startedAt,
      level: 'error',
      message,
      command: [...resolvedCommandPreview, ...commandPreview],
    })
    throw new Error(message)
  }

  const runningState: RuntimeState = {
    ...getState(profileId),
    status: 'running',
    pid,
    exitCode: undefined,
    lastError: undefined,
    startedAt,
  }
  states.set(profileId, runningState)
  await appendLog(profileId, {
    timestamp: startedAt,
    level: 'info',
    message: `profile running with pid ${pid}`,
    command: [...resolvedCommandPreview, ...commandPreview],
  })

  child.once('error', async (error) => {
    states.set(profileId, {
      ...getState(profileId),
      status: 'error',
      pid: undefined,
      lastError: error.message,
    })
    await appendLog(profileId, {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      command: [...resolvedCommandPreview, ...commandPreview],
    })
  })

  child.once('exit', async (code) => {
    const latest = getState(profileId)
    if (latest.status !== 'running' || latest.pid !== pid) {
      return
    }
    const stoppedAt = new Date().toISOString()
    states.set(profileId, {
      ...latest,
      status: 'stopped',
      pid: undefined,
      exitCode: code ?? undefined,
      stoppedAt,
    })
    await appendLog(profileId, {
      timestamp: stoppedAt,
      level: 'info',
      message: `browser process ${pid} exited`,
      exitCode: code ?? undefined,
    })
  })

  return runningState
}

export const renameRuntimeProfile = (oldProfileId: string, newProfileId: string) => {
  if (oldProfileId === newProfileId) {
    return
  }
  const state = states.get(oldProfileId)
  if (!state) {
    return
  }
  states.delete(oldProfileId)
  states.set(newProfileId, { ...state, profileId: newProfileId })
}
