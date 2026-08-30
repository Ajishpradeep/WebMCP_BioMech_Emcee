/**
 * Segment-frame overlays — the visual payoff of building anatomical coordinate systems.
 *
 * Two things are drawn:
 *
 *  1. **Triads** — the three orthonormal axes of each segment frame, at its proximal
 *     joint. Red = anterior (ex), green = long axis (ey), blue = medio-lateral (ez).
 *     These make orientation visible, which joint dots alone never do.
 *
 *  2. **The axial-rotation dial** — a disc perpendicular to the humeral long axis at
 *     the elbow, with a needle showing current external rotation and a ghost needle at
 *     the neutral reference. This is the one quantity that is invisible in joint
 *     positions: the arm can spin about its own axis without any joint centre moving.
 *     Watching the needle sweep while the dots stay put is the clearest demonstration
 *     of what the segment frames buy.
 */

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

import { frameSeries } from '../biomech/angles'
import type { SegmentName } from '../biomech/frames'
import { useAnalysis } from '../store'
import type { Session } from '../types'
import { jointAt, type ViewerFrames } from './geometry'

/** Which joint each segment's triad is anchored to. */
const ANCHOR: Record<string, string> = {
  pelvis: 'pelvis',
  thorax: 'thorax',
  upperarm_l: 'l_acromion', upperarm_r: 'r_acromion',
  forearm_l: 'l_elbow', forearm_r: 'r_elbow',
  thigh_l: 'l_hip', thigh_r: 'r_hip',
  shank_l: 'l_knee', shank_r: 'r_knee',
}

const AXIS_COLORS = ['#f87171', '#4ade80', '#60a5fa'] // ex anterior, ey long, ez lateral

export function SegmentFrames({ session, vf }: { session: Session; vf: ViewerFrames }) {
  const show = useAnalysis((s) => s.overlays.segment_frames)
  const frames = useMemo(() => frameSeries(session), [session])
  const groupRef = useRef<THREE.Group>(null)
  const linesRef = useRef<THREE.LineSegments>(null)

  const segs = useMemo(
    () => (Object.keys(ANCHOR) as SegmentName[]).filter((s) => session.joints.includes(ANCHOR[s])),
    [session],
  )
  const len = vf.scale * 0.09

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    // 3 axes per segment, 2 vertices each
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs.length * 3 * 2 * 3), 3))
    const colors = new Float32Array(segs.length * 3 * 2 * 3)
    for (let s = 0; s < segs.length; s++) {
      for (let a = 0; a < 3; a++) {
        const c = new THREE.Color(AXIS_COLORS[a])
        for (let v = 0; v < 2; v++) {
          const o = ((s * 3 + a) * 2 + v) * 3
          colors[o] = c.r; colors[o + 1] = c.g; colors[o + 2] = c.b
        }
      }
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [segs.length])

  useFrame(() => {
    const g = groupRef.current
    if (g) g.visible = show
    if (!show || !linesRef.current) return
    const { currentFrame } = useAnalysis.getState()
    const f = Math.min(currentFrame, frames.length - 1)
    const F = frames[f]
    const arr = linesRef.current.geometry.attributes.position.array as Float32Array

    segs.forEach((seg, si) => {
      const m = F[seg]
      const ji = session.joints.indexOf(ANCHOR[seg])
      if (!m || ji < 0) {
        // collapse to a point so nothing stale is drawn
        for (let k = 0; k < 18; k++) arr[si * 18 + k] = 0
        return
      }
      const p = jointAt(vf, f, ji)
      const axes = [m.ex, m.ey, m.ez]
      for (let a = 0; a < 3; a++) {
        const o = si * 18 + a * 6
        arr[o] = p[0]; arr[o + 1] = p[1]; arr[o + 2] = p[2]
        arr[o + 3] = p[0] + axes[a][0] * len
        arr[o + 4] = p[1] + axes[a][1] * len
        arr[o + 5] = p[2] + axes[a][2] * len
      }
    })
    linesRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <group ref={groupRef}>
      <lineSegments ref={linesRef} geometry={geom} frustumCulled={false}>
        <lineBasicMaterial vertexColors linewidth={2} />
      </lineSegments>
    </group>
  )
}

/**
 * The axial-rotation dial at the throwing elbow.
 * A ring in the plane normal to the humerus, plus a needle along the forearm's
 * projection into that plane — i.e. a direct picture of humeral axial rotation.
 */
export function AxialRotationDial({ session, vf }: { session: Session; vf: ViewerFrames }) {
  const show = useAnalysis((s) => s.overlays.axial_dial)
  const frames = useMemo(() => frameSeries(session), [session])
  const throwing = session.subject.handedness === 'left' ? 'l' : 'r'
  const elbowIdx = session.joints.indexOf(`${throwing}_elbow`)
  const wristIdx = session.joints.indexOf(`${throwing}_wrist`)

  const group = useRef<THREE.Group>(null)
  const needle = useRef<THREE.Line>(null)
  const ring = useRef<THREE.Line>(null)

  const R = vf.scale * 0.11
  const RING_N = 48

  const ringGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((RING_N + 1) * 3), 3))
    return g
  }, [])
  const needleGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 3), 3))
    return g
  }, [])

  useFrame(() => {
    const g = group.current
    if (g) g.visible = show
    if (!show || elbowIdx < 0 || wristIdx < 0) return
    const { currentFrame } = useAnalysis.getState()
    const f = Math.min(currentFrame, frames.length - 1)
    const ua = frames[f][`upperarm_${throwing}` as SegmentName]
    if (!ua || !ring.current || !needle.current) return

    const c = jointAt(vf, f, elbowIdx)
    const w = jointAt(vf, f, wristIdx)
    const axis = new THREE.Vector3(ua.ey[0], ua.ey[1], ua.ey[2]).normalize()
    const u = new THREE.Vector3(ua.ex[0], ua.ex[1], ua.ex[2])
    const v = new THREE.Vector3(ua.ez[0], ua.ez[1], ua.ez[2])

    const ra = ring.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i <= RING_N; i++) {
      const th = (i / RING_N) * Math.PI * 2
      const px = c[0] + (u.x * Math.cos(th) + v.x * Math.sin(th)) * R
      const py = c[1] + (u.y * Math.cos(th) + v.y * Math.sin(th)) * R
      const pz = c[2] + (u.z * Math.cos(th) + v.z * Math.sin(th)) * R
      ra[i * 3] = px; ra[i * 3 + 1] = py; ra[i * 3 + 2] = pz
    }
    ring.current.geometry.attributes.position.needsUpdate = true

    // Needle: the forearm direction projected into the ring plane.
    const fv = new THREE.Vector3(w[0] - c[0], w[1] - c[1], w[2] - c[2])
    fv.addScaledVector(axis, -fv.dot(axis))
    if (fv.lengthSq() > 1e-8) {
      fv.normalize().multiplyScalar(R)
      const na = needle.current.geometry.attributes.position.array as Float32Array
      na[0] = c[0]; na[1] = c[1]; na[2] = c[2]
      na[3] = c[0] + fv.x; na[4] = c[1] + fv.y; na[5] = c[2] + fv.z
      needle.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <group ref={group}>
      {/* @ts-expect-error three's Line is a valid r3f intrinsic */}
      <line ref={ring} geometry={ringGeom} frustumCulled={false}>
        <lineBasicMaterial color="#fbbf24" transparent opacity={0.45} />
      </line>
      {/* @ts-expect-error three's Line is a valid r3f intrinsic */}
      <line ref={needle} geometry={needleGeom} frustumCulled={false}>
        <lineBasicMaterial color="#fbbf24" linewidth={2} />
      </line>
    </group>
  )
}
