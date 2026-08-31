/**
 * Compact, evidence-first measurement inspector.
 *
 * Event values and their observed ranges come from the same reference definitions the
 * WebMCP tools use. Live values deliberately omit range styling: they are exploratory
 * traces at the current frame, not event-anchored comparisons.
 */

import { useEffect, useMemo, useState } from 'react'
import type { AnalysisResult, MetricReading } from '../biomech/analyze'
import type { MetricName } from '../biomech/angles'
import { CITATIONS, METRIC_INFO, REFERENCES, referenceFor } from '../biomech/reference'
import { useAnalysis } from '../store'
import type { Confidence, EventName, Session } from '../types'

const EVENT_LABEL: Record<EventName, string> = {
  foot_contact: 'Lead foot contact',
  max_external_rotation: 'MER candidate',
  ball_release: 'Ball release',
}

const EVENT_SHORT: Record<EventName, string> = {
  foot_contact: 'FC',
  max_external_rotation: 'MER',
  ball_release: 'BR',
}

const PRETTY: Partial<Record<MetricName, string>> = {
  lead_knee_flexion: 'Lead knee flexion',
  trail_knee_flexion: 'Trail knee flexion',
  lead_hip_flexion: 'Lead hip flexion',
  elbow_flexion: 'Elbow flexion',
  shoulder_abduction: 'Shoulder abduction',
  shoulder_external_rotation: 'Shoulder axial-rotation proxy',
  shoulder_horizontal_abduction: 'Shoulder horizontal abduction',
  trunk_forward_tilt: 'Camera-frame forward trunk-tilt proxy',
  trunk_lateral_tilt: 'Camera-frame lateral trunk-tilt proxy',
  hip_shoulder_separation: 'Pelvis-to-trunk rotation proxy',
  lead_foot_angle: 'Foot-to-pelvis angle proxy',
}

export function ConfidenceBadge({ c }: { c: Confidence }) {
  return <span className={`conf ${c}`} title={`Measurement confidence: ${c}`}>{c}</span>
}

function statusText(reading: MetricReading) {
  if (reading.status === 'unavailable') return 'Comparison held until this event is reviewed'
  if (!reading.reference) return 'No published range'
  if (reading.status === 'within') return 'Inside observed range'
  return `${reading.status === 'above' ? 'Above' : 'Below'} observed range by ${reading.magnitude}°`
}

function MetricInfo({ metric, event }: { metric: MetricName; event?: EventName }) {
  const exact = event ? referenceFor(metric, event) : undefined
  const fallback = METRIC_INFO[metric] ?? REFERENCES.find((candidate) => candidate.metric === metric)
  const info = exact ?? fallback
  if (!info) return null

  return (
    <div className="metric-info" role="region" aria-label={`${PRETTY[metric] ?? metric} definition`}>
      <p>{info.plainLanguage}</p>
      <dl>
        <div><dt>Computed as</dt><dd>{info.computation}</dd></div>
        <div><dt>Use with care</dt><dd>{info.limitations}</dd></div>
        <div>
          <dt>Reference</dt>
          <dd>
            {exact
              ? <>{exact.range[0]}–{exact.range[1]}° observed range—not a target.</>
              : 'No reference comparison is applied in live mode.'}
          </dd>
        </div>
      </dl>
      {exact && exact.citations.length > 0 && (
        <ul className="cites">
          {exact.citations.map((citation) => (
            <li key={citation}>
              {CITATIONS[citation]?.text ?? citation}
              {CITATIONS[citation]?.doi && (
                <>{' '}<a href={`https://doi.org/${CITATIONS[citation].doi}`} target="_blank" rel="noreferrer">source</a></>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EventMetricTile({
  reading,
  expanded,
  onToggle,
}: {
  reading: MetricReading
  expanded: boolean
  onToggle: () => void
}) {
  const ref = reading.reference
  // Give the observed band breathing room so values outside it visibly sit outside,
  // rather than being clamped onto an apparently full-width reference bar.
  const marker = ref && reading.value !== null
    ? Math.max(0, Math.min(100, 25 + ((reading.value - ref.range[0]) / (ref.range[1] - ref.range[0])) * 50))
    : null

  return (
    <article className={`metric-tile ${reading.status} ${expanded ? 'expanded' : ''}`}>
      <div className="metric-tile-head">
        <div>
          <span className="metric-name">{PRETTY[reading.metric] ?? reading.metric}</span>
          <ConfidenceBadge c={reading.confidence} />
        </div>
        <div className="metric-value-wrap">
          <strong className="metric-value mono">{reading.value === null ? '—' : `${reading.value}°`}</strong>
          <button
            className="info-button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={`Explain ${PRETTY[reading.metric] ?? reading.metric}`}
            title="Definition, method, limits and source"
          >i</button>
        </div>
      </div>

      {ref && (
        <div className="range-wrap">
          <div className="range-bar" aria-label={`Observed reference range ${ref.range[0]} to ${ref.range[1]} degrees`}>
            <div className="range-band" />
            {marker !== null && <div className={`range-marker ${reading.status}`} style={{ left: `${marker}%` }} />}
          </div>
          <div className="range-labels">
            <span>{statusText(reading)}</span>
            <span className="mono">ref {ref.range[0]}–{ref.range[1]}°</span>
          </div>
        </div>
      )}

      {expanded && <MetricInfo metric={reading.metric} event={reading.event} />}
    </article>
  )
}

function LiveMetricTile({
  metric,
  value,
  expanded,
  onToggle,
}: {
  metric: MetricName
  value: number | null
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <article className={`metric-tile live-tile ${expanded ? 'expanded' : ''}`}>
      <div className="metric-tile-head">
        <span className="metric-name">{PRETTY[metric] ?? metric}</span>
        <div className="metric-value-wrap">
          <strong className="metric-value mono">{value === null ? '—' : `${value}°`}</strong>
          <button
            className="info-button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={`Explain ${PRETTY[metric] ?? metric}`}
            title="Definition, method and limits"
          >i</button>
        </div>
      </div>
      {expanded && <MetricInfo metric={metric} />}
    </article>
  )
}

export function MetricsPanel({ session, analysis }: { session: Session; analysis: AnalysisResult }) {
  const currentFrame = useAnalysis((state) => state.currentFrame)
  const setFrame = useAnalysis((state) => state.setFrame)
  const [mode, setMode] = useState<'events' | 'live'>('events')
  const [selectedEvent, setSelectedEvent] = useState<EventName>(
    analysis.events[0]?.name ?? 'foot_contact',
  )
  const [expanded, setExpanded] = useState<string | null>(null)

  const live = useMemo(
    () => Object.fromEntries(
      (Object.keys(analysis.series) as MetricName[]).map((metric) => [
        metric,
        analysis.series[metric][currentFrame] ?? null,
      ]),
    ) as Record<MetricName, number | null>,
    [analysis, currentFrame],
  )

  const byEvent = useMemo(() => {
    const grouped = new Map<EventName, MetricReading[]>()
    for (const reading of analysis.readings) {
      const rows = grouped.get(reading.event) ?? []
      rows.push(reading)
      grouped.set(reading.event, rows)
    }
    return grouped
  }, [analysis])

  // Agent and timeline navigation remain legible in the inspector: seeking to an exact
  // event selects the same event here without introducing a second state path.
  useEffect(() => {
    const event = analysis.events.find((candidate) => candidate.frame === currentFrame)
    if (event) setSelectedEvent(event.name)
  }, [analysis.events, currentFrame])

  useEffect(() => setExpanded(null), [mode, selectedEvent])

  const activeEvent = analysis.events.find((event) => event.name === selectedEvent)
  const eventRows = byEvent.get(selectedEvent) ?? []

  const chooseEvent = (event: EventName, frame: number) => {
    setSelectedEvent(event)
    setFrame(frame)
  }

  const toggleInfo = (key: string) => setExpanded((current) => current === key ? null : key)

  return (
    <section className="metrics">
      <h2>
        <span className="workflow-step">2</span> Inspect measurements
        <span className="seg-toggle" aria-label="Measurement mode">
          <button className={mode === 'events' ? 'on' : ''} onClick={() => setMode('events')}>At events</button>
          <button className={mode === 'live' ? 'on' : ''} onClick={() => setMode('live')}>Live</button>
        </span>
      </h2>

      {mode === 'events' ? (
        <>
          <div className="event-tabs" role="tablist" aria-label="Pitching events">
            {analysis.events.map((event) => (
              <button
                key={event.name}
                className={selectedEvent === event.name ? 'on' : ''}
                onClick={() => chooseEvent(event.name, event.frame)}
                role="tab"
                aria-selected={selectedEvent === event.name}
                title={EVENT_LABEL[event.name]}
              >
                <span>{EVENT_SHORT[event.name]}</span>
                <span className="mono">f{event.frame}</span>
                <i className={`confidence-dot ${event.confidence}`} aria-label={`${event.confidence} confidence`} />
              </button>
            ))}
          </div>

          <div className="measurement-context">
            <div>
              <strong>{EVENT_LABEL[selectedEvent]}</strong>
              {selectedEvent === 'max_external_rotation' && <span className="tag warn">review candidate</span>}
            </div>
            {activeEvent && <ConfidenceBadge c={activeEvent.confidence} />}
          </div>

          <div className="metric-grid event-metric-grid">
            {eventRows.length === 0 && <p className="dim small">No construct-compatible reference measurements at this event.</p>}
            {eventRows.map((reading) => {
              const key = `${reading.event}:${reading.metric}`
              return (
                <EventMetricTile
                  key={key}
                  reading={reading}
                  expanded={expanded === key}
                  onToggle={() => toggleInfo(key)}
                />
              )
            })}
          </div>
          <p className="measurement-footnote">Observed pitching-population ranges are context, not targets or diagnoses.</p>
        </>
      ) : (
        <>
          <div className="live-context">
            <span>Frame <strong className="mono">{currentFrame}</strong></span>
            <span className="mono dim">{session.frames[currentFrame]?.t.toFixed(2)} video-s</span>
            <span className="tag exploratory">exploratory</span>
          </div>
          <div className="metric-grid live-metric-grid">
            {(Object.keys(live) as MetricName[]).map((metric) => (
              <LiveMetricTile
                key={metric}
                metric={metric}
                value={live[metric]}
                expanded={expanded === `live:${metric}`}
                onToggle={() => toggleInfo(`live:${metric}`)}
              />
            ))}
          </div>
          <p className="measurement-footnote">Live values move with the workspace. Reference comparisons are applied only at reviewed event anchors.</p>
        </>
      )}
    </section>
  )
}
