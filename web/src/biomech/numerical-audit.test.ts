/**
 * End-to-end numerical audit of every exposed series and both bundled sessions.
 *
 * This deliberately separates anatomical invariants from session-quality claims. The
 * short second clip may contain finite angles, but its cut release cannot support event
 * comparisons or a kinematic-sequence order. A number being finite is not enough to
 * make it interpretable.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import type { Session } from '../types'
import { analyze } from './analyze'
import type { MetricName } from './angles'

const load = (id: string): Session => JSON.parse(
  readFileSync(join(__dirname, `../../public/sessions/${id}.json`), 'utf8'),
)
const full = analyze(load('delivery-01'))
const cut = analyze(load('delivery-02'))

const DIRECT_ANGLES: MetricName[] = [
  'lead_knee_flexion', 'trail_knee_flexion', 'lead_hip_flexion',
  'elbow_flexion', 'shoulder_abduction',
]
const REFERENCED = new Set<MetricName>(['lead_knee_flexion', 'elbow_flexion'])

describe.each([
  ['delivery-01', load('delivery-01'), full],
  ['delivery-02', load('delivery-02'), cut],
] as const)('%s complete numerical contract', (_id, session, result) => {
  it('returns one finite-or-null value per frame for every metric', () => {
    for (const [metric, values] of Object.entries(result.series)) {
      expect(values, metric).toHaveLength(session.frames.length)
      expect(values.filter((value) => value !== null).length / values.length, metric)
        .toBeGreaterThan(0.95)
      for (const value of values) {
        expect(value === null || Number.isFinite(value), `${metric}: ${value}`).toBe(true)
      }
    }
  })

  it('keeps direct position-derived angles inside anatomical bounds', () => {
    for (const metric of DIRECT_ANGLES) {
      for (const value of result.series[metric]) {
        if (value === null) continue
        expect(value, `${metric} lower bound`).toBeGreaterThanOrEqual(0)
        expect(value, `${metric} upper bound`).toBeLessThanOrEqual(180)
      }
    }
  })

  it('never attaches a population range to an exploratory proxy', () => {
    for (const reading of result.readings) {
      expect(REFERENCED.has(reading.metric), reading.metric).toBe(true)
      expect(reading.reference).toBeTruthy()
      expect(reading.citations.length).toBeGreaterThan(0)
      expect(reading.confidence).toBe(
        reading.eventConfidence === 'low' ? 'low' : 'medium',
      )
      if (reading.eventConfidence === 'low') {
        expect(reading.status).toBe('unavailable')
        expect(reading.magnitude).toBeNull()
      }
    }
  })

  it('keeps detected events strictly ordered', () => {
    const byName = Object.fromEntries(result.events.map((event) => [event.name, event]))
    expect(byName.foot_contact.frame).toBeLessThan(byName.max_external_rotation.frame)
    expect(byName.max_external_rotation.frame).toBeLessThan(byName.ball_release.frame)
  })
})

describe('complete delivery numerical regression', () => {
  const at = (metric: MetricName, frame: number) => full.series[metric][frame]
  const event = (name: string) => full.events.find((candidate) => candidate.name === name)!

  it('removes the former 180° segment-frame branch jumps', () => {
    for (const metric of Object.keys(full.series) as MetricName[]) {
      const values = full.series[metric]
      let maxStep = 0
      for (let index = 1; index < values.length; index++) {
        const a = values[index - 1]
        const b = values[index]
        if (a !== null && b !== null) maxStep = Math.max(maxStep, Math.abs(b - a))
      }
      expect(maxStep, metric).toBeLessThan(25)
    }
  })

  it('retains coherent event measurements', () => {
    const fc = event('foot_contact')
    const br = event('ball_release')
    expect(fc.frame).toBe(562)
    expect(at('lead_knee_flexion', fc.frame)).toBeCloseTo(47.9, 1)
    expect(at('elbow_flexion', fc.frame)).toBeCloseTo(39.8, 1)
    expect(br.frame).toBe(701)
    expect(at('lead_knee_flexion', br.frame)).toBeCloseTo(37.8, 1)
    expect(at('elbow_flexion', br.frame)).toBeCloseTo(37.8, 1)
    expect(br.confidence).toBe('high')
    expect(event('max_external_rotation').confidence).toBe('low')
  })

  it('reports supported, internally consistent KSA peaks and all three intervals', () => {
    const sequence = full.sequence
    expect(sequence.available).toBe(true)
    expect(sequence.quality).toBe('medium')
    expect(sequence.observedOrder).toEqual(['pelvis', 'thorax', 'upperarm', 'forearm'])
    expect(sequence.peaks.map((peak) => peak.frame)).toEqual([639, 667, 672, 685])
    expect(sequence.intervals.map((interval) => interval.frames)).toEqual([28, 5, 13])
    expect(sequence.intervals.map((interval) => interval.normalizedPctPoints))
      .toEqual([20.1, 3.6, 9.4])
    for (const peak of sequence.peaks) {
      expect(peak.tNormPct).toBeGreaterThanOrEqual(0)
      expect(peak.tNormPct).toBeLessThanOrEqual(100)
      expect(peak.peakSpeedVideo).toBeGreaterThan(0)
      expect(peak.peakAngularVelocity).toBeNull()
    }
  })
})

describe('cut delivery quality refusal', () => {
  it('downgrades every boundary-dependent event and comparison', () => {
    expect(cut.events.every((event) => event.confidence === 'low')).toBe(true)
    expect(cut.events.find((event) => event.name === 'ball_release')?.frame).toBe(37)
    expect(cut.readings.every((reading) => reading.confidence === 'low')).toBe(true)
    expect(cut.readings.every((reading) => reading.status === 'unavailable')).toBe(true)
    expect(cut.readings.every((reading) => reading.magnitude === null)).toBe(true)
  })

  it('refuses KSA order, peaks, and intervals instead of collapsing them onto one frame', () => {
    expect(cut.sequence.available).toBe(false)
    expect(cut.sequence.quality).toBe('unavailable')
    expect(cut.sequence.unavailableReason).toMatch(/edge of the clip/i)
    expect(cut.sequence.observedOrder).toEqual([])
    expect(cut.sequence.peaks).toEqual([])
    expect(cut.sequence.intervals).toEqual([])
    expect(cut.sequence.isProximalToDistal).toBeNull()
  })
})
