/**
 * Category B — measurement & query. The instrument readings.
 *
 * Everything here is anchored to the three detected events, so the agent can reason about
 * *when* something happens and see how sure the detector was. Two hard rules from the
 * science constraints hold throughout: no absolute angular velocity while the slow-motion
 * factor is unknown, and no metric without its confidence grade.
 */

import { normalisedPct } from '../../../biomech/analyze'
import { metricsFor, poseAt } from '../../../biomech/angles'
import { rateUnavailableReason, worst } from '../../../biomech/confidence'
import { referenceFor } from '../../../biomech/reference'
import type { Confidence, EventName } from '../../../types'
import { metaFor, ToolInputError, type PitchTool } from '../../registry'
import {
  EVENT_LABEL, EVENT_NAMES, METRIC_LABEL, METRIC_NAMES, METRIC_PLANE,
  resolveEvent, resolveMetric, SEGMENT_LABEL,
} from '../../vocab'
import { pct, resolveSession, r1, r3 } from '../shared'

const EVENT_ENUM = EVENT_NAMES.join(' | ')

function requireEvent(input: unknown): EventName {
  const ev = resolveEvent(input)
  if (!ev) {
    throw new ToolInputError(
      `"${String(input)}" is not a pitching event this analysis knows. Use one of the three detected events.`,
      { event: EVENT_NAMES },
    )
  }
  return ev
}

export const getPhaseEvents: PitchTool = {
  name: 'get_phase_events',
  title: 'Get phase events',
  description:
    'Returns the three detected pitching events — lead foot contact, maximum external rotation, and ball release — with frame number, video timestamp, the signal each was detected from, its confidence, and whether a human corrected it. Every other measurement is anchored to these frames, so read them before interpreting any angle.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Defaults to the pitch currently on screen.' },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
  async execute(input) {
    const { session, analysis } = await resolveSession(input.sessionId)
    const fc = analysis.events.find((e) => e.name === 'foot_contact')
    const br = analysis.events.find((e) => e.name === 'ball_release')
    const confidences = analysis.events.map((e) => e.confidence)

    return {
      events: analysis.events.map((e) => ({
        name: e.name,
        label: EVENT_LABEL[e.name],
        frame: e.frame,
        tVideoSeconds: r3(e.t),
        pctOfContactToRelease: pct(normalisedPct(e.frame, analysis.events)),
        method: e.method,
        confidence: e.confidence,
        manualOverride: e.manualOverride,
      })),
      deliveryWindow:
        fc && br ? { fromFrame: fc.frame, toFrame: br.frame, frames: br.frame - fc.frame } : null,
      meta: metaFor(session, confidences.length ? worst(...confidences) : 'unavailable', [], [
        'Timestamps are video seconds. Event detection from monocular video is fallible; a low confidence grade means the underlying signal was not sharply peaked.',
      ]),
    }
  },
}

export const getKinematicsAtEvent: PitchTool = {
  name: 'get_kinematics_at_event',
  title: 'Get kinematics at an event',
  description:
    `Returns the joint angles measured at one pitching event (${EVENT_ENUM}), each with its value in degrees, the published reference range where one exists, whether it sits inside that range, and its measurement confidence. One call gives a complete reference-anchored snapshot of that instant.`,
  inputSchema: {
    type: 'object',
    properties: {
      event: {
        type: 'string',
        enum: EVENT_NAMES,
        description: 'Which pitching event to measure at.',
      },
      sessionId: { type: 'string', description: 'Defaults to the pitch currently on screen.' },
    },
    required: ['event'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
  async execute(input) {
    const { session, analysis } = await resolveSession(input.sessionId)
    const event = requireEvent(input.event)
    const detected = analysis.events.find((e) => e.name === event)
    if (!detected) {
      throw new ToolInputError(
        `${EVENT_LABEL[event]} was not detected in this pitch.`,
        { event: analysis.events.map((e) => e.name) },
      )
    }

    const readings = analysis.readings.filter((r) => r.event === event)
    const referenced = new Set(readings.map((r) => r.metric))
    const all = metricsFor(poseAt(session, detected.frame))

    // Metrics with no published range at this event still get reported — as a plain
    // value, never dressed up with a comparison nobody has published.
    const otherMetrics: Record<string, number | null> = {}
    for (const m of METRIC_NAMES) if (!referenced.has(m)) otherMetrics[m] = all[m]

    const citations = new Set<string>()
    for (const r of readings) for (const c of r.citations) citations.add(c)

    return {
      event,
      label: EVENT_LABEL[event],
      frame: detected.frame,
      tVideoSeconds: r3(detected.t),
      eventConfidence: detected.confidence,
      metrics: readings.map((r) => ({
        name: r.metric,
        value: r.value,
        unit: r.unit,
        reference: r.reference ? { range: r.reference.range, typical: r.reference.typical } : null,
        status: r.status,
        deviationDeg: r.magnitude,
        confidence: r.confidence,
      })),
      otherMetrics,
      meta: metaFor(
        session,
        readings.length ? worst(...readings.map((r) => r.confidence)) : 'low',
        [...citations],
        [
          'Reference ranges describe pitching populations; they are not targets and not diagnostic thresholds.',
          'Only construct-compatible direct two-segment flexion angles are compared. Signed or frame-dependent measurements are reported separately without a range.',
        ],
      ),
    }
  },
}

export const getJointAngleSeries: PitchTool = {
  name: 'get_joint_angle_series',
  title: 'Get joint angle series',
  description:
    'Returns one joint angle sampled across the pitch, so you can reason about the shape of the movement rather than a single instant — when the peak happens and how sharp it is. Optionally restrict the window to between two events. Downsampled to maxPoints (default 40); the reported peak still comes from the full-resolution series.',
  inputSchema: {
    type: 'object',
    properties: {
      joint: {
        type: 'string',
        enum: METRIC_NAMES,
        description: 'Which angle to trace, e.g. shoulder_external_rotation or lead_knee_flexion.',
      },
      fromEvent: { type: 'string', enum: EVENT_NAMES, description: 'Window start. Default: clip start.' },
      toEvent: { type: 'string', enum: EVENT_NAMES, description: 'Window end. Default: clip end.' },
      maxPoints: { type: 'integer', description: 'Samples to return, 5–120. Default 40, which keeps the response inside the output budget.' },
      sessionId: { type: 'string', description: 'Defaults to the pitch currently on screen.' },
    },
    required: ['joint'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
  async execute(input) {
    const { session, analysis } = await resolveSession(input.sessionId)
    const metric = resolveMetric(input.joint ?? input.metric)
    if (!metric) {
      throw new ToolInputError(
        `"${String(input.joint ?? input.metric)}" is not a measured angle. Call get_metric_definition for what any of these mean.`,
        { joint: METRIC_NAMES },
      )
    }

    const series = analysis.series[metric] ?? []
    const n = series.length
    const frameOf = (spec: unknown, fallback: number) => {
      if (spec === undefined || spec === null || spec === '') return fallback
      const ev = requireEvent(spec)
      return analysis.events.find((e) => e.name === ev)?.frame ?? fallback
    }
    let lo = frameOf(input.fromEvent, 0)
    let hi = frameOf(input.toEvent, n - 1)
    if (hi < lo) [lo, hi] = [hi, lo]

    // 40 keeps a full-window trace near the ~1.5 K output guidance; 120 is the ceiling a
    // caller can ask for when it really needs the shape of a short window.
    const maxPoints = Math.max(5, Math.min(120, Number(input.maxPoints) || 40))
    const span = hi - lo + 1
    const stride = Math.max(1, Math.ceil(span / maxPoints))

    const samples: { frame: number; t: number; value: number | null }[] = []
    for (let i = lo; i <= hi; i += stride) {
      samples.push({ frame: i, t: r3(session.frames[i]?.t ?? 0), value: series[i] })
    }
    if (samples[samples.length - 1]?.frame !== hi) {
      samples.push({ frame: hi, t: r3(session.frames[hi]?.t ?? 0), value: series[hi] })
    }

    // Peak = largest magnitude in the window, reported at full resolution rather than at
    // the downsampled points, so the timing stays exact.
    let peakFrame = lo
    let peakValue: number | null = null
    for (let i = lo; i <= hi; i++) {
      const v = series[i]
      if (v === null || !Number.isFinite(v)) continue
      if (peakValue === null || Math.abs(v) > Math.abs(peakValue)) {
        peakValue = v
        peakFrame = i
      }
    }

    const ref = referenceFor(metric, 'ball_release') ?? referenceFor(metric, 'foot_contact')
    return {
      joint: metric,
      label: METRIC_LABEL[metric],
      unit: 'deg',
      measurementPlane: METRIC_PLANE[metric],
      window: {
        fromFrame: lo,
        toFrame: hi,
        fromEvent: input.fromEvent ? requireEvent(input.fromEvent) : null,
        toEvent: input.toEvent ? requireEvent(input.toEvent) : null,
      },
      sampledEveryNFrames: stride,
      samples,
      peak: peakValue === null ? null : {
        frame: peakFrame,
        t: r3(session.frames[peakFrame]?.t ?? 0),
        value: peakValue,
        pctOfContactToRelease: pct(normalisedPct(peakFrame, analysis.events)),
      },
      coveragePct: Math.round((analysis.coverage[metric] ?? 0) * 1000) / 10,
      meta: metaFor(session, (ref?.confidence ?? 'medium') as Confidence, ref?.citations ?? [], [
        'Samples are every Nth frame; the peak is taken from the full-resolution series.',
      ]),
    }
  },
}

export const getKinematicSequence: PitchTool = {
  name: 'get_kinematic_sequence',
  title: 'Get kinematic sequence',
  description:
    'Returns a partial four-segment order: pelvis, trunk, upper arm and forearm peak angular speed. It is not a published full five-segment kinematic sequence or a quality score. Read literatureNote before judging the order: a different order is common and is not by itself a fault.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Defaults to the pitch currently on screen.' },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
  async execute(input) {
    const { session, analysis } = await resolveSession(input.sessionId)
    const seq = analysis.sequence
    const rateReason = rateUnavailableReason(session)

    return {
      observedOrder: seq.observedOrder.map((s) => SEGMENT_LABEL[s] ?? s),
      peaks: seq.peaks.map((p) => ({
        segment: SEGMENT_LABEL[p.segment] ?? p.segment,
        frame: p.frame,
        tVideoSeconds: r3(p.tVideo),
        pctOfContactToRelease: p.tNormPct === null ? null : r1(p.tNormPct),
        peakAngularVelocityDegPerSec: p.peakAngularVelocity,
      })),
      // Stated once rather than repeated on every peak: it is the same reason each time,
      // and four copies of it would crowd out the measurements.
      ...(rateReason ? { peakAngularVelocityUnavailable: rateReason } : {}),
      isProximalToDistal: seq.isProximalToDistal,
      pelvisToTrunkSeparationPct: seq.pelvisToTrunkSeparationPct,
      separationUnits:
        'percent of the foot-contact to ball-release window, not seconds — the slow-motion factor of the source is unknown.',
      rateUnitsAvailable: seq.rateUnitsAvailable,
      literatureNote: seq.literatureNote,
      meta: metaFor(session, analysis.rateConfidence === 'unavailable' ? 'medium' : 'high',
        ['kinematicSeq2020'],
        ['Peak ORDER and normalised timing survive an unknown time warp; absolute angular velocity does not.'],
      ),
    }
  },
}

export const measurementTools: PitchTool[] = [
  getPhaseEvents, getKinematicsAtEvent, getJointAngleSeries, getKinematicSequence,
]
