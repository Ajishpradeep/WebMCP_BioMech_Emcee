import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { analyze } from '../biomech/analyze'
import type { JointName, Session } from '../types'
import { buildViewerFrames, jointAt } from './geometry'
import { buildFlexionArc, flexionEvidenceTarget } from './supportedAngles'

describe('supported flexion evidence', () => {
  it('resolves throwing-side elbow geometry by handedness', () => {
    expect(flexionEvidenceTarget('r_elbow', 'right')).toMatchObject({
      metric: 'elbow_flexion', proximal: 'r_acromion', distal: 'r_wrist',
    })
    expect(flexionEvidenceTarget('l_elbow', 'left')).toMatchObject({
      metric: 'elbow_flexion', proximal: 'l_acromion', distal: 'l_wrist',
    })
    expect(flexionEvidenceTarget('l_elbow', 'right')).toBeNull()
  })

  it('maps both knees to the correct lead/trail construct', () => {
    expect(flexionEvidenceTarget('l_knee', 'right')?.metric).toBe('lead_knee_flexion')
    expect(flexionEvidenceTarget('r_knee', 'right')?.metric).toBe('trail_knee_flexion')
    expect(flexionEvidenceTarget('r_knee', 'left')?.metric).toBe('lead_knee_flexion')
  })

  it('uses the zero-when-straight flexion convention', () => {
    const straight = buildFlexionArc([0, 1, 0], [0, 0, 0], [0, -1, 0], 0.25)
    expect(straight?.angleDeg).toBeCloseTo(0, 6)

    const rightAngle = buildFlexionArc([0, 1, 0], [0, 0, 0], [1, 0, 0], 0.25)
    expect(rightAngle?.angleDeg).toBeCloseTo(90, 6)
    expect(rightAngle?.points[0]).toEqual([0, -0.25, 0])
    expect(rightAngle?.points.at(-1)?.[0]).toBeCloseTo(0.25, 6)
  })

  it('matches the engine values at every event in both bundled sessions', () => {
    for (const id of ['delivery-02', 'delivery-03']) {
      const session: Session = JSON.parse(
        readFileSync(join(__dirname, `../../public/sessions/${id}.json`), 'utf8'),
      )
      const analysis = analyze(session)
      const viewer = buildViewerFrames(session)
      const throwing = session.subject.handedness === 'left' ? 'l' : 'r'
      const lead = throwing === 'l' ? 'r' : 'l'

      for (const joint of [`${throwing}_elbow`, `${lead}_knee`] as JointName[]) {
        const target = flexionEvidenceTarget(joint, session.subject.handedness)!
        const indices = [target.proximal, target.vertex, target.distal]
          .map((name) => session.joints.indexOf(name))
        for (const event of analysis.events) {
          const [proximal, vertex, distal] = indices.map((index) => jointAt(viewer, event.frame, index))
          const arc = buildFlexionArc(proximal, vertex, distal, 0.2)!
          expect(arc.angleDeg, `${id} ${target.metric} at ${event.name}`)
            .toBeCloseTo(analysis.series[target.metric][event.frame]!, 1)
        }
      }
    }
  })
})
