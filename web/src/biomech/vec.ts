/** Minimal 3D vector / rotation-matrix maths. Pure, dependency-free, no React. */

export type Vec3 = readonly [number, number, number]
/** Column-major-by-basis: M = [ex, ey, ez], each a world-space unit vector. */
export type Mat3 = { ex: Vec3; ey: Vec3; ez: Vec3 }

export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s]
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const norm = (a: Vec3): number => Math.sqrt(dot(a, a))
export const mid = (a: Vec3, b: Vec3): Vec3 => scale(add(a, b), 0.5)

export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

export function unit(a: Vec3): Vec3 {
  const n = norm(a)
  return n < 1e-9 ? [0, 0, 0] : [a[0] / n, a[1] / n, a[2] / n]
}

/** Component of `a` perpendicular to unit vector `n` (Gram–Schmidt). */
export function reject(a: Vec3, n: Vec3): Vec3 {
  return sub(a, scale(n, dot(a, n)))
}

/** Unsigned angle between two vectors, degrees. */
export function angleBetween(a: Vec3, b: Vec3): number {
  const c = dot(unit(a), unit(b))
  return (Math.acos(Math.min(1, Math.max(-1, c))) * 180) / Math.PI
}

/**
 * Signed angle from `a` to `b` measured about `axis` (right-hand rule), degrees.
 * Both vectors are first projected onto the plane normal to `axis`.
 */
export function signedAngleAbout(a: Vec3, b: Vec3, axis: Vec3): number {
  const n = unit(axis)
  const ap = unit(reject(a, n))
  const bp = unit(reject(b, n))
  if (norm(ap) < 1e-6 || norm(bp) < 1e-6) return NaN
  const s = dot(cross(ap, bp), n)
  const c = dot(ap, bp)
  return (Math.atan2(s, c) * 180) / Math.PI
}

/**
 * Build a right-handed orthonormal segment frame in the ISB convention:
 *   ey = segment LONG axis, pointing proximally (or superiorly)
 *   ez = medio-lateral, toward the subject's right
 *   ex = ey × ez, which comes out anterior
 *
 * ISB places the long axis on Y for the thorax, pelvis, humerus, forearm, femur and
 * tibia alike, so every segment here uses one convention. `lateralHint` need not be
 * perpendicular — it is orthogonalised. Returns null on degenerate input.
 */
export function frameFrom(longAxis: Vec3, lateralHint: Vec3): Mat3 | null {
  const ey = unit(longAxis)
  if (norm(ey) < 1e-9) return null
  const ezRaw = reject(lateralHint, ey)
  if (norm(ezRaw) < 1e-6) return null // hint parallel to the long axis
  const ez = unit(ezRaw)
  const ex = cross(ey, ez) // ex × ey = ez holds for this ordering
  return { ex, ey, ez }
}

/** Express world vector `v` in frame `f`'s local coordinates (i.e. Rᵀv). */
export function toLocal(f: Mat3, v: Vec3): Vec3 {
  return [dot(f.ex, v), dot(f.ey, v), dot(f.ez, v)]
}

/** Relative rotation Rrel = Aᵀ·B, returned as B's basis expressed in A's coordinates. */
export function relative(a: Mat3, b: Mat3): Mat3 {
  return { ex: toLocal(a, b.ex), ey: toLocal(a, b.ey), ez: toLocal(a, b.ez) }
}

/** r[row][col] of the relative rotation matrix. */
function el(m: Mat3, row: number, col: number): number {
  const c = col === 0 ? m.ex : col === 1 ? m.ey : m.ez
  return c[row]
}

const DEG = 180 / Math.PI
const clamp1 = (x: number) => Math.min(1, Math.max(-1, x))

/**
 * Z–X–Y intrinsic Euler decomposition, R = Rz(γ)·Rx(α)·Ry(β) — the standard clinical
 * sequence (Grood & Suntay) for knee, hip and trunk when the long axis is Y:
 *   flexion/extension   about Z (medio-lateral)  = γ
 *   ab/adduction        about the floating X     = α
 *   internal/external   about Y (long axis)      = β
 * Returns degrees. `gimbal` flags the ±90° ab/adduction singularity, where the
 * flexion/rotation split stops being meaningful.
 */
export function eulerZXY(m: Mat3): {
  flexion: number
  abduction: number
  rotation: number
  gimbal: boolean
} {
  const sa = clamp1(el(m, 2, 1))
  const alpha = Math.asin(sa)
  if (Math.abs(sa) > 0.9995) {
    return {
      flexion: Math.atan2(-el(m, 0, 2), el(m, 0, 0)) * DEG,
      abduction: alpha * DEG,
      rotation: 0,
      gimbal: true,
    }
  }
  return {
    flexion: Math.atan2(-el(m, 0, 1), el(m, 1, 1)) * DEG,
    abduction: alpha * DEG,
    rotation: Math.atan2(-el(m, 2, 0), el(m, 2, 2)) * DEG,
    gimbal: false,
  }
}

/**
 * Y–X–Y decomposition — the ISB recommendation for the glenohumeral joint.
 * Yields plane of elevation, elevation, and **axial rotation** (internal/external).
 * The axial term is the one that position-only methods cannot recover.
 * Returns degrees; `gimbal` is true when elevation ≈ 0 and the plane/axial split is
 * ill-conditioned (their sum is still meaningful, the split is not).
 */
export function eulerYXY(m: Mat3): {
  planeOfElevation: number
  elevation: number
  axialRotation: number
  gimbal: boolean
} {
  const cy = clamp1(el(m, 1, 1))
  const elevation = Math.acos(cy)
  if (Math.abs(Math.sin(elevation)) < 0.02) {
    return {
      planeOfElevation: Math.atan2(el(m, 0, 2), el(m, 0, 0)) * DEG,
      elevation: elevation * DEG,
      axialRotation: 0,
      gimbal: true,
    }
  }
  return {
    planeOfElevation: Math.atan2(el(m, 2, 1), el(m, 0, 1)) * DEG,
    elevation: elevation * DEG,
    axialRotation: Math.atan2(el(m, 1, 2), -el(m, 1, 0)) * DEG,
    gimbal: false,
  }
}

/**
 * Angular velocity magnitude between two frames, in degrees per unit time.
 * Uses the rotation angle of Aᵀ·B, which is orientation-convention independent.
 */
export function angularSpeed(a: Mat3, b: Mat3, dt: number): number {
  const r = relative(a, b)
  const trace = el(r, 0, 0) + el(r, 1, 1) + el(r, 2, 2)
  const theta = Math.acos(clamp1((trace - 1) / 2))
  return dt > 0 ? (theta * DEG) / dt : 0
}
