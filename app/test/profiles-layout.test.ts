import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const styleSheet = readFileSync(resolve(__dirname, '../src/style.css'), 'utf8')

const rulesFor = (...selectors: string[]) => {
  const selectorPattern = selectors.map((selector) => selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*,\\s*')
  return [...styleSheet.matchAll(new RegExp(`${selectorPattern}\\s*\\{([^}]*)\\}`, 'gm'))].map((match) => match[1])
}

describe('profiles layout', () => {
  it('keeps the profiles page itself as the reachable scrollport', () => {
    const scrollportRule = rulesFor('.profiles-detail-content', '.software-settings-page').find(
      (rule) => rule.includes('overflow: auto') && rule.includes('min-height: 0'),
    )

    expect(scrollportRule).toBeDefined()
    expect(scrollportRule).toContain('height: 100%')
  })
})
