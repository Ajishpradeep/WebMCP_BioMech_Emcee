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
  const setEventFrame = useAnalysis((s) => s.setEventFrame)
  const resetEventFrame = useAnalysis((s) => s.resetEventFrame)
  const [error, setError] = useState<string | null>(null)

  const apply = (name: EventName) => {
    if (setEventFrame(name, currentFrame)) setError(null)
    else setError('Events must stay in order: foot contact → MER → ball release.')
  }

  return (
    <section className="event-review">
      <h2>Review event frames</h2>
      <p className="dim small">
        Event frames anchor every reading. Scrub to the moment you judge correct, then apply it;
        the analysis and agent tools immediately use the human-reviewed frame.
      </p>
      <div className="event-list">
        {events.map((event) => (
          <div className="event-row" key={event.name}>
            <div>
              <strong>{LABEL[event.name]}</strong>
              <span className="mono dim">f{event.frame}</span>
              {event.manualOverride && <span className="tag review">reviewed</span>}
            </div>
            <div className="event-actions">
              <button className="btn tiny" onClick={() => apply(event.name)}>
                Use f{currentFrame}
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
