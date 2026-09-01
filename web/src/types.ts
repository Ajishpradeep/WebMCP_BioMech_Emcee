/**
 * session.json contract — mirrors pipeline/joint_map.py and .claude/steering/tech.md §4.
 *
 * ⚠️ FROZEN. `JOINT_NAMES` order must match pipeline/joint_map.py exactly; the
 * `keypoints3d` rows are index-aligned to it.
 */

export type Confidence = 'high' | 'medium' | 'low' | 'unavailable'

/** Index-aligned to session.joints. Keep in sync with pipeline/joint_map.py. */
export const JOINT_NAMES = [
  'pelvis', 'thorax',
  'neck', 'nose',
  'l_acromion', 'l_elbow', 'l_wrist',
  'r_acromion', 'r_elbow', 'r_wrist',
  'l_olecranon', 'r_olecranon',
  'l_cubital_fossa', 'r_cubital_fossa',
  'l_hip', 'l_knee', 'l_ankle', 'l_heel', 'l_big_toe',
  'r_hip', 'r_knee', 'r_ankle', 'r_heel', 'r_big_toe',
] as const

export type JointName = (typeof JOINT_NAMES)[number]

export interface Frame {
  index: number
  sourceFrame: number
  /** VIDEO seconds, not real seconds — see Timebase.slowMotion. */
  t: number
  keypoints3d: [number, number, number][]
  keypoints2d: [number, number][]
}

export interface Timebase {
  videoFps: number
  /** True when the source is a slow-motion recording. */
  slowMotion: boolean
  /**
   * Multiply video seconds by this to get real seconds. `null` means unknown, which
   * makes every rate-derived metric (deg/s, separation time in seconds) `unavailable`.
   * See .claude/steering/tech.md §3.2b.
   */
  realTimeScale: number | null
  scaleSource: 'unknown' | 'user' | 'estimated'
}

export interface Session {
  schemaVersion: string
  sessionId: string
  source: {
    label: string
    view: string
    frameCount: number
    resolution: [number, number]
    attribution: string
    /** Trimmed browser video aligned so video time 0 equals session frame 0. */
    videoFile?: string
  }
  subject: {
    handedness: 'right' | 'left'
    heightMeters: number | null
    heightSource: string
  }
  capture: {
    model: string
    /** Always true: reconstruction is camera-frame, not metric world space. */
    cameraFrame: boolean
    focalLengthEstimated: boolean
    focalLengthMedian: number
    smoothing: { method: string; window: number; polyorder: number }
  }
  timebase: Timebase
  joints: string[]
  /** Pairs of indices into `joints`. */
  bones: [number, number][]
  frames: Frame[]
}

export interface SessionIndexEntry {
  sessionId: string
  label: string
  handedness: 'right' | 'left'
  view: string
  frameCount: number
  file: string
  rights?: {
    status: 'licensed' | 'unverified'
    creator: string
    sourceLabel: string
    sourceUrl: string
    licenseLabel: string
    licenseUrl?: string
    note: string
  }
}

/** Named pitching events. Detection lands in Task 9. */
export type EventName = 'foot_contact' | 'max_external_rotation' | 'ball_release'

export interface PhaseEvent {
  name: EventName
  frame: number
  t: number
  method: string
  confidence: Confidence
  manualOverride: boolean
}

export type OverlayName =
  | 'segment_frames'
  | 'axial_dial'
  | 'angle_readouts'
  | 'motion_trail'
  | 'event_markers'

export interface Annotation {
  id: string
  frame: number
  joint: JointName | null
  label: string
  severity: 'info' | 'attention'
  createdAt: number
}
