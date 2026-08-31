/**
 * Pitching event detection: lead foot contact, maximum external rotation, ball release.
 *
 * Every other measurement is anchored to these three frames, so each one reports the
 * method used and a confidence grade rather than pretending to be exact. Detection from
 * monocular video is sometimes wrong; the UI and the `manualOverride` flag exist so a
 * coach can correct it.
 */

import type { Confidence, EventName, PhaseEvent, Session } from '../types'
import { metricSeries, poseAt } from './angles'
import { landmarksAt } from './frames'
import { norm, sub } from './vec'

/** Centred finite difference, in units per frame. */
function speedPerFrame(pts: (readonly [number, number, number])[]): number[] {
  return pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(pts.length - 1, i + 1)]
    const span = Math.min(pts.length - 1, i + 1) - Math.max(0, i - 1)
    return span > 0 ? norm(sub(b, a)) / span : 0
  })
}

function argmaxIn(xs: (number | null)[], lo: number, hi: number): number {
  let best = lo
  let bv = -Infinity
  for (let i = Math.max(0, lo); i <= Math.min(xs.length - 1, hi); i++) {
    const v = xs[i]
    if (v !== null && Number.isFinite(v) && v > bv) {
      bv = v
      best = i
    }
  }
  return best
}

export function detectEvents(session: Session): PhaseEvent[] {
  const n = session.frames.length
  if (n < 5) return []

  const throwing = session.subject.handedness === 'left' ? 'l' : 'r'
  const lead = throwing === 'r' ? 'l' : 'r'

  const L = Array.from({ length: n }, (_, i) => landmarksAt(session, i))
  const wrist = L.map((l) => l[`${throwing}_wrist`])
  const leadAnkle = L.map((l) => l[`${lead}_ankle`])
  const t = (i: number) => session.frames[i].t

  // ── ball release: the global peak of throwing-hand speed ──
  const wristSpeed = speedPerFrame(wrist)
  const brFrame = argmaxIn(wristSpeed, 0, n - 1)

  // ── lead foot contact ──
  // The lead ankle rises through the leg lift, then descends and plants. Look before
  // release for the last frame where it is still descending appreciably; the plant is
  // where descent stops.
  const ankleY = leadAnkle.map((p) => p[1])
  const searchHi = Math.max(2, brFrame - 1)
  const liftFrame = argmaxIn(ankleY, 0, searchHi)
  const floor = Math.min(...ankleY.slice(liftFrame, searchHi + 1))
  const ceil = ankleY[liftFrame]
  const threshold = floor + (ceil - floor) * 0.12 // within 12% of the lowest point
  let fcFrame = liftFrame
  for (let i = liftFrame; i <= searchHi; i++) {
    if (ankleY[i] <= threshold) {
      fcFrame = i
      break
    }
    fcFrame = i
  }

  // ── maximum external rotation, strictly between foot contact and release ──
  // MER precedes release by definition: the arm lays back, then accelerates through.
  // Searching up to and including brFrame let the two collide on noisy clips.
  const series = metricSeries(session)
  const er = series.shoulder_external_rotation
  const merFrame = argmaxIn(er, fcFrame, Math.max(fcFrame, brFrame - 1))

  // Confidence: how peaked is the signal we keyed on?
  const peakedness = (xs: (number | null)[], at: number, lo: number, hi: number): Confidence => {
    const vals = xs.slice(Math.max(0, lo), Math.min(xs.length, hi + 1)).filter(
      (v): v is number => v !== null && Number.isFinite(v),
    )
    if (vals.length < 3) return 'low'
    const peak = xs[at]
    if (peak === null || !Number.isFinite(peak)) return 'low'
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length)
    if (sd < 1e-9) return 'low'
    const z = (peak - mean) / sd
    return z > 2.5 ? 'high' : z > 1.4 ? 'medium' : 'low'
  }

  const mk = (
    name: EventName,
    frame: number,
    method: string,
    confidence: Confidence,
  ): PhaseEvent => ({
    name,
    frame,
    t: t(frame),
    method,
    confidence,
    manualOverride: false,
  })

  const deliveryFrames = brFrame - fcFrame
  const boundaryRelease = brFrame <= 1 || brFrame >= n - 2
  const shortDeliveryWindow = deliveryFrames < 8

  return [
    mk('foot_contact', fcFrame, 'lead-ankle descent arrest after leg lift',
      fcFrame > liftFrame && fcFrame < brFrame && !shortDeliveryWindow ? 'medium' : 'low'),
    mk('max_external_rotation', merFrame,
      'peak reconstructed shoulder axial-rotation proxy between FC and BR; human review recommended',
      'low'),
    mk('ball_release', brFrame, 'peak throwing-hand speed',
      boundaryRelease ? 'low' : peakedness(wristSpeed, brFrame, 0, n - 1)),
  ].sort((a, b) => a.frame - b.frame)
}

/** Normalised position within the foot-contact → ball-release window, as a percentage. */
export function normalisedPct(frame: number, events: PhaseEvent[]): number | null {
  const fc = events.find((e) => e.name === 'foot_contact')
  const br = events.find((e) => e.name === 'ball_release')
  if (!fc || !br || br.frame <= fc.frame) return null
  return ((frame - fc.frame) / (br.frame - fc.frame)) * 100
}

export { poseAt }
