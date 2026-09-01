import type { MetricName } from '../biomech/angles'
import type { JointName, Session } from '../types'

export interface FlexionEvidenceTarget {
  metric: MetricName
  proximal: JointName
  vertex: JointName
  distal: JointName
}

type Point3 = readonly [number, number, number]

const sub = (a: Point3, b: Point3): [number, number, number] => [
  a[0] - b[0], a[1] - b[1], a[2] - b[2],
]

const unit = (v: Point3): [number, number, number] | null => {
  const length = Math.hypot(v[0], v[1], v[2])
  return length > 1e-8 ? [v[0] / length, v[1] / length, v[2] / length] : null
}

const dot = (a: Point3, b: Point3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

const cross = (a: Point3, b: Point3): [number, number, number] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

/**
 * The direct flexion constructs the viewer can explain without inventing geometry.
 * Flexion is the bend away from the straight continuation of the proximal segment.
 */
export function flexionEvidenceTarget(
  joint: JointName | null,
  handedness: Session['subject']['handedness'],
): FlexionEvidenceTarget | null {
  if (!joint) return null
  const throwing = handedness === 'left' ? 'l' : 'r'
  const lead = throwing === 'l' ? 'r' : 'l'
  const side = joint.startsWith('l_') ? 'l' : joint.startsWith('r_') ? 'r' : null

  if (joint === `${throwing}_elbow`) {
    return {
      metric: 'elbow_flexion',
      proximal: `${throwing}_acromion`,
      vertex: `${throwing}_elbow`,
      distal: `${throwing}_wrist`,
    }
  }
  if (side && joint === `${side}_knee`) {
    return {
      metric: side === lead ? 'lead_knee_flexion' : 'trail_knee_flexion',
      proximal: `${side}_hip`,
      vertex: `${side}_knee`,
      distal: `${side}_ankle`,
    }
  }
  return null
}

export interface FlexionArc {
  angleDeg: number
  points: [number, number, number][]
  referenceEnd: [number, number, number]
}

/**
 * Build the application-owned arc for a direct three-landmark flexion angle. The arc
 * starts on the straight continuation of the proximal segment and ends on the distal
 * segment, so its sweep equals the app's 0°-when-straight flexion convention.
 */
export function buildFlexionArc(
  proximal: Point3,
  vertex: Point3,
  distal: Point3,
  radius: number,
  steps = 32,
): FlexionArc | null {
  const extension = unit(sub(vertex, proximal))
  const distalDirection = unit(sub(distal, vertex))
  if (!extension || !distalDirection || radius <= 0 || steps < 2) return null

  const cosine = Math.max(-1, Math.min(1, dot(extension, distalDirection)))
  const angle = Math.acos(cosine)
  let axis = unit(cross(extension, distalDirection))
  if (!axis) {
    const fallback: Point3 = Math.abs(extension[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
    axis = unit(cross(extension, fallback))
  }
  if (!axis) return null

  const points: [number, number, number][] = []
  for (let index = 0; index <= steps; index++) {
    const theta = angle * (index / steps)
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    const oneMinusC = 1 - c
    const axisDot = dot(axis, extension)
    const rotated: [number, number, number] = [
      extension[0] * c + (axis[1] * extension[2] - axis[2] * extension[1]) * s + axis[0] * axisDot * oneMinusC,
      extension[1] * c + (axis[2] * extension[0] - axis[0] * extension[2]) * s + axis[1] * axisDot * oneMinusC,
      extension[2] * c + (axis[0] * extension[1] - axis[1] * extension[0]) * s + axis[2] * axisDot * oneMinusC,
    ]
    points.push([
      vertex[0] + rotated[0] * radius,
      vertex[1] + rotated[1] * radius,
      vertex[2] + rotated[2] * radius,
    ])
  }

  return {
    angleDeg: angle * 180 / Math.PI,
    points,
    referenceEnd: [
      vertex[0] + extension[0] * radius * 1.25,
      vertex[1] + extension[1] * radius * 1.25,
      vertex[2] + extension[2] * radius * 1.25,
    ],
  }
}
