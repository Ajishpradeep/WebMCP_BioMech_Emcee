# The WebMCP Challenge — Team Brief

**Compiled:** 2026-08-30 and rechecked 2026-09-01 against
<https://webmcp.devpost.com/> (Overview), `/rules`, `/resources`, and `/updates`, plus sponsor pages.
Companion doc:
[`webmcp-technical-reference.md`](./webmcp-technical-reference.md).

**Sponsor:** OpenAI OpCo, LLC · **Administrator:** Devpost, Inc. · **Support:** support@devpost.com
**Partners:** Chrome, Cloudflare, Shopify, Vercel, Render, Netlify

> ⏱️ **Reconfirmed 2026-09-01.** Deadline is **Thu Sep 3, 2026 @ 1:00 PM PDT**.
> A Devpost update posted ~2026-08-28 ("6 days left to build") reaffirmed the date and stated
> *"a focused week is enough time to build something real."* No extension was shown in the official
> rules or overview at the 2026-09-01 recheck.

---

## 1. Timeline

All times **Pacific**. Source: [rules page](https://webmcp.devpost.com/rules).

| Phase | Window |
|---|---|
| **Registration opens** | Aug 25, 2026 @ 11:00 AM PT |
| **Submission period** | Aug 25, 2026 @ 11:00 AM PT → **Sep 3, 2026 @ 1:00 PM PT** |
| **Judging** | Sep 4, 2026 @ 10:00 AM PT → Sep 21, 2026 @ 5:00 PM PT |
| **Winners announced** | ~Sep 23, 2026 @ 2:00 PM PT |

The Overview page states the deadline as **September 3, 2026 @ 1:00 PM PDT (4:00 PM EDT)** and
describes the event as a **10-day challenge**.

**Additional dated obligation:** entrants must keep the project accessible and testable, **free of
charge, through the entire Judging Period** — i.e. your live URL must stay up and working until at
least **Sep 21, 2026**. Don't let a free-tier deploy lapse on Sep 4.

**Netlify credit deadlines** (optional, see §4): request by **Sep 1, 2026 @ 12:00 PM PT** via the
form; redeem by **Oct 3, 2026**.

---

## 2. Eligibility

### Who can enter
- Individuals **aged 18+** *(the rules page states 18+; the Overview page phrases it as "legal age of
  majority in your country" — see [§9](#9-unverified--contradictory))*, from countries where OpenAI
  API access is supported.
- Teams of eligible individuals.
- Organizations incorporated in supported jurisdictions.

### Who cannot enter

**Excluded countries / territories** (from the [Overview page](https://webmcp.devpost.com/), the
fuller of the two lists):

> Belarus · Brazil · China · Crimea · Cuba · Donetsk People's Republic · Hong Kong · Iran ·
> North Korea · Luhansk People's Republic · Quebec · Russia · Syria · Venezuela

⚠️ Note the non-obvious entries: **Brazil**, **Hong Kong**, and **Quebec** (a Canadian province, not
a country — Quebec's contest-law regime is the usual reason). Check every teammate's residency, not
just the lead's.

Also excluded: employees and family members of the organizers and judges, and anyone with a conflict
of interest.

### Language requirement
Video, project description, and testing instructions **must be in English**.

---

## 3. What you must submit

Source: [Overview](https://webmcp.devpost.com/) and [rules](https://webmcp.devpost.com/rules).
Four artifacts — all four are required.

### 3.1 Working live URL
- Must be reachable and functional via **ChatGPT's in-app browser** *or* **Chrome 149+ with WebMCP
  enabled**.
- Hosting: **ChatGPT Sites, Cloudflare, Vercel, Render, Netlify, Shopify, or any other provider.**
  There is **no restriction to sponsor platforms** — "or equivalent"/"other providers" is explicit.
- **Authentication is permitted**, provided you supply working credentials on the submission form.
- Must remain free to access and test through the Judging Period.

### 3.2 Text description
Must address all four of:
1. **Why WebMCP fits your use case**
2. **How the user experience is improved**
3. **What new capabilities human-agent collaboration unlocks**
4. **Implementation details** — how you actually built it

> These four bullets map almost 1:1 onto the four judging criteria. Write the description *as* the
> judges' scoring sheet. See [§6](#6-self-scoring-rubric).

### 3.3 Demo video
- **Under 3 minutes.**
- **Must include audio.**
- Must demonstrate the app **and the WebMCP integration** functioning.
- **Public YouTube link.** (The rules specify a YouTube link; make sure it's public, not unlisted-only
  if the form validates it — and definitely not private.)
- The app must **match what the video and description depict**.

### 3.4 Public code repository
- **GitHub, GitLab, or Bitbucket.**
- **Public.**
- Contains complete **source code, assets, and functional setup instructions**.
- **Open source license file** — the rules require it be **detectable at the top of the repository**,
  and the Overview requires it be **visible in the repository's About section**. In practice: commit
  a standard `LICENSE` file at the repo root with a canonical license text (MIT/Apache-2.0), so
  GitHub auto-detects it and surfaces it in the About sidebar. *Verify this renders before submitting
  — a hand-edited or nonstandard LICENSE may not be auto-detected.*
- Must contain the actual **WebMCP tool registration with schemas and execution handlers**.

### 3.5 Project originality rules
- **New projects, or meaningfully extended existing projects** — extensions must be backed by
  **timestamped git history** showing the work.
- Must be original work. **Cannot** derive from sponsor-funded projects or be subject to prior
  commercial licenses.
- You are responsible for compliance with any third-party integrations you use.

---

## 4. Prizes

**$35,000 total.** Awarded to the **Top 10 submissions**, which each receive the *entire stack*
below. **Each project is eligible for one prize only.**

| Sponsor | Per-winner award |
|---|---|
| **OpenAI** | **$3,000 USD cash** · **Codex Micro** device · **ChatGPT Pro for 1 year** (up to 3 team members) · OpenAI merch · spotlight on **@OpenAIDevs** |
| **Cloudflare** | **$10,000** in Cloudflare credits |
| **Vercel** | **$3,600/yr** in Vercel credits ($300/mo × 12) **+ $600/yr** in Gateway credits ($50/mo × 12) |
| **Render** | **$300** in Render credits |
| **Netlify** | **$500 cash** |
| **Shopify** | **$250** in limited-edition Supply gear |
| **Google Chrome** | **3-month Google AI Ultra** subscription (~$300 value **per team member**) |

**Cash math checks out:** ($3,000 OpenAI + $500 Netlify) × 10 winners = **$35,000**. So the
advertised "$35,000 in prizes" is the *cash* total; credits and hardware are on top of it. Total
per-winner value including credits is roughly **$17,000+**.

### Participant credits (available to everyone, not just winners)
From the [resources page](https://webmcp.devpost.com/resources):

| Sponsor | Offer |
|---|---|
| Vercel | $30 in build credits — <https://credits.vercel.sh/redeem> |
| Render | Participant credits — <https://credits-portal-mmdm.onrender.com/claim/openai-hackathon> |
| Netlify | $3,000 pool, while supplies last — form by **Sep 1 @ 12 PM PT**, redeem by **Oct 3, 2026** — <https://forms.gle/xw75XGUQzCXEiALc7> |

---

## 5. Judging

### Process
**Two stages** ([rules](https://webmcp.devpost.com/rules)):

- **Stage One — viability.** Pass/fail screen. A submission that doesn't run, doesn't meet the
  deliverable requirements, or doesn't match its video is eliminated here **before anyone scores its
  merits**. This is the stage most entries lose on.
- **Stage Two — ranked scoring** against the four criteria.

**Tiebreaker:** highest score in the **first criterion (WebMCP Leverage)**, then proceeding
sequentially through the remaining criteria in order.

> Consequence: **WebMCP Leverage is the de facto primary criterion.** The four are "equally
> weighted," but ties break on Leverage first, so it is worth more than the other three at the
> margin. Optimize for it.

### The four criteria (equally weighted)

**1. WebMCP Leverage**
> *"Thoroughness and skill in implementation; genuine effort demonstrated through working,
> non-trivial code."*

Judged on the depth and quality of your actual WebMCP usage — not that you called `registerTool`
once. Non-trivial means real tools, real schemas, real handlers, doing real work.

**2. Execution**
> *"Delivers functional, complete product experience with coherent design; not merely a technical
> proof-of-concept."*

Explicitly penalizes tech demos. A polished, finished, narrow product beats a sprawling unfinished
one.

**3. Potential Impact**
> *"Addresses real problems for real audiences with credible solutions; demonstrates practical
> value."*

Needs a named audience and a demonstrated need — not a hypothetical.

**4. Creativity & Ambition**
> *"Novel concepts distinguishing submissions from existing solutions; demonstrates forward-thinking
> approach."*

Differentiation from what already exists. Note that Shopify already ships WebMCP commerce tools
out of the box (§7), so generic e-commerce ideas start at a creativity deficit.

---

## 6. Self-scoring rubric

Score an idea 1–5 on each before committing. Anything scoring ≤2 on **WebMCP Leverage** should be
reworked, because that's the tiebreaker.

### WebMCP Leverage — ask:
- [ ] Would the app be **meaningfully worse without WebMCP**? (If a chatbot with a backend MCP server
      would do the same job, you're building the wrong thing — see §7.)
- [ ] Do you expose **multiple, composable tools** that an agent chains, rather than one god-tool?
- [ ] Do the tools **read and mutate live page state** the agent couldn't otherwise reach?
- [ ] Do you use the API's real surface — `inputSchema`, `annotations` (`readOnlyHint`,
      `untrustedContentHint`), `AbortSignal` cancellation, `toolchange`, dynamic registration where
      justified?
- [ ] Are tool descriptions and schemas actually **designed** (action verbs, natural-language enums,
      loose schema / strict code) per Chrome's best practices?
- [ ] Is there evidence of **evals or testing** of tool selection?

### Execution — ask:
- [ ] Does it work end-to-end on a **cold load in a fresh browser profile**?
- [ ] Does the **non-agent UI** stand on its own for a human with no WebMCP browser?
- [ ] Is it **designed**, not scaffolded? Coherent visual language, real empty/error/loading states.
- [ ] Does the **UI update visibly** when the agent acts? (Chrome's best practices: agents read the
      interface to plan next steps — and judges watch it to believe you.)
- [ ] Would a stranger, given only the README, get it running?

### Potential Impact — ask:
- [ ] Can you name the **specific audience** in one sentence?
- [ ] Can you point at evidence the problem is real (not "imagine if...")?
- [ ] Is the WebMCP version **measurably** better — fewer steps, fewer errors, less time?

### Creativity & Ambition — ask:
- [ ] Is this **already shipped** by a sponsor? (Shopify ships catalog/cart/checkout tools already.)
- [ ] Is it in the well-trodden set — shopping, form-filling, filtering, reordering? Chrome's
      use-cases page names exactly these four, so **they are the expected baseline, not the
      differentiator**.
- [ ] Does it show something about human-agent collaboration that isn't obvious?

---

## 7. Scope & opportunity analysis

### What's clearly in scope
The brief: *"Build a WebMCP-powered web app that imagines and explores the future of the open
web—where humans and agents can interact, collaborate, and create together."* Broad. Effectively any
web app with a substantive, non-trivial WebMCP tool surface qualifies.

### What the canonical use cases are — and why that's a warning
Chrome's [use-cases page](https://developer.chrome.com/docs/ai/webmcp/use-cases) names four
"critical user journeys": **shopping/purchasing**, **form filling**, **information filtering**, and
**repeat transactions**. Every participant reading the resources tab sees this list.

**Treat these as the floor, not the idea.** Shopify already ships `search_catalog`, `browse_store`,
`get_product`, `show_variant`, `get_cart`, `update_cart`, `cancel_cart`, `proceed_to_checkout`,
`manage_orders`, and `search_shop_policies_and_faqs` automatically on Liquid and Hydrogen storefronts
with **zero configuration** ([shopify.dev](https://shopify.dev/docs/api/web-mcp)). A shopping-agent
submission is competing against a sponsor's free built-in feature.

### What will stand out

The spec's **explicit non-goals** are the strategic tell. WebMCP is *not* for headless browsing and
*not* for autonomous workflows without human oversight. Its stated goal is *"visually rich,
cooperative interplay between a user, a web page, and an agent with shared context."*

So the winning shape is: **something where the human and the agent are both looking at the same rich
UI at the same time, and neither could do the task alone.** Directions that fit:

1. **Agent + rich visual/spatial interface.** Anything where the page renders something an agent
   cannot see or manipulate through text alone — a canvas, a timeline, a 3D view, a chart, an
   annotation surface, a video scrubber, a graph editor. The agent drives structure; the human judges
   the visual result. This is the strongest fit with the spec's own framing and the hardest thing to
   replicate with a backend MCP server.
2. **Live client-side state the server never sees.** Tools that read in-memory data, an in-progress
   edit, a local computation, a WASM session, or a device sensor. A backend MCP server structurally
   *cannot* do this — which makes "why WebMCP and not MCP?" answer itself.
3. **Accessibility as intermediation.** The explainer lists *"improved accessibility through agents
   acting as intermediaries"* as a goal, and almost nobody will build it. High impact score,
   genuinely novel, on-thesis.
4. **Human-in-the-loop review workflows.** Use `requestUserInteraction()` and the declarative form
   events (`toolactivated`, `toolcancel`, `:tool-form-active`) so the human *sees and approves* what
   the agent proposes. Directly demonstrates the collaboration thesis and doubles as your security
   story.
5. **Genuinely hard domain tooling.** A specialized analysis/authoring tool where the tools encode
   real domain logic — the agent handles intent and orchestration, the app handles correctness.

### What to avoid
- A chat wrapper. If the agent is just a text box over your API, WebMCP adds nothing.
- One tool that takes a giant free-text parameter. That's a prompt, not a tool.
- Anything Shopify or the Chrome demos (Pizza Maker, Flight Search, Le Petit Bistro) already show.
- Anything requiring headless/autonomous operation — an explicit non-goal.

### The actual deliverable bar, end-to-end

To clear **Stage One** and then score, you need all of:

- [ ] Deployed on **HTTPS**, publicly reachable, staying up through **Sep 21**
- [ ] `Origin-Agent-Cluster: ?0` **not** sent (it silently disables WebMCP — check your host's defaults)
- [ ] Works in **ChatGPT in-app browser** *or* **Chrome 149+** with WebMCP enabled
- [ ] If targeting **ChatGPT**: imperative API only, **top-level page only, no iframes** — declarative
      forms and iframe tools are not supported there
- [ ] Non-agent UI works standalone
- [ ] Public repo with `LICENSE` at root, **auto-detected and showing in the About section**
- [ ] README with real setup instructions someone else can follow
- [ ] Description covering all four required points
- [ ] **<3 min** public YouTube video, **with audio**, showing the app *and* the WebMCP integration
- [ ] App matches video and description exactly
- [ ] Test credentials on the submission form if auth is required
- [ ] Registered on Devpost before the deadline

### Time-boxing advice for a ~4-day run
Given Stage One is pass/fail on completeness, and Execution explicitly penalizes proofs-of-concept:
**cut scope on features, never on finish.** Budget the last day entirely for deploy, README, license,
video, and description. A narrow, polished, well-explained app with 5–8 well-designed tools will
outrank an ambitious half-built one.

---

## 8. Platform, tooling & IP terms

### Hosting / tooling
- **No mandated platform.** ChatGPT Sites, Cloudflare, Vercel, Render, Netlify, Shopify, "or
  equivalent"/"other providers" all explicitly allowed.
- Use of the **Devpost ChatGPT plugin is optional**.
- **No stated restriction on frameworks, languages, or AI tooling.**

### Intellectual property
- **You keep ownership** of your submission.
- The sponsor receives a **non-exclusive license** for judging and promotion.
- The sponsor retains **promotional rights for 3 years** after the hackathon.
- You **must** apply an open source license to the repository.
- Work must be original; no sponsor-funded derivations, no prior commercial licenses.
- You're responsible for third-party integration compliance.

### Precedence
The **official rules and website prevail** over any other communication in case of conflict.

---

## 9. Unverified & contradictory

Chase these manually before relying on them.

1. **Minimum age: 18+ vs. "legal age of majority."** The rules page states **18+**; the Overview
   page says *"legal age of majority in your country."* These differ in jurisdictions where majority
   is 19 or 21. **Rules page wins (18+), but verify if any teammate is near the boundary.**

2. **Excluded-countries list differs between pages.** The Overview lists **14** entries including
   **Belarus**; my extraction of the rules page returned **13**, omitting Belarus. This is likely an
   extraction artifact rather than a real difference, but **read the rules page yourself** if any
   teammate is affected. The safe assumption is the union of both lists.

3. **"Winners announced ~Sep 23"** — the rules present this as approximate. Not a commitment.

4. **YouTube requirement strictness.** The rules specify a YouTube link; the Overview says "public
   YouTube link." Whether Vimeo or similar is accepted is **not stated**. Use YouTube.

5. **License "at the top of the repository" vs. "visible in the About section"** — two different
   phrasings of the same requirement across the two pages. Satisfying both means a root `LICENSE`
   file that **GitHub auto-detects**. Confirm visually on the repo page before submitting.

6. **Only one Devpost update post was visible** ("6 days left to build", ~Aug 28). Additional updates
   or rule amendments may exist that weren't rendered in the fetched page. **Re-check
   <https://webmcp.devpost.com/updates> before submitting.**

7. **The OpenAI WebMCP showcase is empty.** `developers.openai.com/showcase?view=webmcp-apps`
   currently reads *"WebMCP examples are coming soon."* Despite being linked as a key resource,
   **there are no OpenAI-published WebMCP example apps to study.** Substitute the
   [GoogleChromeLabs demos](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos)
   (Pizza Maker, React Flight Search, Le Petit Bistro), the
   [Vercel storefront WebMCP PR](https://github.com/vercel/shop/pull/498), and the
   [Cloudflare coffee-store demo](https://webmcp-coffee.jilles.fyi/).

8. **Participant count was 4,288** at time of research. Top-10 placement is the bar.

9. **Chrome version discrepancy in the ecosystem.** Cloudflare's blog says WebMCP ships
   experimentally in **Chrome 146**; Chrome's docs, `implementation-status.md`, and these rules all
   say **149**. Build and test against **149+**. Detailed in the technical reference.

10. **"Codex Micro"** is listed as a prize device. Its specifications are not described on either
    Devpost page and I did not verify them elsewhere.

---

## 10. Key links

### Challenge
| Resource | URL |
|---|---|
| Overview | <https://webmcp.devpost.com/> |
| Rules | <https://webmcp.devpost.com/rules> |
| Resources | <https://webmcp.devpost.com/resources> |
| Updates | <https://webmcp.devpost.com/updates> |
| Discussions | <https://webmcp.devpost.com/forum_topics> |
| Project gallery | <https://webmcp.devpost.com/project-gallery> |
| Register | <https://webmcp.devpost.com/register> |
| OpenAI Discord | <https://discord.gg/openai> |

### Reference implementations to study
| What | URL |
|---|---|
| Chrome Labs demos | <https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos> |
| Vercel storefront + WebMCP PR | <https://github.com/vercel/shop> · <https://github.com/vercel/shop/pull/498> · <https://template.vercel.shop/> |
| Cloudflare Workers template | <https://github.com/cloudflare/agents/tree/main/examples/webmcp-react> |
| Cloudflare coffee-store demo | <https://webmcp-coffee.jilles.fyi/> |
| Netlify starter | <https://webmcp-starter.netlify.app/> |
| Shopify built-in tools | <https://shopify.dev/docs/api/web-mcp> |
| React hook | <https://www.npmjs.com/package/use-webmcp-tool> |
| Angular support | <https://angular.dev/ai/webmcp> |

### Hosting
| Platform | Docs |
|---|---|
| ChatGPT Sites | <https://learn.chatgpt.com/docs/sites?surface=app> |
| Cloudflare Pages/Workers | <https://developers.cloudflare.com/pages/> |
| Cloudflare Browser Run WebMCP | <https://developers.cloudflare.com/browser-run/features/webmcp/> |
| Render Workflows | <https://render.com/docs/workflows> |
| Netlify | <https://docs.netlify.com/start/choose-your-path/> |

Technical details on the API itself: see
[`webmcp-technical-reference.md`](./webmcp-technical-reference.md).
