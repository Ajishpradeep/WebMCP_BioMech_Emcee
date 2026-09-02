# Submission assets — frozen revision

All visuals must come from <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app> at application
commit `7e0561d7ed766c5d9a6e4adaf084c561829423a0`, Cloud Run revision
`pitchlab-webmcp-00011-26x`, image digest
`sha256:96c6c936058e2892d444d4aedd77edc44571e92e3e394cbf42053f343e68149e`.

**Published video:** <https://youtu.be/yAUan4TGnl8> — YouTube metadata checked 2026-09-03;
playable/embeddable and 160–161 seconds. Owner confirms narrated audio.

## Judge journey

Lead with one idea: **the agent operates the same evidence workspace as the human; it does not
merely chat about it.**

1. Open `?session=delivery-03` with ChatGPT and immediately show the prepared prompt: “At MER, show
   me what elbow flexion means and leave a note for the reviewer.”
2. Let the agent seek to MER, focus the throwing elbow, expose the supported flexion geometry, and
   pin `Review elbow flexion geometry at MER.` Pause so the visible state change is unmistakable.
3. Open the persistent note and show that it returns to its evidence frame.
4. Briefly establish the synchronized 2D/3D workspace and human event correction.
5. Ask for the two-review comparison, then ask “Which one is better?” Show descriptive differences
   followed by the ranking refusal.
6. Ask for elbow valgus torque. Show the structured refusal and supported-observation redirect.

## Video recording plan and narration (target 2:35–2:45)

Record at 1600×1000 or 1920×1080. Keep the app and ChatGPT side by side where possible. Use normal
cursor movement, do not accelerate the visible agent action, and trim agent waiting time. Publish
as a public YouTube video with spoken narration and verify the final duration is below 3:00.

| Time | Picture / action | Narration |
|---|---|---|
| 0:00–0:12 | Start with the prepared ChatGPT prompt and immediately show the agent moving the live app to MER. | “This agent is not describing a biomechanics website. Through WebMCP, it is operating the same evidence workspace as the human.” |
| 0:12–0:38 | Agent focuses the throwing elbow; show synchronized source/3D context plus segments, extension reference, arc, and value. | “A casual question becomes a precise event, joint, view, and explanation. The application—not the language model—draws the landmark geometry that supports the measurement.” |
| 0:38–0:55 | Agent pins the note; seek away and reopen it. | “The agent leaves a persistent note at that frame. Opening it returns the reviewer to the same evidence, so the conversation produces a usable review artifact.” |
| 0:55–1:18 | Briefly show event anchors, measurements, shared-view state, and a human event correction followed by agent readback. | “The loop also runs from human to agent. When a reviewer corrects an event frame, measurements recompute and the next tool read uses that correction.” |
| 1:18–1:42 | Show a short plain-language explanation request, then the same evidence framed as a specialist review note. | “The website supplies domain facts and safe actions; the connected GPT model supplies language and reasoning shaped to the user—whether that user needs teaching or a concise coach-style observation.” |
| 1:42–2:04 | Ask for a comparison; show `descriptive_only`, compatibility limits, then ask `Which one is better?` | “Two sessions can be compared descriptively. They are different athletes and camera protocols, so Biomech Emcee reports observed differences but refuses to call either one better.” |
| 2:04–2:22 | Ask for elbow valgus torque; show the unavailable response and supported redirect. | “It also refuses quantities the evidence cannot establish. Torque needs force data and inverse dynamics, so the tool returns a structured boundary instead of inventing a number.” |
| 2:22–2:39 | Brief code view: `registerTool`, tool index, `9 read / 4 write`; return to app. | “Thirteen WebMCP tools—nine read and four write—share the browser state rendered by the interface. This is not a chat wrapper; WebMCP is the interaction architecture.” |
| 2:39–2:48 | End on focused evidence and the note. | “Biomech Emcee is shared movement-evidence review: an expert website, an agent the user chooses, and one evidence surface they can operate together.” |

## Word-for-word recording script

Only text marked **SAY** is narration. Text marked **SCREEN** is a silent production direction.
Paste the prompts; do not type them during the recording. Trim waits longer than about two seconds.

### 0:00–0:12 — Open with the WebMCP action

**SCREEN:** Start already inside ChatGPT's in-app browser with the frozen `delivery-03` workspace
loaded. Keep the application and conversation visible. Paste and send this prompt immediately:

> I’m new to biomechanics. At MER, show me what throwing-elbow flexion means. Navigate to that
> moment, focus the correct elbow, turn on the useful evidence layers, explain how the displayed
> angle is constructed in plain language, and leave a note saying “Review elbow flexion geometry at
> MER.”

**SAY:** “This is Biomech Emcee. The agent is not merely describing a biomechanics website. Through
WebMCP, it can operate the same live evidence workspace as the person reviewing it.”

### 0:12–0:42 — Show the read-and-write chain

**SCREEN:** Let the agent work. Keep the visible viewer in frame as it seeks to MER and focuses the
throwing elbow. When the geometry appears, pause for two seconds. Point briefly to the synchronized
source video, the focused elbow, the angle arc, and the shared-view status. Do not orbit the model.

**SAY:** “A casual question is resolved into a precise event, joint, camera view, and measurement.
The agent reads the detected phase events, retrieves the measurement and its definition, moves the
timeline to maximum external rotation, and focuses the correct elbow. The application itself draws
the shoulder, elbow, and wrist geometry behind the angle. The language model does not invent the
visual evidence.”

### 0:42–1:00 — Show the persistent note

**SCREEN:** Wait until the annotation is visible in Shared notes. Point to it. Seek briefly to
another event, then click the note so the workspace returns to its evidence frame.

**SAY:** “The agent also leaves a persistent note at the frame it describes. If the reviewer moves
away, opening that note returns to the same evidence. The conversation has produced a usable review
artifact inside the specialist application.”

### 1:00–1:20 — Show the human-to-agent direction

**SCREEN:** In Review event anchors, move to a valid nearby frame between foot contact and ball
release and confirm it as MER. Then paste and send:

> I corrected MER in the workspace. Read the phase events again and tell me whether my correction
> is now the evidence you see.

Show the `reviewed` state and the agent's readback. If doing the correction live feels risky, record
this as a separate clip and join it with a cut.

**SAY:** “The collaboration also runs in the other direction. A human can correct an event frame,
and the next agent read uses that reviewed frame. The interface and the WebMCP tools share one
browser state, rather than maintaining separate versions of the analysis.”

### 1:20–1:54 — Show comparison with an honesty boundary

**SCREEN:** Paste and send:

> Compare the two available reviews. Show the most meaningful differences the evidence can support,
> explain the athlete, camera, frame-rate, and capture-protocol limitations, and tell me what I
> should inspect next.

After the result appears, paste and send:

> Which review is better, and what caused the difference?

Keep the descriptive-only result and ranking refusal readable on screen.

**SAY:** “Biomech Emcee can compare the two licensed sessions, but only descriptively. These clips
show different athletes, viewpoints, frame rates, and capture protocols. The tool can report
observed differences, but it refuses to call one review better or claim what caused the difference.
That boundary is part of the product, not a disclaimer added afterward.”

### 1:54–2:20 — Show an unsupported-quantity refusal

**SCREEN:** Paste and send:

> What was this pitcher’s elbow valgus torque, and what generated the power? If this evidence cannot
> establish those quantities, explain exactly why, take me to a supported movement observation near
> release, focus the relevant anatomy, and leave a note about what can actually be reviewed.

Show the unavailable result, supported redirect, viewer navigation, and note if completed.

**SAY:** “The same tool contract refuses quantities this evidence cannot establish. Elbow torque
requires force data and inverse dynamics, while power and causality cannot be recovered from this
monocular reconstruction. Instead of fabricating an answer, the agent explains the missing evidence
and redirects the reviewer to a supported movement observation.”

### 2:20–2:39 — Prove the implementation briefly

**SCREEN:** Cut to a prepared code view showing `document.modelContext.registerTool` and the tool
index. Highlight or overlay the text `13 WebMCP tools · 9 read · 4 write`. Return to the focused
workspace before the sentence ends. Do not scroll through source code.

**SAY:** “The application exposes thirteen imperative WebMCP tools: nine read tools and four write
tools. They inspect session evidence, events, measurements, definitions, and comparisons, and they
visibly seek, focus, change evidence layers, and annotate the human workspace.”

### 2:39–2:52 — Close

**SCREEN:** End on the focused elbow geometry with the synchronized source and persistent note
visible. Add a simple title overlay: `Shared evidence, not automated coaching.`

**SAY:** “Biomech Emcee shows what WebMCP enables for specialist software: an expert website, an
agent the user chooses, and one evidence surface they can understand and operate together. Shared
evidence, not automated coaching.”

### Optional title and description

**YouTube title:** `Biomech Emcee — Shared 3D Movement Review with WebMCP`

**YouTube description:** `Biomech Emcee is a WebMCP-native biomechanics evidence workspace. Its 13
tools let an external agent inspect the live session, navigate and focus the 3D viewer, explain
supported measurements, compare sessions descriptively, and leave persistent evidence-linked notes
in the same workspace used by the human reviewer. Built for The WebMCP Challenge.`

## Rubric strategy

- **WebMCP Leverage:** strongest dimension. Demonstrate a multi-tool read→seek→focus→annotate chain,
  human correction feeding agent reads, and structured refusals. Do not spend the demo enumerating
  all 13 tools.
- **Execution:** show the coherent deployed workflow before code. The synchronized source, 3D view,
  events, measurements, notes, two licensed sessions, and visible writes make this a product rather
  than a protocol demo.
- **Potential Impact:** frame the real problem as interaction friction in specialist software. A
  user should not need to learn every anatomical control before asking a useful question, and an
  agent should not lose the evidence state the human is judging.
- **Creativity & Ambition:** emphasize the separation of responsibilities: the website owns domain
  evidence and valid actions; the external model owns language and reasoning; the human owns final
  judgment. That is more distinctive than embedding another fixed chatbot in a dashboard.

## Final screenshot set

Use no more than four images, in this order:

1. `submission-assets/screenshots/01-main-workspace.png` — synchronized 2D/3D workspace, event
   anchors, measurement cards, and partial sequence. Captured from the frozen deployment.
2. `submission-assets/BioMech_EmmCee_Screen_Capture.png` — high-resolution hero capture from
   ChatGPT's in-app browser, visibly showing 13 WebMCP tools, synchronized evidence, throwing-elbow
   focus, and supported flexion geometry.
3. `03-descriptive-comparison.png` — capture the app plus agent result showing `descriptive_only`
   and the unavailable better/worse ranking, only if the result is legible at gallery size.
4. `04-webmcp-proof.png` — optional code/browser proof showing exactly 13 tools (9 read / 4 write).
   Omit if it reads as a developer screenshot rather than a product proof.

Do not use the failed blank automated focus capture; it was deleted. Avoid historical screenshots,
unlicensed footage, Chrome 149 claims, and any frame implying diagnostic or coaching advice.

## Capture checklist

- Confirm the header/session label and `delivery-03` source match the frozen deployment.
- Keep the synchronized source, focused 3D geometry, shared-view status, and note visible together.
- Hide unrelated browser chrome, notifications, personal account details, and debug consoles.
- Verify every screenshot is sharp at Devpost gallery size and contains no provisional session IDs.
- Retain the unedited originals; crop copies only for presentation.
