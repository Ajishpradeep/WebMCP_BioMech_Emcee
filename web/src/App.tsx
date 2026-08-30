import { useEffect } from 'react'

import { SequenceChart } from './components/SequenceChart'
import { SidePanel } from './components/SidePanel'
import { Timeline } from './components/Timeline'
import { useAnalysis } from './store'
import { SkeletonViewer } from './viewer/SkeletonViewer'

export default function App() {
  const session = useAnalysis((s) => s.session)
  const analysis = useAnalysis((s) => s.analysis)
  const sessionState = useAnalysis((s) => s.sessionState)
  const indexState = useAnalysis((s) => s.indexState)
  const index = useAnalysis((s) => s.index)
  const error = useAnalysis((s) => s.error)
  const loadIndex = useAnalysis((s) => s.loadIndex)
  const loadSession = useAnalysis((s) => s.loadSession)

  // Load the session index, then auto-open the first session.
  useEffect(() => { loadIndex() }, [loadIndex])
  useEffect(() => {
    if (indexState === 'ready' && index.length > 0 && !session) {
      const want = new URLSearchParams(location.search).get('session')
      const pick = index.find((s) => s.sessionId === want) ?? index[0]
      loadSession(pick.sessionId)
    }
  }, [indexState, index, session, loadSession])

  // ?frame=N deep-links a specific moment — handy for debugging and for sharing
  // "look at this" without a screenshot.
  useEffect(() => {
    if (!session) return
    const f = new URLSearchParams(location.search).get('frame')
    if (f !== null) useAnalysis.getState().setFrame(Number(f))
  }, [session])

  // Keyboard scrubbing — a coach lives on arrow keys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const st = useAnalysis.getState()
      if (e.key === ' ') { e.preventDefault(); st.togglePlaying() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); st.stepFrame(e.shiftKey ? -10 : -1) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); st.stepFrame(e.shiftKey ? 10 : 1) }
      else if (e.key === 'Home') st.setFrame(0)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">◈</span>
          <div>
            <h1>PitchLab</h1>
            <p>agent-native biomechanics</p>
          </div>
        </div>
        <div className="topbar-right">
          {session && <span className="session-name">{session.source.label}</span>}
          <span className="tag webmcp" title="WebMCP tools land in Tasks 13–15">
            WebMCP · pending
          </span>
        </div>
      </header>

      <main className="stage">
        <div className="viewer">
          {sessionState === 'loading' && <div className="center dim">Loading session…</div>}
          {sessionState === 'error' && (
            <div className="center err">
              <p>Could not load a session.</p>
              <p className="small mono">{error}</p>
            </div>
          )}
          {sessionState === 'idle' && indexState === 'ready' && index.length === 0 && (
            <div className="center dim">
              <p>No analysed sessions yet.</p>
              <p className="small">
                Run <span className="mono">.venv/bin/python pipeline/run.py</span> to produce one.
              </p>
            </div>
          )}
          {session && <SkeletonViewer session={session} />}
        </div>

        {session && <Timeline session={session} />}
        {session && analysis && <SequenceChart session={session} analysis={analysis} />}
      </main>

      <SidePanel session={session} />
    </div>
  )
}
