/**
 * Validation against a real reconstructed delivery.
 *
 * Synthetic tests prove the maths; this proves the maths survives contact with actual
 * SAM 3D Body output. It doubles as a regression guard: if smoothing, the joint map or
 * the frame conventions change, these ranges are what will catch it.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import type { Session } from '../types'
import { analyze } from './analyze'
import { metricSeries } from './angles'

const session: Session = JSON.parse(
  readFileSync(join(__dirname, '../../public/sessions/delivery-01.json'), 'utf8'),
)

const finite = (xs: (number | null)[]) => xs.filter((v): v is number => v !== null && Number.isFinite(v))
const range = (xs: (number | null)[]) => {
  const f = finite(xs)
  return { min: Math.min(...f), max: Math.max(...f), n: f.length }
}

describe('real session integrity', () => {
  it('loads a well-formed session', () => {
    expect(session.frames.length).toBeGreaterThan(1000)
    expect(session.joints).toHaveLength(24)
    expect(session.capture.cameraFrame).toBe(true)
    expect(session.timebase.slowMotion).toBe(true)
    expect(session.timebase.realTimeScale).toBeNull()
  })
})

describe('metric plausibility on real data', () => {
  const series = metricSeries(session)

  it('resolves every metric on nearly every frame', () => {
    for (const [name, xs] of Object.entries(series)) {
      const cov = finite(xs).length / xs.length
      expect(cov, `${name} coverage`).toBeGreaterThan(0.9)
    }
  })

  it('keeps flexion angles inside anatomical limits', () => {
    for (const k of ['lead_knee_flexion', 'trail_knee_flexion', 'elbow_flexion'] as const) {
      const r = range(series[k])
      expect(r.min, `${k} min`).toBeGreaterThanOrEqual(0)
      expect(r.max, `${k} max`).toBeLessThan(170)
    }
  })

  it('sweeps a plausible range of knee and elbow flexion across a delivery', () => {
    // A pitch must involve substantial excursion at both joints.
    const knee = range(series.lead_knee_flexion)
    const elbow = range(series.elbow_flexion)
    expect(knee.max - knee.min).toBeGreaterThan(40)
    expect(elbow.max - elbow.min).toBeGreaterThan(40)
  })

  it('produces hip–shoulder separation in a physically sensible band', () => {
    const r = range(series.hip_shoulder_separation)
    expect(r.min).toBeGreaterThan(-180)
    expect(r.max).toBeLessThan(180)
    // Some genuine separation must occur during the throw.
    expect(Math.max(Math.abs(r.min), Math.abs(r.max))).toBeGreaterThan(15)
  })

  it('resolves shoulder external rotation on most frames', () => {
    const cov = finite(series.shoulder_external_rotation).length / session.frames.length
    expect(cov).toBeGreaterThan(0.85)
  })
})

describe('event detection on real data', () => {
  const result = analyze(session)

  it('finds all three events in the correct order', () => {
    const names = result.events.map((e) => e.name)
    expect(names).toContain('foot_contact')
    expect(names).toContain('max_external_rotation')
    expect(names).toContain('ball_release')
    const f = (n: string) => result.events.find((e) => e.name === n)!.frame
    expect(f('foot_contact')).toBeLessThan(f('max_external_rotation'))
    expect(f('max_external_rotation')).toBeLessThanOrEqual(f('ball_release'))
  })

  it('places events inside the clip and away from the very edges', () => {
    for (const e of result.events) {
      expect(e.frame).toBeGreaterThan(0)
      expect(e.frame).toBeLessThan(session.frames.length - 1)
    }
  })
})

describe('analysis output contract', () => {
  const result = analyze(session)

  it('grades every reading and attaches citations where a reference exists', () => {
    expect(result.readings.length).toBeGreaterThanOrEqual(5)
    for (const r of result.readings) {
      expect(['high', 'medium', 'low', 'unavailable']).toContain(r.confidence)
      if (r.reference) expect(r.citations.length).toBeGreaterThan(0)
    }
  })

  it('keeps unvalidated axial rotation out of reference-ranked readings', () => {
    const er = result.readings.find((r) => r.metric === 'shoulder_external_rotation')
    expect(er).toBeUndefined()
    expect(result.series.shoulder_external_rotation.some((v) => v !== null)).toBe(true)
  })

  it('refuses rate units because the clip is slow motion at an unknown factor', () => {
    expect(result.rateConfidence).toBe('unavailable')
    expect(result.sequence.rateUnitsAvailable).toBe(false)
    for (const p of result.sequence.peaks) expect(p.peakAngularVelocity).toBeNull()
  })

  it('reports a kinematic sequence with the literature caveat attached', () => {
    expect(result.sequence.available).toBe(true)
    expect(result.sequence.quality).toBe('medium')
    expect(result.sequence.observedOrder).toHaveLength(4)
    expect(new Set(result.sequence.observedOrder).size).toBe(4)
    expect(result.sequence.literatureNote).toMatch(/not itself a fault/)
    expect(result.sequence.literatureNote).toMatch(/partial four-segment/i)
    for (const p of result.sequence.peaks) expect(p.peakSpeedVideo).toBeGreaterThan(0)
    expect(result.sequence.intervals).toHaveLength(3)
  })
})
