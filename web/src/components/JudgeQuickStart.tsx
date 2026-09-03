import { useEffect, useRef, useState } from 'react'

const prompts = [
  {
    title: 'See the evidence',
    text: 'Show me the elbow angle when the front foot lands.',
    hint: 'Watch the timeline, camera and elbow geometry move together.',
  },
  {
    title: 'Correct, then re-read',
    before: 'In Review event anchors, move foot contact to another frame and confirm it.',
    text: 'I changed foot contact. What changed in the analysis?',
    hint: 'Your correction becomes the evidence the agent reads.',
  },
  {
    title: 'Leave a shared note',
    text: 'Pin a note here summarizing what we found.',
    hint: 'Return to this moment from Shared notes.',
  },
]

/** Visible first prompt; optional follow-ups. No analysis state or automatic agent actions. */
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
      <div className="judge-startline">
        <div className="judge-lead">
          <strong>Quick-start prompts</strong>
          <span>ChatGPT’s in-app browser</span>
        </div>
        <p className="judge-prompt-text judge-first-prompt">{prompts[0].text}</p>
        <div className="judge-actions">
          <button type="button" className="btn small judge-copy" aria-label="Copy prompt 1" onClick={() => void copy(0)}>
            {copied === 0 ? 'Copied' : 'Copy prompt'}
          </button>
          <button
            ref={trigger}
            type="button"
            className="btn small judge-trigger"
            aria-expanded={open}
            aria-controls="judge-quick-start-panel"
            onClick={() => { setOpen(!open); setCopied(null); setCopyError(false) }}
          >
            2 more prompts <span aria-hidden="true">{open ? '−' : '+'}</span>
          </button>
        </div>
      </div>
      <p className={`judge-copy-status${copyError ? ' copy-error' : ''}`} role="status">{copyError ? 'Clipboard unavailable — select the prompt text to copy it.' : copied !== null ? `Prompt ${copied + 1} copied.` : ''}</p>
      {open && (
        <section id="judge-quick-start-panel" className="judge-card" aria-labelledby="judge-quick-start-title">
          <div className="judge-card-heading">
            <h2 id="judge-quick-start-title">Keep the review going</h2>
            <button type="button" className="btn tiny" aria-label="Close prompt guide" onClick={close}>×</button>
          </div>
          <p className="judge-intro">Use the same session and chat.</p>
          <ol className="judge-prompts" start={2}>
            {prompts.slice(1).map((prompt, offset) => {
              const index = offset + 1
              return (
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
              )
            })}
          </ol>
          <p className="judge-footnote">Corrections update measurements, not the recorded pitch. Notes preserve observations.</p>
          <p className="judge-tested">Demo recorded in ChatGPT’s in-app browser; native tools verified in Chrome for Testing 154.</p>
          <p className="judge-explore">These are just examples. Feel free to use your own words and ask other questions.</p>
        </section>
      )}
    </div>
  )
}
