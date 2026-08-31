/**
 * Category C — evidence & comparison. These tools exist to keep the agent honest.
 *
 * `get_metric_definition` is the anti-hallucination tool: without it, an agent asked
 * "is 42° of hip–shoulder separation good?" invents a range. It also serves the
 * structured refusals — asked for elbow valgus torque, we return the reason no number is
 * derivable from monocular video rather than a fabricated one.
 */

import { worst } from '../../../biomech/confidence'
import { METRIC_INFO, REFERENCES, REFUSALS } from '../../../biomech/reference'
import type { MetricName } from '../../../biomech/angles'
import type { Confidence, EventName } from '../../../types'
import { useAnalysis } from '../../../store'
import { metaFor, ToolInputError, type PitchTool } from '../../registry'
import {
  EVENT_LABEL, EVENT_NAMES, METRIC_LABEL, METRIC_NAMES, METRIC_PLANE,
  normalise, resolveEvent, resolveMetric,
} from '../../vocab'
import { resolveSession, r1 } from '../shared'

/** Quantities we refuse to estimate, and the words a model is likely to ask them by. */
const REFUSAL_ALIASES: Record<string, keyof typeof REFUSALS> = {
  elbow_valgus_torque: 'elbow_valgus_torque', valgus_torque: 'elbow_valgus_torque',
  elbow_torque: 'elbow_valgus_torque', elbow_stress: 'elbow_valgus_torque',
  ucl_stress: 'elbow_valgus_torque', ucl_load: 'elbow_valgus_torque',
  medial_elbow_torque: 'elbow_valgus_torque', torque: 'elbow_valgus_torque',
  shoulder_distraction_force: 'shoulder_distraction_force',
  distraction_force: 'shoulder_distraction_force', shoulder_force: 'shoulder_distraction_force',
  ground_reaction_force: 'ground_reaction_force', grf: 'ground_reaction_force',
  ground_force: 'ground_reaction_force', force_plate: 'ground_reaction_force',
  injury_risk: 'injury_risk', injury: 'injury_risk', risk: 'injury_risk',
  injury_probability: 'injury_risk', risk_score: 'injury_risk', arm_health: 'injury_risk',
  pitch_velocity: 'pitch_velocity', velocity: 'pitch_velocity', velo: 'pitch_velocity',
  ball_speed: 'pitch_velocity', pitch_speed: 'pitch_velocity', mph: 'pitch_velocity',
}

export const getMetricDefinition: PitchTool = {
  name: 'get_metric_definition',
  title: 'Get metric definition',
  description:
    'Explains one biomechanical metric: what it measures in plain language, exactly how this app computes it, its published reference ranges with citations, and the limits of measuring it from single-camera video. Use it before quoting any range — it is the only source of reference numbers here, and it also explains which quantities this reconstruction cannot produce at all.',
  inputSchema: {
    type: 'object',
    properties: {
      metric: {
        type: 'string',
        description: 'A metric name, e.g. hip_shoulder_separation, or a quantity you want to check is measurable.',
      },
    },
    required: ['metric'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
  execute(input) {
    const session = useAnalysis.getState().session
    const raw = String(input.metric ?? '')
    const key = normalise(raw)

    // ── structured refusal: measurable-sounding, not derivable ──
    const refusalKey = REFUSAL_ALIASES[key]
    if (refusalKey) {
      const refusal = REFUSALS[refusalKey]
      return {
        metric: refusalKey,
        available: false,
        refusal: {
          reason: refusal.reason,
          insteadUse: refusal.insteadUse,
        },
        meta: metaFor(session, 'unavailable', ['markerless'], [
          'This is a deliberate refusal, not a gap in the data. Reporting a number here would be fabrication.',
        ]),
      }
    }

    const metric = resolveMetric(raw)
    if (!metric) {
      throw new ToolInputError(
        `"${raw}" is not a metric this app measures. The measured angles are listed below; kinetic quantities (torques, forces) and injury risk are not derivable from monocular video and are refused by name.`,
        { metric: METRIC_NAMES, refusable: Object.keys(REFUSALS) },
      )
    }

    const refs = REFERENCES.filter((r) => r.metric === metric)
    const info = refs[0] ?? METRIC_INFO[metric]
    const citations = new Set<string>()
    for (const r of refs) for (const c of r.citations) citations.add(c)

    return {
      metric,
      label: METRIC_LABEL[metric],
      available: true,
      plainLanguage: info?.plainLanguage ?? 'No plain-language description recorded for this metric.',
      computation: info?.computation ?? 'Derived from ISB segment coordinate systems built from landmarks.',
      measurementPlane: METRIC_PLANE[metric],
      referenceRanges: refs.map((r) => ({
        event: r.event,
        eventLabel: EVENT_LABEL[r.event],
        range: r.range,
        typical: r.typical ?? null,
        sd: r.sd ?? null,
        unit: r.unit,
        confidence: r.confidence,
        citations: r.citations,
      })),
      limitations: info?.limitations ?? '',
      ...(refs.length === 0
        ? { note: 'This app measures this angle but our cited sources publish no reference range for it, so no comparison is offered.' }
        : {}),
      meta: metaFor(session, refs.length ? worst(...refs.map((r) => r.confidence)) : 'medium',
        [...citations],
        ['A reference range describes what pitching populations do, not what any individual should do.'],
      ),
    }
  },
}

export const compareToReference: PitchTool = {
  name: 'compare_to_reference',
  title: 'Compare to reference ranges',
  description:
    'Compares every measured angle in this pitch against its published reference range and returns the ones that fall outside, with the direction and size of the deviation and the citation behind the range. Answers "what stands out?" in a single call. Deviations are observations about this delivery, not faults and not a diagnosis.',
  inputSchema: {
    type: 'object',
    properties: {
      event: { type: 'string', enum: EVENT_NAMES, description: 'Restrict to one event. Default: all three.' },
      includeWithinRange: { type: 'boolean', description: 'Also return metrics that sit inside their range. Default false.' },
      sessionId: { type: 'string', description: 'Defaults to the pitch currently on screen.' },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
  async execute(input) {
    const { session, analysis } = await resolveSession(input.sessionId)
    let event: EventName | null = null
    if (input.event !== undefined && input.event !== null && input.event !== '') {
      event = resolveEvent(input.event)
      if (!event) throw new ToolInputError(`"${String(input.event)}" is not a pitching event.`, { event: EVENT_NAMES })
    }

    const includeWithin = input.includeWithinRange === true
    const considered = analysis.readings.filter((r) => (event ? r.event === event : true))
    const ranked = considered
      .filter((r) => includeWithin || (r.status === 'above' || r.status === 'below'))
      .sort((a, b) => (b.magnitude ?? 0) - (a.magnitude ?? 0))
    // Largest deviations first, capped: the tail of a long list is what an agent ignores
    // anyway, and the whole point of this tool is fitting "what stands out" in one call.
    const LIMIT = 10
    const rows = ranked.slice(0, LIMIT)

    const citations = new Set<string>()
    for (const r of rows) for (const c of r.citations) citations.add(c)

    const outside = considered.filter((r) => r.status === 'above' || r.status === 'below')
    const biggest = outside[0]
      ? [...outside].sort((a, b) => (b.magnitude ?? 0) - (a.magnitude ?? 0))[0]
      : null

    return {
      unit: 'deg',
      deviations: rows.map((r) => ({
        metric: r.metric,
        event: r.event,
        value: r.value,
        reference: r.reference?.range ?? null,
        direction: r.status,
        magnitudeDeg: r.magnitude,
        confidence: r.confidence,
      })),
      omitted: ranked.length - rows.length,
      summary:
        `${outside.length} of ${considered.length} referenced measurements fall outside their published range` +
        (biggest
          ? `; the largest is ${METRIC_LABEL[biggest.metric]} at ${EVENT_LABEL[biggest.event]}, ${r1(biggest.magnitude ?? 0)}° ${biggest.status} the range (confidence: ${biggest.confidence}).`
          : '.'),
      meta: metaFor(session, rows.length ? worst(...rows.map((r) => r.confidence)) : 'high',
        [...citations],
        ['Outside a reference range is an observation, not a fault or a diagnosis.'],
      ),
    }
  },
}

export const comparePitches: PitchTool = {
  name: 'compare_pitches',
  title: 'Compare two pitches',
  description:
    'Compares two analysed pitches metric by metric at the same events and returns the differences, so you can reason about what changed between attempts. The second pitch is analysed in the background without changing what the human is looking at. Cross-session comparison is only meaningful when the camera setup is similar — check meta.caveats.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionIdA: { type: 'string', description: 'Baseline pitch. Defaults to the pitch on screen.' },
      sessionIdB: { type: 'string', description: 'Pitch to compare against the baseline.' },
      event: { type: 'string', enum: EVENT_NAMES, description: 'Restrict to one event. Default: all three.' },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
  async execute(input) {
    const st = useAnalysis.getState()
    const A = await resolveSession(input.sessionIdA)

    let idB = typeof input.sessionIdB === 'string' ? input.sessionIdB.trim() : ''
    if (!idB) {
      const others = st.index.map((s) => s.sessionId).filter((id) => id !== A.session.sessionId)
      if (others.length !== 1) {
        throw new ToolInputError(
          'sessionIdB is required when more than one other pitch is available. Call list_pitch_sessions for the ids.',
          { sessionIdB: others },
        )
      }
      idB = others[0]
    }
    if (idB === A.session.sessionId) {
      throw new ToolInputError('sessionIdA and sessionIdB are the same pitch; choose two different sessions.', {
        sessionId: st.index.map((s) => s.sessionId),
      })
    }
    const B = await resolveSession(idB)

    let event: EventName | null = null
    if (input.event !== undefined && input.event !== null && input.event !== '') {
      event = resolveEvent(input.event)
      if (!event) throw new ToolInputError(`"${String(input.event)}" is not a pitching event.`, { event: EVENT_NAMES })
    }

    const keyOf = (m: MetricName, e: EventName) => `${m}@${e}`
    const bByKey = new Map(B.analysis.readings.map((r) => [keyOf(r.metric, r.event), r]))

    const comparisons = A.analysis.readings
      .filter((r) => (event ? r.event === event : true))
      .flatMap((a) => {
        const b = bByKey.get(keyOf(a.metric, a.event))
        if (!b || a.value === null || b.value === null) return []
        return [{
          metric: a.metric,
          event: a.event,
          valueA: a.value,
          valueB: b.value,
          deltaDeg: r1(b.value - a.value),
          statusB: b.status,
          confidence: worst(a.confidence, b.confidence) as Confidence,
        }]
      })
      .sort((x, y) => Math.abs(y.deltaDeg) - Math.abs(x.deltaDeg))
    const LIMIT = 10
    const shown = comparisons.slice(0, LIMIT)

    const caveats = [
      'Cross-session comparison assumes a comparable camera setup: the reconstruction is camera-frame, so a changed viewpoint moves rotation angles more than sagittal ones.',
    ]
    if (A.session.source.view !== B.session.source.view) {
      caveats.unshift(
        `These pitches were shot from DIFFERENT views ("${A.session.source.view}" vs "${B.session.source.view}"). Treat differences in rotation and separation metrics as unreliable.`,
      )
    }

    const largest = comparisons[0]
    return {
      sessionA: { sessionId: A.session.sessionId, label: A.session.source.label },
      sessionB: { sessionId: B.session.sessionId, label: B.session.source.label },
      unit: 'deg',
      comparisons: shown,
      omitted: comparisons.length - shown.length,
      summary: largest
        ? `${comparisons.length} metrics compared at shared events; the largest change is ${METRIC_LABEL[largest.metric]} at ${EVENT_LABEL[largest.event]} (${largest.valueA}° → ${largest.valueB}°, ${largest.deltaDeg > 0 ? '+' : ''}${largest.deltaDeg}°).`
        : 'No metrics were measurable at shared events in both pitches.',
      meta: metaFor(A.session, shown.length ? worst(...shown.map((c) => c.confidence)) : 'low',
        [...new Set(A.analysis.readings.flatMap((r) => r.citations))], caveats),
    }
  },
}

export const evidenceTools: PitchTool[] = [getMetricDefinition, compareToReference, comparePitches]
