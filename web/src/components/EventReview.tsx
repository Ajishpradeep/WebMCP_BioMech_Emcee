import { useState } from 'react'

import { useAnalysis } from '../store'
import type { EventName } from '../types'

const LABEL: Record<EventName, string> = {
  foot_contact: 'Lead foot contact',
  max_external_rotation: 'MER candidate (review)',
  ball_release: 'Ball release',
}

/** Human-in-the-loop correction for the three event frames that anchor every reading. */
export function EventReview() {
  const events = useAnalysis((s) => s.events)
  const currentFrame = useAnalysis((s) => s.currentFrame)
  const setFrame = useAnalysis((s) => s.setFrame)
  const setEventFrame = useAnalysis((s) => s.setEventFrame)
  const resetEventFrame = useAnalysis((s) => s.resetEventFrame)
  const [error, setError] = useState<string | null>(null)

  const apply = (name: EventName) => {
    if (setEventFrame(name, currentFrame)) setError(null)
    else setError('Events must stay in order: foot contact → MER → ball release.')
  }

  const canApply = (name: EventName) => {
    const frame = Object.fromEntries(events.map((event) => [event.name, event.frame])) as Record<EventName, number>
    if (name === 'foot_contact') return currentFrame < frame.max_external_rotation
    if (name === 'max_external_rotation') return currentFrame > frame.foot_contact && currentFrame < frame.ball_release
    return currentFrame > frame.max_external_rotation
  }

  return (
    <section className="event-review">
      <h2><span className="workflow-step">1</span> Review event anchors</h2>
      <div className="review-instruction">
        <span><b>1</b> Open an event</span>
        <span><b>2</b> Scrub to verify</span>
        <span><b>3</b> Confirm frame</span>
      </div>
      <div className="current-frame-callout">
        Inspecting <strong className="mono">f{currentFrame}</strong>
        <span>Corrections update measurements and agent reads.</span>
      </div>
      <div className="event-list">
        {events.map((event) => (
          <div className="event-row" key={event.name}>
            <button className="event-jump" onClick={() => setFrame(event.frame)}>
              <span>
                <strong>{LABEL[event.name]}</strong>
                {event.manualOverride && <span className="tag review">reviewed</span>}
              </span>
              <span className="event-meta">
                <span className="mono">f{event.frame}</span>
                <span className={`conf ${event.confidence}`}>{event.confidence}</span>
              </span>
            </button>
            <div className="event-actions">
              <button
                className="btn tiny primary-soft"
                onClick={() => apply(event.name)}
                disabled={!canApply(event.name)}
                title={canApply(event.name) ? 'Use the inspected frame for this event' : 'Scrub to a frame that preserves FC → MER → BR order'}
              >
                {currentFrame === event.frame ? `Confirm f${currentFrame}` : `Use f${currentFrame}`}
              </button>
              {event.manualOverride && <button className="btn tiny" onClick={() => resetEventFrame(event.name)}>Reset</button>}
            </div>
          </div>
        ))}
      </div>
      {error && <p className="err small">{error}</p>}
    </section>
  )
}
