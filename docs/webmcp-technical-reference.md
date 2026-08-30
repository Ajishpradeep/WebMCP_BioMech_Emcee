# WebMCP Technical Reference

**Status of this document:** Compiled 2026-08-30 from primary sources opened during research
(Chrome for Developers docs, the W3C Web Machine Learning CG spec, the `webmachinelearning/webmcp`
explainer, OpenAI's ChatGPT WebMCP guide, and Context7 snapshots of the spec/explainer repos).
Every non-obvious claim below is linked to the page it came from. See
[§9 Unverified & Contradictory](#9-unverified--contradictory) for what I could *not* confirm.

> **WebMCP is a moving target.** It is a Community Group *draft*, in *origin trial* — not a shipped,
> stable web platform feature. Details in this doc (especially the execute-return shape, §3.4) are
> known to differ between sources that were all published within the last few months. Re-verify
> against the spec before depending on any single signature.

---

## Table of contents

1. [What WebMCP is, and how it differs from MCP](#1-what-webmcp-is-and-how-it-differs-from-mcp)
2. [Spec status](#2-spec-status)
3. [Core API surface (imperative)](#3-core-api-surface-imperative)
4. [Declarative API (HTML forms)](#4-declarative-api-html-forms)
5. [How agents discover and call tools](#5-how-agents-discover-and-call-tools)
6. [Security model](#6-security-model)
7. [Enabling and testing WebMCP today](#7-enabling-and-testing-webmcp-today)
8. [Known limitations & open issues](#8-known-limitations--open-issues)
9. [Unverified & contradictory](#9-unverified--contradictory)
10. [Quickstart](#10-quickstart)
11. [References](#11-references)

---

## 1. What WebMCP is, and how it differs from MCP

WebMCP is **"a proposed web standard to help you build and expose structured tools for AI agents"**
([Chrome docs](https://developer.chrome.com/docs/ai/webmcp)). A page calls a JavaScript API to
declare named, schema-typed capabilities; an agent viewing that page discovers and invokes them
directly instead of guessing at the DOM.

### The problem it solves: actuation

Chrome's docs name the status quo **actuation** — *"the act of an agent simulating manual mouse
clicks and text input, as though it were the human user engaging with your website"*
([Chrome docs](https://developer.chrome.com/docs/ai/webmcp)). Actuation is brittle: it depends on
DOM structure, is slow, and misreads ambiguous UI. WebMCP replaces guessing with an explicit
contract.

Chrome frames three foundational capabilities:

| Capability | What it gives the agent |
|---|---|
| **Discovery** | A standard registry of named tools (`checkout`, `filter_results`) |
| **JSON Schemas** | Explicit input/output definitions, which reduce hallucination |
| **State** | Shared awareness of live page context (e.g. real-time availability) |

### Why not just build an MCP server?

The [explainer](https://github.com/webmachinelearning/webmcp/blob/main/README.md) argues that
backend MCP integrations cause:

- **UI disintermediation** — the agent talks to your backend and your interface is bypassed entirely.
- **State replication** — you must duplicate user context and auth on a separate server.
- **Developer burden** — exposing a capability means standing up a server, rather than reusing
  client-side logic you already wrote.

WebMCP's pitch is a client-side alternative enabling *"visually rich, cooperative interplay between
a user, a web page, and an agent with shared context."*

### WebMCP vs MCP — the actual distinction

OpenAI's guide states it most cleanly: **WebMCP operates within the webpage context** — you and the
agent look at the same live page, with the same session and authentication. **MCP connects to
independent servers** that run apart from any open webpage. *A site can support both simultaneously.*
([learn.chatgpt.com/docs/webmcp](https://learn.chatgpt.com/docs/webmcp))

The explainer adds the design-level differences:

- MCP was designed for server-to-client / process communication; WebMCP is natively built for browsers.
- WebMCP incorporates web concepts MCP has no notion of: **origins, permissions policy, DOM
  integration, tab lifecycle**.
- The explainer explicitly rejects coupling tightly to MCP, on grounds that it *"would hinder
  backward compatibility and platform stability."*
- They share vocabulary (tools, schemas, parameters), but WebMCP aims to be *"form-fitting,
  client-safe."*

**Practical read:** despite the name, WebMCP is *not* MCP-over-the-DOM. It is a web API inspired by
MCP's tool vocabulary. Do not assume MCP SDK types transfer.

### Goals and non-goals (from the explainer)

**Goals:** human-in-the-loop workflows with user visibility and control; simpler agent integration;
preventing disintermediation by adapting front-ends for agents; reuse of existing client-side logic;
improved accessibility with agents as intermediaries.

**Explicit non-goals:** supporting **headless browsing**; enabling **fully autonomous workflows
without human oversight**; **replacing MCP**; **replacing human web interfaces**.

> The non-goals matter for hackathon scoping: a design that only works with a human watching is
> *on-thesis*, not a limitation.

---

## 2. Spec status

State this precisely, because it changes what you can rely on:

| Dimension | Status | Source |
|---|---|---|
| Document type | **Draft Community Group Report**, published **2026-08-26** | [spec](https://webmachinelearning.github.io/webmcp/) |
| Venue | **W3C Web Machine Learning Community Group** (a CG, *not* a chartered W3C Working Group — no Recommendation track yet) | [spec](https://webmachinelearning.github.io/webmcp/) |
| Editors | Brandon Walderman (Microsoft), Khushal Sagar (Google), Dominic Farolino (Google) | [spec](https://webmachinelearning.github.io/webmcp/) |
| Licensing | W3C Community Contributor License Agreement (CLA) | [spec](https://webmachinelearning.github.io/webmcp/) |
| Test suite | `https://wpt.fyi/results/webmcp` | [spec](https://webmachinelearning.github.io/webmcp/) |
| Browser status | Origin trial, Chrome 149 / Edge 150; experimental in Brave Leo + ChatGPT Desktop; Firefox & Safari under review | [implementation-status.md](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md) |
| Chrome Status feature ID | `5117755740913664` | [implementation-status.md](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md) |

### Cross-browser position

| Engine | Position |
|---|---|
| Chrome | Origin Trial, **149** |
| Edge | Origin Trial, **150** (same Chromium base) |
| Brave | Experimental support in Leo AI chat |
| ChatGPT Desktop | Supported |
| Firefox | **Under review** — Mozilla standards-positions #1412, Bugzilla entry filed |
| Safari | **Under review** — WebKit standards-positions #670 |

No Firefox or Safari implementation timeline has been announced. Treat WebMCP as
**Chromium + ChatGPT-only** for the foreseeable term.

---

## 3. Core API surface (imperative)

### 3.1 Entry point

The spec extends `Document`:

```webidl
partial interface Document {
  [SecureContext, SameObject] readonly attribute ModelContext modelContext;
};
```

`document.modelContext` is **`SecureContext`-gated** — HTTPS (or `localhost`) only.

### 3.2 The `ModelContext` interface

Verbatim WebIDL from the spec:

```webidl
[Exposed=Window, SecureContext]
interface ModelContext : EventTarget {
  Promise<undefined> registerTool(ModelContextTool tool, optional ModelContextRegisterToolOptions options = {});
  Promise<sequence<RegisteredTool>> getTools(optional ModelContextGetToolOptions options = {});

  attribute EventHandler ontoolchange;
};
```

The spec text as fetched also documents a third method, which the IDL block above (a Context7
snapshot) omits — see [§9](#9-unverified--contradictory):

```webidl
Promise<DOMString> executeTool(RegisteredTool tool,
                              optional object inputObject = {},
                              optional ModelContextExecuteToolOptions options = {});
```

### 3.3 Dictionaries

```webidl
dictionary ModelContextTool {
  required DOMString name;
  // Because `title` is for display in possibly native UIs, this must be a `USVString`.
  USVString title;
  required DOMString description;
  object inputSchema;
  required ToolExecuteCallback execute;
  ToolAnnotations annotations;
};

dictionary ToolAnnotations {
  boolean readOnlyHint = false;
  boolean untrustedContentHint = false;
};

callback ToolExecuteCallback = Promise<any> (object input);

dictionary ModelContextRegisterToolOptions {
  AbortSignal signal;
  sequence<USVString> exposedTo;
};

dictionary ModelContextGetToolOptions {
  sequence<USVString> fromOrigins;
};

dictionary RegisteredTool {
  required DOMString name;
  DOMString title;
  required DOMString description;
  DOMString inputSchema;
  required Window window;
  required USVString origin;
  ToolAnnotations annotations;
};
```

**Field notes:**

- `name` — **required**. Must be unique per document. Constraint: **1–128 characters**, alphanumeric
  plus underscore, hyphen, period ([spec](https://webmachinelearning.github.io/webmcp/)).
- `title` — optional human-readable label; `USVString` because it may render in *native* browser UI.
- `description` — **required**. This is the natural-language contract the model reads to decide
  whether to call your tool. It is the single highest-leverage string in your app.
- `inputSchema` — optional JSON Schema object. Note the asymmetry: `ModelContextTool.inputSchema` is
  an `object` on the way in, but `RegisteredTool.inputSchema` is a `DOMString` on the way out
  (serialized for cross-context exposure).
- `execute` — **required** callback.
- `annotations` — `readOnlyHint` (tool preserves state) and `untrustedContentHint` (output contains
  content the site does not vouch for). Both default `false`. See [§6](#6-security-model).

There is **no `outputSchema`** in the current dictionary. The explainer lists "Output contracts:
structured `outputSchema` specifications" as an *open question*, not a shipped feature.

### 3.4 `registerTool` — behavior

```javascript
const controller = new AbortController();

await document.modelContext.registerTool({
  name: "add-todo",
  description: "Add a new item to the user's active todo list",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "The text content" }
    },
    required: ["text"]
  },
  async execute({ text }) {
    await addTodoItemToCollection(text);
    return {
      content: [{
        type: "text",
        text: `Added todo item: "${text}" successfully.`
      }]
    };
  }
}, { signal: controller.signal });
```
*Source: [explainer README](https://github.com/webmachinelearning/webmcp/blob/main/README.md)*

The returned promise **rejects** if a tool with the same name is already registered, if `name` or
`description` is empty, or if `inputSchema` is not a valid JSON-serializable object
([spec, via Context7](https://webmachinelearning.github.io/webmcp/)).

> ### ⚠️ The execute-return shape is genuinely inconsistent across official sources
>
> This is the most important discrepancy in this document. Three primary sources disagree:
>
> | Source | Shown return value |
> |---|---|
> | [Explainer README](https://github.com/webmachinelearning/webmcp/blob/main/README.md) | MCP-style envelope: `{ content: [{ type: "text", text: "..." }] }` |
> | [Spec IDL](https://webmachinelearning.github.io/webmcp/) | `callback ToolExecuteCallback = Promise<any> (object input)` — *any* JSON-serializable value (strings, numbers, booleans, objects, arrays, null) |
> | [OpenAI guide](https://learn.chatgpt.com/docs/webmcp) | Plain object: `execute: async () => ({ title: document.title })` |
> | [Chrome imperative-api docs](https://developer.chrome.com/docs/ai/webmcp/imperative-api) | Described as "returning a result string" |
>
> **Reconciliation:** the *spec* is authoritative and is the most permissive — `Promise<any>`,
> auto-serialized to JSON. The MCP-style `{content: [...]}` envelope in the explainer is therefore a
> *legal* return value, not a required one, and reads as a holdover from MCP vocabulary. The
> "stringified JSON" language in Chrome's docs and in `executeTool`'s `Promise<DOMString>` return
> refers to what the **caller** receives after serialization, not what your callback must produce.
>
> **Recommendation:** return a plain JSON-serializable object. Verify against your target agent
> (ChatGPT in-app browser vs. Chrome) before relying on either shape.

### 3.5 `execute` callback signature

Two forms appear in the sources:

- Spec IDL: `Promise<any> (object input)` — one argument.
- [Chrome imperative-api docs](https://developer.chrome.com/docs/ai/webmcp/imperative-api) and
  [Context7's explainer autodocs](https://github.com/webmachinelearning/webmcp): a second
  `ToolExecuteCallbackOptions` argument carrying an **`AbortSignal`**:
  `execute: async (params, { signal }) => { ... }`.

The `signal` is how you learn the user cancelled mid-execution. Forward it to any `fetch()` you make
inside the tool. The spec IDL block above appears to be behind the docs here; assume the two-arg form
is available and feature-detect.

Behavior notes (from Context7's autodocs of the explainer repo):

- The callback runs in the **tool owner document's context**.
- The return value is automatically serialized to JSON.
- If the callback throws or its promise rejects, execution is **reported as failed to the agent**.
- Serialization errors also result in failure.

### 3.6 Lifecycle — unregistering and updating

Unregistration is via `AbortSignal`, not an `unregisterTool()` method:

```javascript
const controller = new AbortController();
await document.modelContext.registerTool({ /* ... */ }, { signal: controller.signal });

// later — tool disappears from the registry and `toolchange` fires
controller.abort();
```

Per Context7's autodocs: *"An AbortSignal used to unregister the tool. If aborted, the tool is
removed and a `toolchange` event is fired."* Chrome's imperative-api docs add that from **Chrome
153+**, aborting removes the tool *without breaking active executions*. Below 153, assume an abort
may disrupt an in-flight call.

Listen for registry changes:

```javascript
document.modelContext.addEventListener("toolchange", async () => {
  const currentTools = await document.modelContext.getTools();
  updateAgentToolRegistry(currentTools);
});
```
*Source: [explainer README](https://github.com/webmachinelearning/webmcp/blob/main/README.md)*

Chrome's [best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices) advise that
**most applications should use static registration** — register once, keep it simple — and reach for
dynamic register/unregister only when tool availability genuinely depends on page state.

### 3.7 Discovery and manual execution

```javascript
// Discover tools
const tools = await document.modelContext.getTools();

// Execute a tool
const result = await document.modelContext.executeTool(
  addTodoTool,
  { text: "Buy groceries" }
);
```
*Source: [explainer README](https://github.com/webmachinelearning/webmcp/blob/main/README.md)*

Cancellation from the caller side:

```javascript
const controller = new AbortController();

const executionPromise = document.modelContext.executeTool(
  addTodoTool,
  { text: "Buy groceries" },
  { signal: controller.signal }
);

// If the user cancels the interaction:
stopButton.addEventListener('click', e => controller.abort());
```
*Source: [explainer README](https://github.com/webmachinelearning/webmcp/blob/main/README.md)*

`executeTool` returns `Promise<DOMString>` — a **stringified JSON** representation of the tool's
return value. Documented error conditions
([Context7 autodocs](https://github.com/webmachinelearning/webmcp)):

| Error | Cause |
|---|---|
| `InvalidStateError` | Document not fully active |
| `SecurityError` | Cross-origin mismatch, or permissions policy disabled |
| `NotAllowedError` | `"tools"` permissions policy is disabled |
| `NotSupportedError` | Tool origin is invalid or opaque |
| `UnknownError` | Tool not found / not exposed / cross-document execution failed / callback rejected |
| `TypeError` | Input cannot be serialized to JSON |

Chrome's docs note `executeTool` returns **`null` on navigation**.

> `executeTool` is primarily how *you* test and how a same-origin coordinator drives tools — it is
> not how an external agent invokes them. See [§5](#5-how-agents-discover-and-call-tools).

### 3.8 Cross-origin exposure

By default a tool is exposed to same-origin documents and browser agents. Widen it explicitly:

```javascript
await document.modelContext.registerTool({
  name: "share-location",
  description: "Returns the user's office location.",
  execute() { return { office: "Building 4" }; }
}, { exposedTo: ["https://trusted-partner.example"] });
```
*Source: [explainer README](https://github.com/webmachinelearning/webmcp/blob/main/README.md)*

Consumers must opt in on their side too, via `getTools({ fromOrigins: [...] })`
([Chrome docs](https://developer.chrome.com/docs/ai/webmcp/imperative-api)). Cross-origin iframes
additionally require `allow="tools"` — see [§6.1](#61-platform-gating).

---

## 4. Declarative API (HTML forms)

For form-shaped interactions, the browser can **synthesize a tool definition from a `<form>`**, with
no JavaScript. Two attributes are required; both must be present or the tool does not exist.

```html
<form toolname="createSupportRequest"
      tooldescription="Submits a request for customer support.">
</form>
```
*Source: [Chrome declarative-api docs](https://developer.chrome.com/docs/ai/webmcp/declarative-api)*

| Attribute | On | Meaning |
|---|---|---|
| `toolname` | `<form>` | Tool name. **Required.** |
| `tooldescription` | `<form>` | Tool description. **Required.** |
| `toolparamdescription` | form controls | Maps a field to a JSON Schema property description. Falls back to the associated `<label>` content or `aria-description` if omitted. |
| `toolautosubmit` | `<form>` | Lets the agent submit the form itself (with navigation). Without it, a human must click Submit. |

**Unregistration:** removing either `toolname` or `tooldescription` unregisters the tool.

**Submit integration** — `SubmitEvent` gains:

- `agentInvoked` (boolean) — whether an AI agent triggered this submission.
- `respondWith(Promise<any>)` — return a value to the model as tool output. Requires calling
  `preventDefault()` first.

**Events** (fire on `window`, non-cancelable, each carrying a `toolName` attribute):

- `"toolactivated"` — an agent has pre-filled the form's fields.
- `"toolcancel"` — the user cancelled, or `reset()` was invoked.

**CSS pseudo-classes** for visual feedback — both deactivate after submission, agent cancellation, or
user reset:

- `:tool-form-active` — on the `<form>`
- `:tool-submit-active` — on the submit button

> **Critical caveat:** the [OpenAI guide](https://learn.chatgpt.com/docs/webmcp) states the
> declarative API is **not supported** in ChatGPT's in-app browser. If your target agent is ChatGPT,
> you must use the imperative API. The explainer also notes that imperative registration remains
> necessary regardless, since *"websites cannot be built exclusively out of declarative forms."*

---

## 5. How agents discover and call tools

### ChatGPT in-app browser

Per [learn.chatgpt.com/docs/webmcp](https://learn.chatgpt.com/docs/webmcp):

1. The user opens a site in ChatGPT's built-in browser and asks for help.
2. The agent **automatically detects** available tools.
3. The address bar shows a **"Site tools" indicator**, from which the user can inspect **"Available
   site tools"** and **"Recently used"** actions.
4. **Each request receives a safety review before execution.**

Because the agent is inside the page, it inherits **the same live page and the same authentication**
as the user. That is the core UX advantage over a backend MCP server: no separate OAuth dance, no
duplicated session.

**ChatGPT-specific limits** (all from the same page):

- Declarative API (HTML form attributes) — **unsupported**.
- **iframe tools are not discovered.**
- **Only JavaScript-registered tools in top-level pages function.**

OpenAI's own documentation site is cited as a live example, exposing `search_openai_docs`,
`lookup_page`, and `navigate_to_page`.

### Chrome

Chrome exposes the registry to browser-integrated agents and to extensions. For manual inspection
there is a **Model Context Tool Inspector** extension
([Chrome Web Store](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd))
and a built-in DevTools panel ([§7.3](#73-devtools)).

### Discovery hygiene

Chrome's [best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices) note there is
**no maximum tool count**, but *each tool consumes context window space* — more tools means slower
completion and worse selection. Budget deliberately.

---

## 6. Security model

WebMCP deliberately *"crosses traditional trust boundaries"* (explainer). Treat this section as
load-bearing, not boilerplate.

### 6.1 Platform gating

Three platform-level controls, all from [Chrome docs](https://developer.chrome.com/docs/ai/webmcp):

1. **Secure context** — `document.modelContext` is `SecureContext`-only.
2. **Origin isolation** — WebMCP requires origin-isolated documents. It is **disabled if you send
   `Origin-Agent-Cluster: ?0`**. (Easy to break accidentally; check your host's default headers.)
3. **Permissions Policy** — gated by the **`tools`** policy, which **defaults to `self`**.
   Cross-origin iframes need `allow="tools"`.

### 6.2 The threat: indirect prompt injection

From [Chrome's secure-tools guide](https://developer.chrome.com/docs/ai/webmcp/secure-tools): LLMs
are susceptible to *"indirect prompt injection, an inclusion of malicious instructions by an
attacker."* Models have defensive layers but remain probabilistic, and *"it's impossible to guarantee
safety inside of a large language model (LLM)."* The guide states there have been **repeatable prompt
injection attacks** against agentic systems using state-of-the-art models.

The [spec](https://webmachinelearning.github.io/webmcp/) enumerates the vectors:

| Vector | Description |
|---|---|
| Prompt injection | Metadata poisoning and output manipulation |
| Intent misrepresentation | Tool description diverges from actual behavior |
| Over-parameterization | Extra parameters used to exfiltrate data / leak privacy |
| Same-origin boundary violations | Escaping the origin model |

### 6.3 Mitigations you are responsible for

**Control exposure.** From the secure-tools guide: *"You can provide access to your tool with the
`exposedTo` option in `registerTool` to an array of specific, secure origins."* And: **"Only expose
your tools to origins that you trust. This is particularly important when tools manage user data or
otherwise impact the user."**

The guide draws a sharp line by tool kind:

- **Read-only tools** reveal user information → expose only to sites you would *share that data with*.
- **Read/write tools** take actions on the user's behalf → expose only to origins you trust to *act
  as the user*.

**Annotate honestly.**

- `readOnlyHint: true` on tools that preserve state.
- `untrustedContentHint: true` on any tool returning user-generated or externally-sourced data. The
  spec describes this as letting clients *sanitize payloads, visually highlight untrusted content for
  the model, or suppress the content entirely to prevent output injection attacks*.

**Respect character budgets.** From the secure-tools guide — these are stated as limits, and they
double as an anti-injection measure (a smaller surface is a smaller injection vector):

| Field | Budget |
|---|---|
| Tool name | 30 characters |
| Tool description | 500 characters |
| Parameter description | 150 characters |
| Tool output | 1.5 K per output |

**Request confirmation for consequential actions.** The spec includes `requestUserInteraction()`, to
*"asynchronously request user input at tool execution."* The secure-tools guide notes that broader
**consent management across parties is still under discussion** and offers no auth/authorization
pattern beyond origin-based exposure control.

### 6.4 Authentication

There is no WebMCP-specific auth mechanism. OpenAI's guidance is to **reuse your application's
existing authentication and authorization** — which works precisely because the agent is operating
inside the user's already-authenticated page. Your tool handlers must enforce the same
authorization checks your UI handlers do; a registered tool is a new entry point to your app.

---

## 7. Enabling and testing WebMCP today

### 7.1 Local development (fastest path)

Enable the flag:

```
chrome://flags/#enable-webmcp-testing
```
*Source: [Chrome docs](https://developer.chrome.com/docs/ai/webmcp)*

### 7.2 Origin trial (for a real deployed origin)

- Available from **Chrome 149** (Edge 150).
- Register at:
  `https://developer.chrome.com/origintrials/#/register_trial/4163014905550602241`
  ([Chrome docs](https://developer.chrome.com/docs/ai/webmcp))
- The origin trial was announced in the
  [WebMCP origin trial blog post](https://developer.chrome.com/blog/ai-webmcp-origin-trial),
  published **2026-06-09**. An earlier
  [early preview program announcement](https://developer.chrome.com/blog/webmcp-epp) is dated
  **2026-02-10**.

### 7.3 DevTools

There is a first-class debugging surface
([Chrome DevTools docs](https://developer.chrome.com/docs/devtools/application/webmcp)):

**Application panel → WebMCP** (top-level sidebar item). It shows:

- **Available Tools** — every detected tool with name, description, and an invocation counter.
- **Invoked Tools** — chronological log with status (Completed / Canceled / In Progress / Error),
  input parameters, and output values.

**Manual invocation without an agent:** click a tool in Available Tools (or the ▶ Play icon on an
invoked-tool row), adjust parameters in the input fields, and click **Run tool**. Testing from
invoked history pre-populates parameters; fresh tests start empty.

> This is the single most useful thing for development. You can build and debug the entire tool
> surface without an agent in the loop.

### 7.4 Other tooling

- **Model Context Tool Inspector** extension —
  [Chrome Web Store](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd)
- **`GoogleChromeLabs/webmcp-tools`** — inspection tools, an evaluation CLI, and sample apps
  ([demos](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos))
- **Lighthouse audit: "Registered WebMCP tools"** —
  [docs](https://developer.chrome.com/docs/lighthouse/agentic-browsing/registered-webmcp-tools)
- **React:** `use-webmcp-tool` hook on npm (npmjs.com returned 403 to automated fetch — see [§9](#9-unverified--contradictory))
- **Angular:** experimental WebMCP support — [angular.dev/ai/webmcp](https://angular.dev/ai/webmcp)
- **Chrome demos:** Pizza Maker, React Flight Search, Le Petit Bistro
- **Official polyfill:** *does not exist yet* — hosting one is
  [open issue #252](https://github.com/webmachinelearning/webmcp/issues). A third-party polyfill/bridge
  exists as **MCP-B** (`webmcp-org/npm-packages`), unaffiliated with the spec authors.

### 7.5 Testing strategy

Chrome's [evals guide](https://developer.chrome.com/docs/ai/webmcp/evals) frames the core problem:
*"one input could lead to thousands of answers with varying degrees of accuracy."* It recommends a
three-layer approach:

1. **Isolation testing** — use `document.modelContext.executeTool(...)` to invoke tools directly and
   verify the model picks the right tool with the right parameters.
2. **Deterministic tests** — conventional tests for tool logic, UI updates, and returned data accuracy.
3. **Probabilistic tests (evals)** — where model output drives subsequent calls. Cover both direct
   queries ("Add pepperoni") and ambiguous ones ("I want all meat toppings").

Failure modes to test explicitly: wrong tool chosen, wrong sequencing, wrong arguments, inaccurate
outputs. Also test **end-to-end journeys** with ordered and unordered tool chains, and **mid-chain
failure** where one tool fails but the process continues.

Chrome's best practices add: use **evaluation-driven development rather than hard-coded unit tests**;
when a case fails, *abstract and adjust the tool* rather than adding a narrow rule.

---

## 8. Known limitations & open issues

### Hard limitations (documented)

| Limitation | Source |
|---|---|
| Headless environments are out of scope — *"this API is primarily designed for local browser workflows with a human in the loop"* | [Chrome docs](https://developer.chrome.com/docs/ai/webmcp) |
| Fully autonomous workflows are an explicit non-goal | [explainer](https://github.com/webmachinelearning/webmcp/blob/main/README.md) |
| Tool discoverability is called out as a challenge | [Chrome docs](https://developer.chrome.com/docs/ai/webmcp) |
| ChatGPT: declarative API unsupported | [OpenAI guide](https://learn.chatgpt.com/docs/webmcp) |
| ChatGPT: iframe tools not discovered; top-level JS registration only | [OpenAI guide](https://learn.chatgpt.com/docs/webmcp) |
| Broken by `Origin-Agent-Cluster: ?0` | [Chrome docs](https://developer.chrome.com/docs/ai/webmcp) |
| No `outputSchema` yet | [spec](https://webmachinelearning.github.io/webmcp/) IDL + explainer open questions |
| No official polyfill | [issue #252](https://github.com/webmachinelearning/webmcp/issues) |
| Firefox / Safari: no implementation, no timeline | [implementation-status.md](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md) |

### Open design questions (from the explainer)

Multimodal I/O (binary media); cross-document responses (tool execution that causes navigation);
built-in agent exposure keywords like `native-agent`; streaming/chunked tool I/O; native schema
validation; "skills" coordinating multiple tools; structured `outputSchema`; permission dialogs for
authorization-requiring tools; progress reporting for long-running tasks; service worker integration.

### Selected open GitHub issues

The repo had **107 open issues** at time of research. Notable:

| # | Title | Why it matters |
|---|---|---|
| 262 | WebMCP loses important context when tools appear or disappear | Real limitation of dynamic registration — argues for static registration |
| 257 | Agent-Scoped Cookies | Unresolved: no way to scope credentials to agent actions |
| 256 | Origin Trial research note: observations on tool exposure, validation, and context cost | Field data on context cost of many tools |
| 255 | Tool collections: coarse-grained grouping with progressive disclosure | No grouping/progressive-disclosure primitive exists yet |
| 252 | Hosting official polyfill for WebMCP | No official polyfill |
| 242 | App → Agent explicit integration/manifest? | No manifest-level integration story |
| 239 | Grammar-level (structural) mitigation for prompt injection | Injection defenses are still an open research problem |
| 267 | Turn awareness | — |
| 266 | Implementation report: agent commerce storefront on WebMCP | Useful prior art |
| 261 | Proposal: preserve completed WebMCP tasks as reviewable workflow documents | — |

Issue list: <https://github.com/webmachinelearning/webmcp/issues>

---

## 9. Unverified & contradictory

Chase these down manually before relying on them.

1. **`provideContext` does not appear in any current source.** It was named in our research brief,
   but it is absent from the spec IDL, the explainer, and Chrome's docs. The current surface is
   `registerTool` / `getTools` / `executeTool` / `ontoolchange`. **Most likely an API from an earlier
   iteration of the proposal that has since been removed or renamed.** Do not build against it
   without confirming.

2. **`executeTool` is in the spec prose but missing from the Context7 IDL snapshot.** The direct
   spec fetch and Chrome's imperative-api docs both document it; Context7's cached IDL block for
   `interface ModelContext` lists only `registerTool`, `getTools`, and `ontoolchange`. Almost
   certainly a stale cache, but it means at least one of our two views of the spec is out of date.
   **Treat the live spec page as authoritative.**

3. **The execute-return shape conflicts across three official sources.** Fully documented in
   [§3.4](#34-registertool--behavior). Unresolved; verify empirically per agent.

4. **Chrome version conflict: 146 vs 149.** Cloudflare's blog states WebMCP is *"shipping
   experimentally in Chrome 146"*
   ([blog.cloudflare.com/webmcp](https://blog.cloudflare.com/webmcp/)). Chrome's own docs and
   `implementation-status.md` both say **origin trial from Chrome 149**, and the challenge rules
   require **Chrome 149+**. **Per our source-precedence rule, official Chrome docs win: 149.** The
   Cloudflare figure may refer to an earlier flag-gated build.

5. **`execute` callback arity: one argument or two?** Spec IDL says
   `Promise<any> (object input)`; Chrome docs and the explainer autodocs show
   `(params, { signal })`. Feature-detect rather than assume.

6. **Chrome 153+ abort semantics.** Chrome's imperative-api docs mention that from 153, aborting a
   registration does not break active executions. Chrome 153 is beyond the current origin trial
   version (149) — I could not verify what the behavior is *below* 153 beyond the implication that
   it is worse.

7. **`npmjs.com/package/use-webmcp-tool` returned HTTP 403** to automated fetch. The package is
   linked from the challenge resources page as the official React hook, but I could not read its
   README. Verify the API surface manually.

8. **`developers.openai.com/showcase?view=webmcp-apps` has no content yet** — the WebMCP filter
   displays *"WebMCP examples are coming soon."* There are therefore **no OpenAI-published WebMCP
   showcase apps to study**, despite the challenge linking to it as a resource. This materially
   affects the "learn from the showcase" plan in the challenge brief.

9. **The `webmcp` GitHub repo landing page does not state its own standardization venue.** The venue
   (W3C Web Machine Learning Community Group) comes from the spec document itself, which is the
   better source anyway.

10. **DevTools WebMCP panel: no minimum Chrome version is documented.** Assume it tracks the origin
    trial (149+).

---

## 10. Quickstart

Verified against the [explainer](https://github.com/webmachinelearning/webmcp/blob/main/README.md),
the [spec](https://webmachinelearning.github.io/webmcp/), and the
[OpenAI guide](https://learn.chatgpt.com/docs/webmcp). Nothing here is invented.

### Prerequisites

- Serve over **HTTPS** (or `localhost`) — `SecureContext` required.
- Do **not** send `Origin-Agent-Cluster: ?0`.
- Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled, or an origin-trial token.

### Minimal read-only tool

Feature detection pattern taken verbatim from OpenAI's guide:

```javascript
if (typeof document.modelContext?.registerTool === "function") {
  await document.modelContext.registerTool({
    name: "get_page_title",
    description: "Read the title of the current page.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: async () => ({ title: document.title }),
  });
}
```
*Source: [learn.chatgpt.com/docs/webmcp](https://learn.chatgpt.com/docs/webmcp)*

### A write tool with input, cancellation, and lifecycle

Composed from documented pieces (registration + `inputSchema` from the explainer; `signal` handling
from Chrome's imperative-api docs; annotations from the spec):

```javascript
const controller = new AbortController();

await document.modelContext.registerTool({
  name: "add-todo",
  title: "Add todo",
  description: "Add a new item to the user's active todo list",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "The text content" }
    },
    required: ["text"]
  },
  annotations: { readOnlyHint: false },
  async execute({ text }, { signal }) {
    // Enforce the same authorization your UI handler enforces.
    await addTodoItemToCollection(text, { signal });
    // Update the UI before returning: agents read the page to plan next steps.
    renderTodoList();
    return { ok: true, added: text };
  }
}, { signal: controller.signal });

// Unregister when the view goes away.
// controller.abort();
```

### Reacting to registry changes

```javascript
document.modelContext.addEventListener("toolchange", async () => {
  const currentTools = await document.modelContext.getTools();
  console.log("tools now:", currentTools.map(t => t.name));
});
```
*Source: [explainer README](https://github.com/webmachinelearning/webmcp/blob/main/README.md)*

### Test it without an agent

1. Open DevTools → **Application** → **WebMCP**.
2. Find your tool under **Available Tools**.
3. Click it, fill parameters, click **Run tool**.
4. Check **Invoked Tools** for status, inputs, and outputs.

### Design rules worth internalizing

From [Chrome best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices) and
[secure-tools](https://developer.chrome.com/docs/ai/webmcp/secure-tools):

- **One function per tool.** Multi-purpose tools confuse selection.
- **Action-verb names that distinguish doing from starting** — `create-event`, not
  `start-event-creation-process`. ≤30 characters.
- **Describe what the tool *can* do, not what it can't.** Positive framing. ≤500 characters.
- **Natural language over IDs** — `shipping="Express"`, never `shipping_id=1`.
- **Declare specific types** — `string`, `number`, `enum`. Parameter descriptions ≤150 characters.
- **Accept raw input.** Parse strings in your code; don't make the model do arithmetic or format
  conversion.
- **Loose schema, strict code.** Let the schema be forgiving so the model can self-correct; validate
  hard in the handler.
- **Return descriptive errors** so the model can retry with better parameters.
- **Fail gracefully on rate limits** — return a meaningful error or tell the user to do it manually.
- **Update the UI before you return.** Agents read the interface to plan next steps, and your
  function may finish after the interface has visibly settled.
- **Keep outputs under ~1.5 K** and mark externally-sourced content `untrustedContentHint: true`.
- **Keep the non-WebMCP interface working** for browsers without the API.

---

## 11. References

All opened during research on 2026-08-30.

### Specification & explainer
- WebMCP spec (Draft Community Group Report, 2026-08-26) — <https://webmachinelearning.github.io/webmcp/>
- Explainer README — <https://github.com/webmachinelearning/webmcp/blob/main/README.md>
- Repository — <https://github.com/webmachinelearning/webmcp>
- Implementation status — <https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md>
- Declarative API explainer — <https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md>
- Open issues — <https://github.com/webmachinelearning/webmcp/issues>
- Web platform tests — <https://wpt.fyi/results/webmcp>

### Chrome
- WebMCP overview — <https://developer.chrome.com/docs/ai/webmcp>
- Imperative API — <https://developer.chrome.com/docs/ai/webmcp/imperative-api>
- Declarative API — <https://developer.chrome.com/docs/ai/webmcp/declarative-api>
- Best practices — <https://developer.chrome.com/docs/ai/webmcp/best-practices>
- Secure tools — <https://developer.chrome.com/docs/ai/webmcp/secure-tools>
- Evals — <https://developer.chrome.com/docs/ai/webmcp/evals>
- Use cases — <https://developer.chrome.com/docs/ai/webmcp/use-cases>
- Origin trial blog (2026-06-09) — <https://developer.chrome.com/blog/ai-webmcp-origin-trial>
- Early preview blog (2026-02-10) — <https://developer.chrome.com/blog/webmcp-epp>
- DevTools debugging — <https://developer.chrome.com/docs/devtools/application/webmcp>
- Lighthouse audit — <https://developer.chrome.com/docs/lighthouse/agentic-browsing/registered-webmcp-tools>
- Origin trial registration — <https://developer.chrome.com/origintrials/#/register_trial/4163014905550602241>
- Model Context Tool Inspector — <https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd>

### OpenAI
- WebMCP guide — <https://learn.chatgpt.com/docs/webmcp>
- Showcase (WebMCP section empty as of research) — <https://developers.openai.com/showcase?view=webmcp-apps>

### Ecosystem
- Cloudflare WebMCP post — <https://blog.cloudflare.com/webmcp/>
- Shopify WebMCP tools — <https://shopify.dev/docs/api/web-mcp>
- Angular WebMCP — <https://angular.dev/ai/webmcp>
- GoogleChromeLabs demos — <https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos>
- `use-webmcp-tool` React hook — <https://www.npmjs.com/package/use-webmcp-tool> *(403 to automated fetch)*

### Retrieved via Context7 MCP
- `/webmachinelearning/webmcp` — explainer autodocs (API reference for `registerTool`, `executeTool`, `RegisteredTool`, `execute` callback)
- `/websites/webmachinelearning_github_io_webmcp` — spec IDL and mitigation text
