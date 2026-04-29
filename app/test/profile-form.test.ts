import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ProfileForm from '../src/components/profile/ProfileForm.vue'

describe('ProfileForm', () => {
  it('emits normalized profile data on submit', async () => {
    setActivePinia(createPinia())
    const wrapper = mount(ProfileForm)

    await wrapper.findAll('input')[0].setValue('工作环境')
    await wrapper.findAll('input')[1].setValue('default-1')
    await wrapper.findAll('input')[2].setValue('./runtime/fingerprint-chromium/chrome.exe')
    await wrapper.findAll('input')[3].setValue('./data/profiles/default-1')
    await wrapper.find('textarea').setValue('--start-maximized\n--incognito')
    await wrapper.find('form').trigger('submit.prevent')

    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeTruthy()
    const payload = emitted?.[0]?.[0] as { extraArgs: string[]; id: string; name: string }
    expect(payload.name).toBe('工作环境')
    expect(payload.id).toBe('default-1')
    expect(payload.extraArgs).toEqual(['--start-maximized', '--incognito'])
  })
})
