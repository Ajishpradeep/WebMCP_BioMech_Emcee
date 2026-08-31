/**
 * Measured values against published reference ranges.
 *
 * Every row carries its confidence grade and its citation keys. That is the honesty
 * contract made visible: the same `reference.ts` entries feed this table and the
 * `get_metric_definition` WebMCP tool, so the screen and the agent can never disagree.
 */

import { useMemo, useState } from 'react'
import type { AnalysisResult, MetricReading } from '../biomech/analyze'
import type { MetricName } from '../biomech/angles'
import { CITATIONS, referenceFor } from '../biomech/reference'
import { useAnalysis } from '../store'
import type { Confidence, EventName, Session } from '../types'

const EVENT_LABEL: Record<EventName, string> = {
  foot_contact: 'Lead foot contact',
  max_external_rotation: 'MER candidate (review)',
  ball_release: 'Ball release',
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

function ConfidenceBadge({ c }: { c: Confidence }) {
  return <span className={`conf ${c}`} title={`Measurement confidence: ${c}`}>{c}</span>
}

function Row({ r, onExplain }: { r: MetricReading; onExplain: () => void }) {
  const ref = r.reference
  const pct =
    ref && r.value !== null
      ? Math.max(0, Math.min(1, (r.value - ref.range[0]) / (ref.range[1] - ref.range[0])))
      : null

  return (
    <div className={`mrow ${r.status}`}>
      <button className="mrow-name" onClick={onExplain} title="What is this and where does the range come from?">
        {PRETTY[r.metric] ?? r.metric}
      </button>
      <div className="mrow-val">
        <span className="mono val">{r.value === null ? '—' : `${r.value}°`}</span>
        <ConfidenceBadge c={r.confidence} />
      </div>
      {ref && (
        <div className="mrow-bar" title={`reference ${ref.range[0]}–${ref.range[1]}°`}>
          <div className="ref-band" />
          {pct !== null && (
            <div
              className={`ref-mark ${r.status}`}
              style={{ left: `${(pct * 100).toFixed(1)}%` }}
            />
          )}
        </div>
      )}
      <div className="mrow-meta dim">
        {r.status === 'unavailable'
          ? 'comparison unavailable · review event frame'
          : ref ? `ref ${ref.range[0]}–${ref.range[1]}°` : 'no published range'}
        {r.status === 'above' || r.status === 'below'
          ? ` · ${r.status} by ${r.magnitude}°`
          : r.status === 'within'
            ? ' · within'
            : ''}
      </div>
    </div>
  )
}

export function MetricsPanel({ session, analysis }: { session: Session; analysis: AnalysisResult }) {
  const currentFrame = useAnalysis((s) => s.currentFrame)
  const setFrame = useAnalysis((s) => s.setFrame)
  const [explain, setExplain] = useState<{ metric: MetricName; event: EventName } | null>(null)
  const [mode, setMode] = useState<'events' | 'live'>('events')

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
    const g = new Map<EventName, MetricReading[]>()
    for (const r of analysis.readings) {
      const arr = g.get(r.event) ?? []
      arr.push(r)
      g.set(r.event, arr)
    }
    return g
  }, [analysis])

  const def = explain ? referenceFor(explain.metric, explain.event) : undefined

  return (
    <section className="metrics">
      <h2>
        Measurements
        <span className="seg-toggle">
          <button className={mode === 'events' ? 'on' : ''} onClick={() => setMode('events')}>at events</button>
          <button className={mode === 'live' ? 'on' : ''} onClick={() => setMode('live')}>live</button>
        </span>
      </h2>

      {mode === 'events' ? (
        analysis.events.map((ev) => {
          const rows = byEvent.get(ev.name) ?? []
          return (
            <div key={ev.name} className="mgroup">
              <button className="mgroup-head" onClick={() => setFrame(ev.frame)}>
                <span>{EVENT_LABEL[ev.name]}</span>
                <span className="mono dim">f{ev.frame}</span>
                <ConfidenceBadge c={ev.confidence} />
              </button>
              {rows.length === 0 && <p className="dim small">No referenced metrics at this event.</p>}
              {rows.map((r) => (
                <Row
                  key={`${r.event}:${r.metric}`}
                  r={r}
                  onExplain={() => setExplain({ metric: r.metric, event: r.event })}
                />
              ))}
            </div>
          )
        })
      ) : (
        <div className="mgroup">
          <div className="mgroup-head static">
            <span>Frame {currentFrame}</span>
            <span className="mono dim">{session.frames[currentFrame]?.t.toFixed(2)}s</span>
          </div>
          {(Object.keys(live) as MetricName[]).map((k) => (
            <div key={k} className="mrow live">
              <span className="mrow-name static">{PRETTY[k] ?? k}</span>
              <div className="mrow-val">
                <span className="mono val">{live[k] === null ? '—' : `${live[k]}°`}</span>
              </div>
            </div>
          ))}
          <p className="dim small">
            Live values are exploratory traces. Only the event view applies vetted,
            construct-compatible reference comparisons.
          </p>
        </div>
      )}

      {def && (
        <div className="explain" role="dialog">
          <div className="explain-head">
            <strong>{PRETTY[def.metric] ?? def.metric}</strong>
            <button className="btn tiny" onClick={() => setExplain(null)}>close</button>
          </div>
          <p>{def.plainLanguage}</p>
          <p className="dim"><strong>How it is computed.</strong> {def.computation}</p>
          <p className="dim"><strong>Limitations.</strong> {def.limitations}</p>
          <p className="dim">
            <strong>Reference.</strong> {def.range[0]}–{def.range[1]}°
            {def.typical !== undefined ? ` (typical ${def.typical}°${def.sd ? ` ± ${def.sd}` : ''})` : ''}
          </p>
          <ul className="cites">
            {def.citations.map((c) => (
              <li key={c}>
                {CITATIONS[c]?.text ?? c}
                {CITATIONS[c]?.doi && (
                  <>
                    {' '}
                    <a href={`https://doi.org/${CITATIONS[c].doi}`} target="_blank" rel="noreferrer">
                      doi:{CITATIONS[c].doi}
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
