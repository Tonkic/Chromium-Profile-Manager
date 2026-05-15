import type { CommandResult } from '../../electron/ipc/contracts'
import { tauriInvoke } from './tauri'

export type FingerprintUserAgentResult = CommandResult<'test_fingerprint_user_agent_url'>

export const testFingerprintUserAgentUrl = (url: string) =>
  tauriInvoke('test_fingerprint_user_agent_url', { url })
