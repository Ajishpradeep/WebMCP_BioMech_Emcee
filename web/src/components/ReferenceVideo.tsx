import { useEffect, useRef, useState } from 'react'

import { useAnalysis } from '../store'
import type { Session } from '../types'

/**
 * The floating source-video reference follows the shared frame clock rather than owning
 * a second timeline. During playback the browser advances the video normally; frame
 * changes, seeks, loops, and WebMCP actions correct any drift against the session timestamp.
 */
export function ReferenceVideo({ session }: { session: Session }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const currentFrame = useAnalysis((s) => s.currentFrame)
  const playing = useAnalysis((s) => s.playing)
  const playbackRate = useAnalysis((s) => s.playbackRate)

  const targetTime = session.frames[Math.min(currentFrame, session.frames.length - 1)]?.t ?? 0
  const videoFile = session.source.videoFile

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
      className="reference-video"
      aria-label="Synchronized 2D reference video. Resize from the lower-right corner."
      title="Drag the lower-right corner to resize the synchronized reference"
    >
      <div className="view-badge">
        <strong>2D reference</strong>
        <span className="mono">frame {currentFrame}</span>
      </div>
      <span className="reference-resize-hint" aria-hidden="true">resize ↘</span>
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
            event.currentTarget.currentTime = targetTime
            event.currentTarget.playbackRate = playbackRate
          }}
          onError={() => setFailed(true)}
        />
      )}
    </section>
  )
}
