/**
 * Tool-surface verification.
 *
 * DevTools proves the tools register; this proves they are CORRECT — every handler run
 * against two real reconstructed deliveries, with the conventions that the submission
 * rests on asserted rather than eyeballed: the 13-tool ceiling, the honesty `meta` block
 * on every response, the output budget, retryable errors, the structured refusal, and
 * write tools that actually move the store the UI renders from.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAnalysis } from '../store'
import type { Session, SessionIndexEntry } from '../types'
import { runTool, type PitchTool } from './registry'
import { ALL_TOOLS, READ_TOOLS, WRITE_TOOLS } from './tools'

const sessionsDir = join(__dirname, '../../public/sessions')
const read = (f: string) => JSON.parse(readFileSync(join(sessionsDir, f), 'utf8'))

const index: SessionIndexEntry[] = read('index.json').sessions
const active: Session = read('scherzer-delivery-01.json')
const other: Session = read('skenes-delivery-01.json')

const byName = (name: string): PitchTool => {
  const t = ALL_TOOLS.find((x) => x.name === name)
  if (!t) throw new Error(`no such tool: ${name}`)
  return t
}

const call = (name: string, input: Record<string, unknown> = {}) => runTool(byName(name), input)

/** Anything with a `meta` block. Tools return plain objects; this keeps the tests honest. */
type Result = Record<string, any>

beforeEach(() => {
  useAnalysis.setState({ index, indexState: 'ready', cache: {}, annotations: [] })
  useAnalysis.getState().adoptSession(active)
  useAnalysis.getState().cacheAnalysis(other)
})

describe('tool surface contract', () => {
  it('holds at the 13-tool ceiling with unique, well-formed names', () => {
    expect(ALL_TOOLS).toHaveLength(13)
    expect(new Set(ALL_TOOLS.map((t) => t.name)).size).toBe(13)
    for (const t of ALL_TOOLS) {
      expect(t.name, t.name).toMatch(/^[a-z][a-z0-9_]{2,29}$/)
      expect(t.description.length, `${t.name} description`).toBeLessThanOrEqual(500)
      expect(t.description.length, `${t.name} description`).toBeGreaterThan(80)
    }
  })

  it('keeps parameter descriptions inside the budget', () => {
    for (const t of ALL_TOOLS) {
      for (const [param, schema] of Object.entries(t.inputSchema.properties)) {
        const d = (schema as { description?: string }).description ?? ''
        expect(d.length, `${t.name}.${param}`).toBeLessThanOrEqual(150)
        expect(d.length, `${t.name}.${param} has no description`).toBeGreaterThan(0)
      }
    }
  })

  it('annotates read and write tools correctly', () => {
    expect(READ_TOOLS).toHaveLength(9)
    expect(WRITE_TOOLS).toHaveLength(4)
    for (const t of READ_TOOLS) expect(t.annotations.readOnlyHint, t.name).toBe(true)
    for (const t of WRITE_TOOLS) expect(t.annotations.readOnlyHint, t.name).toBe(false)
    // Anything echoing text this page does not author is marked untrusted.
    expect(byName('annotate_frame').annotations.untrustedContentHint).toBe(true)
    expect(byName('list_pitch_sessions').annotations.untrustedContentHint).toBe(true)
  })
})

describe('every tool answers with the honesty contract', () => {
  const inputs: Record<string, Record<string, unknown>> = {
    list_pitch_sessions: {},
    get_session_overview: {},
    get_phase_events: {},
    get_kinematics_at_event: { event: 'ball_release' },
    get_joint_angle_series: { joint: 'shoulder_external_rotation' },
    get_kinematic_sequence: {},
    get_metric_definition: { metric: 'hip_shoulder_separation' },
    compare_to_reference: {},
    compare_pitches: { sessionIdB: 'skenes-delivery-01' },
    seek_to_event: { event: 'max_external_rotation' },
    focus_joint: { joint: 'lead knee' },
    set_overlay: { overlay: 'motion_trail', enabled: true },
    annotate_frame: { label: 'test pin', event: 'ball_release' },
  }

  for (const tool of ALL_TOOLS) {
    it(`${tool.name} returns a populated meta block inside the output budget`, async () => {
      const res = (await call(tool.name, inputs[tool.name])) as Result
      expect(res.ok, `${tool.name} failed: ${res.error}`).not.toBe(false)
      expect(res.meta, `${tool.name} meta`).toBeTruthy()
      expect(res.meta.disclaimer).toMatch(/Not a diagnosis/)
      expect(['high', 'medium', 'low', 'unavailable']).toContain(res.meta.confidence)
      expect(res.meta.cameraFrame).toBe(true)
      // Chrome's guidance is ~1.5 K of output; allow headroom for the honesty block but
      // keep a hard ceiling so no tool can quietly start dumping the whole analysis.
      expect(JSON.stringify(res).length, `${tool.name} output size`).toBeLessThan(3000)
    })
  }
})

describe('measurement tools', () => {
  it('reports the three events with detection method and confidence', async () => {
    const res = (await call('get_phase_events')) as Result
    expect(res.events.map((e: any) => e.name)).toEqual([
      'foot_contact', 'max_external_rotation', 'ball_release',
    ])
    for (const e of res.events) {
      expect(e.method.length).toBeGreaterThan(5)
      expect(['high', 'medium', 'low', 'unavailable']).toContain(e.confidence)
    }
    expect(res.deliveryWindow.frames).toBeGreaterThan(0)
  })

  it('gives only construct-compatible references at an event, plus the unreferenced angles', async () => {
    const res = (await call('get_kinematics_at_event', { event: 'BR' })) as Result
    expect(res.event).toBe('ball_release')
    expect(res.metrics.length).toBeGreaterThanOrEqual(2)
    for (const m of res.metrics) {
      expect(m.unit).toBe('deg')
      expect(['within', 'above', 'below', 'no_reference', 'unavailable']).toContain(m.status)
      if (m.status === 'within' || m.status === 'above' || m.status === 'below') {
        expect(m.reference.range).toHaveLength(2)
      }
    }
    // Everything measured is reported; nothing gets an invented comparison.
    expect(Object.keys(res.otherMetrics).length).toBeGreaterThan(0)
  })

  it('downsamples a series and reports the peak at full resolution', async () => {
    const res = (await call('get_joint_angle_series', {
      joint: 'external rotation', fromEvent: 'foot_contact', toEvent: 'ball_release', maxPoints: 20,
    })) as Result
    expect(res.joint).toBe('shoulder_external_rotation')
    expect(res.samples.length).toBeLessThanOrEqual(21)
    expect(res.window.fromEvent).toBe('foot_contact')
    expect(res.peak.frame).toBeGreaterThanOrEqual(res.window.fromFrame)
    expect(res.peak.frame).toBeLessThanOrEqual(res.window.toFrame)
    // The peak may sit between two returned samples — that is the point of reporting it.
    expect(typeof res.peak.value).toBe('number')
  })

  it('refuses absolute angular velocity while the slow-motion factor is unknown', async () => {
    const res = (await call('get_kinematic_sequence')) as Result
    expect(res.observedOrder).toHaveLength(4)
    expect(res.literatureNote).toMatch(/not itself a fault/)
    expect(res.rateUnitsAvailable).toBe(false)
    for (const p of res.peaks) expect(p.peakAngularVelocityDegPerSec).toBeNull()
    expect(res.peakAngularVelocityUnavailable).toMatch(/slow motion/i)
    expect(res.separationUnits).toMatch(/percent/)
  })
})

describe('evidence tools', () => {
  it('serves only construct-compatible cited reference ranges', async () => {
    const res = (await call('get_metric_definition', { metric: 'elbow flexion' })) as Result
    expect(res.metric).toBe('elbow_flexion')
    expect(res.available).toBe(true)
    expect(res.referenceRanges[0].range).toEqual([74, 90])
    expect(res.meta.citations.join(' ')).toMatch(/doi:/)
    expect(res.limitations.length).toBeGreaterThan(20)
  })

  it('explains but does not rank a metric with an unvalidated convention', async () => {
    const res = (await call('get_metric_definition', { metric: 'x factor' })) as Result
    expect(res.metric).toBe('hip_shoulder_separation')
    expect(res.referenceRanges).toEqual([])
    expect(res.note).toMatch(/no comparison/i)
    expect(res.limitations).toMatch(/not been proven equivalent/i)
  })

  it('returns a structured refusal for kinetics instead of a number', async () => {
    for (const asked of ['elbow valgus torque', 'UCL stress', 'injury risk', 'pitch velocity']) {
      const res = (await call('get_metric_definition', { metric: asked })) as Result
      expect(res.available, asked).toBe(false)
      expect(res.refusal.reason.length).toBeGreaterThan(40)
      expect(res.refusal.insteadUse.length).toBeGreaterThan(0)
      expect(res.meta.confidence).toBe('unavailable')
      expect(JSON.stringify(res)).not.toMatch(/\d+\s*(Nm|newton)/i)
    }
  })

  it('surfaces only the deviations, largest first', async () => {
    const res = (await call('compare_to_reference')) as Result
    expect(res.summary).toMatch(/fall outside/)
    for (const d of res.deviations) expect(['above', 'below']).toContain(d.direction)
    const mags = res.deviations.map((d: any) => d.magnitudeDeg)
    expect([...mags].sort((a: number, b: number) => b - a)).toEqual(mags)

    const all = (await call('compare_to_reference', { includeWithinRange: true })) as Result
    expect(all.deviations.length).toBeGreaterThanOrEqual(res.deviations.length)
  })

  it('compares two pitches without disturbing the loaded one', async () => {
    const before = useAnalysis.getState().session?.sessionId
    const res = (await call('compare_pitches', { sessionIdB: 'skenes-delivery-01' })) as Result
    expect(useAnalysis.getState().session?.sessionId).toBe(before)
    expect(res.comparisonScope).toBe('descriptive_only')
    expect(res.comparisons.length).toBeGreaterThan(0)
    for (const c of res.comparisons) expect(typeof c.deltaDeg).toBe('number')
    expect(res.meta.caveats.join(' ')).toMatch(/camera/i)
    expect(res.meta.caveats.join(' ')).toMatch(/athlete identity/i)
  })
})

describe('viewer-control tools move the store the UI renders from', () => {
  it('propagates a human-reviewed event frame into analysis and agent reads', async () => {
    const st = useAnalysis.getState()
    const original = st.events.find((e) => e.name === 'max_external_rotation')!
    const changedFrame = original.frame - 1
    expect(st.setEventFrame('max_external_rotation', changedFrame)).toBe(true)

    const changed = useAnalysis.getState().events.find((e) => e.name === 'max_external_rotation')!
    expect(changed.frame).toBe(changedFrame)
    expect(changed.manualOverride).toBe(true)
    expect(changed.method).toMatch(/human-reviewed/)
    expect(useAnalysis.getState().analysis?.events.find((e) => e.name === changed.name)?.frame).toBe(changedFrame)

    const read = (await call('get_phase_events')) as Result
    expect(read.events.find((e: any) => e.name === 'max_external_rotation').manualOverride).toBe(true)
    expect(read.events.find((e: any) => e.name === 'max_external_rotation').frame).toBe(changedFrame)

    useAnalysis.getState().resetEventFrame('max_external_rotation')
    expect(useAnalysis.getState().events.find((e) => e.name === 'max_external_rotation')?.frame).toBe(original.frame)
  })

  it('seeks to an event and pauses playback', async () => {
    useAnalysis.getState().setPlaying(true)
    const res = (await call('seek_to_event', { event: 'mer' })) as Result
    const mer = useAnalysis.getState().events.find((e) => e.name === 'max_external_rotation')!
    expect(useAnalysis.getState().currentFrame).toBe(mer.frame)
    expect(useAnalysis.getState().playing).toBe(false)
    expect(res.movedTo.event).toBe('max_external_rotation')
  })

  it('seeks to an explicit frame', async () => {
    await call('seek_to_event', { frame: 120 })
    expect(useAnalysis.getState().currentFrame).toBe(120)
  })

  it('focuses a joint, resolving handedness, and picks the readable plane', async () => {
    const res = (await call('focus_joint', { joint: 'front knee' })) as Result
    // Right-handed pitcher strides onto the left leg.
    expect(res.joint).toBe('l_knee')
    expect(useAnalysis.getState().selectedJoint).toBe('l_knee')
    expect(useAnalysis.getState().cameraPlane).toBe('sagittal')
    expect(useAnalysis.getState().overlays.angle_readouts).toBe(true)
    expect(res.reason.length).toBeGreaterThan(20)

    const rot = (await call('focus_joint', { joint: 'pelvis' })) as Result
    expect(rot.cameraPlane).toBe('transverse')
  })

  it('toggles overlays', async () => {
    const res = (await call('set_overlay', { overlay: 'trails', enabled: false })) as Result
    expect(res.overlay).toBe('motion_trail')
    expect(useAnalysis.getState().overlays.motion_trail).toBe(false)
    expect(res.activeOverlays).not.toContain('motion_trail')
  })

  it('pins a note into the viewer and truncates an over-long label', async () => {
    const res = (await call('annotate_frame', {
      event: 'ball_release', joint: 'throwing elbow', severity: 'attention',
      label: 'x'.repeat(200),
    })) as Result
    const anns = useAnalysis.getState().annotations
    expect(anns).toHaveLength(1)
    expect(anns[0].joint).toBe('r_elbow')
    expect(anns[0].severity).toBe('attention')
    expect(res.truncated).toBe(true)
    expect(res.label.length).toBeLessThanOrEqual(80)
    expect(anns[0].frame).toBe(
      useAnalysis.getState().events.find((e) => e.name === 'ball_release')!.frame,
    )
  })

  it('defaults a pin to the frame the human is already looking at', async () => {
    useAnalysis.getState().setFrame(200)
    await call('annotate_frame', { label: 'here' })
    expect(useAnalysis.getState().annotations[0].frame).toBe(200)
  })
})

describe('errors are retryable, never stack traces', () => {
  const expectRetryable = (res: Result, mustList: string) => {
    expect(res.ok).toBe(false)
    expect(res.retryable).toBe(true)
    expect(res.error).not.toMatch(/at .*\.ts:\d+/)
    expect(JSON.stringify(res.validValues ?? {})).toMatch(mustList)
  }

  it('names the valid events', async () => {
    expectRetryable((await call('get_kinematics_at_event', { event: 'wind up' })) as Result, 'ball_release')
  })

  it('names the real overlays when asked for one that does not exist', async () => {
    // `reference_ghost` appears in the design doc but was never built — the tool says so
    // rather than silently succeeding.
    expectRetryable((await call('set_overlay', { overlay: 'reference_ghost', enabled: true })) as Result, 'motion_trail')
  })

  it('names the measurable metrics', async () => {
    expectRetryable((await call('get_joint_angle_series', { joint: 'spine curvature' })) as Result, 'elbow_flexion')
    expectRetryable((await call('get_metric_definition', { metric: 'grip strength' })) as Result, 'elbow_flexion')
  })

  it('rejects an ambiguous seek and an out-of-range frame', async () => {
    const both = (await call('seek_to_event', { event: 'ball_release', frame: 3 })) as Result
    expect(both.ok).toBe(false)
    const far = (await call('seek_to_event', { frame: 99999 })) as Result
    expect(far.ok).toBe(false)
    expect(far.error).toMatch(/valid frames are 0/)
  })

  it('explains itself when no pitch is loaded', async () => {
    useAnalysis.setState({ session: null, analysis: null })
    const res = (await call('get_session_overview')) as Result
    expect(res.ok).toBe(false)
    expect(res.error).toMatch(/list_pitch_sessions/)
  })
})
