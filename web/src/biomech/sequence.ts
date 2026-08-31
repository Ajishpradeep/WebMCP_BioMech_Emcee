/**
 * Kinematic sequence — the order in which segments reach peak angular speed.
 *
 * ⚠️ Timebase: both demo clips are slow-motion at an unknown factor, so angular speed
 * in real deg/s is NOT derivable (tech.md §3.2b). What survives any monotonic time warp
 * is (a) the ORDER of the peaks and (b) their timing normalised to the foot-contact →
 * ball-release window. Those are what we report. This app observes only four segments;
 * it is not a published full five-segment kinematic sequence. Absolute rates are returned
 * only when `timebase.realTimeScale` is known.
 *
 * ⚠️ Do not build a "sequence score". Across 208 analysed pitches, not one showed a
 * complete proximal-to-distal order and 14 distinct patterns appeared, the most common
 * being pelvis → trunk → arm → hand → forearm. A non-PDS order is not a fault.
 */

import type { PhaseEvent, Session } from '../types'
import { frameSeries } from './angles'
import { normalisedPct } from './events'
import type { SegmentName } from './frames'
import { angularSpeed } from './vec'

export const SEQUENCE_SEGMENTS = ['pelvis', 'thorax', 'upperarm', 'forearm'] as const
export type SequenceSegment = (typeof SEQUENCE_SEGMENTS)[number]

/** The expected order for this app's intentionally partial, four-segment view. */
export const PROXIMAL_TO_DISTAL: SequenceSegment[] = ['pelvis', 'thorax', 'upperarm', 'forearm']

export interface SegmentPeak {
  segment: SequenceSegment
  frame: number
  /** Video-time seconds — NOT real seconds when the source is slow motion. */
  tVideo: number
  /** Position in the foot-contact → ball-release window, percent. */
  tNormPct: number | null
  /** deg per video-second. Only meaningful in real terms if realTimeScale is known. */
  peakSpeedVideo: number
  /** deg/s in real time, or null when the slow-motion factor is unknown. */
  peakAngularVelocity: number | null
}

export interface KinematicSequence {
  observedOrder: SequenceSegment[]
  peaks: SegmentPeak[]
  /** Whether the four observed segments occur in the expected order; not a quality score. */
  isProximalToDistal: boolean
  /** Pelvis→thorax peak separation, as a percentage of the FC→BR window. */
  pelvisToTrunkSeparationPct: number | null
  /** Per-frame angular speed traces, for the sequence chart. */
  traces: Record<SequenceSegment, (number | null)[]>
  rateUnitsAvailable: boolean
  literatureNote: string
}

const LITERATURE_NOTE =
  'This is a partial four-segment view (pelvis, thorax, upper arm, forearm), not the ' +
  'published five-segment sequence. Complete proximal-to-distal sequencing is uncommon: across 208 analysed pitches no ' +
  'pitch showed a fully proximal-to-distal order and 14 distinct patterns were observed, ' +
  'the most prevalent being pelvis → trunk → arm → hand → forearm. A non-PDS order is ' +
  'therefore not itself a fault.'

export function kinematicSequence(session: Session, events: PhaseEvent[]): KinematicSequence {
  const F = frameSeries(session)
  const n = F.length
  const fps = session.timebase.videoFps || 30
  const dtVideo = 1 / fps
  const scale = session.timebase.realTimeScale

  const throwing = session.subject.handedness === 'left' ? 'l' : 'r'
  const segKey: Record<SequenceSegment, SegmentName> = {
    pelvis: 'pelvis',
    thorax: 'thorax',
    upperarm: `upperarm_${throwing}` as SegmentName,
    forearm: `forearm_${throwing}` as SegmentName,
  }

  /**
   * Centred moving average. A frame-to-frame angular difference is a derivative, so it
   * amplifies reconstruction noise; without smoothing the trace is unreadable and the
   * peak lands on whichever frame happened to be noisiest. The window is short enough
   * to preserve peak timing, which is the quantity we actually report.
   */
  const smooth = (xs: (number | null)[], win = 7): (number | null)[] =>
    xs.map((_, i) => {
      let sum = 0
      let cnt = 0
      for (let k = i - (win >> 1); k <= i + (win >> 1); k++) {
        const v = xs[k]
        if (k >= 0 && k < xs.length && v !== null) {
          sum += v
          cnt++
        }
      }
      return cnt ? Math.round((sum / cnt) * 10) / 10 : null
    })

  const traces = {} as Record<SequenceSegment, (number | null)[]>
  for (const s of SEQUENCE_SEGMENTS) {
    const key = segKey[s]
    const raw = F.map((_, i) => {
      if (i === 0 || i === n - 1) return null
      const a = F[i - 1][key]
      const b = F[i + 1][key]
      return a && b ? angularSpeed(a, b, 2 * dtVideo) : null
    })
    traces[s] = smooth(raw)
  }

  // Restrict the peak search to the delivery window when we have one — the windup and
  // follow-through contain fast motion that is not part of the throw.
  const fc = events.find((e) => e.name === 'foot_contact')?.frame ?? 0
  const br = events.find((e) => e.name === 'ball_release')?.frame ?? n - 1
  const lo = Math.max(1, fc)
  const hi = Math.min(n - 2, br)

  const peaks: SegmentPeak[] = SEQUENCE_SEGMENTS.map((s) => {
    let bf = lo
    let bv = -Infinity
    for (let i = lo; i <= hi; i++) {
      const v = traces[s][i]
      if (v !== null && v > bv) {
        bv = v
        bf = i
      }
    }
    return {
      segment: s,
      frame: bf,
      tVideo: session.frames[bf]?.t ?? 0,
      tNormPct: normalisedPct(bf, events),
      peakSpeedVideo: Math.round(bv * 10) / 10,
      peakAngularVelocity: scale ? Math.round((bv / scale) * 10) / 10 : null,
    }
  })

  const observedOrder = [...peaks].sort((a, b) => a.frame - b.frame).map((p) => p.segment)
  const isProximalToDistal = observedOrder.every((s, i) => s === PROXIMAL_TO_DISTAL[i])

  const pPelvis = peaks.find((p) => p.segment === 'pelvis')
  const pThorax = peaks.find((p) => p.segment === 'thorax')
  const sep =
    pPelvis && pThorax && pPelvis.tNormPct !== null && pThorax.tNormPct !== null
      ? Math.round((pThorax.tNormPct - pPelvis.tNormPct) * 10) / 10
      : null

  return {
    observedOrder,
    peaks,
    isProximalToDistal,
    pelvisToTrunkSeparationPct: sep,
    traces,
    rateUnitsAvailable: scale !== null,
    literatureNote: LITERATURE_NOTE,
  }
}
