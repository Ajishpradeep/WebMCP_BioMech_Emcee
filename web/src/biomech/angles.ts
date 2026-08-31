/**
 * Clinical joint angles from segment frames.
 *
 * Two kinds of measurement live here, and the distinction matters for how much you can
 * trust each one:
 *
 *  1. **Inter-segment angles** (knee, elbow, hip flexion) — the unsigned angle between
 *     two long axes. Robust: depends only on joint centre positions.
 *  2. **3-DOF Euler decompositions** (shoulder) — needs a full segment frame, so it
 *     also depends on the elbow antero-posterior axis. This is what makes axial
 *     rotation observable, and it is inherently noisier. Graded accordingly in
 *     `confidence.ts`.
 */

import type { Session } from '../types'
import { buildFrames, footVector, landmarksAt, WORLD_UP, type Frames, type Landmarks } from './frames'
import { angleBetween, dot, eulerYXY, relative, signedAngleAbout, sub, type Mat3 } from './vec'

export type MetricName =
  | 'lead_knee_flexion' | 'trail_knee_flexion'
  | 'lead_hip_flexion'
  | 'elbow_flexion'
  | 'shoulder_abduction' | 'shoulder_external_rotation' | 'shoulder_horizontal_abduction'
  | 'trunk_forward_tilt' | 'trunk_lateral_tilt'
  | 'hip_shoulder_separation'
  | 'lead_foot_angle'

export type Pose = {
  frames: Frames
  landmarks: Landmarks
  /** Throwing side and lead (stride) side, derived from handedness. */
  throwing: 'l' | 'r'
  lead: 'l' | 'r'
}

export function poseAt(session: Session, frame: number): Pose {
  const landmarks = landmarksAt(session, frame)
  const throwing = session.subject.handedness === 'left' ? 'l' : 'r'
  return {
    landmarks,
    frames: buildFrames(landmarks),
    throwing,
    lead: throwing === 'r' ? 'l' : 'r', // a right-hander strides onto the left leg
  }
}

/** All metrics for one pose. Missing values are `null`, never a silent zero. */
export function metricsFor(pose: Pose): Record<MetricName, number | null> {
  const { frames: F, landmarks: L, throwing, lead } = pose
  const trail = lead === 'l' ? 'r' : 'l'
  const out = {} as Record<MetricName, number | null>
  const set = (k: MetricName, v: number | null) => {
    out[k] = v !== null && Number.isFinite(v) ? Math.round(v * 10) / 10 : null
  }

  // ── inter-segment flexion angles ──
  const kneeFlex = (side: 'l' | 'r') => {
    const t = F[`thigh_${side}` as const]
    const s = F[`shank_${side}` as const]
    return t && s ? angleBetween(t.ey, s.ey) : null
  }
  set('lead_knee_flexion', kneeFlex(lead))
  set('trail_knee_flexion', kneeFlex(trail))

  const thighLead = F[`thigh_${lead}` as const]
  set('lead_hip_flexion', F.pelvis && thighLead ? angleBetween(F.pelvis.ey, thighLead.ey) : null)

  const ua = F[`upperarm_${throwing}` as const]
  // Computed from the long axes directly, not from the forearm frame: an
  // inter-segment angle only needs joint centres, so it stays valid even where the
  // elbow antero-posterior axis is ill-conditioned and the frame is unavailable.
  const acr = L[`${throwing}_acromion`]
  const elb = L[`${throwing}_elbow`]
  const wri = L[`${throwing}_wrist`]
  set(
    'elbow_flexion',
    acr && elb && wri ? angleBetween(sub(acr, elb), sub(elb, wri)) : null,
  )

  // ── shoulder: the 3-DOF decomposition ──
  if (F.thorax && ua) {
    const rel = relative(F.thorax, ua)
    const e = eulerYXY(rel)
    // Mirror the left arm so both sides read in the same clinical sense.
    const s = throwing === 'l' ? -1 : 1
    set('shoulder_abduction', e.elevation)
    set('shoulder_external_rotation', e.gimbal ? null : s * e.axialRotation)
    set('shoulder_horizontal_abduction', e.gimbal ? null : s * e.planeOfElevation)
  } else {
    set('shoulder_abduction', null)
    set('shoulder_external_rotation', null)
    set('shoulder_horizontal_abduction', null)
  }

  // ── trunk orientation relative to world vertical ──
  if (F.thorax) {
    // Negated so that leaning toward the target reads POSITIVE, matching the clinical
    // convention the published reference ranges are stated in.
    set('trunk_forward_tilt', -signedAngleAbout(WORLD_UP, F.thorax.ey, F.thorax.ez))
    set('trunk_lateral_tilt', -signedAngleAbout(WORLD_UP, F.thorax.ey, F.thorax.ex))
  } else {
    set('trunk_forward_tilt', null)
    set('trunk_lateral_tilt', null)
  }

  // ── hip–shoulder separation: axial offset of thorax from pelvis, transverse plane ──
  // Signed about world vertical, so it is independent of which way the mound faces.
  if (F.pelvis && F.thorax) {
    const sep = signedAngleAbout(F.pelvis.ez, F.thorax.ez, WORLD_UP)
    set('hip_shoulder_separation', throwing === 'l' ? -sep : sep)
  } else {
    set('hip_shoulder_separation', null)
  }

  // ── lead foot angle: foot progression vs the pelvis' facing, transverse plane ──
  const fv = footVector(L, lead)
  if (fv && F.pelvis) {
    set('lead_foot_angle', signedAngleAbout(F.pelvis.ex, fv, WORLD_UP))
  } else {
    set('lead_foot_angle', null)
  }

  return out
}

/**
 * Metrics that come from atan2 and can jump ±360° between adjacent frames when they
 * cross the branch cut. Unwrapping turns those discontinuities back into continuous
 * motion — without it, a smooth arm rotation reads as a 300°/frame spike.
 */
const WRAPPING: MetricName[] = [
  'shoulder_external_rotation',
  'shoulder_horizontal_abduction',
  'hip_shoulder_separation',
  'lead_foot_angle',
  'trunk_forward_tilt',
  'trunk_lateral_tilt',
]

function unwrapDegrees(xs: (number | null)[]): (number | null)[] {
  const out = [...xs]
  let offset = 0
  let prev: number | null = null
  for (let i = 0; i < out.length; i++) {
    const raw = out[i]
    if (raw === null) continue
    if (prev !== null) {
      let d = raw + offset - prev
      while (d > 180) { offset -= 360; d -= 360 }
      while (d < -180) { offset += 360; d += 360 }
    }
    const v = raw + offset
    out[i] = Math.round(v * 10) / 10
    prev = v
  }
  return out
}

/** Metric series across the whole clip: name -> per-frame values. */
export function metricSeries(session: Session): Record<MetricName, (number | null)[]> {
  const acc = {} as Record<MetricName, (number | null)[]>
  // Use the continuity-corrected segment frames. Building each pose independently can
  // choose the equally valid 180°-flipped transverse axes on adjacent frames. That
  // leaves flexion unchanged but creates impossible jumps in axial rotation and any
  // downstream peak detector that consumes it.
  const frames = frameSeries(session)
  const throwing = session.subject.handedness === 'left' ? 'l' : 'r'
  const lead = throwing === 'r' ? 'l' : 'r'
  for (let i = 0; i < session.frames.length; i++) {
    const m = metricsFor({
      frames: frames[i],
      landmarks: landmarksAt(session, i),
      throwing,
      lead,
    })
    for (const k of Object.keys(m) as MetricName[]) {
      ;(acc[k] ??= []).push(m[k])
    }
  }
  for (const k of WRAPPING) if (acc[k]) acc[k] = unwrapDegrees(acc[k])
  return acc
}

/**
 * Segment frames per clip frame — reused by the sequence maths and the 3D triads.
 *
 * ⚠️ Includes a CONTINUITY pass. `frameFrom` can legitimately return either a frame or
 * its 180° flip about the long axis (both are right-handed), and which one it picks
 * depends on noise in the lateral hint. Left alone, that shows up as instantaneous
 * "rotations" of ~70° per frame — angular speeds in the thousands of deg/s that are
 * pure artefact. Flipping each frame to agree with its predecessor removes them.
 */
export function frameSeries(session: Session): Frames[] {
  const out = session.frames.map((_, i) => buildFrames(landmarksAt(session, i)))
  const names = new Set<string>()
  for (const f of out) for (const k of Object.keys(f)) names.add(k)

  for (const name of names) {
    const key = name as keyof Frames
    let prev: Mat3 | undefined
    for (const f of out) {
      const m = f[key]
      if (!m) continue
      if (prev) {
        const agree = dot(m.ez, prev.ez) + dot(m.ex, prev.ex)
        if (agree < 0) {
          // 180° about ey: still orthonormal and still right-handed.
          f[key] = {
            ex: [-m.ex[0], -m.ex[1], -m.ex[2]],
            ey: m.ey,
            ez: [-m.ez[0], -m.ez[1], -m.ez[2]],
          }
        }
      }
      prev = f[key]
    }
  }
  return out
}

export type { Mat3 }
