/**
 * AnalysisStore — the single source of truth for what the human is looking at.
 *
 * ⚠️ ARCHITECTURAL: the WebMCP tools (Tasks 13–15) read from and write to THIS store —
 * the same one the UI renders from. That identity is the whole "why WebMCP and not a
 * backend MCP server" argument (SPEC §3). Never create a parallel state path for tools.
 */

import { create } from 'zustand'
import { analyze, type AnalysisResult } from './biomech/analyze'
import type {
  Annotation,
  EventName,
  JointName,
  OverlayName,
  PhaseEvent,
  Session,
  SessionIndexEntry,
} from './types'

export type LoadState = 'idle' | 'loading' | 'ready' | 'error'

/** A session plus its derived analysis, computed in the browser. */
export interface AnalysedSession {
  session: Session
  analysis: AnalysisResult
}

interface AnalysisState {
  // ── available sessions ──
  index: SessionIndexEntry[]
  indexState: LoadState

  // ── active session ──
  session: Session | null
  sessionState: LoadState
  error: string | null
  /**
   * The derived biomechanical analysis. Computed IN THE BROWSER on session load —
   * this object has no server representation, which is precisely what the WebMCP
   * tools will expose and what a backend MCP server could not (SPEC §3).
   */
  analysis: AnalysisResult | null
  /**
   * Analyses kept alongside the active one, keyed by session id. `compare_pitches` needs
   * a second pitch without yanking the human's view to it, so it analyses that session
   * off-screen and caches the result here.
   */
  cache: Record<string, AnalysedSession>

  // ── viewer state (client-only; no server representation) ──
  currentFrame: number
  playing: boolean
  playbackRate: number
  selectedJoint: JointName | null
  cameraPlane: 'sagittal' | 'frontal' | 'transverse' | 'free'
  overlays: Record<OverlayName, boolean>
  annotations: Annotation[]
  events: PhaseEvent[]

  // ── actions ──
  loadIndex: () => Promise<void>
  loadSession: (sessionId: string) => Promise<void>
  adoptSession: (session: Session) => void
  setFrame: (frame: number) => void
  stepFrame: (delta: number) => void
  setPlaying: (playing: boolean) => void
  togglePlaying: () => void
  setPlaybackRate: (rate: number) => void
  selectJoint: (joint: JointName | null) => void
  setCameraPlane: (plane: AnalysisState['cameraPlane']) => void
  setOverlay: (overlay: OverlayName, enabled: boolean) => void
  addAnnotation: (a: Omit<Annotation, 'id' | 'createdAt'>) => Annotation
  clearAnnotations: () => void
  seekToEvent: (name: EventName) => PhaseEvent | null
  /** Active session, cached session, or fetch-and-analyse — without changing the view. */
  analysisFor: (sessionId?: string) => Promise<AnalysedSession>
  /** Analyse a session into the cache without displaying it. */
  cacheAnalysis: (session: Session) => AnalysedSession
}

const DEFAULT_OVERLAYS: Record<OverlayName, boolean> = {
  segment_frames: true,
  axial_dial: true,
  angle_readouts: true,
  motion_trail: true,
  event_markers: true,
}

export const useAnalysis = create<AnalysisState>((set, get) => ({
  index: [],
  indexState: 'idle',
  session: null,
  sessionState: 'idle',
  error: null,
  analysis: null,
  cache: {},

  currentFrame: 0,
  playing: false,
  playbackRate: 1,
  selectedJoint: null,
  cameraPlane: 'free',
  overlays: { ...DEFAULT_OVERLAYS },
  annotations: [],
  events: [],

  async loadIndex() {
    set({ indexState: 'loading' })
    try {
      const res = await fetch('/sessions/index.json')
      if (!res.ok) throw new Error(`index.json ${res.status}`)
      const data = await res.json()
      set({ index: data.sessions ?? [], indexState: 'ready' })
    } catch (e) {
      set({ indexState: 'error', error: String(e) })
    }
  },

  async loadSession(sessionId) {
    set({ sessionState: 'loading', error: null })
    try {
      const entry = get().index.find((s) => s.sessionId === sessionId)
      const file = entry?.file ?? `${sessionId}.json`
      const res = await fetch(`/sessions/${file}`)
      if (!res.ok) throw new Error(`${file} ${res.status}`)
      const session: Session = await res.json()
      get().adoptSession(session)
    } catch (e) {
      set({ sessionState: 'error', error: String(e) })
    }
  },

  adoptSession(session) {
    const analysis = analyze(session)
    set((s) => ({
      cache: { ...s.cache, [session.sessionId]: { session, analysis } },
      session,
      analysis,
      sessionState: 'ready',
      currentFrame: analysis.events.find((e) => e.name === 'foot_contact')?.frame ?? 0,
      playing: false,
      selectedJoint: null,
      annotations: [],
      events: analysis.events,
      error: null,
    }))
  },

  setFrame(frame) {
    const s = get().session
    if (!s) return
    const max = s.frames.length - 1
    set({ currentFrame: Math.max(0, Math.min(max, Math.round(frame))) })
  },

  stepFrame(delta) {
    get().setFrame(get().currentFrame + delta)
  },

  setPlaying: (playing) => set({ playing }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  selectJoint: (selectedJoint) => set({ selectedJoint }),
  setCameraPlane: (cameraPlane) => set({ cameraPlane }),

  setOverlay: (overlay, enabled) =>
    set((s) => ({ overlays: { ...s.overlays, [overlay]: enabled } })),

  addAnnotation(a) {
    const annotation: Annotation = {
      ...a,
      id: `ann_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    }
    set((s) => ({ annotations: [...s.annotations, annotation] }))
    return annotation
  },

  clearAnnotations: () => set({ annotations: [] }),

  seekToEvent(name) {
    const ev = get().events.find((e) => e.name === name)
    if (!ev) return null
    get().setFrame(ev.frame)
    return ev
  },

  cacheAnalysis(session) {
    const entry: AnalysedSession = { session, analysis: analyze(session) }
    set((s) => ({ cache: { ...s.cache, [session.sessionId]: entry } }))
    return entry
  },

  async analysisFor(sessionId) {
    const st = get()
    const id = sessionId ?? st.session?.sessionId
    if (!id) throw new Error('No pitch session is loaded.')
    if (st.session?.sessionId === id && st.analysis) {
      return { session: st.session, analysis: st.analysis }
    }
    const hit = st.cache[id]
    if (hit) return hit

    const entry = st.index.find((s) => s.sessionId === id)
    const res = await fetch(`/sessions/${entry?.file ?? `${id}.json`}`)
    if (!res.ok) throw new Error(`Session "${id}" could not be loaded (HTTP ${res.status}).`)
    return get().cacheAnalysis(await res.json())
  },
}))
