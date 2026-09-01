import { Line } from '@react-three/drei'
import { useMemo } from 'react'

import { useAnalysis } from '../store'
import type { Session } from '../types'
import { jointAt, type ViewerFrames } from './geometry'
import { buildFlexionArc, flexionEvidenceTarget } from './supportedAngles'

/**
 * A semantic visual explanation for the direct flexion metrics the app already owns.
 * The LLM chooses a supported focus; the application chooses landmarks, segments, arc,
 * value and availability. No arbitrary drawing coordinates cross the WebMCP boundary.
 */
export function SupportedAngleGeometry({ session, vf }: { session: Session; vf: ViewerFrames }) {
  const show = useAnalysis((state) => state.overlays.angle_readouts)
  const selectedJoint = useAnalysis((state) => state.selectedJoint)
  const currentFrame = useAnalysis((state) => state.currentFrame)
  const target = flexionEvidenceTarget(selectedJoint, session.subject.handedness)

  const evidence = useMemo(() => {
    if (!show || !target) return null
    const proximalIndex = session.joints.indexOf(target.proximal)
    const vertexIndex = session.joints.indexOf(target.vertex)
    const distalIndex = session.joints.indexOf(target.distal)
    if (proximalIndex < 0 || vertexIndex < 0 || distalIndex < 0) return null

    const frame = Math.min(currentFrame, vf.frameCount - 1)
    const proximal = jointAt(vf, frame, proximalIndex)
    const vertex = jointAt(vf, frame, vertexIndex)
    const distal = jointAt(vf, frame, distalIndex)
    const radius = Math.min(
      Math.hypot(proximal[0] - vertex[0], proximal[1] - vertex[1], proximal[2] - vertex[2]),
      Math.hypot(distal[0] - vertex[0], distal[1] - vertex[1], distal[2] - vertex[2]),
    ) * 0.34
    const arc = buildFlexionArc(proximal, vertex, distal, radius)
    const value = useAnalysis.getState().analysis?.series[target.metric]?.[frame] ?? null
    if (!arc || value === null) return null

    return { proximal, vertex, distal, arc, value }
  }, [show, target, session, vf, currentFrame])

  if (!target || !evidence) return null
  return (
    <group>
      <Line points={[evidence.proximal, evidence.vertex]} color="#fbbf24" lineWidth={4} />
      <Line points={[evidence.vertex, evidence.distal]} color="#fb923c" lineWidth={4} />
      <Line
        points={[evidence.vertex, evidence.arc.referenceEnd]}
        color="#fde68a"
        lineWidth={1.5}
        dashed
        dashSize={0.06}
        gapSize={0.04}
        transparent
        opacity={0.7}
      />
      <Line points={evidence.arc.points} color="#fef08a" lineWidth={3} />
    </group>
  )
}
