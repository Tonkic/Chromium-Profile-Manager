import { describe, expect, it } from 'vitest'
import { commandNames, isCommandName } from '../electron/ipc/contracts'

describe('IPC command contracts', () => {
  it('exposes a unique allowlist used by preload and main process validation', () => {
    expect(new Set(commandNames).size).toBe(commandNames.length)
    expect(isCommandName('list_profiles')).toBe(true)
    expect(isCommandName('save_quick_links')).toBe(true)
    expect(isCommandName('unknown_command')).toBe(false)
  })
})
