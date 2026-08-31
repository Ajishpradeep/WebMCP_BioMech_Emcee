/**
 * Per-metric confidence grading — the honesty contract, enforced in code.
 *
 * Grades come from three independent constraints, and the WORST one wins:
 *  1. Measurement plane. Markerless-vs-marker agreement in sports settings is RMSD
 *     6.3–23.0°, worst for internal/external rotation.
 *  2. Timebase. Slow motion at an unknown factor makes every rate quantity underivable.
 *  3. Scale. Camera-frame reconstruction with an estimated focal length makes absolute
 *     distances underivable.
 */

import type { Confidence, Session } from '../types'
import type { MetricName } from './angles'

const ORDER: Confidence[] = ['unavailable', 'low', 'medium', 'high']

export function worst(...cs: Confidence[]): Confidence {
  return cs.reduce((a, b) => (ORDER.indexOf(a) <= ORDER.indexOf(b) ? a : b), 'high')
}

/** Grade set by which anatomical plane the measurement lives in. */
const PLANE_GRADE: Record<MetricName, Confidence> = {
  // Best conditioned planes are still unvalidated markerless measurements here.
  lead_knee_flexion: 'medium',
  trail_knee_flexion: 'medium',
  lead_hip_flexion: 'medium',
  elbow_flexion: 'medium',
  shoulder_abduction: 'medium',
  trunk_forward_tilt: 'medium',
  trunk_lateral_tilt: 'medium',
  // transverse — derived from segment vectors, noisier
  hip_shoulder_separation: 'medium',
  lead_foot_angle: 'medium',
  shoulder_horizontal_abduction: 'medium',
  // axial rotation — weakest agreement in the literature
  shoulder_external_rotation: 'low',
}

export function gradeMetric(metric: MetricName): Confidence {
  return PLANE_GRADE[metric] ?? 'low'
}

/**
 * Grade for any rate-derived quantity (deg/s, seconds between peaks).
 * Unknown slow-motion factor makes these unavailable outright.
 */
export function gradeRate(session: Session): Confidence {
  const tb = session.timebase
  if (!tb.slowMotion) return 'medium'
  if (tb.realTimeScale === null) return 'unavailable'
  return tb.scaleSource === 'user' ? 'low' : 'medium' // a user estimate is not a measurement
}

/** Human-readable reason a quantity is unavailable, or null when it is available. */
export function rateUnavailableReason(session: Session): string | null {
  const tb = session.timebase
  if (!tb.slowMotion || tb.realTimeScale !== null) return null
  return (
    'Source clip is slow motion at an unknown factor, so video seconds cannot be ' +
    'converted to real seconds. Sequence order and timing normalised to the ' +
    'foot-contact → ball-release window remain valid.'
  )
}

export const DISCLAIMER =
  'Measurement only. Not a diagnosis, injury-risk assessment, or medical device. ' +
  'Deviation from a reference range is an observation, not a finding.'

/** The `meta` block every WebMCP tool response carries. */
export interface MetaBlock {
  confidence: Confidence
  cameraFrame: boolean
  disclaimer: string
  citations: string[]
  caveats?: string[]
}

export function buildMeta(
  session: Session,
  confidence: Confidence,
  citations: string[] = [],
  caveats: string[] = [],
): MetaBlock {
  const extra = [...caveats]
  const rateReason = rateUnavailableReason(session)
  if (rateReason) extra.push(rateReason)
  if (session.capture.cameraFrame) {
    extra.push(
      'Reconstruction is camera-frame with an estimated focal length; distances are not metric.',
    )
  }
  return {
    confidence,
    cameraFrame: session.capture.cameraFrame,
    disclaimer: DISCLAIMER,
    citations,
    caveats: extra.length ? extra : undefined,
  }
}
