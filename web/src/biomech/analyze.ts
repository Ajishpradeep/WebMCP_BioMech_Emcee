/**
 * Orchestrator: session.json -> AnalysisResult.
 *
 * Runs entirely IN THE BROWSER. That is deliberate and architectural: the derived
 * analysis has no server representation, which is what makes WebMCP the right choice
 * over a backend MCP server (SPEC §3). The WebMCP tools read this object.
 */

import type { Confidence, EventName, PhaseEvent, Session } from '../types'
import { metricSeries, type MetricName } from './angles'
import { gradeMetric, gradeRate, worst } from './confidence'
import { detectEvents, normalisedPct } from './events'
import { kinematicSequence, type KinematicSequence } from './sequence'
import { referenceFor, type ReferenceRange } from './reference'

export type DeviationDirection = 'above' | 'below' | 'within'

export interface MetricReading {
  metric: MetricName
  event: EventName
  value: number | null
  unit: 'deg'
  reference?: { range: [number, number]; typical?: number; sd?: number }
  status: DeviationDirection | 'no_reference' | 'unavailable'
  /** How far outside the range, in degrees. 0 when within. */
  magnitude: number | null
  confidence: Confidence
  eventConfidence: Confidence
  citations: string[]
}

export interface AnalysisResult {
  sessionId: string
  events: PhaseEvent[]
  /** Readings for every metric that has a published reference at that event. */
  readings: MetricReading[]
  /** Full per-frame series, for charts and the agent's series tool. */
  series: Record<MetricName, (number | null)[]>
  sequence: KinematicSequence
  rateConfidence: Confidence
  /** Fraction of frames where each metric resolved — a reconstruction-quality signal. */
  coverage: Record<string, number>
}

function readingFor(
  metric: MetricName,
  event: EventName,
  value: number | null,
  eventConfidence: Confidence,
): MetricReading {
  const ref: ReferenceRange | undefined = referenceFor(metric, event)
  const confidence = worst(ref ? ref.confidence : gradeMetric(metric), eventConfidence)

  if (value === null) {
    return {
      metric, event, value: null, unit: 'deg',
      reference: ref ? { range: ref.range, typical: ref.typical, sd: ref.sd } : undefined,
      status: 'unavailable', magnitude: null, confidence, eventConfidence,
      citations: ref?.citations ?? [],
    }
  }
  // Preserve the measured value for human inspection, but do not turn an uncertain
  // event anchor into a confident-looking population comparison. A reviewer can move
  // the event marker; analysis then recomputes and the comparison becomes available.
  if (eventConfidence === 'low' || eventConfidence === 'unavailable') {
    return {
      metric, event, value, unit: 'deg',
      reference: ref ? { range: ref.range, typical: ref.typical, sd: ref.sd } : undefined,
      status: 'unavailable', magnitude: null, confidence, eventConfidence,
      citations: ref?.citations ?? [],
    }
  }
  if (!ref) {
    return {
      metric, event, value, unit: 'deg', status: 'no_reference',
      magnitude: null, confidence, eventConfidence, citations: [],
    }
  }

  // References are admitted only when their signed construct is compatible with this
  // implementation. Never erase a sign with `Math.abs()` just to make a range fit.
  const v = value
  const [lo, hi] = ref.range
  const status: DeviationDirection = v < lo ? 'below' : v > hi ? 'above' : 'within'
  const magnitude = status === 'below' ? lo - v : status === 'above' ? v - hi : 0

  return {
    metric, event, value, unit: 'deg',
    reference: { range: ref.range, typical: ref.typical, sd: ref.sd },
    status, magnitude: Math.round(magnitude * 10) / 10,
    confidence, eventConfidence, citations: ref.citations,
  }
}

export function analyze(session: Session, reviewedEvents?: PhaseEvent[]): AnalysisResult {
  const events = reviewedEvents ?? detectEvents(session)
  const series = metricSeries(session)
  const sequence = kinematicSequence(session, events)

  // Only metrics with a published reference at that event become readings — we do not
  // invent comparisons for numbers nobody has published a range for.
  const readings: MetricReading[] = []
  for (const ev of events) {
    for (const metric of Object.keys(series) as MetricName[]) {
      if (!referenceFor(metric, ev.name)) continue
      readings.push(readingFor(metric, ev.name, series[metric][ev.frame] ?? null, ev.confidence))
    }
  }

  const coverage: Record<string, number> = {}
  for (const k of Object.keys(series) as MetricName[]) {
    const xs = series[k]
    coverage[k] = xs.length ? xs.filter((v) => v !== null).length / xs.length : 0
  }

  return {
    sessionId: session.sessionId,
    events,
    readings,
    series,
    sequence,
    rateConfidence: gradeRate(session),
    coverage,
  }
}

export { normalisedPct }
export type { MetricName, KinematicSequence }
