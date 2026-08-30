/**
 * Anatomical segment coordinate systems, built from landmarks.
 *
 * ── Why landmarks and not the model's own rotations ──────────────────────────
 * SAM 3D Body also returns `pred_global_rots`, a 3×3 matrix per MHR rig joint. Those
 * are valid rotations, but they are rig frames in Momentum's internal convention: the
 * bone direction is NOT constant when expressed in the parent joint's frame (measured
 * spread 0.4–0.98 on unit vectors), so they cannot be treated as segment frames without
 * reverse-engineering Momentum's prerotation/parameter-transform chain. Recovering that
 * is not on the critical path.
 *
 * Landmark-built frames are also what the biomechanics literature actually specifies —
 * ISB defines segment coordinate systems from anatomical landmarks, not from a rig — so
 * this is the more defensible route regardless.
 *
 * ── The key landmarks ────────────────────────────────────────────────────────
 * MHR-70 gives us `olecranon` (posterior elbow) and `cubital_fossa` (anterior elbow).
 * The vector between them is the elbow's ANTERO-POSTERIOR axis (verified: |cos| ≈ 0.15
 * against the flexion-plane normal, i.e. near-perpendicular, as anatomy predicts). With
 * the humerus long axis that yields a full 3-DOF arm frame — which is what makes
 * shoulder axial rotation observable at all.
 *
 * Convention (ISB): ey = long axis proximal/superior · ez = medio-lateral toward the
 * subject's RIGHT · ex = anterior. All maths happens in a Y-up right-handed world.
 */

import type { Session } from '../types'
import {
  cross, dot, frameFrom, mid, sub, unit,
  type Mat3, type Vec3,
} from './vec'

export type SegmentName =
  | 'pelvis' | 'thorax'
  | 'upperarm_l' | 'upperarm_r'
  | 'forearm_l' | 'forearm_r'
  | 'thigh_l' | 'thigh_r'
  | 'shank_l' | 'shank_r'

export type Landmarks = Record<string, Vec3>
export type Frames = Partial<Record<SegmentName, Mat3>>

/** Y-up right-handed world. Source keypoints are camera-frame (+X right, +Y DOWN, +Z away). */
export const WORLD_UP: Vec3 = [0, 1, 0]

export function toWorld(p: readonly number[]): Vec3 {
  return [p[0], -p[1], -p[2]]
}

/** Pull one frame's landmarks into a name→world-position map. */
export function landmarksAt(session: Session, frame: number): Landmarks {
  const kp = session.frames[Math.max(0, Math.min(session.frames.length - 1, frame))].keypoints3d
  const out: Landmarks = {}
  session.joints.forEach((name, i) => {
    out[name] = toWorld(kp[i])
  })
  return out
}

/** Flip `axis` so it points the same way as `reference` (used to disambiguate joint axes). */
function agreeWith(axis: Vec3, reference: Vec3): Vec3 {
  return dot(axis, reference) < 0 ? [-axis[0], -axis[1], -axis[2]] : axis
}

/**
 * Build every segment frame we can for one pose. Segments whose landmarks are
 * degenerate (e.g. a perfectly straight knee has no well-defined flexion axis) are
 * simply absent from the result rather than silently wrong.
 */
export function buildFrames(L: Landmarks): Frames {
  const f: Frames = {}

  const pelvisOrigin = mid(L.l_hip, L.r_hip)
  const thoraxOrigin = mid(L.l_acromion, L.r_acromion)

  // ── pelvis: superior toward the thorax, lateral along the hip line ──
  const pelvisRight = unit(sub(L.r_hip, L.l_hip))
  const pelvis = frameFrom(sub(thoraxOrigin, pelvisOrigin), pelvisRight)
  if (pelvis) f.pelvis = pelvis

  // ── thorax: superior toward the neck, lateral along the acromion line ──
  const thoraxRight = unit(sub(L.r_acromion, L.l_acromion))
  const thorax = frameFrom(sub(L.neck, pelvisOrigin), thoraxRight)
  if (thorax) f.thorax = thorax

  // Fall back to the pelvis' lateral axis when a joint axis is ill-conditioned.
  const bodyRight = pelvis ? pelvis.ez : thoraxRight

  // ── arms ──
  for (const side of ['l', 'r'] as const) {
    const acr = L[`${side}_acromion`]
    const elb = L[`${side}_elbow`]
    const wri = L[`${side}_wrist`]
    const ole = L[`${side}_olecranon`]
    const cub = L[`${side}_cubital_fossa`]
    if (!acr || !elb || !wri || !ole || !cub) continue

    // Anterior at the elbow: posterior bony point -> anterior hollow.
    const anterior = unit(sub(cub, ole))

    // ex = anterior, ey = long axis  =>  ez (lateral) = anterior × long
    const humLong = sub(acr, elb)
    const humLat = agreeWith(cross(anterior, unit(humLong)), bodyRight)
    const ua = frameFrom(humLong, humLat)
    if (ua) f[`upperarm_${side}` as SegmentName] = ua

    const foreLong = sub(elb, wri)
    const foreLat = agreeWith(cross(anterior, unit(foreLong)), bodyRight)
    const fa = frameFrom(foreLong, foreLat)
    if (fa) f[`forearm_${side}` as SegmentName] = fa
  }

  // ── legs ──
  for (const side of ['l', 'r'] as const) {
    const hip = L[`${side}_hip`]
    const knee = L[`${side}_knee`]
    const ank = L[`${side}_ankle`]
    if (!hip || !knee || !ank) continue

    // The knee flexion axis is the normal of the thigh/shank plane. It degenerates as
    // the knee straightens, so fall back to the pelvis' lateral axis there.
    const thighDir = unit(sub(hip, knee))
    const shankDir = unit(sub(ank, knee))
    const planeNormal = cross(thighDir, shankDir)
    const kneeAxis =
      Math.hypot(planeNormal[0], planeNormal[1], planeNormal[2]) > 0.25
        ? agreeWith(unit(planeNormal), bodyRight)
        : bodyRight

    const th = frameFrom(sub(hip, knee), kneeAxis)
    if (th) f[`thigh_${side}` as SegmentName] = th

    const sh = frameFrom(sub(knee, ank), kneeAxis)
    if (sh) f[`shank_${side}` as SegmentName] = sh
  }

  return f
}

/** Foot progression vector (heel → big toe), used for the transverse-plane foot angle. */
export function footVector(L: Landmarks, side: 'l' | 'r'): Vec3 | null {
  const heel = L[`${side}_heel`]
  const toe = L[`${side}_big_toe`]
  if (!heel || !toe) return null
  return unit(sub(toe, heel))
}
