/**
 * Registration lifecycle.
 *
 * Tools resolve the live Zustand state when executed, so the fixed 13-tool surface is
 * registered once per document rather than churned on every session change. Where WebMCP
 * is absent the hook reports it and does nothing else; the app stays usable without it.
 */

import { useEffect, useState } from 'react'

import { isWebMCPSupported, registerTools } from './registry'
import { ALL_TOOLS } from './tools'

export interface WebMCPStatus {
  supported: boolean
  state: 'unsupported' | 'registering' | 'ready' | 'partial' | 'error'
  registered: number
  failures: string[]
  toolNames: string[]
}

export function useWebMCP(): WebMCPStatus {
  const [registered, setRegistered] = useState(0)
  const [failures, setFailures] = useState<string[]>([])
  const [state, setState] = useState<WebMCPStatus['state']>('unsupported')
  const supported = isWebMCPSupported()

  useEffect(() => {
    if (!supported) {
      setState('unsupported')
      return
    }
    const controller = new AbortController()
    let live = true
    // In React Strict Mode, delaying one task lets the intentional development-only
    // setup/cleanup rehearsal cancel before it ever touches the host registry.
    const timer = window.setTimeout(() => {
      setState('registering')
      registerTools(ALL_TOOLS, controller.signal)
        .then((report) => {
          if (!live) return
          setRegistered(report.registered)
          setFailures(report.failed)
          setState(report.registered === ALL_TOOLS.length ? 'ready' : 'partial')
        })
        .catch((err) => {
          console.error('[webmcp] registration failed', err)
          if (live) setState('error')
        })
    }, 0)

    return () => {
      live = false
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [supported])

  return { supported, state, registered, failures, toolNames: ALL_TOOLS.map((t) => t.name) }
}
