/**
 * Kinematic sequence — the order in which segments reach peak angular speed.
 *
 * ⚠️ Timebase: absolute rates are returned only when `timebase.realTimeScale` is known
 * (tech.md §3.2b). For an unknown slow-motion factor, what survives the time warp is
 * (a) the ORDER of the peaks and (b) their timing normalised to the foot-contact → ball-release
 * window. This app observes only four segments; it is not a published full five-segment
 * kinematic sequence.
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

export interface PeakInterval {
  from: SequenceSegment
  to: SequenceSegment
  frames: number
  /** Signed percentage-point gap in the FC→BR window. Negative means reversed order. */
  normalizedPctPoints: number
  /** Video seconds; equal real seconds only when the timebase scale is known to be 1. */
  videoSeconds: number
  /** Real seconds when the time scale is known; otherwise null. */
  realSeconds: number | null
}

export interface KinematicSequence {
  available: boolean
  quality: 'medium' | 'low' | 'unavailable'
  unavailableReason: string | null
  deliveryWindow: { fromFrame: number; toFrame: number; frames: number } | null
  observedOrder: SequenceSegment[]
  peaks: SegmentPeak[]
  /** Whether the four observed segments occur in the expected order; not a quality score. */
  isProximalToDistal: boolean | null
  /** Signed gaps along pelvis→thorax→upper arm→forearm, not normative targets. */
  intervals: PeakInterval[]
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

  // A seven-frame derivative smoother cannot support four independent peak claims in a
  // five-frame event window. Likewise, a release at the clip boundary is commonly the
  // result of a source cut rather than an observed speed peak. Keep the traces visible,
  // but refuse to manufacture an order or intervals from that evidence.
  const deliveryFrames = br - fc
  const eventOrderValid = br > fc
  const releaseObserved = br > 1 && br < n - 2
  const windowSupported = deliveryFrames >= 12
  const available = eventOrderValid && releaseObserved && windowSupported
  const unavailableReason = available
    ? null
    : !eventOrderValid
      ? 'Foot contact and release do not define a valid delivery window.'
      : !releaseObserved
        ? 'Release falls at the edge of the clip, so the hand-speed peak and downstream sequence peaks are not observable.'
        : `Only ${deliveryFrames} frames separate foot contact and release; at least 12 are required for the derivative and smoothing window.`

  if (!available) {
    return {
      available: false,
      quality: 'unavailable',
      unavailableReason,
      deliveryWindow: eventOrderValid ? { fromFrame: fc, toFrame: br, frames: deliveryFrames } : null,
      observedOrder: [],
      peaks: [],
      isProximalToDistal: null,
      intervals: [],
      pelvisToTrunkSeparationPct: null,
      traces,
      rateUnitsAvailable: false,
      literatureNote: LITERATURE_NOTE,
    }
  }

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

  const peakBySegment = new Map(peaks.map((peak) => [peak.segment, peak]))
  const intervals: PeakInterval[] = PROXIMAL_TO_DISTAL.slice(0, -1).map((from, index) => {
    const to = PROXIMAL_TO_DISTAL[index + 1]
    const a = peakBySegment.get(from)!
    const b = peakBySegment.get(to)!
    const frameGap = b.frame - a.frame
    const videoSeconds = b.tVideo - a.tVideo
    return {
      from,
      to,
      frames: frameGap,
      normalizedPctPoints: Math.round(((b.tNormPct ?? 0) - (a.tNormPct ?? 0)) * 10) / 10,
      videoSeconds: Math.round(videoSeconds * 1000) / 1000,
      realSeconds: scale === null ? null : Math.round(videoSeconds * scale * 1000) / 1000,
    }
  })

  const pPelvis = peaks.find((p) => p.segment === 'pelvis')
  const pThorax = peaks.find((p) => p.segment === 'thorax')
  const sep =
    pPelvis && pThorax && pPelvis.tNormPct !== null && pThorax.tNormPct !== null
      ? Math.round((pThorax.tNormPct - pPelvis.tNormPct) * 10) / 10
      : null

  return {
    available: true,
    quality: 'medium',
    unavailableReason: null,
    deliveryWindow: { fromFrame: fc, toFrame: br, frames: deliveryFrames },
    observedOrder,
    peaks,
    isProximalToDistal,
    intervals,
    pelvisToTrunkSeparationPct: sep,
    traces,
    rateUnitsAvailable: scale !== null,
    literatureNote: LITERATURE_NOTE,
  }
}
