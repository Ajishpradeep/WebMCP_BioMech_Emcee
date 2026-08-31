/**
 * The tool surface. **13 is the ceiling** (webmcp-tools.md §1) — to add one, delete one.
 *
 *   A · session & context   list_pitch_sessions · get_session_overview
 *   B · measurement         get_phase_events · get_kinematics_at_event ·
 *                           get_joint_angle_series · get_kinematic_sequence
 *   C · evidence            get_metric_definition · compare_to_reference · compare_pitches
 *   D · viewer control ★    seek_to_event · focus_joint · set_overlay · annotate_frame
 *
 * 4 of 13 are write tools that act on the human's live view — that ratio is the WebMCP
 * leverage argument in one line.
 */

import type { PitchTool } from '../registry'
import { evidenceTools } from './read/evidence'
import { measurementTools } from './read/measure'
import { getSessionOverview, listPitchSessions } from './read/session'
import { viewerTools } from './write/viewer'

export const READ_TOOLS: PitchTool[] = [
  listPitchSessions,
  getSessionOverview,
  ...measurementTools,
  ...evidenceTools,
]

export const WRITE_TOOLS: PitchTool[] = viewerTools

export const ALL_TOOLS: PitchTool[] = [...READ_TOOLS, ...WRITE_TOOLS]
