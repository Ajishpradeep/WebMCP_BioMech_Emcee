/**
 * Synthetic-pose tests. Every number the app reports rests on this file.
 *
 * Synthetic body convention (matches frames.ts): anterior = +X, up = +Y,
 * subject's right = +Z, which is right-handed since ex × ey = ez.
 */

import { describe, expect, it } from 'vitest'
import { buildFrames, type Landmarks } from './frames'
import { metricsFor, type Pose } from './angles'
import { angleBetween } from './vec'

/** Rotate a point about the world vertical (Y) by `deg`. */
function rotY(p: readonly [number, number, number], deg: number): [number, number, number] {
  const a = (deg * Math.PI) / 180
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]
}

/** Anatomical standing pose: everything straight, facing +X. */
function standing(): Landmarks {
  return {
    l_hip: [0, 1.0, -0.1], r_hip: [0, 1.0, 0.1],
    l_knee: [0, 0.55, -0.1], r_knee: [0, 0.55, 0.1],
    l_ankle: [0, 0.1, -0.1], r_ankle: [0, 0.1, 0.1],
    l_heel: [-0.05, 0.02, -0.1], r_heel: [-0.05, 0.02, 0.1],
    l_big_toe: [0.15, 0.02, -0.1], r_big_toe: [0.15, 0.02, 0.1],
    l_acromion: [0, 1.5, -0.2], r_acromion: [0, 1.5, 0.2],
    neck: [0, 1.55, 0], nose: [0.1, 1.65, 0],
    pelvis: [0, 1.0, 0], thorax: [0, 1.5, 0],
    l_elbow: [0, 1.2, -0.2], r_elbow: [0, 1.2, 0.2],
    l_wrist: [0, 0.9, -0.2], r_wrist: [0, 0.9, 0.2],
    l_olecranon: [-0.03, 1.2, -0.2], r_olecranon: [-0.03, 1.2, 0.2],
    l_cubital_fossa: [0.03, 1.2, -0.2], r_cubital_fossa: [0.03, 1.2, 0.2],
  }
}

function poseOf(L: Landmarks, handed: 'l' | 'r' = 'r'): Pose {
  return { landmarks: L, frames: buildFrames(L), throwing: handed, lead: handed === 'r' ? 'l' : 'r' }
}

describe('segment frames', () => {
  it('builds every segment for an anatomical pose', () => {
    const F = buildFrames(standing())
    for (const s of ['pelvis', 'thorax', 'upperarm_r', 'forearm_r', 'thigh_l', 'shank_l'] as const) {
      expect(F[s], `missing ${s}`).toBeDefined()
    }
  })

  it('produces right-handed orthonormal frames', () => {
    const F = buildFrames(standing())
    for (const [name, m] of Object.entries(F)) {
      if (!m) continue
      const len = (v: readonly number[]) => Math.hypot(v[0], v[1], v[2])
      expect(len(m.ex), `${name} ex`).toBeCloseTo(1, 6)
      expect(len(m.ey), `${name} ey`).toBeCloseTo(1, 6)
      expect(len(m.ez), `${name} ez`).toBeCloseTo(1, 6)
      // ex × ey === ez
      const cx = m.ex[1] * m.ey[2] - m.ex[2] * m.ey[1]
      const cy = m.ex[2] * m.ey[0] - m.ex[0] * m.ey[2]
      const cz = m.ex[0] * m.ey[1] - m.ex[1] * m.ey[0]
      expect(Math.hypot(cx - m.ez[0], cy - m.ez[1], cz - m.ez[2]), `${name} handedness`)
        .toBeLessThan(1e-6)
    }
  })

  it('orients the pelvis with ey up and ez to the subject right', () => {
    const F = buildFrames(standing())
    expect(F.pelvis!.ey[1]).toBeCloseTo(1, 3) // superior
    expect(F.pelvis!.ez[2]).toBeCloseTo(1, 3) // +Z is the subject's right
  })
})

describe('flexion angles', () => {
  it('reads ~0° for a straight knee and elbow', () => {
    const m = metricsFor(poseOf(standing()))
    expect(m.lead_knee_flexion!).toBeLessThan(2)
    expect(m.trail_knee_flexion!).toBeLessThan(2)
    expect(m.elbow_flexion!).toBeLessThan(2)
  })

  it('reads 90° for a knee flexed 90°', () => {
    const L = standing()
    // Lead (left) shank swings posteriorly: ankle moves behind the knee, same height.
    L.l_ankle = [-0.45, 0.55, -0.1]
    const m = metricsFor(poseOf(L))
    expect(m.lead_knee_flexion!).toBeCloseTo(90, 0)
  })

  it('reads 90° for an elbow flexed 90°', () => {
    const L = standing()
    L.r_wrist = [0.3, 1.2, 0.2] // forearm swings anteriorly from a vertical humerus
    // The elbow antero-posterior axis rotates with the forearm, so it now points up.
    L.r_olecranon = [0, 1.17, 0.2]
    L.r_cubital_fossa = [0, 1.23, 0.2]
    const m = metricsFor(poseOf(L))
    expect(m.elbow_flexion!).toBeCloseTo(90, 0)
  })

  it('tracks intermediate knee flexion monotonically', () => {
    const seen: number[] = []
    for (const deg of [0, 30, 60, 90, 120]) {
      const L = standing()
      const a = (deg * Math.PI) / 180
      L.l_ankle = [-0.45 * Math.sin(a), 0.55 - 0.45 * Math.cos(a), -0.1]
      seen.push(metricsFor(poseOf(L)).lead_knee_flexion!)
    }
    seen.forEach((v, i) => expect(v).toBeCloseTo([0, 30, 60, 90, 120][i], 0))
  })
})

describe('trunk and pelvis', () => {
  it('reads ~0° trunk tilt when upright', () => {
    const m = metricsFor(poseOf(standing()))
    expect(Math.abs(m.trunk_forward_tilt!)).toBeLessThan(2)
    expect(Math.abs(m.trunk_lateral_tilt!)).toBeLessThan(2)
  })

  it('detects 30° of forward trunk lean', () => {
    const L = standing()
    const a = (30 * Math.PI) / 180
    // Tip the whole upper body forward about the hip line (the +Z axis).
    for (const k of ['l_acromion', 'r_acromion', 'neck'] as const) {
      const p = L[k]
      const dy = p[1] - 1.0
      L[k] = [p[0] + dy * Math.sin(a), 1.0 + dy * Math.cos(a), p[2]]
    }
    const m = metricsFor(poseOf(L))
    expect(Math.abs(m.trunk_forward_tilt!)).toBeCloseTo(30, 0)
  })
})

describe('hip–shoulder separation', () => {
  it('is ~0° when the pelvis and thorax face the same way', () => {
    const m = metricsFor(poseOf(standing()))
    expect(Math.abs(m.hip_shoulder_separation!)).toBeLessThan(2)
  })

  it('recovers a known 40° thorax-over-pelvis rotation', () => {
    const L = standing()
    for (const k of ['l_acromion', 'r_acromion'] as const) L[k] = rotY(L[k], 40)
    const m = metricsFor(poseOf(L))
    expect(Math.abs(m.hip_shoulder_separation!)).toBeCloseTo(40, 0)
  })

  it('changes sign with the direction of rotation', () => {
    const mk = (deg: number) => {
      const L = standing()
      for (const k of ['l_acromion', 'r_acromion'] as const) L[k] = rotY(L[k], deg)
      return metricsFor(poseOf(L)).hip_shoulder_separation!
    }
    expect(Math.sign(mk(35))).toBe(-Math.sign(mk(-35)))
  })
})

describe('shoulder axial rotation — the payoff of a full segment frame', () => {
  /**
   * Abduct the arm to 90° in the frontal plane, then spin the forearm about the
   * humeral long axis. The elbow and shoulder centres never move, so a
   * position-only method sees nothing. A frame-based method must see the rotation.
   */
  function abductedArm(axialDeg: number): Landmarks {
    const L = standing()
    const shoulder: [number, number, number] = [0, 1.5, 0.2]
    const elbow: [number, number, number] = [0, 1.5, 0.55] // straight out to the right
    L.r_acromion = shoulder
    L.r_elbow = elbow
    // Forearm hangs down; rotating it about the humerus (the +Z axis here) sweeps it
    // between anterior and superior.
    const a = (axialDeg * Math.PI) / 180
    L.r_wrist = [elbow[0] + 0.3 * Math.sin(a), elbow[1] - 0.3 * Math.cos(a), elbow[2]]
    // The olecranon/cubital-fossa pair rides with the forearm.
    L.r_olecranon = [elbow[0] - 0.03 * Math.cos(a), elbow[1] - 0.03 * Math.sin(a), elbow[2]]
    L.r_cubital_fossa = [elbow[0] + 0.03 * Math.cos(a), elbow[1] + 0.03 * Math.sin(a), elbow[2]]
    return L
  }

  it('sees no change in joint-centre positions across the rotation', () => {
    const a = abductedArm(0)
    const b = abductedArm(60)
    for (const k of ['r_acromion', 'r_elbow'] as const) {
      expect(angleBetween(a[k], b[k])).toBeLessThan(1e-4)
    }
  })

  it('resolves the axial rotation that positions alone cannot', () => {
    const vals = [0, 30, 60, 90].map((d) => metricsFor(poseOf(abductedArm(d))).shoulder_external_rotation)
    for (const v of vals) expect(v).not.toBeNull()
    // Strictly monotonic and spanning roughly the imposed 90°.
    const nums = vals as number[]
    for (let i = 1; i < nums.length; i++) {
      expect(Math.abs(nums[i] - nums[0])).toBeGreaterThan(Math.abs(nums[i - 1] - nums[0]) - 1e-6)
    }
    expect(Math.abs(nums[3] - nums[0])).toBeCloseTo(90, 0)
  })

  it('reports ~90° elevation for an arm abducted to horizontal', () => {
    const m = metricsFor(poseOf(abductedArm(0)))
    expect(m.shoulder_abduction!).toBeCloseTo(90, 0)
  })
})
