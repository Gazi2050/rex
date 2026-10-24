# Roadmap

Rex direction, what's shipped, what's coming, and what's deliberately out of scope.

This file is updated as direction evolves. For day-to-day work, see [GitHub Issues](https://github.com/Gazi2050/rex/issues) and the Projects board.

## What Rex is

Rex is a fast, lightweight, terminal-first workspace. It pairs a native PTY backend with a modern UI: multi-tab terminals, an integrated code editor, a file explorer, source control, and a web preview, all in one native app. About 7-8 MB on disk. No telemetry. The only AI feature is one-click commit message generation.

Rex is a fork of [Terax](https://github.com/crynta/terax-ai) by [@crynta](https://github.com/crynta); credit for the original project goes to Crynta.

The product is opinionated: terminal-first, workspace over IDE, lightweight always, cross-platform without compromise.

## What Rex is not

- Not an IDE clone. Rex selectively integrates high-value editor capabilities such as LSP, formatting, source control, and previews without adopting the heavyweight runtime and always-on background services of a traditional IDE.
- Not a browser. Web preview exists for local dev servers and lightweight doc viewing only.
- Not a general workspace. Tools and formats that pull the product away from the terminal-first surface are out of scope.
- Not a one-size-fits-all CLI replacement. The goal is the best lightweight workspace terminal, not a shell with extras.

## Themes

The themes below frame every scope decision.

1. **Terminal-first.** Terminal correctness, PTY fidelity, TUI app compatibility are non-negotiable.
2. **Workspace, not IDE.** Terminal + editor + explorer + git in one window, each lazy and resource-bounded.
3. **Lightweight always.** 7-8 MB binary. Every dependency justified. Per-tab memory budget enforced.
4. **Cross-platform parity.** macOS, Linux, Windows, WSL. No platform-specific exclusives.
5. **Security by default.** Path guards, workspace authorization, OSC trust, IPC sandboxing. Defaults safe out of the box.

## Shipped

### Terminal

- [x] Multi-tab terminal with a GPU-accelerated renderer (WebGPU default, WebGL fallback)
- [x] Native PTY backend (zsh, bash, pwsh, fish, cmd)
- [x] Split panes
- [x] Shell integration (cwd, prompt markers) with block-based command input
- [x] Inline search, link detection, true-color
- [x] Drag and drop files into terminal panes as shell-safe quoted paths
- [x] Private terminal tabs
- [x] WSL bridge as workspace environment
- [x] Spaces with restored tabs, working directories, and split-pane layouts
- [x] Bundled `rex` CLI for opening files from any shell

### Editor

- [x] Multi-language support (TypeScript / JavaScript, Rust, Python, HTML / CSS, JSON, Markdown, Go, C / C++ / Java / C#, PHP)
- [x] Opt-in LSP support with diagnostics, navigation, completion, formatting, and custom servers
- [x] Format on save with per-language formatters and custom commands
- [x] Vim mode
- [x] Image, video, audio, and PDF viewing

### Themes and Customization

- [x] Prebuilt and custom app themes with import and sharing
- [x] Background images with adjustable opacity and blur
- [x] App-theme-aware and independently selectable editor themes

### File Explorer

- [x] Icon theme with full file-type coverage
- [x] Fuzzy search, keyboard navigation, inline rename, context actions
- [x] Live filesystem updates in the explorer and open editor tabs

### Git / Source Control

- [x] Source control panel (stage, commit, branch display and checkout)
- [x] Git history with commit graph
- [x] Per-file diffs
- [x] One-click AI commit message generation (keyless, explicit click)

### Previews

- [x] Auto-detected local dev server preview
- [x] Rendered Markdown preview with raw and rendered views
- [x] Sandboxed iframe

### Platform Integration

- [x] macOS, Linux (.deb / .rpm / AppImage), Windows (NSIS), WSL
- [x] AUR (Arch)
- [x] Windows Explorer context-menu integration
- [x] Auto-updater
- [x] No telemetry

### Security

- [x] Workspace authorization registry for shell spawns, git, and file operations
- [x] Trust gating in terminal escape-sequence handling
- [x] Sandboxed preview surface
- [x] Explicit, short outbound network allowlist (updater, AI commit message)

### Engineering

- [x] Regression coverage across critical PTY, security, editor, explorer, theme, and native-boundary behavior
- [x] Enforced startup and total client bundle budgets with heavy editor, Markdown, and source-control surfaces loaded on demand

## Planned

### Coming next

- [ ] SSH support (PTY auth and known_hosts first; SFTP and port forwarding later)
- [ ] Inline terminal auto-suggestions (history-based first)
- [ ] Persistent terminal processes across app restarts

### Longer horizon

- [ ] Selective TS → Rust migration where the profiler shows measurable wins

## Wanted contributions

Strategic areas where help is welcome. Pick something and propose an approach via an issue first.

- **Regression tests.** Add focused coverage for bug fixes and critical PTY, security, and native-boundary invariants.
- **Measured performance work.** Profile first and propose focused changes that preserve startup time, bundle size, memory use, and hot-path latency.
- **Platform-specific bugs.** Rendering issues on niche distros, shell quirks, WSL edge cases.
- **Documentation and translations.** Improvements, screenshots, examples, non-English README sections.
- **Themes.** Terminal and editor themes, UI accent palettes that fit the lightweight aesthetic.

See `good-first-issue` and `help-wanted` labels on GitHub Issues for concrete tasks.

## Out of scope

Categories that will not be built into Rex. Individual feature requests in these categories will be closed.

- **Heavyweight IDE infrastructure.** Integrated debugger and profiler suites, unbounded background indexing, and always-resident extension hosts are out of scope. Focused LSP, formatting, and editor workflows remain in scope when they are opt-in, lazy, and resource-bounded.
- **Notebook and document workspaces.** Anything that turns Rex into a document host rather than a terminal.
- **Package manager and toolchain UIs.** Use `npm`, `pip`, `cargo` and friends in the terminal directly.
- **Full web browser features.** Preview pane stays scoped to local dev servers and lightweight doc viewing. No navigation history, no bookmarks, no dev tools. Sandbox and WebView cookie policies can prevent cookie-based sign-in, so preview offers an external browser fallback instead of relaxing its security boundary.
- **Telemetry, analytics, accounts.** Rex stays offline-respectful.
- **Extension marketplaces at IDE scale.** Arbitrary UI or behavior extensions will not be built.
- **Built-in AI agents or provider integrations.** The only AI feature is commit message generation; anything beyond that is out of scope.

## Decision authority

Direction and scope decisions are made by [@Gazi2050](https://github.com/Gazi2050). Trusted reviewers (informal, no fixed roles yet) provide input on security, performance, and platform-specific areas.

If a PR is closed and you disagree, raise it in an issue. Happy to discuss, not happy to be ambushed in a PR comment thread.

This will likely formalize over time as the project grows.
