/**
 * Upload → analyse.
 *
 * The analysis pipeline needs a CUDA GPU (SAM 3D Body, 840M params), so it cannot run in
 * the browser or on the static deployment. This panel talks to the LOCAL backend
 * (`pipeline/server.py`) when one is reachable, and degrades to an explanatory state when
 * it isn't — which is exactly what the deployed build does for judges, who get the
 * pre-computed sessions instead.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAnalysis } from '../store'

type Backend = 'checking' | 'online' | 'offline'
type Job = { id: string; status: string; stage: string; progress: number; error?: string; sessionId?: string }

export function UploadPanel() {
  const [backend, setBackend] = useState<Backend>('checking')
  const [job, setJob] = useState<Job | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const loadIndex = useAnalysis((s) => s.loadIndex)
  const loadSession = useAnalysis((s) => s.loadSession)

  useEffect(() => {
    let alive = true
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => alive && setBackend(d.gpu ? 'online' : 'offline'))
      .catch(() => alive && setBackend('offline'))
    return () => { alive = false }
  }, [])

  const poll = useCallback(
    async (id: string) => {
      for (;;) {
        await new Promise((r) => setTimeout(r, 1200))
        const res = await fetch(`/api/jobs/${id}`)
        if (!res.ok) return setJob({ id, status: 'error', stage: 'lost', progress: 0, error: 'job vanished' })
        const j: Job = await res.json()
        setJob(j)
        if (j.status === 'done') {
          await loadIndex()
          if (j.sessionId) await loadSession(j.sessionId)
          return
        }
        if (j.status === 'error') return
      }
    },
    [loadIndex, loadSession],
  )

  const upload = useCallback(
    async (file: File) => {
      const fd = new FormData()
      fd.append('video', file)
      setJob({ id: '…', status: 'queued', stage: 'uploading', progress: 0 })
      try {
        const res = await fetch('/api/analyze', { method: 'POST', body: fd })
        if (!res.ok) throw new Error(await res.text())
        const { jobId } = await res.json()
        setJob({ id: jobId, status: 'running', stage: 'queued', progress: 0 })
        poll(jobId)
      } catch (e) {
        setJob({ id: '—', status: 'error', stage: 'upload', progress: 0, error: String(e) })
      }
    },
    [poll],
  )

  const busy = job?.status === 'running' || job?.status === 'queued'

  return (
    <section>
      <h2>
        Analyse a pitch
        <span className={`tag backend ${backend}`}>
          {backend === 'checking' ? 'checking…' : backend === 'online' ? 'GPU ready' : 'no backend'}
        </span>
      </h2>

      {backend === 'offline' ? (
        <div className="offline-note">
          <p>
            Analysis needs a local CUDA GPU — SAM&nbsp;3D&nbsp;Body is an 840M-parameter model and
            runs offline, never in the request path.
          </p>
          <p className="dim small">
            Start it with <span className="mono">.venv/bin/python pipeline/server.py</span>, then
            reload. The sessions above are pre-computed and work without any backend.
          </p>
        </div>
      ) : (
        <>
          <div
            className={`drop ${dragging ? 'over' : ''} ${busy ? 'busy' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const f = e.dataTransfer.files?.[0]
              if (f && !busy) upload(f)
            }}
            onClick={() => !busy && fileRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) upload(f)
              }}
            />
            <span className="drop-icon">⇪</span>
            <span>Drop a pitch clip, or click to choose</span>
            <span className="dim small">mp4 / mov · one pitcher · whole body in frame</span>
          </div>

          {job && (
            <div className={`job ${job.status}`}>
              <div className="job-head">
                <span>{job.stage}</span>
                <span className="mono">{Math.round(job.progress * 100)}%</span>
              </div>
              <div className="bar"><div style={{ width: `${job.progress * 100}%` }} /></div>
              {job.error && <p className="err small">{job.error}</p>}
            </div>
          )}
        </>
      )}
    </section>
  )
}
