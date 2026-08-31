import { useAnalysis } from '../store'
import type { Session } from '../types'
import { WorkspaceControls } from './WorkspaceControls'

const EVENT_LABEL: Record<string, string> = {
  foot_contact: 'FC',
  max_external_rotation: 'MER',
  ball_release: 'BR',
}

export function Timeline({ session }: { session: Session }) {
  const currentFrame = useAnalysis((s) => s.currentFrame)
  const playing = useAnalysis((s) => s.playing)
  const rate = useAnalysis((s) => s.playbackRate)
  const events = useAnalysis((s) => s.events)
  const showMarkers = useAnalysis((s) => s.overlays.event_markers)
  const setFrame = useAnalysis((s) => s.setFrame)
  const stepFrame = useAnalysis((s) => s.stepFrame)
  const togglePlaying = useAnalysis((s) => s.togglePlaying)
  const setRate = useAnalysis((s) => s.setPlaybackRate)

  const last = session.frames.length - 1
  const t = session.frames[Math.min(currentFrame, last)]?.t ?? 0

  return (
    <div className="timeline">
      <div className="tl-controls">
        <div className="tl-playback">
          <button className="btn icon" onClick={() => stepFrame(-1)} title="Previous frame (←)">‹</button>
          <button className="btn icon primary" onClick={togglePlaying} title="Play / pause (space)">
            {playing ? '❚❚' : '▶'}
          </button>
          <button className="btn icon" onClick={() => stepFrame(1)} title="Next frame (→)">›</button>
        </div>

        <div className="tl-readout">
          <span className="mono">{String(currentFrame).padStart(3, '0')}</span>
          <span className="dim"> / {last}</span>
          <span className="dim sep">·</span>
          <span className="mono">{t.toFixed(2)}s</span>
          {session.timebase.slowMotion && <span className="tag slowmo">slow-mo</span>}
        </div>

        <WorkspaceControls session={session} />

        <div className="tl-rate">
          {[0.25, 0.5, 1, 2].map((r) => (
            <button
              key={r}
              className={`btn tiny ${rate === r ? 'on' : ''}`}
              onClick={() => setRate(r)}
            >
              {r}×
            </button>
          ))}
        </div>
      </div>

      <div className="tl-track">
        <input
          type="range"
          min={0}
          max={last}
          value={currentFrame}
          onChange={(e) => setFrame(Number(e.target.value))}
          className="tl-range"
          aria-label="Scrub timeline"
        />
        {showMarkers &&
          events.map((ev) => (
            <button
              key={ev.name}
              className="tl-marker"
              style={{ left: `${(ev.frame / Math.max(1, last)) * 100}%` }}
              onClick={() => setFrame(ev.frame)}
              title={`${ev.name} — frame ${ev.frame} (${ev.method})`}
            >
              <span className="tl-marker-dot" />
              <span className="tl-marker-label">{EVENT_LABEL[ev.name] ?? ev.name}</span>
            </button>
          ))}
      </div>

      {events.length === 0 && (
        <p className="tl-hint">
          Event detection (foot contact · MER · ball release) lands in Task&nbsp;9 — markers will
          appear here.
        </p>
      )}
    </div>
  )
}
