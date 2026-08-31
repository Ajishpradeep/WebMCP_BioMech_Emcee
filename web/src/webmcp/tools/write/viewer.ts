/**
 * Category D — viewer control. ★ The WebMCP-native category.
 *
 * These four tools mutate the SAME `AnalysisStore` the human's UI renders from, so the
 * agent's reasoning lands on the human's screen rather than in a chat transcript. A
 * backend MCP server cannot do any of this: the state being changed exists only in this
 * tab. Every handler awaits a paint before returning, because agents read the page to
 * plan their next step (Chrome's WebMCP best practices).
 */

import { normalisedPct } from '../../../biomech/analyze'
import { useAnalysis } from '../../../store'
import type { EventName, JointName, OverlayName } from '../../../types'
import { metaFor, nextPaint, ToolInputError, type PitchTool } from '../../registry'
import {
  EVENT_LABEL, EVENT_NAMES, METRIC_LABEL, OVERLAY_LABEL, OVERLAY_NAMES, PLANE_REASON,
  resolveEvent, resolveFocus, resolveOverlay, type CameraPlane,
} from '../../vocab'
import { pct, requireActive, r3 } from '../shared'

const FOCUS_EXAMPLES = [
  'lead_knee', 'trail_knee', 'lead_hip', 'lead_foot', 'throwing_shoulder', 'glove_shoulder',
  'throwing_elbow', 'throwing_wrist', 'pelvis', 'trunk', 'head',
]

export const seekToEvent: PitchTool = {
  name: 'seek_to_event',
  title: 'Seek the viewer to a moment',
  description:
    'Scrubs the 3D viewer to a named pitching event or to a specific frame, so the human is looking at the exact moment you are describing. Pass either event or frame, not both. The viewer moves before this returns.',
  inputSchema: {
    type: 'object',
    properties: {
      event: { type: 'string', enum: EVENT_NAMES, description: 'Move to this detected event.' },
      frame: { type: 'integer', description: 'Move to this frame index instead of an event.' },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: false },
  async execute(input) {
    const { session, analysis } = requireActive()
    const st = useAnalysis.getState()
    const hasEvent = input.event !== undefined && input.event !== null && input.event !== ''
    const hasFrame = input.frame !== undefined && input.frame !== null && input.frame !== ''

    if (hasEvent && hasFrame) {
      throw new ToolInputError('Pass either event or frame, not both — they can disagree.')
    }
    if (!hasEvent && !hasFrame) {
      throw new ToolInputError('Nothing to seek to: pass an event or a frame.', {
        event: EVENT_NAMES,
        frame: [`0`, `${session.frames.length - 1}`],
      })
    }

    let frame: number
    let event: EventName | null = null
    if (hasEvent) {
      const ev = resolveEvent(input.event)
      if (!ev) throw new ToolInputError(`"${String(input.event)}" is not a pitching event.`, { event: EVENT_NAMES })
      const detected = analysis.events.find((e) => e.name === ev)
      if (!detected) {
        throw new ToolInputError(`${EVENT_LABEL[ev]} was not detected in this pitch.`, {
          event: analysis.events.map((e) => e.name),
        })
      }
      frame = detected.frame
      event = ev
    } else {
      const n = Number(input.frame)
      if (!Number.isFinite(n)) throw new ToolInputError(`frame must be a number; got "${String(input.frame)}".`)
      const last = session.frames.length - 1
      if (n < 0 || n > last) {
        throw new ToolInputError(`frame ${n} is outside this pitch: valid frames are 0–${last}.`)
      }
      frame = Math.round(n)
    }

    st.setPlaying(false) // a moving viewer is not a shared reference point
    st.setFrame(frame)
    await nextPaint()

    const applied = useAnalysis.getState().currentFrame
    return {
      movedTo: {
        frame: applied,
        tVideoSeconds: r3(session.frames[applied]?.t ?? 0),
        event,
        pctOfContactToRelease: pct(normalisedPct(applied, analysis.events)),
      },
      playbackPaused: true,
      meta: metaFor(session, 'high', [], ['The human now sees this frame in the 3D viewer.']),
    }
  },
}

export const focusJoint: PitchTool = {
  name: 'focus_joint',
  title: 'Focus a joint in the viewer',
  description:
    'Highlights a joint or segment in the 3D viewer, turns on its angle readout, and rotates the camera to the plane where that angle actually reads true — side-on for flexion, front-on for elevation, overhead for rotation. Accepts coaching names like "front knee", "throwing shoulder" or "trunk", and resolves handedness for you.',
  inputSchema: {
    type: 'object',
    properties: {
      joint: {
        type: 'string',
        description: 'What to look at, e.g. lead_knee, throwing_shoulder, trunk, pelvis, lead_foot.',
      },
      cameraPlane: {
        type: 'string',
        enum: ['auto', 'sagittal', 'frontal', 'transverse', 'free'],
        description: 'Camera viewpoint. "auto" picks the plane the joint\'s angles live in.',
      },
    },
    required: ['joint'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: false },
  async execute(input) {
    const { session } = requireActive()
    const st = useAnalysis.getState()

    const focus = resolveFocus(input.joint, session.subject.handedness)
    if (!focus) {
      throw new ToolInputError(
        `"${String(input.joint)}" is not something this viewer can focus. Use a coaching name or a joint from the session contract.`,
        { joint: FOCUS_EXAMPLES },
      )
    }

    const requested = String(input.cameraPlane ?? 'auto').toLowerCase()
    const allowed: CameraPlane[] = ['sagittal', 'frontal', 'transverse', 'free']
    let plane: CameraPlane
    if (requested === 'auto' || requested === '' || requested === 'undefined') {
      plane = focus.plane
    } else if ((allowed as string[]).includes(requested)) {
      plane = requested as CameraPlane
    } else {
      throw new ToolInputError(`"${requested}" is not a camera plane.`, {
        cameraPlane: ['auto', ...allowed],
      })
    }

    st.selectJoint(focus.joint)
    st.setCameraPlane(plane)
    st.setOverlay('angle_readouts', true) // show the number the camera move is for
    await nextPaint()

    return {
      focused: focus.target,
      joint: focus.joint,
      cameraPlane: plane,
      anglesShown: focus.metrics.map((m) => METRIC_LABEL[m]),
      reason: PLANE_REASON[plane],
      meta: metaFor(session, 'high', [], [
        focus.metrics.length === 0
          ? 'No joint angle is defined at this landmark; it is highlighted for reference only.'
          : 'Angles read most accurately in their own plane; a value quoted from an oblique view carries extra error.',
      ]),
    }
  },
}

export const setOverlay: PitchTool = {
  name: 'set_overlay',
  title: 'Toggle a viewer overlay',
  description:
    'Turns one 3D viewer overlay on or off so you can stage the visual evidence for a point instead of describing it: segment_frames (anatomical triads), axial_dial (shoulder rotation dial), angle_readouts (numeric labels), motion_trail (throwing-hand path), event_markers (timeline markers).',
  inputSchema: {
    type: 'object',
    properties: {
      overlay: { type: 'string', enum: OVERLAY_NAMES, description: 'Which overlay to change.' },
      enabled: { type: 'boolean', description: 'true to show it, false to hide it.' },
    },
    required: ['overlay', 'enabled'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: false },
  async execute(input) {
    const { session } = requireActive()
    const st = useAnalysis.getState()

    const overlay = resolveOverlay(input.overlay)
    if (!overlay) {
      throw new ToolInputError(
        `"${String(input.overlay)}" is not an overlay in this viewer.`,
        { overlay: OVERLAY_NAMES },
      )
    }
    if (typeof input.enabled !== 'boolean') {
      throw new ToolInputError('enabled must be true or false.')
    }

    st.setOverlay(overlay, input.enabled)
    await nextPaint()

    const overlays = useAnalysis.getState().overlays
    return {
      overlay,
      enabled: input.enabled,
      shows: OVERLAY_LABEL[overlay],
      activeOverlays: (Object.keys(overlays) as OverlayName[]).filter((o) => overlays[o]),
      meta: metaFor(session, 'high', [], ['Overlay state is client-only — it changes what the human sees, not what is measured.']),
    }
  },
}

export const annotateFrame: PitchTool = {
  name: 'annotate_frame',
  title: 'Pin a note in the viewer',
  description:
    'Pins a short labelled note to a frame and joint in the 3D viewer, where it stays visible to the human as part of the analysis and survives scrubbing. Use it to leave your observations where they belong — on the moment they describe. Give a frame or an event, and keep the label under 80 characters.',
  inputSchema: {
    type: 'object',
    properties: {
      frame: { type: 'integer', description: 'Frame to pin the note to.' },
      event: { type: 'string', enum: EVENT_NAMES, description: 'Pin at this event instead of a frame.' },
      joint: { type: 'string', description: 'Optional anchor, e.g. lead_knee or throwing_shoulder.' },
      label: { type: 'string', description: 'The note. Max 80 characters; longer text is truncated.' },
      severity: { type: 'string', enum: ['info', 'attention'], description: 'Default "info".' },
    },
    required: ['label'],
    additionalProperties: false,
  },
  // The label originates outside this page: mark it as content the site does not vouch for.
  annotations: { readOnlyHint: false, untrustedContentHint: true },
  async execute(input) {
    const { session, analysis } = requireActive()
    const st = useAnalysis.getState()
    const last = session.frames.length - 1

    const rawLabel = String(input.label ?? '').trim()
    if (!rawLabel) throw new ToolInputError('label is required: a pin with no text tells the human nothing.')
    const label = rawLabel.length > 80 ? `${rawLabel.slice(0, 77)}…` : rawLabel

    let frame: number
    if (input.frame !== undefined && input.frame !== null && input.frame !== '') {
      const n = Number(input.frame)
      if (!Number.isFinite(n) || n < 0 || n > last) {
        throw new ToolInputError(`frame must be between 0 and ${last}; got "${String(input.frame)}".`)
      }
      frame = Math.round(n)
    } else if (input.event) {
      const ev = resolveEvent(input.event)
      const detected = ev ? analysis.events.find((e) => e.name === ev) : undefined
      if (!detected) {
        throw new ToolInputError(`"${String(input.event)}" is not a detected event in this pitch.`, {
          event: analysis.events.map((e) => e.name),
        })
      }
      frame = detected.frame
    } else {
      frame = st.currentFrame // the moment the human is already looking at
    }

    let joint: JointName | null = null
    if (input.joint !== undefined && input.joint !== null && input.joint !== '') {
      const focus = resolveFocus(input.joint, session.subject.handedness)
      if (!focus) {
        throw new ToolInputError(`"${String(input.joint)}" is not a joint this viewer knows.`, {
          joint: FOCUS_EXAMPLES,
        })
      }
      joint = focus.joint
    }

    const severity = input.severity === 'attention' ? 'attention' : 'info'
    const annotation = st.addAnnotation({ frame, joint, label, severity })
    await nextPaint()

    return {
      annotationId: annotation.id,
      frame,
      joint,
      label,
      severity,
      truncated: label !== rawLabel,
      totalAnnotations: useAnalysis.getState().annotations.length,
      meta: metaFor(session, 'high', [], [
        'The note is now pinned in the human’s 3D viewer and listed in the side panel. It is your observation, not a measurement from this app.',
      ]),
    }
  },
}

export const viewerTools: PitchTool[] = [seekToEvent, focusJoint, setOverlay, annotateFrame]
