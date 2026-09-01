import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import { useAnalysis } from '../store'
import type { Session } from '../types'

/**
 * The floating source-video reference follows the shared frame clock rather than owning
 * a second timeline. During playback the browser advances the video normally; frame
 * changes, seeks, loops, and WebMCP actions correct any drift against the session timestamp.
 */
export function ReferenceVideo({ session }: { session: Session }) {
  const containerRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [aspectRatio, setAspectRatio] = useState(16 / 9)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  const currentFrame = useAnalysis((s) => s.currentFrame)
  const playing = useAnalysis((s) => s.playing)
  const playbackRate = useAnalysis((s) => s.playbackRate)

  const targetTime = session.frames[Math.min(currentFrame, session.frames.length - 1)]?.t ?? 0
  const videoFile = session.source.videoFile

  useEffect(() => {
    setFailed(false)
    setAspectRatio(16 / 9)
    setSize(null)
  }, [session.sessionId])

  const fitToSource = (video: HTMLVideoElement) => {
    const ratio = video.videoWidth / video.videoHeight
    const host = containerRef.current?.parentElement
    if (!Number.isFinite(ratio) || ratio <= 0 || !host) return
    const maxWidth = Math.max(180, host.clientWidth - 28)
    const maxHeight = Math.max(110, host.clientHeight - 28)
    let width = Math.min(420, Math.max(220, host.clientWidth * 0.31))
    let height = width / ratio
    if (height > maxHeight) {
      height = maxHeight
      width = height * ratio
    }
    if (width > maxWidth) {
      width = maxWidth
      height = width / ratio
    }
    setAspectRatio(ratio)
    setSize({ width, height })
  }

  const beginResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const container = containerRef.current
    const host = container?.parentElement
    if (!container || !host) return
    event.preventDefault()
    const start = container.getBoundingClientRect()
    const startX = event.clientX
    const startY = event.clientY
    const maxWidth = host.clientWidth - 28
    const maxHeight = host.clientHeight - 28
    const maxAspectWidth = Math.max(180, Math.min(maxWidth, maxHeight * aspectRatio))
    const minWidth = Math.min(maxAspectWidth, Math.max(180, 110 * aspectRatio))

    const move = (pointer: PointerEvent) => {
      const fromX = start.width + startX - pointer.clientX
      const fromY = (start.height + startY - pointer.clientY) * aspectRatio
      const horizontalChange = Math.abs(fromX - start.width)
      const verticalChange = Math.abs(fromY - start.width)
      const width = Math.min(maxAspectWidth, Math.max(minWidth, horizontalChange >= verticalChange ? fromX : fromY))
      setSize({ width, height: width / aspectRatio })
    }
    const finish = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', finish, { once: true })
    window.addEventListener('pointercancel', finish, { once: true })
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = playbackRate
    if (playing) {
      void video.play().catch(() => {
        // A browser may still block muted autoplay. The next explicit play-button click
        // or frame update will retry; the 3D viewer remains fully usable meanwhile.
      })
    } else {
      video.pause()
    }
  }, [playing, playbackRate])

  useEffect(() => {
    const video = videoRef.current
    if (!video || video.readyState === 0) return
    const tolerance = Math.max(0.06, 2 / Math.max(1, session.timebase.videoFps))
    if (!playing || Math.abs(video.currentTime - targetTime) > tolerance) {
      video.currentTime = targetTime
    }
  }, [currentFrame, playing, session.timebase.videoFps, targetTime])

  if (!videoFile) return null

  return (
    <section
      ref={containerRef}
      className="reference-video"
      aria-label="Synchronized 2D reference video. Resize from the top-left handle."
      title="Drag the top-left handle to resize the synchronized reference"
      style={size ? { width: size.width, height: size.height, aspectRatio } : { aspectRatio }}
    >
      <button
        type="button"
        className="reference-resize-hint"
        aria-label="Resize synchronized reference video while preserving its aspect ratio"
        title="Drag to resize"
        onPointerDown={beginResize}
      >
        resize ↖
      </button>
      <div className="view-badge">
        <strong>2D reference</strong>
        <span className="mono">frame {currentFrame}</span>
      </div>
      {failed ? (
        <div className="video-fallback dim small">The synchronized reference video could not be loaded.</div>
      ) : (
        <video
          ref={videoRef}
          src={`/sessions/${videoFile}`}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(event) => {
            fitToSource(event.currentTarget)
            event.currentTarget.currentTime = targetTime
            event.currentTarget.playbackRate = playbackRate
          }}
          onError={() => setFailed(true)}
        />
      )}
    </section>
  )
}
