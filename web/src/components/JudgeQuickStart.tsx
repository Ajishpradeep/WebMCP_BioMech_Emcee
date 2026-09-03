import { useEffect, useRef, useState } from 'react'

const prompts = [
  {
    title: 'See the evidence',
    text: 'Show me how bent the throwing arm is when the front foot lands. Go to that moment, focus the elbow, and explain the angle. Note the time from foot contact to ball release.',
    hint: 'Watch the timeline, camera and elbow geometry move together.',
  },
  {
    title: 'Correct, then re-read',
    before: 'Your turn: in Review event anchors, open Lead foot contact (FC), scrub to a different contact frame, then click Use f… on that row. Keep FC before MER.',
    text: 'I corrected foot contact. Re-read the data: how did the elbow angle and time to release change? Update your explanation of this pitch, keeping it descriptive.',
    hint: 'The agent should use your corrected event, not its earlier snapshot.',
  },
  {
    title: 'Leave a shared note',
    text: 'At my corrected foot-contact frame, pin a short note on the throwing elbow summarizing what changed and what still needs review.',
    hint: 'Scrub away, then click the Shared notes entry to return to its evidence.',
  },
]

/** Optional judge handoff only: no analysis state, tool registration or automatic actions. */
export function JudgeQuickStart() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const [copyError, setCopyError] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])

  const close = () => {
    setOpen(false)
    trigger.current?.focus()
  }

  const copy = async (index: number) => {
    setCopied(null)
    setCopyError(false)
    try {
      await navigator.clipboard.writeText(prompts[index].text)
      setCopied(index)
    } catch {
      setCopyError(true)
    }
  }

  return (
    <div className="judge-quick-start" ref={root} onKeyDown={(event) => {
      // The workspace's global space/arrow shortcuts must not steal disclosure/copy keys.
      event.stopPropagation()
      if (event.key === 'Escape' && open) close()
    }}>
      <button
        ref={trigger}
        type="button"
        className="btn small judge-trigger"
        aria-expanded={open}
        aria-controls="judge-quick-start-panel"
        onClick={() => { setOpen(!open); setCopied(null); setCopyError(false) }}
      >
        Try 3 prompts <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <section id="judge-quick-start-panel" className="judge-card" aria-labelledby="judge-quick-start-title">
          <div className="judge-card-heading">
            <h2 id="judge-quick-start-title">One shared review, three prompts</h2>
            <button type="button" className="btn tiny" aria-label="Close prompt guide" onClick={close}>×</button>
          </div>
          <p className="judge-intro">Open in <strong>ChatGPT’s in-app browser</strong>. Use either included session and keep the same chat for all three prompts.</p>
          <ol className="judge-prompts">
            {prompts.map((prompt, index) => (
              <li key={prompt.title}>
                <div className="judge-prompt-heading">
                  <h3><span>{index + 1}</span> {prompt.title}</h3>
                  <button type="button" className="btn tiny" aria-label={`Copy prompt ${index + 1}`} onClick={() => void copy(index)}>
                    {copied === index ? 'Copied' : 'Copy'}
                  </button>
                </div>
                {prompt.before && <p className="judge-manual-step">{prompt.before}</p>}
                <p className="judge-prompt-text">{prompt.text}</p>
                <p className="judge-prompt-hint">{prompt.hint}</p>
              </li>
            ))}
          </ol>
          <p className="judge-copy-status" role="status">{copyError ? 'Clipboard unavailable — select the prompt text to copy it.' : copied !== null ? `Prompt ${copied + 1} copied.` : ''}</p>
          <p className="judge-footnote">Corrections update measurements, not the recorded pitch. Notes preserve observations; they do not change measurements.</p>
          <p className="judge-tested">Demo recorded in ChatGPT’s in-app browser; native tools verified in Chrome for Testing 154.</p>
        </section>
      )}
    </div>
  )
}
