/**
 * Agent-facing vocabulary: natural-language names in, canonical ids out.
 *
 * Chrome's WebMCP best practices say tools should take **natural-language enums, never
 * ids**, and follow "loose schema, strict code": accept what a model plausibly types,
 * validate hard in the handler, and reply with a message it can retry against. All of
 * that fuzziness is confined to this file so the tool handlers stay strict and boring.
 *
 * Nothing here invents a measurement. It only maps words onto the metrics, events,
 * joints and overlays that already exist in the app.
 */

import type { MetricName } from '../biomech/angles'
import type { EventName, JointName, OverlayName } from '../types'

export type MeasurementPlane = 'sagittal' | 'frontal' | 'transverse'
export type CameraPlane = MeasurementPlane | 'free'

/** Lowercase, punctuation-insensitive key. "Max ER" and "max-er" collapse to the same thing. */
export function normalise(input: unknown): string {
  return String(input ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/* ── events ──────────────────────────────────────────────────────────────── */

export const EVENT_NAMES: EventName[] = ['foot_contact', 'max_external_rotation', 'ball_release']

export const EVENT_LABEL: Record<EventName, string> = {
  foot_contact: 'lead foot contact',
  max_external_rotation: 'maximum external-rotation candidate (review recommended)',
  ball_release: 'ball release',
}

const EVENT_ALIASES: Record<string, EventName> = {
  foot_contact: 'foot_contact', fc: 'foot_contact', foot_strike: 'foot_contact',
  footstrike: 'foot_contact', lead_foot_contact: 'foot_contact',
  front_foot_contact: 'foot_contact', stride_foot_contact: 'foot_contact',
  landing: 'foot_contact', foot_plant: 'foot_contact', plant: 'foot_contact',

  max_external_rotation: 'max_external_rotation', mer: 'max_external_rotation',
  max_er: 'max_external_rotation', maximum_external_rotation: 'max_external_rotation',
  max_layback: 'max_external_rotation', layback: 'max_external_rotation',
  lay_back: 'max_external_rotation', late_cocking: 'max_external_rotation',
  top_of_cocking: 'max_external_rotation',

  ball_release: 'ball_release', br: 'ball_release', release: 'ball_release',
  ball_release_point: 'ball_release', hand_release: 'ball_release',
}

export function resolveEvent(input: unknown): EventName | null {
  return EVENT_ALIASES[normalise(input)] ?? null
}

/* ── metrics ─────────────────────────────────────────────────────────────── */

export const METRIC_NAMES: MetricName[] = [
  'lead_knee_flexion', 'trail_knee_flexion', 'lead_hip_flexion', 'elbow_flexion',
  'shoulder_abduction', 'shoulder_external_rotation', 'shoulder_horizontal_abduction',
  'trunk_forward_tilt', 'trunk_lateral_tilt', 'hip_shoulder_separation', 'lead_foot_angle',
]

export const METRIC_LABEL: Record<MetricName, string> = {
  lead_knee_flexion: 'lead knee flexion',
  trail_knee_flexion: 'trail knee flexion',
  lead_hip_flexion: 'lead hip flexion',
  elbow_flexion: 'elbow flexion',
  shoulder_abduction: 'shoulder abduction',
  shoulder_external_rotation: 'shoulder axial-rotation proxy',
  shoulder_horizontal_abduction: 'shoulder horizontal abduction',
  trunk_forward_tilt: 'camera-frame forward trunk-tilt proxy',
  trunk_lateral_tilt: 'camera-frame lateral trunk-tilt proxy',
  hip_shoulder_separation: 'pelvis-to-trunk rotation proxy',
  lead_foot_angle: 'foot-to-pelvis angle proxy',
}

/**
 * Which anatomical plane a metric lives in. Drives `focus_joint`'s "auto" camera choice
 * and the measurement-plane note in `get_metric_definition` — an angle is only legible
 * from a viewpoint that contains its plane.
 */
export const METRIC_PLANE: Record<MetricName, MeasurementPlane> = {
  lead_knee_flexion: 'sagittal',
  trail_knee_flexion: 'sagittal',
  lead_hip_flexion: 'sagittal',
  elbow_flexion: 'sagittal',
  trunk_forward_tilt: 'sagittal',
  shoulder_abduction: 'frontal',
  trunk_lateral_tilt: 'frontal',
  hip_shoulder_separation: 'transverse',
  lead_foot_angle: 'transverse',
  shoulder_horizontal_abduction: 'transverse',
  shoulder_external_rotation: 'transverse',
}

const METRIC_ALIASES: Record<string, MetricName> = {
  ...Object.fromEntries(METRIC_NAMES.map((m) => [m, m])) as Record<string, MetricName>,

  knee_flexion: 'lead_knee_flexion', lead_knee: 'lead_knee_flexion',
  front_knee: 'lead_knee_flexion', front_knee_flexion: 'lead_knee_flexion',
  landing_knee: 'lead_knee_flexion',
  trail_knee: 'trail_knee_flexion', back_knee: 'trail_knee_flexion',
  drive_knee: 'trail_knee_flexion', rear_knee: 'trail_knee_flexion',
  hip_flexion: 'lead_hip_flexion', lead_hip: 'lead_hip_flexion', front_hip: 'lead_hip_flexion',
  elbow: 'elbow_flexion', elbow_bend: 'elbow_flexion', elbow_angle: 'elbow_flexion',
  abduction: 'shoulder_abduction', arm_elevation: 'shoulder_abduction',
  shoulder_elevation: 'shoulder_abduction', arm_slot: 'shoulder_abduction',
  shoulder: 'shoulder_abduction',
  er: 'shoulder_external_rotation', shoulder_er: 'shoulder_external_rotation',
  external_rotation: 'shoulder_external_rotation',
  maximum_external_rotation: 'shoulder_external_rotation',
  layback: 'shoulder_external_rotation', lay_back: 'shoulder_external_rotation',
  horizontal_abduction: 'shoulder_horizontal_abduction',
  horizontal_adduction: 'shoulder_horizontal_abduction',
  scapular_loading: 'shoulder_horizontal_abduction',
  forward_tilt: 'trunk_forward_tilt', trunk_flexion: 'trunk_forward_tilt',
  trunk_tilt: 'trunk_forward_tilt', forward_trunk_tilt: 'trunk_forward_tilt',
  lateral_tilt: 'trunk_lateral_tilt', side_tilt: 'trunk_lateral_tilt',
  lateral_trunk_tilt: 'trunk_lateral_tilt', trunk_side_tilt: 'trunk_lateral_tilt',
  separation: 'hip_shoulder_separation', x_factor: 'hip_shoulder_separation',
  hip_to_shoulder_separation: 'hip_shoulder_separation',
  pelvis_trunk_separation: 'hip_shoulder_separation',
  torso_separation: 'hip_shoulder_separation',
  foot_angle: 'lead_foot_angle', stride_foot_angle: 'lead_foot_angle',
  foot_position: 'lead_foot_angle', landing_foot_angle: 'lead_foot_angle',
}

export function resolveMetric(input: unknown): MetricName | null {
  return METRIC_ALIASES[normalise(input)] ?? null
}

/* ── overlays ────────────────────────────────────────────────────────────── */

export const OVERLAY_NAMES: OverlayName[] = [
  'segment_frames', 'axial_dial', 'angle_readouts', 'motion_trail', 'event_markers',
]

export const OVERLAY_LABEL: Record<OverlayName, string> = {
  segment_frames: 'anatomical segment coordinate triads on each segment',
  axial_dial: 'dial showing shoulder axial rotation about the humeral long axis',
  angle_readouts: 'numeric joint-angle labels on the focused joint',
  motion_trail: 'trail of the throwing hand over the last 90 frames',
  event_markers: 'foot-contact / MER / release markers on the timeline',
}

const OVERLAY_ALIASES: Record<string, OverlayName> = {
  ...Object.fromEntries(OVERLAY_NAMES.map((o) => [o, o])) as Record<string, OverlayName>,
  segment_triads: 'segment_frames', triads: 'segment_frames', frames: 'segment_frames',
  coordinate_frames: 'segment_frames', axes: 'segment_frames',
  axial_rotation_dial: 'axial_dial', rotation_dial: 'axial_dial', dial: 'axial_dial',
  angles: 'angle_readouts', angle_labels: 'angle_readouts', readouts: 'angle_readouts',
  joint_angles: 'angle_readouts',
  trail: 'motion_trail', trails: 'motion_trail', hand_trail: 'motion_trail',
  motion_path: 'motion_trail', path: 'motion_trail',
  events: 'event_markers', markers: 'event_markers', timeline_markers: 'event_markers',
}

export function resolveOverlay(input: unknown): OverlayName | null {
  return OVERLAY_ALIASES[normalise(input)] ?? null
}

/* ── focus targets ───────────────────────────────────────────────────────── */

type Side = 'lead' | 'trail' | 'throwing' | 'glove' | 'none'

interface FocusTarget {
  /** Canonical, handedness-neutral name — what the tool echoes back. */
  name: string
  side: Side
  /** Joint suffix, or a full joint name when `side` is "none". */
  base: string
  plane: MeasurementPlane
  /** Metrics that read off this joint, used for the on-screen angle readout. */
  metrics: MetricName[]
}

const FOCUS_TARGETS: FocusTarget[] = [
  { name: 'lead_knee', side: 'lead', base: 'knee', plane: 'sagittal', metrics: ['lead_knee_flexion'] },
  { name: 'trail_knee', side: 'trail', base: 'knee', plane: 'sagittal', metrics: ['trail_knee_flexion'] },
  { name: 'lead_hip', side: 'lead', base: 'hip', plane: 'sagittal', metrics: ['lead_hip_flexion'] },
  { name: 'trail_hip', side: 'trail', base: 'hip', plane: 'sagittal', metrics: [] },
  { name: 'lead_ankle', side: 'lead', base: 'ankle', plane: 'transverse', metrics: ['lead_foot_angle'] },
  { name: 'lead_foot', side: 'lead', base: 'big_toe', plane: 'transverse', metrics: ['lead_foot_angle'] },
  { name: 'throwing_shoulder', side: 'throwing', base: 'acromion', plane: 'frontal',
    metrics: ['shoulder_abduction', 'shoulder_external_rotation', 'shoulder_horizontal_abduction'] },
  { name: 'glove_shoulder', side: 'glove', base: 'acromion', plane: 'frontal', metrics: [] },
  { name: 'throwing_elbow', side: 'throwing', base: 'elbow', plane: 'sagittal', metrics: ['elbow_flexion'] },
  { name: 'throwing_wrist', side: 'throwing', base: 'wrist', plane: 'sagittal', metrics: [] },
  { name: 'pelvis', side: 'none', base: 'pelvis', plane: 'transverse', metrics: ['hip_shoulder_separation'] },
  { name: 'trunk', side: 'none', base: 'thorax', plane: 'sagittal',
    metrics: ['trunk_forward_tilt', 'trunk_lateral_tilt', 'hip_shoulder_separation'] },
  { name: 'head', side: 'none', base: 'neck', plane: 'sagittal', metrics: [] },
]

const FOCUS_ALIASES: Record<string, string> = {
  ...Object.fromEntries(FOCUS_TARGETS.map((t) => [t.name, t.name])),
  knee: 'lead_knee', front_knee: 'lead_knee', landing_knee: 'lead_knee',
  lead_knee_flexion: 'lead_knee', front_leg: 'lead_knee', stride_leg: 'lead_knee',
  back_knee: 'trail_knee', drive_knee: 'trail_knee', rear_knee: 'trail_knee',
  trail_knee_flexion: 'trail_knee', back_leg: 'trail_knee', drive_leg: 'trail_knee',
  hip: 'lead_hip', front_hip: 'lead_hip', lead_hip_flexion: 'lead_hip',
  ankle: 'lead_ankle', front_ankle: 'lead_ankle', lead_foot_angle: 'lead_foot',
  foot: 'lead_foot', front_foot: 'lead_foot', stride_foot: 'lead_foot',
  shoulder: 'throwing_shoulder', pitching_shoulder: 'throwing_shoulder',
  throwing_arm: 'throwing_shoulder', arm: 'throwing_shoulder',
  shoulder_abduction: 'throwing_shoulder', shoulder_external_rotation: 'throwing_shoulder',
  shoulder_horizontal_abduction: 'throwing_shoulder',
  lead_shoulder: 'glove_shoulder', front_shoulder: 'glove_shoulder',
  glove_arm: 'glove_shoulder', glove_side: 'glove_shoulder',
  elbow: 'throwing_elbow', pitching_elbow: 'throwing_elbow', elbow_flexion: 'throwing_elbow',
  wrist: 'throwing_wrist', hand: 'throwing_wrist', throwing_hand: 'throwing_wrist',
  hips: 'pelvis', pelvis_rotation: 'pelvis', hip_shoulder_separation: 'trunk',
  torso: 'trunk', thorax: 'trunk', chest: 'trunk', shoulders: 'trunk', core: 'trunk',
  trunk_forward_tilt: 'trunk', trunk_lateral_tilt: 'trunk',
  neck: 'head', nose: 'head',
}

export interface ResolvedFocus {
  target: string
  joint: JointName
  plane: MeasurementPlane
  metrics: MetricName[]
}

/**
 * Map a spoken name ("front knee", "throwing shoulder", "elbow_flexion") onto a real
 * joint, resolving handedness — a right-hander strides onto the left leg, so "lead knee"
 * is `l_knee` for one pitcher and `r_knee` for another.
 */
export function resolveFocus(input: unknown, handedness: 'left' | 'right'): ResolvedFocus | null {
  const key = normalise(input)
  const throwing = handedness === 'left' ? 'l' : 'r'
  const glove = throwing === 'l' ? 'r' : 'l'
  const lead = glove // a right-hander strides onto the left leg
  const trail = throwing

  const named = FOCUS_ALIASES[key]
  const target = FOCUS_TARGETS.find((t) => t.name === named)
  if (target) {
    const prefix: Record<Side, string> = {
      lead: `${lead}_`, trail: `${trail}_`, throwing: `${throwing}_`, glove: `${glove}_`, none: '',
    }
    return {
      target: target.name,
      joint: `${prefix[target.side]}${target.base}` as JointName,
      plane: target.plane,
      metrics: target.metrics,
    }
  }

  // Raw joint names from the session contract are accepted too (l_knee, r_elbow, …).
  if (RAW_JOINTS.has(key)) {
    return { target: key, joint: key as JointName, plane: planeForRawJoint(key), metrics: metricsForJoint(key as JointName, handedness) }
  }
  return null
}

const RAW_JOINTS = new Set<string>([
  'pelvis', 'thorax', 'neck', 'nose',
  'l_acromion', 'l_elbow', 'l_wrist', 'r_acromion', 'r_elbow', 'r_wrist',
  'l_olecranon', 'r_olecranon', 'l_cubital_fossa', 'r_cubital_fossa',
  'l_hip', 'l_knee', 'l_ankle', 'l_heel', 'l_big_toe',
  'r_hip', 'r_knee', 'r_ankle', 'r_heel', 'r_big_toe',
])

function planeForRawJoint(joint: string): MeasurementPlane {
  if (joint === 'pelvis') return 'transverse'
  if (joint.endsWith('ankle') || joint.endsWith('heel') || joint.endsWith('big_toe')) return 'transverse'
  if (joint.endsWith('acromion')) return 'frontal'
  return 'sagittal'
}

/** Metrics that can be read off a given joint — drives the in-viewer angle readout. */
export function metricsForJoint(joint: JointName, handedness: 'left' | 'right'): MetricName[] {
  const throwing = handedness === 'left' ? 'l' : 'r'
  const lead = throwing === 'l' ? 'r' : 'l'
  const side = joint.slice(0, 1)
  const base = joint.replace(/^[lr]_/, '')

  if (base === 'knee') return side === lead ? ['lead_knee_flexion'] : ['trail_knee_flexion']
  if (base === 'hip') return side === lead ? ['lead_hip_flexion'] : []
  if (base === 'ankle' || base === 'heel' || base === 'big_toe') {
    return side === lead ? ['lead_foot_angle'] : []
  }
  if (base === 'acromion') {
    return side === throwing
      ? ['shoulder_abduction', 'shoulder_external_rotation', 'shoulder_horizontal_abduction']
      : []
  }
  if (base === 'elbow' || base === 'olecranon' || base === 'cubital_fossa') {
    return side === throwing ? ['elbow_flexion'] : []
  }
  if (joint === 'pelvis') return ['hip_shoulder_separation']
  if (joint === 'thorax') return ['trunk_forward_tilt', 'trunk_lateral_tilt', 'hip_shoulder_separation']
  return []
}

/** Why a given camera plane makes an angle legible — returned by `focus_joint`. */
export const PLANE_REASON: Record<CameraPlane, string> = {
  sagittal: 'Side-on view: flexion and forward-tilt angles lie in this plane and read true.',
  frontal: 'Front-on view: elevation and lateral-tilt angles lie in this plane and read true.',
  transverse: 'Overhead view: rotation and separation angles lie in this plane and read true.',
  free: 'Free orbit: a three-quarter view that keeps the whole delivery in frame.',
}

/* ── kinematic-sequence segment names ────────────────────────────────────── */

/** Internal segment ids read as anatomy in the engine; agents expect coaching words. */
export const SEGMENT_LABEL: Record<string, string> = {
  pelvis: 'pelvis',
  thorax: 'trunk',
  upperarm: 'arm',
  forearm: 'forearm',
}
