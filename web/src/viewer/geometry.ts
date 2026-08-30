/**
 * Camera-frame -> viewer-space transform.
 *
 * SAM 3D Body returns CAMERA coordinates: +X right, +Y DOWN, +Z away from camera.
 * three.js wants +Y up. We also want the subject standing on the grid and roughly
 * centred, without destroying the translation that actually happens during a stride.
 *
 * So: flip Y and Z, then subtract a per-session offset computed from the whole clip
 * (mean pelvis in X/Z, lowest foot in Y). Motion is preserved; the subject stays in view.
 *
 * ⚠️ This is a VIEWING transform only. It is scale-preserving but the scale itself is
 * not metric — focal length is estimated (tech.md §3.2). Never read distances off this.
 */

import type { Session } from '../types'

export interface ViewerFrames {
  /** (frameCount * jointCount * 3) flat XYZ in viewer space. */
  positions: Float32Array
  frameCount: number
  jointCount: number
  /** Approximate subject height in viewer units — used to size the camera and markers. */
  scale: number
}

export function buildViewerFrames(session: Session): ViewerFrames {
  const frameCount = session.frames.length
  const jointCount = session.joints.length
  const positions = new Float32Array(frameCount * jointCount * 3)

  // Pass 1: flip axes into a temp buffer and accumulate the offset statistics.
  let sumX = 0
  let sumZ = 0
  let minY = Infinity
  const pelvisIdx = Math.max(0, session.joints.indexOf('pelvis'))

  for (let f = 0; f < frameCount; f++) {
    const kp = session.frames[f].keypoints3d
    for (let j = 0; j < jointCount; j++) {
      const [x, y, z] = kp[j]
      const o = (f * jointCount + j) * 3
      positions[o] = x
      positions[o + 1] = -y // camera Y is down
      positions[o + 2] = -z // camera Z points away
      if (positions[o + 1] < minY) minY = positions[o + 1]
    }
    const po = (f * jointCount + pelvisIdx) * 3
    sumX += positions[po]
    sumZ += positions[po + 2]
  }

  const offX = sumX / frameCount
  const offZ = sumZ / frameCount
  const offY = minY

  // Pass 2: apply the offset in place.
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] -= offX
    positions[i + 1] -= offY
    positions[i + 2] -= offZ
  }

  // Subject height ~ max Y reached across the clip (feet are at 0 after the offset).
  let maxY = 0
  for (let i = 1; i < positions.length; i += 3) {
    if (positions[i] > maxY) maxY = positions[i]
  }

  return { positions, frameCount, jointCount, scale: maxY || 1 }
}

/** Read one joint's XYZ out of the flat buffer. */
export function jointAt(
  vf: ViewerFrames,
  frame: number,
  joint: number,
  out: [number, number, number] = [0, 0, 0],
): [number, number, number] {
  const o = (frame * vf.jointCount + joint) * 3
  out[0] = vf.positions[o]
  out[1] = vf.positions[o + 1]
  out[2] = vf.positions[o + 2]
  return out
}
