/**
 * Published reference ranges — THE single source of truth.
 *
 * The UI and the `get_metric_definition` WebMCP tool both read from here, so a number
 * shown on screen and a number given to an agent can never drift apart.
 *
 * ⚠️ Every entry must carry its citation. A range without a source does not belong here.
 * These are *reference ranges observed in pitching populations*, not targets, and not
 * diagnostic thresholds. Falling outside one is an observation, not a finding.
 */

import type { Confidence } from '../types'
import type { MetricName } from './angles'
import type { EventName } from '../types'

export interface Citation {
  key: string
  text: string
  doi?: string
  /** Compact form for WebMCP `meta.citations` — the full text blows the output budget. */
  short: string
}

export const CITATIONS: Record<string, Citation> = {
  christoffer2019: {
    key: 'christoffer2019',
    text: 'Christoffer DJ, Melugin HP, Cherny CE. A Clinician’s Guide to Analysis of the Pitching Motion. Curr Rev Musculoskelet Med. 2019;12(2):98–104.',
    doi: '10.1007/s12178-019-09556-4',
    short: 'Christoffer 2019, Curr Rev Musculoskelet Med, doi:10.1007/s12178-019-09556-4',
  },
  diffendaffer2023: {
    key: 'diffendaffer2023',
    text: 'Diffendaffer AZ, Bagwell MS, Fleisig GS, et al. The Clinician’s Guide to Baseball Pitching Biomechanics. Sports Health. 2023;15(2):274–281.',
    doi: '10.1177/19417381221078537',
    short: 'Diffendaffer 2023, Sports Health, doi:10.1177/19417381221078537',
  },
  kinematicSeq2020: {
    key: 'kinematicSeq2020',
    text: 'Kinematic sequence patterns in the overhead baseball pitch. Sports Biomechanics. 2020;19(5). PMID 30213227.',
    short: 'Kinematic sequence patterns, Sports Biomech 2020;19(5), PMID 30213227',
  },
  markerless: {
    key: 'markerless',
    text: 'Markerless vs marker-based agreement in sports settings is reported at RMSD 6.3–23.0°, weakest for internal/external rotation.',
    short: 'Markerless vs marker-based agreement: RMSD 6.3–23.0°, worst for axial rotation',
  },
}

export interface ReferenceRange {
  metric: MetricName
  event: EventName
  /** Observed range across the cited sources. */
  range: [number, number]
  typical?: number
  sd?: number
  unit: 'deg'
  confidence: Confidence
  citations: string[]
  plainLanguage: string
  computation: string
  limitations: string
}

export const REFERENCES: ReferenceRange[] = [
  // ── at lead foot contact ──
  {
    metric: 'shoulder_abduction', event: 'foot_contact',
    range: [78, 95], typical: 93, sd: 11, unit: 'deg', confidence: 'high',
    citations: ['christoffer2019', 'diffendaffer2023'],
    plainLanguage: 'How far the throwing arm is raised away from the trunk when the lead foot lands.',
    computation: 'Elevation term of the ISB Y–X–Y decomposition of the humerus relative to the thorax frame.',
    limitations: 'Elevation is well conditioned; the plane/axial split degrades near 0° elevation.',
  },
  {
    metric: 'elbow_flexion', event: 'foot_contact',
    range: [74, 90], typical: 87, sd: 15, unit: 'deg', confidence: 'high',
    citations: ['christoffer2019', 'diffendaffer2023'],
    plainLanguage: 'How bent the throwing elbow is at lead foot contact.',
    computation: 'Angle between the humerus and forearm long axes, from joint centres alone.',
    limitations: 'Robust — depends only on shoulder, elbow and wrist positions.',
  },
  {
    metric: 'lead_knee_flexion', event: 'foot_contact',
    range: [40, 49], typical: 43, sd: 10, unit: 'deg', confidence: 'high',
    citations: ['christoffer2019', 'diffendaffer2023'],
    plainLanguage: 'How bent the front knee is as it lands.',
    computation: 'Angle between the thigh and shank long axes.',
    limitations: 'Robust. The flexion axis is ill-conditioned when the knee is near full extension.',
  },
  {
    metric: 'lead_foot_angle', event: 'foot_contact',
    range: [14, 21.6], typical: 17, sd: 9, unit: 'deg', confidence: 'medium',
    citations: ['christoffer2019', 'diffendaffer2023'],
    plainLanguage: 'How much the front foot is turned open or closed relative to the pelvis at landing.',
    computation: 'Heel→toe vector against the pelvis anterior axis, projected on the transverse plane.',
    limitations: 'Transverse-plane angles are more sensitive to reconstruction noise than sagittal ones.',
  },
  {
    metric: 'hip_shoulder_separation', event: 'foot_contact',
    range: [30, 60], unit: 'deg', confidence: 'medium',
    citations: ['diffendaffer2023'],
    plainLanguage: 'How far the shoulders have stayed closed relative to the hips — the stretch that stores energy across the trunk.',
    computation: 'Signed angle from the pelvis medio-lateral axis to the thorax medio-lateral axis, about world vertical.',
    limitations: 'A transverse-plane measure, so `medium` confidence at best from a single camera.',
  },

  // ── at maximum external rotation ──
  {
    metric: 'shoulder_external_rotation', event: 'max_external_rotation',
    range: [166, 182], typical: 175, sd: 8, unit: 'deg', confidence: 'low',
    citations: ['christoffer2019', 'diffendaffer2023', 'markerless'],
    plainLanguage: 'How far the throwing arm lays back at the top of the cocking phase — the headline number in pitching biomechanics.',
    computation: 'Axial-rotation term of the ISB Y–X–Y decomposition of the humerus relative to the thorax. Requires the elbow antero-posterior axis (olecranon → cubital fossa) to resolve rotation about the humeral long axis.',
    limitations: 'Internal/external rotation is where markerless methods agree worst with marker-based systems. Treat the trend across a session as far more reliable than any single absolute value.',
  },
  {
    metric: 'elbow_flexion', event: 'max_external_rotation',
    range: [95, 102], typical: 100, sd: 11, unit: 'deg', confidence: 'high',
    citations: ['christoffer2019', 'diffendaffer2023'],
    plainLanguage: 'Elbow bend at maximum external rotation.',
    computation: 'Angle between the humerus and forearm long axes.',
    limitations: 'Robust.',
  },
  {
    metric: 'shoulder_abduction', event: 'max_external_rotation',
    range: [66, 100], typical: 90, unit: 'deg', confidence: 'high',
    citations: ['christoffer2019', 'diffendaffer2023'],
    plainLanguage: 'Arm elevation at maximum external rotation — usually close to 90°.',
    computation: 'Elevation term of the ISB Y–X–Y decomposition.',
    limitations: 'Well conditioned near 90° elevation.',
  },

  // ── at ball release ──
  {
    metric: 'shoulder_abduction', event: 'ball_release',
    range: [70, 94], typical: 94, sd: 8, unit: 'deg', confidence: 'high',
    citations: ['christoffer2019', 'diffendaffer2023'],
    plainLanguage: 'Arm elevation at the moment the ball leaves the hand.',
    computation: 'Elevation term of the ISB Y–X–Y decomposition.',
    limitations: 'Well conditioned.',
  },
  {
    metric: 'elbow_flexion', event: 'ball_release',
    range: [24, 39], typical: 24, sd: 5, unit: 'deg', confidence: 'high',
    citations: ['christoffer2019', 'diffendaffer2023'],
    plainLanguage: 'How extended the elbow is at release.',
    computation: 'Angle between the humerus and forearm long axes.',
    limitations: 'Robust.',
  },
  {
    metric: 'trunk_forward_tilt', event: 'ball_release',
    range: [30, 55], typical: 36, sd: 7, unit: 'deg', confidence: 'high',
    citations: ['christoffer2019', 'diffendaffer2023'],
    plainLanguage: 'How far the trunk has tipped forward over the front leg at release.',
    computation: 'Signed angle of the thorax long axis from world vertical, about the thorax medio-lateral axis.',
    limitations: 'Sagittal-plane measure — among the better conditioned angles.',
  },
  {
    metric: 'trunk_lateral_tilt', event: 'ball_release',
    range: [21, 29.5], typical: 23, sd: 10, unit: 'deg', confidence: 'high',
    citations: ['christoffer2019', 'diffendaffer2023'],
    plainLanguage: 'How far the trunk is tilted toward the glove side at release.',
    computation: 'Signed angle of the thorax long axis from world vertical, about the thorax anterior axis.',
    limitations: 'Frontal-plane measure — well conditioned.',
  },
  {
    metric: 'lead_knee_flexion', event: 'ball_release',
    range: [31.2, 41], typical: 35, sd: 13, unit: 'deg', confidence: 'high',
    citations: ['christoffer2019', 'diffendaffer2023'],
    plainLanguage: 'Front-knee bend at release. Extending the front leg from landing to release helps transfer energy upward.',
    computation: 'Angle between the thigh and shank long axes.',
    limitations: 'Robust.',
  },
]

export function referenceFor(metric: MetricName, event: EventName): ReferenceRange | undefined {
  return REFERENCES.find((r) => r.metric === metric && r.event === event)
}

/** Quantities we deliberately refuse to report, with the reason and the honest alternative. */
export const REFUSALS: Record<string, { reason: string; insteadUse: string[] }> = {
  elbow_valgus_torque: {
    reason:
      'Elbow valgus torque is a kinetic quantity. Deriving it needs force data and an inverse-dynamics musculoskeletal model; monocular video provides neither. Any number would be fabricated.',
    insteadUse: ['shoulder_external_rotation', 'elbow_flexion', 'hip_shoulder_separation'],
  },
  shoulder_distraction_force: {
    reason: 'A kinetic quantity requiring force measurement and inverse dynamics. Not derivable from video.',
    insteadUse: ['shoulder_abduction', 'shoulder_external_rotation'],
  },
  ground_reaction_force: {
    reason: 'Requires a force plate. Nothing in a video determines it.',
    insteadUse: ['lead_knee_flexion', 'trunk_forward_tilt'],
  },
  injury_risk: {
    reason:
      'PitchLab does not predict injury. The prospective evidence linking individual biomechanical measures to injury is weak, and deviation from a reference range is an observation, not a diagnosis.',
    insteadUse: ['hip_shoulder_separation', 'shoulder_external_rotation'],
  },
  pitch_velocity: {
    reason:
      'Ball speed needs a calibrated scale and a tracked ball. The reconstruction is camera-frame with an estimated focal length, so absolute speeds are not recoverable.',
    insteadUse: ['hip_shoulder_separation', 'lead_knee_flexion'],
  },
}

/**
 * Metrics the engine computes but for which our cited sources publish no reference range.
 * They are still measurable and still worth reporting — `get_metric_definition` serves
 * these so the agent gets the computation and the caveats without a fabricated range.
 */
export const METRIC_INFO: Partial<
  Record<MetricName, { plainLanguage: string; computation: string; limitations: string }>
> = {
  trail_knee_flexion: {
    plainLanguage: 'How bent the back (drive-side) knee is.',
    computation: 'Angle between the trail thigh and shank long axes.',
    limitations:
      'Robust to measure, but our cited sources report ranges at events for the lead knee only, so there is no published range to compare against.',
  },
  lead_hip_flexion: {
    plainLanguage: 'How far the front thigh is flexed relative to the pelvis.',
    computation: 'Angle between the pelvis long axis and the lead thigh long axis.',
    limitations:
      'Depends on the pelvis frame, which is built from hip landmarks and is noisier than a pure two-segment angle. No published range in our cited sources.',
  },
  shoulder_horizontal_abduction: {
    plainLanguage:
      'Where the throwing arm sits in front of or behind the plane of the shoulders — how far the arm is laid out to the side.',
    computation:
      'Plane-of-elevation term of the ISB Y–X–Y decomposition of the humerus relative to the thorax frame.',
    limitations:
      'A transverse-plane quantity, so it is more sensitive to reconstruction noise, and the plane/axial split degrades near 0° elevation. No published range in our cited sources.',
  },
}
