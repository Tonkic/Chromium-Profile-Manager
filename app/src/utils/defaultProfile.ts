import type { Profile } from '../types/profile'
import { emptyProfile } from '../types/profile'

export const makeDefaultProfile = (): Profile => ({
  ...emptyProfile(),
  id: 'default-fingerprint-144',
  name: '默认指纹环境',
  userDataDir: './data/profiles/default-fingerprint-144/user-data',
  extraArgs: ['--no-first-run', '--disable-sync', '--fingerprint=1000'],
})
