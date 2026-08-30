/**
 * The 3D skeleton viewer.
 *
 * Playback updates geometry IMPERATIVELY inside useFrame rather than re-rendering React
 * every frame — with ~900 frames and 24 joints, per-frame reconciliation would stutter.
 * The viewer reads `currentFrame` via useAnalysis.getState(); only the chrome (timeline,
 * panels) subscribes reactively.
 */

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Grid, OrbitControls, Html } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import { useAnalysis } from '../store'
import type { Session } from '../types'
import { buildViewerFrames, jointAt, type ViewerFrames } from './geometry'
import { AxialRotationDial, SegmentFrames } from './SegmentFrames'

const JOINT_COLOR = new THREE.Color('#5eead4')
const JOINT_SELECTED = new THREE.Color('#fbbf24')
const BONE_COLOR = '#38bdf8'
const TRAIL_LEN = 90

/* ── playback clock ──────────────────────────────────────────────────────── */
function PlaybackClock({ session }: { session: Session }) {
  const acc = useRef(0)
  useFrame((_, delta) => {
    const { playing, playbackRate, currentFrame, setFrame } = useAnalysis.getState()
    if (!playing) return
    acc.current += delta * session.timebase.videoFps * playbackRate
    if (acc.current >= 1) {
      const step = Math.floor(acc.current)
      acc.current -= step
      const next = currentFrame + step
      if (next >= session.frames.length - 1) {
        setFrame(0) // loop
      } else {
        setFrame(next)
      }
    }
  })
  return null
}

/* ── skeleton ────────────────────────────────────────────────────────────── */
function Skeleton({ session, vf }: { session: Session; vf: ViewerFrames }) {
  const jointsRef = useRef<THREE.InstancedMesh>(null)
  const bonesRef = useRef<THREE.LineSegments>(null)
  const trailRef = useRef<THREE.Line>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tmp: [number, number, number] = useMemo(() => [0, 0, 0], [])

  const bones = session.bones
  const nJoints = vf.jointCount
  const radius = vf.scale * 0.018

  const boneGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bones.length * 6), 3))
    return g
  }, [bones.length])

  const trailGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL_LEN * 3), 3))
    return g
  }, [])

  // Throwing wrist follows handedness — the trail should track the pitching hand.
  const trailJoint = useMemo(() => {
    const name = session.subject.handedness === 'left' ? 'l_wrist' : 'r_wrist'
    return Math.max(0, session.joints.indexOf(name))
  }, [session])

  useFrame(() => {
    const { currentFrame, selectedJoint, overlays } = useAnalysis.getState()
    const f = Math.min(currentFrame, vf.frameCount - 1)
    const selIdx = selectedJoint ? session.joints.indexOf(selectedJoint) : -1

    // joints
    const im = jointsRef.current
    if (im) {
      for (let j = 0; j < nJoints; j++) {
        jointAt(vf, f, j, tmp)
        dummy.position.set(tmp[0], tmp[1], tmp[2])
        const s = j === selIdx ? 2.1 : 1
        dummy.scale.setScalar(s)
        dummy.updateMatrix()
        im.setMatrixAt(j, dummy.matrix)
        im.setColorAt(j, j === selIdx ? JOINT_SELECTED : JOINT_COLOR)
      }
      im.instanceMatrix.needsUpdate = true
      if (im.instanceColor) im.instanceColor.needsUpdate = true
    }

    // bones
    const bl = bonesRef.current
    if (bl) {
      const arr = bl.geometry.attributes.position.array as Float32Array
      for (let b = 0; b < bones.length; b++) {
        const [a, c] = bones[b]
        jointAt(vf, f, a, tmp)
        arr[b * 6] = tmp[0]; arr[b * 6 + 1] = tmp[1]; arr[b * 6 + 2] = tmp[2]
        jointAt(vf, f, c, tmp)
        arr[b * 6 + 3] = tmp[0]; arr[b * 6 + 4] = tmp[1]; arr[b * 6 + 5] = tmp[2]
      }
      bl.geometry.attributes.position.needsUpdate = true
    }

    // motion trail of the throwing hand
    const tl = trailRef.current
    if (tl) {
      tl.visible = overlays.motion_trail
      if (overlays.motion_trail) {
        const arr = tl.geometry.attributes.position.array as Float32Array
        for (let k = 0; k < TRAIL_LEN; k++) {
          const src = Math.max(0, f - (TRAIL_LEN - 1 - k))
          jointAt(vf, src, trailJoint, tmp)
          arr[k * 3] = tmp[0]; arr[k * 3 + 1] = tmp[1]; arr[k * 3 + 2] = tmp[2]
        }
        tl.geometry.attributes.position.needsUpdate = true
      }
    }
  })

  return (
    <group>
      <instancedMesh ref={jointsRef} args={[undefined, undefined, nJoints]} frustumCulled={false}>
        <sphereGeometry args={[radius, 12, 12]} />
        <meshStandardMaterial roughness={0.35} metalness={0.1} />
      </instancedMesh>

      <lineSegments ref={bonesRef} geometry={boneGeom} frustumCulled={false}>
        <lineBasicMaterial color={BONE_COLOR} linewidth={2} transparent opacity={0.9} />
      </lineSegments>

      {/* @ts-expect-error three's Line is valid as an r3f intrinsic */}
      <line ref={trailRef} geometry={trailGeom} frustumCulled={false}>
        <lineBasicMaterial color="#f472b6" transparent opacity={0.55} />
      </line>
    </group>
  )
}

/* ── agent annotation pins ───────────────────────────────────────────────── */
function AnnotationPins({ session, vf }: { session: Session; vf: ViewerFrames }) {
  const annotations = useAnalysis((s) => s.annotations)
  const currentFrame = useAnalysis((s) => s.currentFrame)

  return (
    <>
      {annotations.map((a) => {
        const j = a.joint ? session.joints.indexOf(a.joint) : session.joints.indexOf('thorax')
        const p = jointAt(vf, Math.min(a.frame, vf.frameCount - 1), Math.max(0, j))
        const near = Math.abs(a.frame - currentFrame) <= 12
        return (
          <group key={a.id} position={[p[0], p[1], p[2]]}>
            <mesh>
              <sphereGeometry args={[vf.scale * 0.022, 10, 10]} />
              <meshBasicMaterial color={a.severity === 'attention' ? '#f87171' : '#fbbf24'} />
            </mesh>
            <Html distanceFactor={vf.scale * 4} style={{ pointerEvents: 'none' }}>
              <div className={`pin ${a.severity} ${near ? 'pin-near' : ''}`}>{a.label}</div>
            </Html>
          </group>
        )
      })}
    </>
  )
}

/* ── camera presets ──────────────────────────────────────────────────────── */
function CameraRig({ vf }: { vf: ViewerFrames }) {
  const plane = useAnalysis((s) => s.cameraPlane)
  const { camera } = useThree()
  const controls = useRef<any>(null)

  useEffect(() => {
    const d = vf.scale * 1.75
    const h = vf.scale * 0.85
    const target = new THREE.Vector3(0, vf.scale * 0.48, 0)
    const pos: Record<string, [number, number, number]> = {
      sagittal: [d, h, 0],
      frontal: [0, h, d],
      transverse: [0, vf.scale * 2.6, 0.001],
      free: [d * 0.78, h * 1.15, d * 0.62],
    }
    const p = pos[plane] ?? pos.free
    camera.position.set(p[0], p[1], p[2])
    camera.lookAt(target)
    if (controls.current) {
      controls.current.target.copy(target)
      controls.current.update()
    }
  }, [plane, vf.scale, camera])

  return <OrbitControls ref={controls} enableDamping dampingFactor={0.1} makeDefault />
}

/* ── root ────────────────────────────────────────────────────────────────── */
export function SkeletonViewer({ session }: { session: Session }) {
  const vf = useMemo(() => buildViewerFrames(session), [session])

  return (
    <Canvas
      camera={{ fov: 42, near: 0.01, far: 100, position: [2, 1.6, 2] }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#0a0d12']} />
      <fog attach="fog" args={['#0a0d12', vf.scale * 3, vf.scale * 9]} />

      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 6, 4]} intensity={1.4} />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} color="#7dd3fc" />

      <Grid
        args={[20, 20]}
        cellSize={vf.scale * 0.25}
        cellColor="#1c2532"
        sectionSize={vf.scale}
        sectionColor="#2b3a4f"
        fadeDistance={vf.scale * 9}
        fadeStrength={1.4}
        infiniteGrid
        position={[0, 0, 0]}
      />

      <Skeleton session={session} vf={vf} />
      <SegmentFrames session={session} vf={vf} />
      <AxialRotationDial session={session} vf={vf} />
      <AnnotationPins session={session} vf={vf} />
      <PlaybackClock session={session} />
      <CameraRig vf={vf} />
    </Canvas>
  )
}
