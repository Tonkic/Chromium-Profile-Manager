import { tauriInvoke } from './tauri'

export interface FingerprintUserAgentResult {
  userAgent: string
}

export const testFingerprintUserAgentUrl = (url: string) =>
  tauriInvoke<FingerprintUserAgentResult>('test_fingerprint_user_agent_url', { url })
