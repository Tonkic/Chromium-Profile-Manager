import type { Profile } from '../types/profile'
import { emptyProfile } from '../types/profile'

export const makeDefaultProfile = (): Profile => ({
  ...emptyProfile(),
  id: 'default-146',
  name: '默认环境',
  userDataDir: './data/profiles/default-146/user-data',
  extraArgs: ['--no-first-run', '--disable-sync'],
})
