# Terminal UX Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make terminal file/folder output distinguishable, restore a visible underline for clickable paths, and keep block dividers within their own command output after cursor movement and reflow.

**Architecture:** Preserve the existing Ghostty terminal, PTY shell integrations, and click-to-open path resolver. Diagnose the live color path with a regression that checks actual ANSI foreground values, restore a geometry-correct underline, and bound each finished block's content range by the next command marker rather than by the global buffer tail.

**Tech Stack:** React, TypeScript, Ghostty VT model/renderers, Rust PTY shell initialization, Vitest.

**Spec:** User request in this conversation and observed screenshot: visible file/folder colors, visible clickable-path underline, no divider/content overlap during multi-command output or resize.

## Global Constraints

- Preserve current uncommitted work; do not reset or revert unrelated changes.
- No new dependencies.
- Folder names must have a clearly distinct color from regular files; clickable paths must retain click-to-open behavior and a visible underline.
- A block divider must not cross that block's content or overlap following command output, including after terminal resize/reflow.

## Review Focus

- Later command output must not extend a previous command's range; test consecutive commands where the earlier command moves its cursor upward.
- Reflow must not leave a cached buffer line stale; test the same output after dimension changes and after marker lookup changes.
- File/folder ANSI styles must survive shell initialization, VT parsing, palette mapping, and rendering; test blue directory SGR distinctly from regular-file default foreground.
- Underline geometry must remain aligned after resize and on paths at different rows/columns; verify it is within terminal surface bounds and follows the hovered token.
- Shell init must preserve command arguments and work in each supported shell; keep shell-specific tests/checks where present.

---

### Task 1: Isolate terminal color loss and make file/folder colors visible

**Files:**
- Modify: `src-tauri/src/modules/pty/scripts/bashrc.bash`
- Modify: `src-tauri/src/modules/pty/scripts/zshrc.zsh`
- Modify: `src-tauri/src/modules/pty/scripts/init.fish`
- Test: `src/modules/terminal/ghostty/AdaptedGhosttyTerminalModel.colors.test.ts`
- Test: existing shell initialization tests under `src-tauri/src/modules/pty/`

**Interfaces:** The existing shell `ls` setup emits ANSI SGR; terminal theme palette maps ANSI colors to RGB. Keep those interfaces and pinpoint which boundary loses ANSI blue before choosing the minimal correction.

- [ ] Add a regression assertion for ANSI blue (`SGR 34`) and regular default foreground in terminal cells, alongside directory style SGR `1;34`.
- [ ] Run the targeted test and confirm the expected failure at the boundary being fixed.
- [ ] Trace shell output and the model's parsed RGB values; correct only the failing boundary (shell style/configuration, palette mapping, or renderer) and keep directories visually distinct from normal files.
- [ ] Run targeted model and shell initialization checks.

### Task 2: Restore visible underlines for clickable terminal paths

**Files:**
- Modify: `src/modules/terminal/TerminalPane.tsx`
- Test: `src/modules/terminal/lib/terminalPathHit.test.ts` or a focused terminal pane test if one exists.

**Interfaces:** Reuse `hitTest`, `resolvePathToken`, `ghosttyBlockGeometry`, and `onOpenPath`; preserve pointer click and folder/file routing. Add an underline rectangle derived from the measured terminal cell geometry only after a path resolves.

- [ ] Add coverage for identifying the hovered token's exact cell range, including punctuation cleanup and adjacent tokens.
- [ ] Verify the new assertion fails before implementing the underline.
- [ ] Render an accessible-hidden, pointer-events-none underline under the resolved token; recompute its geometry on pointer movement and clear it on pointer leave/resize or invalid token.
- [ ] Verify path hit tests and terminal pane checks pass; visually inspect if a PTY-backed app run is available.

### Task 3: Bound block output ranges and prevent divider overlap

**Files:**
- Modify: `src/modules/terminal/ghostty/GhosttyBlocks.ts`
- Test: `src/modules/terminal/ghostty/GhosttyBlocks.test.ts`

**Interfaces:** Keep semantic marker IDs as authoritative command boundaries and existing `range()`/`visibleBlocks()` APIs. A finished command's content scan must stop before the next command's start marker; live/current command scanning must not treat future buffer content as its own.

- [ ] Add a failing regression with cursor-up output in command one followed by command two output; assert command one's visual and selected/read range do not include command two, and its divider stays above command two's content.
- [ ] Add a reflow regression that changes dimensions after markers/output exist and verifies boundaries still resolve correctly.
- [ ] Replace global-bottom scanning and post-hoc chrome stacking with per-command bounds based on adjacent semantic markers; invalidate any cached scan when the relevant marker/range or layout changes.
- [ ] Run targeted Ghostty block tests, then all required project checks and report known baseline failures separately.

### Task 4: End-to-end verification and review

**Files:**
- Review changes across the files above; no unrelated cleanup.

- [ ] Check types, formatting/lint, focused terminal suites, full test suite, and build.
- [ ] Manually verify on the reported workflow: run `ls`, `gli`, then another command; hover/click a file and folder; open a file to reflow the terminal; confirm colors, underline, routing, and divider placement.
- [ ] Report any PTY-dependent verification that could not be performed and the exact user restart/repro steps required.
