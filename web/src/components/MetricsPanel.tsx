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
  if (reading.status === 'unavailable') return 'Review required'
  if (!reading.reference) return 'No reference range'
  if (reading.status === 'within') return 'Within range'
  return `${reading.magnitude}° ${reading.status} range`
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
  return (
    <article className={`metric-tile ${reading.status} ${expanded ? 'expanded' : ''}`}>
      <div className="metric-tile-kicker">
        <span className="metric-event">
          <strong>{EVENT_SHORT[reading.event]}</strong>
          <span>{EVENT_LABEL[reading.event]}</span>
        </span>
        <button
          className="info-button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`Explain ${PRETTY[reading.metric] ?? reading.metric} at ${EVENT_LABEL[reading.event]}`}
          title="Definition, observed range, method, limits and source"
        >i</button>
      </div>
      <span className="metric-name">{PRETTY[reading.metric] ?? reading.metric}</span>
      <strong className="metric-value mono">{reading.value === null ? '—' : `${reading.value}°`}</strong>
      <div className="metric-tile-status">
        <span>{statusText(reading)}</span>
        <ConfidenceBadge c={reading.confidence} />
      </div>

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
      <div className="metric-tile-kicker">
        <span className="metric-event"><strong>LIVE</strong><span>current frame</span></span>
        <button
          className="info-button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`Explain ${PRETTY[metric] ?? metric}`}
          title="Definition, method and limits"
        >i</button>
      </div>
      <span className="metric-name">{PRETTY[metric] ?? metric}</span>
      <strong className="metric-value mono">{value === null ? '—' : `${value}°`}</strong>
      {expanded && <MetricInfo metric={metric} />}
    </article>
  )
}

export function MetricsPanel({ session, analysis }: { session: Session; analysis: AnalysisResult }) {
  const currentFrame = useAnalysis((state) => state.currentFrame)
  const [mode, setMode] = useState<'events' | 'live'>('events')
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

  useEffect(() => setExpanded(null), [mode, analysis.sessionId])

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
          <div className="measurement-summary">
            <span>{analysis.readings.length} event-anchored readings</span>
            <span>Definitions and ranges behind <b>i</b></span>
          </div>
          <div className="metric-grid event-metric-grid">
            {analysis.readings.length === 0 && <p className="dim small">No construct-compatible event measurements are available.</p>}
            {analysis.readings.map((reading) => {
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
