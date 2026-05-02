import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Profile } from '../src/types/profile'
import ProfileForm from '../src/components/profile/ProfileForm.vue'

const sampleProfile = (): Profile => ({
  id: 'profile-a',
  name: 'Profile A',
  note: '',
  browserPath: './runtime/chrome.exe',
  userDataDir: './data/profiles/profile-a/user-data',
  proxy: '',
  lang: 'zh-CN',
  timezone: 'Asia/Shanghai',
  windowSize: [1400, 900],
  extensions: [{ id: 'ext-a', enabled: false }],
  extraArgs: ['--no-first-run'],
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

describe('ProfileForm', () => {
  it('emits normalized profile data on submit', async () => {
    setActivePinia(createPinia())
    const wrapper = mount(ProfileForm)

    await wrapper.findAll('input')[0].setValue('工作环境')
    await wrapper.findAll('input')[1].setValue('default-1')
    await wrapper.findAll('input')[2].setValue('./runtime/fingerprint-chromium/chrome.exe')
    await wrapper.findAll('input')[3].setValue('./data/profiles/default-1')
    await wrapper.find('form').trigger('submit.prevent')

    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeTruthy()
    const payload = emitted?.[0]?.[0] as {
      extraArgs: string[]
      fingerprint?: { enabled?: boolean; source?: string }
      id: string
      name: string
    }
    expect(payload.name).toBe('工作环境')
    expect(payload.id).toBe('default-1')
    expect(payload.extraArgs).toEqual([])
    expect(payload.fingerprint).toEqual({
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
    })
  })

  it('does not mutate modelValue extensions before submit and emits dirty state', async () => {
    setActivePinia(createPinia())
    const profile = sampleProfile()
    const wrapper = mount(ProfileForm, {
      props: {
        modelValue: profile,
        availableExtensions: [{ id: 'ext-a', kind: 'dir', path: './data/extensions/ext-a' }],
      },
    })

    await wrapper.find('fieldset:last-of-type input[type="checkbox"]').setValue(true)

    expect(profile.extensions).toEqual([{ id: 'ext-a', enabled: false }])
    expect(wrapper.emitted('dirtyChange')?.some((event) => event[0] === true)).toBe(true)

    await wrapper.find('form').trigger('submit.prevent')
    const payload = wrapper.emitted('submit')?.[0]?.[0] as Profile
    expect(payload.extensions).toEqual([{ id: 'ext-a', enabled: true }])
  })

  it('emits URL fingerprint settings and structured launch settings on submit', async () => {
    setActivePinia(createPinia())
    const wrapper = mount(ProfileForm, {
      props: {
        section: 'fingerprint',
      },
    })

    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.find('select').setValue('url')
    await wrapper.find('input[placeholder="http://111.231.98.57/ua.php?key=..."]').setValue('http://111.231.98.57/ua.php?key=your_secret_key_1')
    await wrapper.find('input[placeholder="1000"]').setValue('2023')
    await wrapper.findAll('select')[1].setValue('macos')
    await wrapper.find('input[placeholder="15.2.0"]').setValue('15.2.0')
    await wrapper.findAll('select')[2].setValue('Edge')
    await wrapper.find('input[placeholder="144.0.7559.132"]').setValue('144.0.7559.132')
    await wrapper.find('input[placeholder="8"]').setValue('8')
    await wrapper.findAll('input[type="checkbox"]')[2].setValue(true)
    await wrapper.findAll('input[type="checkbox"]')[6].setValue(true)
    await wrapper.find('form').trigger('submit.prevent')

    const emitted = wrapper.emitted('submit')
    const payload = emitted?.[0]?.[0] as { extraArgs?: string[]; fingerprint?: unknown }
    expect(payload.fingerprint).toEqual({
      enabled: true,
      source: 'url',
      userAgentUrl: 'http://111.231.98.57/ua.php?key=your_secret_key_1',
      userAgentText: '',
      jsonText: '',
      launch: {
        seed: '2023',
        platform: 'macos',
        platformVersion: '15.2.0',
        brand: 'Edge',
        brandVersion: '144.0.7559.132',
        hardwareConcurrency: '8',
        disableNonProxiedUdp: true,
        disableSpoofing: ['font', 'gpu'],
      },
    })
    expect(payload.extraArgs).toEqual([])
  })
})
