import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { JudgeQuickStart } from './JudgeQuickStart'

describe('visible agent invitation', () => {
  it('shows one short intent-based prompt before opening anything', () => {
    const html = renderToStaticMarkup(<JudgeQuickStart />)
    expect(html).toContain('Show me the elbow angle when the front foot lands.')
    expect(html).toContain('Copy prompt 1')
    expect(html).toContain('Quick-start prompts')
    expect(html).not.toContain('Go to that moment')
    expect(html).not.toContain('Note the time')
  })

  it('keeps correction and notes optional without opening a panel on arrival', () => {
    const html = renderToStaticMarkup(<JudgeQuickStart />)
    expect(html).toContain('2 more prompts')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('Copy prompt 2')
    expect(html).not.toContain('id="judge-quick-start-panel"')
  })
})
