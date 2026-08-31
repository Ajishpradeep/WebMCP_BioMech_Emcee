import { useAnalysis } from '../store'
import { JOINT_NAMES, type JointName, type OverlayName, type Session } from '../types'
import { MetricsPanel } from './MetricsPanel'
import { UploadPanel } from './UploadPanel'

const OVERLAY_LABEL: Record<OverlayName, string> = {
  segment_frames: 'Segment frames (triads)',
  axial_dial: 'Axial-rotation dial',
  angle_readouts: 'Angle readouts',
  motion_trail: 'Motion trail',
  event_markers: 'Event markers',
}

const PLANES = ['free', 'sagittal', 'frontal', 'transverse'] as const

function SessionMeta({ session }: { session: Session }) {
  const tb = session.timebase
  return (
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
      </div>
    </div>
  )
}

export function SidePanel({ session }: { session: Session | null }) {
  const analysis = useAnalysis((s) => s.analysis)
  const index = useAnalysis((s) => s.index)
  const loadSession = useAnalysis((s) => s.loadSession)
  const selectedJoint = useAnalysis((s) => s.selectedJoint)
  const selectJoint = useAnalysis((s) => s.selectJoint)
  const overlays = useAnalysis((s) => s.overlays)
  const setOverlay = useAnalysis((s) => s.setOverlay)
  const cameraPlane = useAnalysis((s) => s.cameraPlane)
  const setCameraPlane = useAnalysis((s) => s.setCameraPlane)
  const annotations = useAnalysis((s) => s.annotations)
  const clearAnnotations = useAnalysis((s) => s.clearAnnotations)

  return (
    <aside className="panel">
      <section>
        <h2>Sessions</h2>
        <div className="session-list">
          {index.length === 0 && <p className="dim small">No analysed sessions yet.</p>}
          {index.map((s) => (
            <button
              key={s.sessionId}
              className={`session-item ${session?.sessionId === s.sessionId ? 'on' : ''}`}
              onClick={() => loadSession(s.sessionId)}
            >
              <span className="si-label">{s.label}</span>
              <span className="si-meta mono">{s.frameCount} frames · {s.handedness}</span>
            </button>
          ))}
        </div>
      </section>

      <UploadPanel />

      {session && (
        <>
          {analysis && <MetricsPanel session={session} analysis={analysis} />}

          <section>
            <h2>Capture</h2>
            <SessionMeta session={session} />
          </section>

          <section>
            <h2>View</h2>
            <div className="chips">
              {PLANES.map((p) => (
                <button
                  key={p}
                  className={`chip ${cameraPlane === p ? 'on' : ''}`}
                  onClick={() => setCameraPlane(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="toggles">
              {(Object.keys(OVERLAY_LABEL) as OverlayName[]).map((o) => (
                <label key={o} className="toggle">
                  <input
                    type="checkbox"
                    checked={overlays[o]}
                    onChange={(e) => setOverlay(o, e.target.checked)}
                  />
                  <span>{OVERLAY_LABEL[o]}</span>

                </label>
              ))}
            </div>
          </section>

          <section>
            <h2>Focus joint</h2>
            <div className="chips wrap">
              <button
                className={`chip ${selectedJoint === null ? 'on' : ''}`}
                onClick={() => selectJoint(null)}
              >
                none
              </button>
              {JOINT_NAMES.filter((j) => !j.includes('cubital') && !j.includes('olecranon')).map(
                (j) => (
                  <button
                    key={j}
                    className={`chip ${selectedJoint === j ? 'on' : ''}`}
                    onClick={() => selectJoint(j as JointName)}
                  >
                    {j}
                  </button>
                ),
              )}
            </div>
          </section>

          <section>
            <h2>
              Agent annotations
              {annotations.length > 0 && <span className="count">{annotations.length}</span>}
            </h2>
            {annotations.length === 0 ? (
              <p className="dim small">
                None yet. An agent can pin notes into the 3D view with{' '}
                <span className="mono">annotate_frame</span>; they stay here and in the viewer
                while you scrub.
              </p>
            ) : (
              <>
                <ul className="ann-list">
                  {annotations.map((a) => (
                    <li key={a.id} className={a.severity}>
                      <span className="mono dim">f{a.frame}</span> {a.label}
                    </li>
                  ))}
                </ul>
                <button className="btn small" onClick={clearAnnotations}>Clear</button>
              </>
            )}
          </section>
        </>
      )}

      <footer className="disclaimer">
        Measurement only — not a diagnosis, injury-risk assessment, or medical device.
        Deviation from a reference range is an observation, not a finding.
      </footer>
    </aside>
  )
}
