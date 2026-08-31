/**
 * Kinematic sequence chart — angular speed of four segments through the delivery.
 *
 * This is the iconic pitching-biomechanics plot, and it only exists because we have
 * segment *frames* rather than joint positions: angular speed is the rotation angle
 * between consecutive frames of a segment's coordinate system.
 *
 * ⚠️ The y-axis is deg per VIDEO second. The demo clips are slow motion at an unknown
 * factor, so this is not deg/s in real time (tech.md §3.2b). The axis says so.
 * The peak ORDER and the normalised timings are what remain valid.
 *
 * Palette: reference categorical slots 1–4, validated for the dark surface with
 * `validate_palette.js` (all six checks pass, worst adjacent CVD ΔE 8.4 protan).
 * Assigned in fixed proximal→distal order, never cycled.
 */

import { useMemo, useRef, useState } from 'react'
import { useAnalysis } from '../store'
import type { AnalysisResult } from '../biomech/analyze'
import { SEQUENCE_SEGMENTS, type SequenceSegment } from '../biomech/sequence'
import type { Session } from '../types'

const SERIES_COLOR: Record<SequenceSegment, string> = {
  pelvis: '#3987e5',
  thorax: '#d95926',
  upperarm: '#199e70',
  forearm: '#c98500',
}
const SERIES_LABEL: Record<SequenceSegment, string> = {
  pelvis: 'Pelvis',
  thorax: 'Thorax',
  upperarm: 'Upper arm',
  forearm: 'Forearm',
}

const W = 640
const H = 150
const M = { top: 9, right: 14, bottom: 24, left: 44 }

/**
 * Display-only zero-phase Gaussian smoothing. The biomechanics engine retains its
 * original traces and peak calculations; this removes frame-scale visual chatter from
 * the chart without moving the values returned by WebMCP or shown in the peak table.
 */
function smoothForDisplay(xs: (number | null)[], radius = 16, sigma = 6.5) {
  return xs.map((value, i) => {
    if (value === null) return null
    let weighted = 0
    let weights = 0
    for (let offset = -radius; offset <= radius; offset++) {
      const sample = xs[i + offset]
      if (sample === undefined || sample === null) continue
      const weight = Math.exp(-(offset * offset) / (2 * sigma * sigma))
      weighted += sample * weight
      weights += weight
    }
    return weights ? weighted / weights : value
  })
}

export function SequenceChart({
  session,
  analysis,
}: {
  session: Session
  analysis: AnalysisResult
}) {
  const currentFrame = useAnalysis((s) => s.currentFrame)
  const setFrame = useAnalysis((s) => s.setFrame)
  const [hover, setHover] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)
  const [open, setOpen] = useState(true)
  const svgRef = useRef<SVGSVGElement>(null)

  const seq = analysis.sequence
  const n = session.frames.length

  const { displayTraces, plot, yMax, x, y } = useMemo(() => {
    const shown = {} as Record<SequenceSegment, (number | null)[]>
    for (const s of SEQUENCE_SEGMENTS) shown[s] = smoothForDisplay(seq.traces[s])

    let max = 0
    for (const s of SEQUENCE_SEGMENTS) {
      for (const v of shown[s]) if (v !== null && v > max) max = v
    }
    // Clip the y-scale to a robust upper bound so one spike can't flatten everything.
    const all = SEQUENCE_SEGMENTS.flatMap((s) =>
      shown[s].filter((v): v is number => v !== null),
    ).sort((a, b) => a - b)
    const p98 = all.length ? all[Math.floor(all.length * 0.98)] : max
    const yM = Math.max(1, p98)

    const iw = W - M.left - M.right
    const ih = H - M.top - M.bottom
    const xf = (f: number) => M.left + (f / Math.max(1, n - 1)) * iw
    const yf = (v: number) => M.top + ih - (Math.min(v, yM) / yM) * ih

    const paths: Record<string, string> = {}
    for (const s of SEQUENCE_SEGMENTS) {
      let d = ''
      let pen = false
      shown[s].forEach((v, i) => {
        if (v === null) {
          pen = false
          return
        }
        d += `${pen ? 'L' : 'M'}${xf(i).toFixed(1)},${yf(v).toFixed(1)}`
        pen = true
      })
      paths[s] = d
    }
    return { displayTraces: shown, plot: paths, yMax: yM, x: xf, y: yf }
  }, [seq, n])

  const onMove = (e: React.MouseEvent) => {
    const r = svgRef.current?.getBoundingClientRect()
    if (!r) return
    const px = ((e.clientX - r.left) / r.width) * W
    const f = Math.round(((px - M.left) / (W - M.left - M.right)) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, f)))
  }

  const hf = hover ?? currentFrame

  return (
    <div className="seqchart">
      <div className="sc-head">
        <div>
          <h3>Kinematic sequence</h3>
          <p className="dim small">
            Peak order:{' '}
            <strong className="mono">{seq.observedOrder.join(' → ')}</strong>
            {seq.isProximalToDistal ? (
              <span className="tag ok">four-segment order matches</span>
            ) : (
              <span className="tag neutral">four-segment order differs</span>
            )}
          </p>
        </div>
        <div className="sc-actions">
          <button className="btn tiny" onClick={() => setShowTable((v) => !v)}>
            {showTable ? 'Chart' : 'Table'}
          </button>
          <button className="btn tiny" onClick={() => setOpen((v) => !v)} title="Collapse">
            {open ? '▾' : '▴'}
          </button>
        </div>
      </div>

      {open && (showTable ? (
        <table className="sc-table">
          <thead>
            <tr><th>Segment</th><th>Peak frame</th><th>% of FC→BR</th><th>deg / video-s</th><th>deg/s</th></tr>
          </thead>
          <tbody>
            {seq.peaks.map((p) => (
              <tr key={p.segment}>
                <td><span className="swatch" style={{ background: SERIES_COLOR[p.segment] }} />{SERIES_LABEL[p.segment]}</td>
                <td className="mono">{p.frame}</td>
                <td className="mono">{p.tNormPct === null ? '—' : `${p.tNormPct.toFixed(1)}%`}</td>
                <td className="mono">{p.peakSpeedVideo}</td>
                <td className="mono dim">{p.peakAngularVelocity ?? 'unavailable'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="sc-svg"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          onClick={() => hover !== null && setFrame(hover)}
          role="img"
          aria-label="Angular speed of pelvis, thorax, upper arm and forearm through the delivery"
        >
          {/* recessive grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <g key={g}>
              <line x1={M.left} x2={W - M.right} y1={y(yMax * g)} y2={y(yMax * g)} className="sc-grid" />
              <text x={M.left - 6} y={y(yMax * g) + 3} className="sc-axis" textAnchor="end">
                {Math.round(yMax * g)}
              </text>
            </g>
          ))}

          {/* event markers */}
          {analysis.events.map((e) => (
            <g key={e.name}>
              <line x1={x(e.frame)} x2={x(e.frame)} y1={M.top} y2={H - M.bottom} className="sc-event" />
              <text x={x(e.frame)} y={H - M.bottom + 12} className="sc-axis" textAnchor="middle">
                {e.name === 'foot_contact' ? 'FC' : e.name === 'ball_release' ? 'BR' : 'MER'}
              </text>
            </g>
          ))}

          {/* series */}
          {SEQUENCE_SEGMENTS.map((s) => (
            <path key={s} d={plot[s]} fill="none" stroke={SERIES_COLOR[s]} strokeWidth={2}
              strokeLinejoin="round" strokeLinecap="round" />
          ))}

          {/* peak markers — 8px, ringed against the surface so overlaps stay legible */}
          {seq.peaks.map((p) => {
            const v = displayTraces[p.segment][p.frame]
            if (v === null) return null
            return (
              <circle key={p.segment} cx={x(p.frame)} cy={y(v)} r={4.5}
                fill={SERIES_COLOR[p.segment]} stroke="#0c1016" strokeWidth={2} />
            )
          })}

          {/* crosshair */}
          <line x1={x(hf)} x2={x(hf)} y1={M.top} y2={H - M.bottom} className="sc-cursor" />

          <text x={M.left} y={H - 4} className="sc-axis">frame</text>
          <text x={W - M.right} y={H - 4} className="sc-axis" textAnchor="end">
            deg / video-second
          </text>
        </svg>
      ))}

      {open && (
      <>
      {/* legend — always present for ≥2 series; identity never by colour alone */}
      <div className="sc-legend">
        {SEQUENCE_SEGMENTS.map((s) => {
          const v = displayTraces[s][hf]
          return (
            <span key={s} className="sc-key">
              <span className="swatch" style={{ background: SERIES_COLOR[s] }} />
              {SERIES_LABEL[s]}
              <span className="mono dim">{v === null ? '—' : Math.round(v)}</span>
            </span>
          )
        })}
      </div>

      <p className="sc-note">
        {seq.rateUnitsAvailable
          ? 'Rates shown in real time.'
          : 'Slow-motion source at an unknown factor — absolute angular velocity is unavailable. Peak order and normalised timing remain valid.'}
      </p>
      <details className="sc-details">
        <summary>Interpretation and chart method</summary>
        <p>{seq.literatureNote}</p>
        <p>Curves are display-smoothed to remove frame-scale reconstruction chatter. Peak calculations and agent results retain the analysis values.</p>
      </details>
      </>
      )}
    </div>
  )
}
