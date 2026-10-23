# Terminal Block UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Rex's terminal presentation to combine Ubuntu-like shell fidelity with Warp-inspired command blocks that never overlap or misattribute output.

**Architecture:** Keep the shared Ghostty VT buffer, PTY, and canvas renderer as the source of truth; command blocks remain semantic ranges in that buffer. Replace unsafe post-hoc overlay placement with row-bounded block geometry, and suppress sticky/hover chrome when output is taller than the viewport or a full-screen application is active. Keep visual chrome subtle so CLI colors, tables, and drawings remain the focus.

**Tech Stack:** React 19, TypeScript, Ghostty VT WASM, Tauri/Rust PTY shell integration, existing terminal CSS and Vitest.

**Spec:** `docs/superpowers/specs/2026-10-23-terminal-block-ui-design.md`

## Global Constraints

- Keep the Ghostty VT model and current WebGPU/WebGL renderer architecture.
- Add no dependency.
- Preserve ANSI/truecolor and the existing full-screen terminal behavior.
- Use existing semantic command markers as the authority for block boundaries; recalculate buffer rows after reflow.
- Keep terminal chrome outside text-cell content or prove geometrically that it cannot intersect it.
- Do not truncate output or create a second terminal buffer/scrollback.
- Preserve existing folder colors, path hover affordance, and file/folder click routing.
- Keep renderer-frame work cached; do not add DOM layout reads or React commits to ordinary PTY cell repaint frames.

## Review Focus

- Cursor-repositioning programs followed by another command: first block output and divider must stop before the next block (Task 1).
- Resize/reflow after markers have been recorded: block output and chrome must follow the same semantic rows (Task 1).
- Long-running output taller than the pane: sticky/hover chrome must not obscure any output (Task 2).
- Alternate-screen/full-screen and mouse-tracking programs: block chrome must disappear and return cleanly afterward (Task 2).
- Narrow panes with ANSI colors, box drawing, and wrapped output: terminal glyphs stay intact, within the pane, and retain color (Task 3).

---

### Task 1: Bound command blocks to semantic rows

**Files:**
- Modify: `src/modules/terminal/ghostty/GhosttyBlocks.ts`
- Modify: `src/modules/terminal/ghostty/GhosttyBlocks.test.ts`

**Interfaces:**
- Consume existing `GhosttyBlocks.visibleBlocks(cellHeight)`, `readById(id)`, and model `semanticMarkerLine(id)`/`semanticMarkerColumn(id)` behavior.
- Add tests using the existing dual-VT test harness; do not create a new terminal test framework.

- [ ] **Step 1: Add a failing cursor-reposition and following-command regression**

Add a test named `keeps previous block content and divider before following command output`. Write a first command with multiple rows, move its cursor above the last row before its end marker, then write a second command with recognizable text. Assert the first block's `readById` output excludes the second command, and the first divider is no lower than the next block's start row.

- [ ] **Step 2: Run the focused regression to establish the failure**

Run: `pnpm exec vitest run src/modules/terminal/ghostty/GhosttyBlocks.test.ts -t "keeps previous block content and divider before following command output"`

Expected: the new assertion fails against the current geometry/range behavior for at least one invariant before implementation.

- [ ] **Step 3: Add a resize assertion to the same scenario**

Resize the model after both commands are written; locate a recognizable final output row through `readCellLine`, then assert the first block still ends after its own final row and before the next command's content.

- [ ] **Step 4: Associate each completed entry with its next semantic marker**

When handling `end-of-input`, associate that marker ID with the previous completed entry before creating the new live entry. Marker IDs remain authoritative; never infer a boundary from later buffer text.

- [ ] **Step 5: Bound completed content and scans, then invalidate row caches on reflow**

Completed command read/copy ranges and content-end scans stop before the next command/prompt boundary. A live entry may extend only to the current cursor. Key cached end-row scans on resolved marker rows and terminal dimensions so resizing recomputes geometry while marker IDs continue tracking the same content.

- [ ] **Step 6: Remove post-hoc chrome stacking and clamp each divider at its semantic neighbor**

Do not shift a later header or truncate an earlier divider after layout. Derive both from their semantic rows; cap each divider before the next command's start row. If headers cannot be positioned without intersecting terminal text, report no header position for that block.

- [ ] **Step 7: Run the block test file**

Run: `pnpm exec vitest run src/modules/terminal/ghostty/GhosttyBlocks.test.ts`

Expected: new ownership/reflow regressions and existing block range/selection tests pass. The existing `keeps direct input until shell integration confirms a shared prompt` test currently fails in both VT variants (`plain` expected, `prompt` received); track that separately and do not change shell-mode behavior as part of this task.

---

### Task 2: Redesign block chrome using Warp's safe-visibility rules

**Files:**
- Modify: `src/modules/terminal/ghostty/GhosttyBlocks.ts`
- Modify: `src/modules/terminal/ghostty/GhosttyBlockOverlay.tsx`
- Modify: `src/modules/terminal/block/BlockOverlay.tsx`
- Modify: `src/modules/terminal/block/block.css`
- Test: `src/modules/terminal/ghostty/GhosttyBlocks.test.ts`

**Interfaces:**
- Consume `visibleBlocks(cellHeight)` and existing `PositionedBlock` data passed from `GhosttyBlockOverlay` to `BlockOverlay`.
- `PositionedBlock.headerTop` is either a safe viewport-relative pixel position or `null`; null means do not render a floating header for that block.
- Add only the minimum visibility/geometry state required for the renderer to avoid unsafe chrome; do not add a second output container or independent scrollback.

- [ ] **Step 1: Add tests for chrome visibility with tall output and alternate screen**

Add tests named `hides sticky command chrome for output taller than viewport`, `hides block chrome during mouse-tracking applications`, and `keeps ordinary block context in an empty spacer row`; the existing `keeps previous block content and divider before following command output` and alternate-screen tests cover the other cases. Assert long-running tall output has no sticky header; a visible header's row interval intersects neither the preceding block output nor the current command output; alternate-screen and mouse-tracking output has no block chrome; and normal prompt output restores safe-row block affordance.

- [ ] **Step 2: Run the new visibility tests and verify they fail**

Run: `pnpm exec vitest run src/modules/terminal/ghostty/GhosttyBlocks.test.ts -t "hides sticky command chrome for output taller than viewport|hides block chrome during mouse-tracking applications|keeps ordinary block context in an empty spacer row|keeps previous block content and divider before following command output|hides block chrome in alternate screen and preserves it on return"`

Expected: the tall-output and mouse-tracking visibility assertions fail before their policy is implemented; existing safe-row and alternate-screen cases continue to pass.

- [ ] **Step 3: Implement a Warp-inspired safe chrome policy**

Do not show sticky/hover header chrome when a running block's output exceeds the visible terminal content height. Preserve the existing alternate-screen/mouse-tracking suppression. Keep command/cwd/status context available for ordinary-sized blocks, without placing text or controls over occupied terminal cells.

- [ ] **Step 4: Restyle block boundaries as quiet terminal chrome**

Update `block.css` and the overlay markup so the boundary is subtle, aligned to the exact end row, and visually subordinate to CLI output; remove any style or positioning that makes the divider/header look like an opaque card over terminal text. Keep the Ubuntu-like dense monospace output and existing theme tokens.

- [ ] **Step 5: Run block overlay and geometry regressions**

Run: `pnpm exec vitest run src/modules/terminal/ghostty/GhosttyBlocks.test.ts`

Expected: tall-output, alternate-screen, following-command, resize/reflow, selection, and search cases pass apart from the separately known shell prompt-mode failure.

---

### Task 3: Verify real shell output fidelity and final UX

**Files:**
- Modify only if a failing regression identifies an issue: `src/modules/terminal/TerminalPane.tsx`, `src/modules/terminal/ghostty/useGhosttyTerminalSession.ts`, or shell initialization scripts.
- Test: relevant existing tests under `src/modules/terminal/ghostty/` and `src/modules/terminal/lib/`.

**Interfaces:**
- Keep the existing Ghostty canvas renderer and terminal geometry APIs.
- Preserve the already implemented folder truecolor styling and path hover/click routing.

- [ ] **Step 1: Run color, path, and block regression suites**

Run: `pnpm exec vitest run src/modules/terminal/ghostty/GhosttyBlocks.test.ts src/modules/terminal/ghostty/AdaptedGhosttyTerminalModel.colors.test.ts src/modules/terminal/lib/terminalPathHit.test.ts`

Expected: new visual/geometry regressions and color/path tests pass; document the known prompt-mode failure separately if still present.

- [ ] **Step 2: Verify manually in the desktop app**

Run the terminal and check `ls --color`, a wide `ls`/table, the user's `gli` output, a command that redraws using cursor-up, and a long-running/full-screen command. Resize the pane while output is visible. Confirm text and colors match ordinary terminal output; no header/divider covers glyphs; the next command never appears inside the previous block; scrollback and copy still work.

- [ ] **Step 3: Run project checks**

Run: `pnpm check-types && pnpm build && pnpm lint`

Expected: typecheck and build succeed; lint exits successfully. Report existing warnings and the known prompt-mode test failure distinctly rather than claiming a clean full suite.

---

## Known baseline to keep separate

The focused `GhosttyBlocks.test.ts` suite currently has the same prompt-mode assertion failure in both VT variants: `keeps direct input until shell integration confirms a shared prompt` expects `plain` after the tested prompt marker and gets `prompt`. The block UI redesign must not alter this unrelated shell integration contract; verify whether it remains after implementation and report it independently.
