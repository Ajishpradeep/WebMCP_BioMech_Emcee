import { useEffect } from 'react'

import { SequenceChart } from './components/SequenceChart'
import { SidePanel } from './components/SidePanel'
import { Timeline } from './components/Timeline'
import { useAnalysis } from './store'
import { SkeletonViewer } from './viewer/SkeletonViewer'
import { useWebMCP } from './webmcp/useWebMCP'

export default function App() {
  const session = useAnalysis((s) => s.session)
  const analysis = useAnalysis((s) => s.analysis)
  const sessionState = useAnalysis((s) => s.sessionState)
  const indexState = useAnalysis((s) => s.indexState)
  const index = useAnalysis((s) => s.index)
  const error = useAnalysis((s) => s.error)
  const loadIndex = useAnalysis((s) => s.loadIndex)
  const loadSession = useAnalysis((s) => s.loadSession)

  // Registers the 13 WebMCP tools against this document. No-ops in a browser without WebMCP.
  const webmcp = useWebMCP()
  const webmcpLabel =
    webmcp.state === 'ready' ? `WebMCP · ${webmcp.registered} tools` :
      webmcp.state === 'registering' ? 'WebMCP · registering…' :
        webmcp.state === 'partial' ? `WebMCP · ${webmcp.registered}/13 tools` :
          webmcp.state === 'error' ? 'WebMCP · registration failed' :
            'WebMCP · not in this browser'
  const webmcpTitle =
    webmcp.state === 'ready'
      ? `Registered tools: ${webmcp.toolNames.join(', ')}`
      : webmcp.state === 'partial'
        ? `Failed registrations: ${webmcp.failures.join(', ') || 'unknown'}`
        : webmcp.state === 'error'
          ? 'Registration failed. Reload in a WebMCP-capable HTTPS browser and inspect the console.'
          : 'document.modelContext is unavailable here — needs a WebMCP-capable browser over HTTPS. The app works fully without it.'

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
            <h1>PitchLab Review</h1>
            <p>shared biomechanics evidence workspace</p>
          </div>
        </div>
        <div className="topbar-right">
          {session && <span className="session-name">{session.source.label}</span>}
          <span
            className={`tag webmcp ${webmcp.state === 'ready' ? 'ok' : webmcp.state === 'partial' || webmcp.state === 'error' ? 'warn' : ''}`}
            title={webmcpTitle}
          >
            {webmcpLabel}
          </span>
        </div>
      </header>

      <main className="stage">
        <div className="viewer">
          {indexState === 'loading' && <div className="center dim">Loading review sessions…</div>}
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
                This public workspace is built around precomputed review sessions.
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
