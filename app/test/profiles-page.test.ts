import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ProfilesPage from '../src/pages/ProfilesPage.vue'

const profilesApi = vi.hoisted(() => ({
  listProfiles: vi.fn(),
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
  deleteProfile: vi.fn(),
}))

const launcherApi = vi.hoisted(() => ({
  launchProfile: vi.fn(),
  stopProfile: vi.fn(),
  getRuntimeState: vi.fn(),
}))

const logsApi = vi.hoisted(() => ({
  getLogs: vi.fn(),
}))

const extensionsApi = vi.hoisted(() => ({
  listExtensions: vi.fn(),
  importExtensionDir: vi.fn(),
  importExtensionCrx: vi.fn(),
}))

const bookmarksApi = vi.hoisted(() => ({
  getBookmarks: vi.fn(),
  saveBookmarks: vi.fn(),
  getQuickLinks: vi.fn(),
  saveQuickLinks: vi.fn(),
}))

vi.mock('../src/services/profiles', () => profilesApi)
vi.mock('../src/services/launcher', () => launcherApi)
vi.mock('../src/services/logs', () => logsApi)
vi.mock('../src/services/extensions', () => extensionsApi)
vi.mock('../src/services/bookmarks', () => bookmarksApi)

describe('ProfilesPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    profilesApi.listProfiles.mockResolvedValue([
      {
        id: 'default-1',
        name: '工作环境',
        note: '',
        browserPath: './runtime/fingerprint-chromium/chrome.exe',
        userDataDir: './data/profiles/default-1',
        proxy: '',
        lang: 'zh-CN',
        timezone: 'Asia/Shanghai',
        windowSize: [1400, 900],
        extensions: [],
        extraArgs: [],
        bookmarkSetId: '',
        createdAt: '2026-04-10T00:00:00.000Z',
        updatedAt: '2026-04-10T00:00:00.000Z',
      },
    ])

    launcherApi.getRuntimeState.mockResolvedValue({
      profileId: 'default-1',
      status: 'idle',
    })

    logsApi.getLogs.mockResolvedValue([])
    extensionsApi.listExtensions.mockResolvedValue([])
    bookmarksApi.getBookmarks.mockResolvedValue([])
    bookmarksApi.getQuickLinks.mockResolvedValue([])
  })

  it('loads profiles and refreshes runtime state on mount', async () => {
    const wrapper = mount(ProfilesPage, {
      global: {
        plugins: [createPinia()],
      },
    })

    await flushPromises()

    expect(profilesApi.listProfiles).toHaveBeenCalledTimes(1)
    expect(extensionsApi.listExtensions).toHaveBeenCalledTimes(1)
    expect(launcherApi.getRuntimeState).toHaveBeenCalledWith('default-1')
    expect(logsApi.getLogs).toHaveBeenCalledWith('default-1')
    expect(bookmarksApi.getBookmarks).toHaveBeenCalledWith('default-1')
    expect(bookmarksApi.getQuickLinks).toHaveBeenCalledWith('default-1')
    expect(wrapper.text()).toContain('工作环境')
    expect(wrapper.text()).toContain('idle')
  })
})
