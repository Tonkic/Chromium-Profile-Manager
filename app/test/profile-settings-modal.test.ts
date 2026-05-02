import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Profile } from '../src/types/profile'
import ProfileSettingsModal from '../src/components/profile/ProfileSettingsModal.vue'

const profile = (): Profile => ({
  id: 'profile-a',
  name: 'Profile A',
  note: '',
  browserPath: './runtime/chrome.exe',
  userDataDir: './data/profiles/profile-a/user-data',
  proxy: '',
  lang: 'zh-CN',
  timezone: 'Asia/Shanghai',
  windowSize: [1400, 900],
  extensions: [],
  extraArgs: [],
  fingerprint: {
    enabled: false,
    source: 'none',
    userAgentUrl: '',
    userAgentText: '',
    jsonText: '',
    launch: {
      seed: '',
      platform: '',
      platformVersion: '',
      brand: '',
      brandVersion: '',
      hardwareConcurrency: '',
      disableNonProxiedUdp: true,
      disableSpoofing: [],
    },
  },
  bookmarkSetId: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

describe('ProfileSettingsModal', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps modal open when dirty close confirmation is cancelled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const wrapper = mount(ProfileSettingsModal, {
      props: {
        open: true,
        profile: profile(),
        section: 'general',
      },
    })

    await wrapper.findAll('input')[0].setValue('Changed Profile')
    await wrapper.find('.settings-modal-close').trigger('click')

    expect(confirmSpy).toHaveBeenCalled()
    expect(wrapper.emitted('close')).toBeUndefined()
    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('emits save with closeAfterSave when dirty close is confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const wrapper = mount(ProfileSettingsModal, {
      props: {
        open: true,
        profile: profile(),
        section: 'general',
      },
    })

    await wrapper.findAll('input')[0].setValue('Changed Profile')
    await wrapper.find('.settings-modal-close').trigger('click')

    const saveEvent = wrapper.emitted('save')?.[0]
    expect(saveEvent?.[0]).toMatchObject({ name: 'Changed Profile' })
    expect(saveEvent?.[1]).toBe('profile-a')
    expect(saveEvent?.[2]).toBe(true)
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('redirects away from fingerprint section when fingerprint runtime is disabled', () => {
    const wrapper = mount(ProfileSettingsModal, {
      props: {
        open: true,
        profile: profile(),
        section: 'fingerprint',
        fingerprintSettingsEnabled: false,
      },
    })

    expect(wrapper.text()).not.toContain('指纹设置')
    expect(wrapper.emitted('update:section')?.[0]).toEqual(['general'])
  })

  it('saves fingerprint section changes when dirty close is confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const wrapper = mount(ProfileSettingsModal, {
      props: {
        open: true,
        profile: profile(),
        section: 'fingerprint',
        fingerprintSettingsEnabled: true,
      },
    })

    await wrapper.find('input[placeholder="1000"]').setValue('2023')
    await wrapper.find('.settings-modal-close').trigger('click')

    const saveEvent = wrapper.emitted('save')?.[0]
    expect(saveEvent?.[0]).toMatchObject({
      fingerprint: {
        launch: {
          seed: '2023',
        },
      },
    })
    expect(saveEvent?.[1]).toBe('profile-a')
    expect(saveEvent?.[2]).toBe(true)
    expect(wrapper.emitted('close')).toBeUndefined()
  })
})
