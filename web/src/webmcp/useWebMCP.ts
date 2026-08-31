/**
 * Registration lifecycle.
 *
 * The surface is scoped to an `AbortController` tied to the loaded pitch: switching
 * sessions aborts, which unregisters and fires `toolchange`, then re-registers. That is a
 * justified use of dynamic registration rather than a gratuitous one — the tools' answers
 * are about the pitch on screen, so an agent holding a stale registry is holding stale
 * context. Where WebMCP is absent the hook reports it and does nothing else; the app must
 * stay completely usable without it.
 */

import { useEffect, useState } from 'react'

import { useAnalysis } from '../store'
import { isWebMCPSupported, registerTools } from './registry'
import { ALL_TOOLS } from './tools'

export interface WebMCPStatus {
  supported: boolean
  registered: number
  toolNames: string[]
}

export function useWebMCP(): WebMCPStatus {
  const sessionId = useAnalysis((s) => s.session?.sessionId ?? null)
  const indexState = useAnalysis((s) => s.indexState)
  const [registered, setRegistered] = useState(0)
  const supported = isWebMCPSupported()

  useEffect(() => {
    if (!supported) return
    const controller = new AbortController()
    let live = true

    registerTools(ALL_TOOLS, controller.signal).then((n) => {
      if (live) setRegistered(n)
    })

    return () => {
      live = false
      controller.abort()
    }
  }, [supported, sessionId, indexState])

  return { supported, registered, toolNames: ALL_TOOLS.map((t) => t.name) }
}
