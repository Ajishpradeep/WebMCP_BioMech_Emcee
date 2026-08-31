/**
 * Category A — session & context.
 *
 * `get_session_overview` is the flagship "why WebMCP" tool: it answers *what is the human
 * looking at right now?*, and that state exists only in this browser tab. No backend MCP
 * server can answer it, however much pitching data it holds.
 */

import { normalisedPct } from '../../../biomech/analyze'
import { useAnalysis } from '../../../store'
import type { OverlayName } from '../../../types'
import { metaFor, type PitchTool } from '../../registry'
import { EVENT_LABEL } from '../../vocab'
import { pct, qualityOf, resolveSession, r3 } from '../shared'

export const listPitchSessions: PitchTool = {
  name: 'list_pitch_sessions',
  title: 'List pitch sessions',
  description:
    'Lists the pitch analyses available in this browser, with pitcher handedness, camera view, frame count, and whether each has been analysed yet. Start here: every other tool addresses a pitch by the sessionId returned from this list.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  // Labels come from the clip manifest or an uploaded file — text this page does not vouch for.
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  execute() {
    const st = useAnalysis.getState()
    const sessions = st.index.map((entry) => {
      const cached = st.cache[entry.sessionId]
      return {
        sessionId: entry.sessionId,
        label: entry.label,
        handedness: entry.handedness,
        view: entry.view,
        frameCount: entry.frameCount,
        fps: cached?.session.timebase.videoFps ?? null,
        analysed: Boolean(cached),
        quality: cached ? qualityOf(cached) : null,
      }
    })
    return {
      sessions,
      activeSessionId: st.session?.sessionId ?? null,
      meta: metaFor(st.session, 'high', [], [
        'quality is null for pitches not yet analysed in this browser; load one to populate it.',
      ]),
    }
  },
}

export const getSessionOverview: PitchTool = {
  name: 'get_session_overview',
  title: 'Get session overview',
  description:
    'Returns what is on screen right now: the loaded pitch, the frame the viewer is scrubbed to, the joint in focus, the camera plane, which overlays are on, which events were detected, and how many notes are pinned. This is live browser state — call it before discussing anything so your words match what the human sees.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Defaults to the pitch currently on screen.' },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  async execute(input) {
    const st = useAnalysis.getState()
    const entry = await resolveSession(input.sessionId)
    const { session, analysis } = entry
    const isActive = st.session?.sessionId === session.sessionId
    const frame = isActive ? st.currentFrame : 0
    const clipFrame = session.frames[Math.min(frame, session.frames.length - 1)]

    return {
      sessionId: session.sessionId,
      label: session.source.label,
      onScreen: isActive,
      subject: {
        handedness: session.subject.handedness,
        heightMeters: session.subject.heightMeters,
      },
      capture: {
        view: session.source.view,
        model: session.capture.model,
        frameCount: session.frames.length,
        videoFps: session.timebase.videoFps,
        slowMotion: session.timebase.slowMotion,
        realTimeScale: session.timebase.realTimeScale,
        cameraFrame: session.capture.cameraFrame,
      },
      viewer: {
        currentFrame: frame,
        currentTimeVideoSeconds: r3(clipFrame?.t ?? 0),
        pctOfContactToRelease: pct(normalisedPct(frame, analysis.events)),
        selectedJoint: isActive ? st.selectedJoint : null,
        cameraPlane: isActive ? st.cameraPlane : null,
        playing: isActive ? st.playing : false,
        activeOverlays: isActive
          ? (Object.keys(st.overlays) as OverlayName[]).filter((o) => st.overlays[o])
          : [],
        pinnedAnnotations: isActive ? st.annotations.length : 0,
      },
      eventsDetected: analysis.events.map((e) => ({
        name: e.name,
        label: EVENT_LABEL[e.name],
        frame: e.frame,
        confidence: e.confidence,
      })),
      quality: qualityOf(entry),
      meta: metaFor(session, qualityOf(entry).eventDetection, [], [
        'currentFrame, selectedJoint, cameraPlane and overlays are client-only state — they exist only in this browser tab.',
      ]),
    }
  },
}
