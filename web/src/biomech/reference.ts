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
    doi: '10.1080/14763141.2018.1503321',
    short: 'Scarborough 2020, Sports Biomech, doi:10.1080/14763141.2018.1503321',
  },
  dobos2022: {
    key: 'dobos2022',
    text: 'Dobos TJ, Bench RWG, McKinnon CD, et al. Validation of pitchAI markerless motion capture using marker-based 3D motion capture. Sports Biomech. 2025;24(3):587–607.',
    doi: '10.1080/14763141.2022.2137425',
    short: 'Dobos et al., single-camera markerless validation, doi:10.1080/14763141.2022.2137425',
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
  // Only direct two-segment flexion angles are compared. Other values remain visible as
  // measurements, but their frame definitions or signs have not been proven equivalent
  // to the clinical-review ranges below.
  {
    metric: 'elbow_flexion', event: 'foot_contact',
    range: [74, 90], typical: 87, sd: 15, unit: 'deg', confidence: 'medium',
    citations: ['christoffer2019', 'diffendaffer2023'],
    plainLanguage: 'How bent the throwing elbow is at lead foot contact.',
    computation: 'Angle between the humerus and forearm long axes, from joint centres alone.',
    limitations: 'Robust — depends only on shoulder, elbow and wrist positions.',
  },
  {
    metric: 'lead_knee_flexion', event: 'foot_contact',
    range: [40, 49], typical: 43, sd: 10, unit: 'deg', confidence: 'medium',
    citations: ['christoffer2019', 'diffendaffer2023'],
    plainLanguage: 'How bent the front knee is as it lands.',
    computation: 'Angle between the thigh and shank long axes.',
    limitations: 'Robust. The flexion axis is ill-conditioned when the knee is near full extension.',
  },
  {
    metric: 'elbow_flexion', event: 'max_external_rotation',
    range: [95, 102], typical: 100, sd: 11, unit: 'deg', confidence: 'medium',
    citations: ['christoffer2019', 'diffendaffer2023'],
    plainLanguage: 'Elbow bend at maximum external rotation.',
    computation: 'Angle between the humerus and forearm long axes.',
    limitations: 'Robust.',
  },
  {
    metric: 'elbow_flexion', event: 'ball_release',
    range: [24, 39], typical: 24, sd: 5, unit: 'deg', confidence: 'medium',
    citations: ['christoffer2019', 'diffendaffer2023'],
    plainLanguage: 'How extended the elbow is at release.',
    computation: 'Angle between the humerus and forearm long axes.',
    limitations: 'Robust.',
  },
  {
    metric: 'lead_knee_flexion', event: 'ball_release',
    range: [31.2, 41], typical: 35, sd: 13, unit: 'deg', confidence: 'medium',
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
      'Biomech Emcee does not predict injury. The prospective evidence linking individual biomechanical measures to injury is weak, and deviation from a reference range is an observation, not a diagnosis.',
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
  elbow_flexion: {
    plainLanguage: 'How bent the throwing elbow is at the inspected frame.',
    computation: 'Angle between the humerus and forearm long axes, from joint centres alone.',
    limitations: 'Robust to measure from shoulder, elbow and wrist positions. A population comparison is meaningful only at the matching pitching event.',
  },
  lead_knee_flexion: {
    plainLanguage: 'How bent the front knee is at the inspected frame.',
    computation: 'Angle between the lead thigh and shank long axes.',
    limitations: 'Robust to measure, though the flexion axis is ill-conditioned near full extension. A population comparison is meaningful only at the matching pitching event.',
  },
  shoulder_abduction: {
    plainLanguage: 'How far the throwing arm is raised away from the trunk.',
    computation: 'Elevation term of the ISB Y–X–Y decomposition of the humerus relative to the thorax frame.',
    limitations: 'The app reports this value, but its segment-frame definition has not been validated as interchangeable with the published pitching ranges, so no reference comparison is offered.',
  },
  shoulder_external_rotation: {
    plainLanguage: 'An exploratory trace of how the reconstructed upper arm rotates around its own long axis; it helps locate a possible arm-layback moment.',
    computation: 'Continuity-corrected, unwrapped axial-rotation term of a Y–X–Y decomposition of the humerus relative to the thorax frame.',
    limitations: 'This is a proxy, not a clinical shoulder-external-rotation measurement. Its zero and sign have not been validated, and continuity unwrapping can exceed ±180°. Use its within-pitch shape to nominate a review frame, never its absolute value as clinical layback.',
  },
  trunk_forward_tilt: {
    plainLanguage: 'How far the reconstructed thorax tips forward from the app’s world vertical.',
    computation: 'Signed angle of the thorax long axis from world vertical, about the thorax medio-lateral axis.',
    limitations: 'This world-frame measurement is useful for review, but it has not been shown equivalent to the published pitching convention; no reference comparison is offered.',
  },
  trunk_lateral_tilt: {
    plainLanguage: 'How far the reconstructed thorax tilts sideways from the app’s world vertical.',
    computation: 'Signed angle of the thorax long axis from world vertical, about the thorax anterior axis.',
    limitations: 'The sign and published convention have not been audited against this reconstruction, so no reference comparison is offered.',
  },
  hip_shoulder_separation: {
    plainLanguage: 'The signed rotational difference between the reconstructed pelvis and thorax.',
    computation: 'Signed angle from the pelvis medio-lateral axis to the thorax medio-lateral axis, about world vertical.',
    limitations: 'The sign and anatomical-frame convention have not been proven equivalent to published hip–shoulder separation values. It is displayed as an exploratory measurement, never ranked against a range.',
  },
  lead_foot_angle: {
    plainLanguage: 'How much the front foot is turned relative to the reconstructed pelvis.',
    computation: 'Heel→toe vector against the pelvis anterior axis, projected on the transverse plane.',
    limitations: 'Published foot-angle values may use the pitching direction or home plate rather than the pelvis as their reference. This construct mismatch prevents a valid range comparison.',
  },
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
