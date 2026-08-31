/**
 * WebMCP registration layer — the single choke point for every tool response.
 *
 * Three jobs:
 *  1. **Return-shape convention.** Sources disagree on whether `execute` must return the
 *     MCP-style `{content:[…]}` envelope or a plain object (technical reference §3.4).
 *     The spec is the most permissive — `Promise<any>`, auto-serialised — so we return
 *     plain objects. If a target agent turns out to need the envelope, change
 *     `toolResult()` HERE and nowhere else.
 *  2. **Error discipline.** A thrown stack trace tells a model nothing. Every failure
 *     comes back as a structured, retryable message naming the values that would work.
 *  3. **Lifecycle.** The surface is registered once for this document. Tools resolve
 *     the current Zustand state at execution time, so changing sessions never leaves a
 *     host with stale tool definitions or creates duplicate registrations.
 */

import { buildMeta, DISCLAIMER, type MetaBlock } from '../biomech/confidence'
import { CITATIONS } from '../biomech/reference'
import type { Confidence, Session } from '../types'

/* ── the slice of the WebMCP API we depend on ────────────────────────────── */

export interface ModelContextToolDef {
  name: string
  title?: string
  description: string
  inputSchema?: object
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean }
  execute: (input: Record<string, unknown>) => Promise<unknown>
}

interface ModelContextLike extends EventTarget {
  registerTool(tool: ModelContextToolDef, options?: { signal?: AbortSignal }): Promise<void>
  getTools?(): Promise<unknown[]>
}

declare global {
  interface Document {
    readonly modelContext?: ModelContextLike
  }
}

/* ── tool definition ─────────────────────────────────────────────────────── */

export interface PitchTool {
  name: string
  title: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
    additionalProperties?: boolean
  }
  annotations: { readOnlyHint: boolean; untrustedContentHint?: boolean }
  execute: (input: Record<string, unknown>) => unknown | Promise<unknown>
}

/**
 * A bad input the model can fix by itself. Carries the values that would have worked, so
 * the retry is informed rather than a guess.
 */
export class ToolInputError extends Error {
  constructor(message: string, readonly validValues?: Record<string, string[]>) {
    super(message)
    this.name = 'ToolInputError'
  }
}

/**
 * ★ The return-shape choke point. Everything a tool returns passes through here.
 * Today: identity. That is deliberate — see the file header.
 */
export function toolResult<T>(data: T): T {
  return data
}

/** Run a tool with the house error convention applied. Exported so tests exercise it. */
export async function runTool(tool: PitchTool, input: Record<string, unknown> = {}) {
  try {
    return toolResult(await tool.execute(input ?? {}))
  } catch (err) {
    if (err instanceof ToolInputError) {
      return toolResult({
        ok: false,
        error: err.message,
        ...(err.validValues ? { validValues: err.validValues } : {}),
        retryable: true,
      })
    }
    // Never hand a stack trace to a model: it cannot act on one.
    const detail = err instanceof Error ? err.message : String(err)
    console.error(`[webmcp] ${tool.name} failed`, err)
    return toolResult({
      ok: false,
      error: `${tool.name} could not complete: ${detail}`,
      retryable: false,
    })
  }
}

/* ── shared response furniture ───────────────────────────────────────────── */

/** Citation keys → short, quotable strings. Sourced from `reference.ts`, never retyped. */
export function cite(keys: Iterable<string>): string[] {
  const out: string[] = []
  for (const k of new Set(keys)) {
    const c = CITATIONS[k]
    if (c) out.push(c.short)
  }
  return out
}

/**
 * The `meta` block every response carries — confidence, camera-frame warning, citations
 * and the disclaimer. Part of the product, not boilerplate: an agent that cannot see the
 * error bars will state our numbers with more certainty than they deserve.
 */
export function metaFor(
  session: Session | null,
  confidence: Confidence,
  citationKeys: string[] = [],
  caveats: string[] = [],
): MetaBlock {
  const citations = cite(citationKeys)
  if (!session) {
    return {
      confidence,
      cameraFrame: true,
      disclaimer: DISCLAIMER,
      citations,
      caveats: caveats.length ? caveats : undefined,
    }
  }
  return buildMeta(session, confidence, citations, caveats)
}

/**
 * Resolve after the browser has painted, so a write tool's UI change is on screen before
 * the tool returns (Chrome best practice: agents read the page to plan the next step).
 * Falls back to a timer where rAF never fires — background tabs, and Node under test.
 */
export function nextPaint(): Promise<void> {
  if (typeof requestAnimationFrame !== 'function') return new Promise((r) => setTimeout(r, 0))
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (!done) {
        done = true
        resolve()
      }
    }
    requestAnimationFrame(() => requestAnimationFrame(finish))
    setTimeout(finish, 120) // a hidden tab never paints; do not hang the agent
  })
}

/* ── registration ────────────────────────────────────────────────────────── */

export function isWebMCPSupported(): boolean {
  return typeof document !== 'undefined' && typeof document.modelContext?.registerTool === 'function'
}

export interface RegistrationReport {
  registered: number
  failed: string[]
}

/**
 * Register every tool against the live `document.modelContext`. No-ops silently where
 * WebMCP is absent — the app must stay fully usable in a browser without it.
 * Returns both the registered count and any failed names. A partial surface must be
 * visible to the human; silently presenting it as fully agent-enabled is a demo risk.
 */
export async function registerTools(tools: PitchTool[], signal: AbortSignal): Promise<RegistrationReport> {
  if (!isWebMCPSupported()) return { registered: 0, failed: [] }
  const ctx = document.modelContext!
  let registered = 0
  const failed: string[] = []

  const define = (tool: PitchTool): ModelContextToolDef => ({
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
    annotations: tool.annotations,
    execute: (input) => runTool(tool, input),
  })

  for (const tool of tools) {
    if (signal.aborted) break
    try {
      await ctx.registerTool(define(tool), { signal })
      registered++
    } catch (err) {
      // Usually a duplicate name: the previous session's registration has not finished
      // tearing down. Give the abort a tick to land, then try once more. One failing
      // tool must never take the rest of the surface down with it.
      try {
        await new Promise((r) => setTimeout(r, 50))
        if (signal.aborted) break
        await ctx.registerTool(define(tool), { signal })
        registered++
      } catch (retryErr) {
        console.warn(`[webmcp] could not register ${tool.name}`, retryErr ?? err)
        failed.push(tool.name)
      }
    }
  }
  return { registered, failed }
}
