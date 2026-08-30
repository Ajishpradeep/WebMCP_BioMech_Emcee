/**
 * Orchestrator: session.json -> AnalysisResult.
 *
 * Runs entirely IN THE BROWSER. That is deliberate and architectural: the derived
 * analysis has no server representation, which is what makes WebMCP the right choice
 * over a backend MCP server (SPEC §3). The WebMCP tools read this object.
 */

import type { Confidence, EventName, PhaseEvent, Session } from '../types'
import { metricSeries, metricsFor, poseAt, type MetricName } from './angles'
import { gradeMetric, gradeRate } from './confidence'
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
): MetricReading {
  const ref: ReferenceRange | undefined = referenceFor(metric, event)
  const confidence = ref ? ref.confidence : gradeMetric(metric)

  if (value === null) {
    return {
      metric, event, value: null, unit: 'deg',
      reference: ref ? { range: ref.range, typical: ref.typical, sd: ref.sd } : undefined,
      status: 'unavailable', magnitude: null, confidence,
      citations: ref?.citations ?? [],
    }
  }
  if (!ref) {
    return {
      metric, event, value, unit: 'deg', status: 'no_reference',
      magnitude: null, confidence, citations: [],
    }
  }

  // Compare on magnitude: several of these are signed, and the published ranges are not.
  const v = Math.abs(value)
  const [lo, hi] = ref.range
  const status: DeviationDirection = v < lo ? 'below' : v > hi ? 'above' : 'within'
  const magnitude = status === 'below' ? lo - v : status === 'above' ? v - hi : 0

  return {
    metric, event, value, unit: 'deg',
    reference: { range: ref.range, typical: ref.typical, sd: ref.sd },
    status, magnitude: Math.round(magnitude * 10) / 10,
    confidence, citations: ref.citations,
  }
}

export function analyze(session: Session): AnalysisResult {
  const events = detectEvents(session)
  const series = metricSeries(session)
  const sequence = kinematicSequence(session, events)

  // Only metrics with a published reference at that event become readings — we do not
  // invent comparisons for numbers nobody has published a range for.
  const readings: MetricReading[] = []
  for (const ev of events) {
    const m = metricsFor(poseAt(session, ev.frame))
    for (const metric of Object.keys(m) as MetricName[]) {
      if (!referenceFor(metric, ev.name)) continue
      readings.push(readingFor(metric, ev.name, m[metric]))
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
