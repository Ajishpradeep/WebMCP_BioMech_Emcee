/**
 * Helpers shared by the tool handlers. Nothing here computes biomechanics — it resolves
 * which analysis a call refers to and formats the honest bits consistently.
 */

import { worst } from '../../biomech/confidence'
import { useAnalysis, type AnalysedSession } from '../../store'
import type { Confidence } from '../../types'
import { ToolInputError } from '../registry'

/** The pitch currently on screen. */
export function requireActive(): AnalysedSession {
  const st = useAnalysis.getState()
  if (!st.session || !st.analysis) {
    throw new ToolInputError(
      'No pitch session is loaded yet. Call list_pitch_sessions to see what is available; the app loads one automatically once its analysis finishes.',
    )
  }
  return { session: st.session, analysis: st.analysis }
}

/**
 * Resolve an optional `sessionId` to an analysis. Defaults to the pitch on screen, and
 * analyses another one off-screen without disturbing the human's view.
 */
export async function resolveSession(sessionId?: unknown): Promise<AnalysedSession> {
  const st = useAnalysis.getState()
  const id = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : undefined
  if (!id) return requireActive()
  try {
    return await st.analysisFor(id)
  } catch (err) {
    throw new ToolInputError(
      `Unknown session "${id}". ${err instanceof Error ? err.message : ''}`.trim(),
      { sessionId: st.index.map((s) => s.sessionId) },
    )
  }
}

/** Reconstruction-quality summary — honest inputs to how far an agent should push a claim. */
export function qualityOf({ analysis }: AnalysedSession) {
  const cov = Object.values(analysis.coverage)
  const mean = cov.length ? cov.reduce((a, b) => a + b, 0) / cov.length : 0
  const eventConfidences = analysis.events.map((e) => e.confidence)
  return {
    metricCoveragePct: Math.round(mean * 1000) / 10,
    eventDetection: (eventConfidences.length ? worst(...eventConfidences) : 'unavailable') as Confidence,
    rateUnits: analysis.rateConfidence,
  }
}

export const r1 = (x: number) => Math.round(x * 10) / 10
/** Normalised-timing percentages, rounded — raw floats waste the output budget. */
export const pct = (v: number | null) => (v === null ? null : r1(v))
export const r3 = (x: number) => Math.round(x * 1000) / 1000
