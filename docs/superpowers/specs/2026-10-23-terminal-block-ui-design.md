# Terminal Block UI Redesign

## Intent

Make Rex's terminal feel like a real Linux terminal while presenting commands in a clear, Warp-inspired block structure. The user's current failure is visual: command dividers and block chrome can overlap or appear to contain later command output. Treat that as a layout/design problem, not merely a one-off divider offset.

## Approved direction

- Preserve the Ubuntu-terminal feel shown in the user's reference: terminal output remains primary, dense and readable; shell colors, ANSI styling, box drawing, and full CLI layouts render as emitted.
- Use Warp as a design reference for command organization: identifiable command blocks, subtle command context, and block-aware navigation/chrome.
- Keep the existing terminal model/PTY architecture. A command block is a visual and semantic view onto the shared Ghostty buffer, not a separate terminal emulator or a copy of Warp's Rust implementation.
- Command output is never truncated, clipped behind chrome, or silently assigned to the wrong command. Long output remains reachable through normal terminal scrollback.

## Behavioral requirements

1. Each block starts and ends at shell-integration semantic markers; a completed block's content range ends before the next command/prompt boundary.
2. Dividers and command headers align to terminal buffer rows after scroll, resize, and reflow. They never cover glyph cells or another command's output.
3. Output-heavy and full-screen/TUI commands do not get sticky headers or hover chrome over their content. Context UI may appear in a reserved gutter or at a safe boundary, but must not steal terminal columns or input.
4. Block chrome is quiet and secondary: command/cwd/status/time context is available without turning every output into a card that changes its colors, spacing, or wrapping.
5. User scrollback, selection/copy, hyperlinks, prompt interaction, alternate-screen behavior, and output fidelity remain owned by Ghostty and the existing terminal renderer.
6. File/folder color distinction and clickable path behavior are retained: folders are distinguishable, paths have visible hover affordance, files open in the editor, and folders reveal in the explorer.

## Non-goals

- Reimplementing Warp's terminal model or copying its Rust UI.
- Replacing the PTY, Ghostty parser, canvas renderer, or terminal color pipeline.
- Artificially truncating tall command output or adding a nested scrollbar that competes with terminal scrollback.
- Reworking the explorer, editor, tabs, or unrelated workspace features.

## Constraints

- Keep the Ghostty VT model and current WebGPU/WebGL renderer architecture.
- Add no dependency.
- Preserve ANSI/truecolor and the existing full-screen terminal behavior.
- Use the existing semantic command markers as the authority for block boundaries; buffer row positions must be recalculated after reflow.
- Keep terminal chrome outside the text-cell content area or prove geometrically that it cannot intersect it.

## Design decisions left to implementation

- The exact visual treatment of block boundaries (gutter, subtle rule, or combination) may follow existing Rex theme tokens, provided the behavioral requirements above hold.
- Any sticky/hover context must be conditional on available viewport space and disabled for output taller than the pane or alternate-screen applications.
- Implementation should first reproduce the actual overflowing case in a renderer-level or layout-level regression, then change the shared positioning/layout path.

## Existing integration facts

- Ghostty parser events already expose `prompt-start`, `prompt-end`, `end-of-input`, and `end-of-command`; parser-time semantic pin IDs resolve to buffer lines/columns after reflow.
- The current `GhosttyBlocks` controller uses `end-of-input` as a block start and `end-of-command` as completion, and knows alternate-screen mode. Shells without compatible integration stay in plain terminal mode; Bash versions before 4.4 explicitly disable block input.
- For incomplete/missing markers, keep the shell in plain mode or use only a known prompt/cursor boundary; never claim later output for a completed block. Running commands may extend to the live cursor but must not scan future buffer content.
- Hide command chrome in alternate-screen/mouse-tracking sessions. For a running command whose output is taller than the viewport, suppress sticky/hover header chrome, following Warp's `should_hide_snackbar_during_long_running_command` behavior.
