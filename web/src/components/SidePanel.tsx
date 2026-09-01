import { useState } from 'react'

import { useAnalysis } from '../store'
import type { Session } from '../types'
import { MetricsPanel } from './MetricsPanel'
import { EventReview } from './EventReview'
import { UploadPanel } from './UploadPanel'

function SessionDetails({ session }: { session: Session }) {
  const tb = session.timebase
  return (
    <section className="session-details-section">
      <details className="session-details">
        <summary>
          <span>Session & measurement limits</span>
          <span className="summary-flags">camera-frame · {tb.slowMotion ? 'slow-mo' : 'normal-rate'}</span>
        </summary>
        <div className="meta">
          <dl>
            <div><dt>Subject</dt><dd>{session.subject.handedness}-handed</dd></div>
            <div><dt>View</dt><dd>{session.source.view || '—'}</dd></div>
            <div><dt>Frames</dt><dd className="mono">{session.source.frameCount}</dd></div>
            <div><dt>Video fps</dt><dd className="mono">{tb.videoFps.toFixed(2)}</dd></div>
            <div><dt>Model</dt><dd className="mono">{session.capture.model}</dd></div>
          </dl>

          <div className="caveats">
            <div className="caveat">
              <span className="dot amber" />
              <div>
                <strong>Camera-frame reconstruction.</strong> Focal length is estimated
                (<span className="mono">{session.capture.focalLengthMedian}</span>), so distances are
                not metric. Lengths are reported as % of body height, never centimetres.
              </div>
            </div>
            {tb.slowMotion && (
              <div className="caveat">
                <span className="dot red" />
                <div>
                  <strong>Slow-motion source, unknown factor.</strong> Sequence <em>order</em> and
                  normalised timing stay valid; absolute angular velocity is{' '}
                  <span className="mono">unavailable</span>.
                </div>
              </div>
            )}
            {!tb.slowMotion && tb.scaleSource === 'estimated' && (
              <div className="caveat">
                <span className="dot amber" />
                <div>
                  <strong>Normal-rate playback inferred from the source.</strong> Video time is
                  treated as real time, but rate-derived measurements remain medium-confidence.
                </div>
              </div>
            )}
          </div>
        </div>
      </details>
    </section>
  )
}

function AgentNotes() {
  const annotations = useAnalysis((state) => state.annotations)
  const clearAnnotations = useAnalysis((state) => state.clearAnnotations)
  const setFrame = useAnalysis((state) => state.setFrame)
  const selectJoint = useAnalysis((state) => state.selectJoint)

  const openNote = (index: number) => {
    const note = annotations[index]
    if (!note) return
    setFrame(note.frame)
    if (note.joint) selectJoint(note.joint)
  }

  return (
    <section className="agent-notes">
      <h2>
        <span className="workflow-step">3</span> Shared notes
        {annotations.length > 0 && <span className="count">{annotations.length}</span>}
      </h2>
      {annotations.length === 0 ? (
        <div className="empty-notes">
          <span className="pin-glyph">◇</span>
          <div>
            <strong>Agent observations land on the evidence.</strong>
            <p>An agent can use <span className="mono">annotate_frame</span> to pin a note to a moment and joint. Notes are observations—not measurements.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="ann-list">
            {annotations.map((annotation, index) => (
              <button key={annotation.id} className={annotation.severity} onClick={() => openNote(index)}>
                <span className="ann-meta">
                  <span className="tag agent">agent note</span>
                  <span className="mono">f{annotation.frame}</span>
                </span>
                <strong>{annotation.label}</strong>
                <span className="dim">{annotation.joint ? annotation.joint.replaceAll('_', ' ') : 'frame note'} · open evidence</span>
              </button>
            ))}
          </div>
          <button className="btn small" onClick={clearAnnotations}>Clear notes</button>
        </>
      )}
    </section>
  )
}

export function SidePanel({ session }: { session: Session | null }) {
  const [rightsOpen, setRightsOpen] = useState<string | null>(null)
  const analysis = useAnalysis((s) => s.analysis)
  const index = useAnalysis((s) => s.index)
  const loadSession = useAnalysis((s) => s.loadSession)
  // Uploads require a local CUDA service and are development tooling. Keeping that
  // control out of the public static deployment avoids a dead call-to-action for judges.
  const showLocalUpload = import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOCAL_UPLOAD === 'true'

  return (
    <aside className="panel">
      <section className="evidence-session">
        <h2>Evidence session</h2>
        <div className="session-list">
          {index.length === 0 && <p className="dim small">No analysed sessions yet.</p>}
          {index.map((item) => {
            const open = rightsOpen === item.sessionId
            return (
              <div
                key={item.sessionId}
                className={`session-entry ${session?.sessionId === item.sessionId ? 'on' : ''}`}
              >
                <button className="session-item" onClick={() => loadSession(item.sessionId)}>
                  <span className="si-label">{item.label}</span>
                  <span className="si-meta mono">{item.frameCount} frames · {item.handedness}</span>
                </button>
                {item.rights && (
                  <button
                    className="info-button session-rights-button"
                    type="button"
                    aria-label={`Copyright and license information for ${item.label}`}
                    aria-expanded={open}
                    aria-controls={`rights-${item.sessionId}`}
                    onClick={() => setRightsOpen(open ? null : item.sessionId)}
                  >
                    i
                  </button>
                )}
                {open && item.rights && (
                  <div id={`rights-${item.sessionId}`} className={`session-rights-card ${item.rights.status}`}>
                    <strong>{item.rights.status === 'licensed' ? 'Licensed source' : 'Rights unverified'}</strong>
                    <dl>
                      <div><dt>Creator</dt><dd>{item.rights.creator}</dd></div>
                      <div>
                        <dt>Source</dt>
                        <dd><a href={item.rights.sourceUrl} target="_blank" rel="noreferrer">{item.rights.sourceLabel}</a></dd>
                      </div>
                      <div>
                        <dt>License</dt>
                        <dd>
                          {item.rights.licenseUrl ? (
                            <a href={item.rights.licenseUrl} target="_blank" rel="noreferrer">{item.rights.licenseLabel}</a>
                          ) : item.rights.licenseLabel}
                        </dd>
                      </div>
                    </dl>
                    <p>{item.rights.note}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {showLocalUpload && <UploadPanel />}

      {session && (
        <>
          <EventReview />
          {analysis && <MetricsPanel session={session} analysis={analysis} />}
          <AgentNotes />
          <SessionDetails session={session} />
        </>
      )}

      <footer className="disclaimer">
        Measurement only — not a diagnosis, injury-risk assessment, or medical device.
        Deviation from a reference range is an observation, not a finding.
      </footer>
    </aside>
  )
}
