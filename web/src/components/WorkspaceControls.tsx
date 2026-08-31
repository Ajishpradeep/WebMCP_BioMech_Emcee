import { useAnalysis } from '../store'
import { JOINT_NAMES, type JointName, type OverlayName, type Session } from '../types'

const PLANE_LABEL = {
  free: 'Free',
  sagittal: 'Side',
  frontal: 'Front',
  transverse: 'Top',
} as const

const OVERLAY_LABEL: Record<OverlayName, string> = {
  segment_frames: 'Segment axes',
  axial_dial: 'Axial dial',
  angle_readouts: 'Angle labels',
  motion_trail: 'Hand trail',
  event_markers: 'Event markers',
}

const FOCUS_JOINTS = JOINT_NAMES.filter(
  (joint) => !joint.includes('cubital') && !joint.includes('olecranon'),
)

function jointLabel(joint: JointName, handedness: Session['subject']['handedness']) {
  const throwing = handedness === 'right' ? 'r' : 'l'
  const side = joint.startsWith('l_') ? 'l' : joint.startsWith('r_') ? 'r' : null
  const part = side ? joint.slice(2) : joint
  if (!side) return part === 'thorax' ? 'Trunk' : part[0].toUpperCase() + part.slice(1)

  if (['acromion', 'elbow', 'wrist'].includes(part)) {
    const role = side === throwing ? 'Throwing' : 'Glove'
    const name = part === 'acromion' ? 'shoulder' : part
    return `${role} ${name}`
  }

  const role = side === throwing ? 'Trail' : 'Lead'
  return `${role} ${part.replace('_', ' ')}`
}

/**
 * Persistent controls for the live workspace. These are deliberately outside the
 * scrolling inspector: focus_joint and set_overlay should be as legible to the human
 * as they are callable by an agent.
 */
export function WorkspaceControls({ session }: { session: Session }) {
  const selectedJoint = useAnalysis((state) => state.selectedJoint)
  const selectJoint = useAnalysis((state) => state.selectJoint)
  const cameraPlane = useAnalysis((state) => state.cameraPlane)
  const setCameraPlane = useAnalysis((state) => state.setCameraPlane)
  const overlays = useAnalysis((state) => state.overlays)
  const setOverlay = useAnalysis((state) => state.setOverlay)

  const activeOverlays = (Object.keys(overlays) as OverlayName[]).filter((overlay) => overlays[overlay])
  const focusLabel = selectedJoint ? jointLabel(selectedJoint, session.subject.handedness) : 'No focus'

  return (
    <section className="workspace-controls" aria-label="Shared viewer controls">
      <div className="workspace-head">
        <div>
          <h3>Shared view</h3>
          <p>Human and agent control the same workspace.</p>
        </div>
        <span className="tag shared">live state</span>
      </div>

      <div className="shared-state" aria-live="polite">
        <span>{PLANE_LABEL[cameraPlane]} view</span>
        <span>{focusLabel}</span>
        <span>{activeOverlays.length} layers</span>
      </div>

      <div className="control-block">
        <span className="control-label">Camera</span>
        <div className="control-segments">
          {(Object.keys(PLANE_LABEL) as (keyof typeof PLANE_LABEL)[]).map((plane) => (
            <button
              key={plane}
              className={cameraPlane === plane ? 'on' : ''}
              onClick={() => setCameraPlane(plane)}
              aria-pressed={cameraPlane === plane}
              title={`${plane} camera plane`}
            >
              {PLANE_LABEL[plane]}
            </button>
          ))}
        </div>
      </div>

      <label className="control-block focus-control">
        <span className="control-label">Focus</span>
        <select
          value={selectedJoint ?? ''}
          onChange={(event) => selectJoint((event.target.value || null) as JointName | null)}
        >
          <option value="">No focused joint</option>
          {FOCUS_JOINTS.map((joint) => (
            <option key={joint} value={joint}>{jointLabel(joint, session.subject.handedness)}</option>
          ))}
        </select>
      </label>

      <div className="control-block overlay-control">
        <span className="control-label">Evidence layers</span>
        <div className="overlay-chips">
          {(Object.keys(OVERLAY_LABEL) as OverlayName[]).map((overlay) => (
            <button
              key={overlay}
              className={overlays[overlay] ? 'on' : ''}
              onClick={() => setOverlay(overlay, !overlays[overlay])}
              aria-pressed={overlays[overlay]}
            >
              <span className="overlay-check" aria-hidden="true">{overlays[overlay] ? '✓' : '+'}</span>
              {OVERLAY_LABEL[overlay]}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
