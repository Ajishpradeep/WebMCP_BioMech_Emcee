# Submission assets — frozen revision

All visuals must come from <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app> at application
commit `7e0561d7ed766c5d9a6e4adaf084c561829423a0`, Cloud Run revision
`pitchlab-webmcp-00011-26x`, image digest
`sha256:96c6c936058e2892d444d4aedd77edc44571e92e3e394cbf42053f343e68149e`.

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
2. `02-agent-focused-elbow-note.png` — capture during the video after the agent focuses the throwing
   elbow and the persistent MER note is visible. This is the hero image.
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
