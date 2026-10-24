<div align="center">
  <img src="public/logo.png" width="144" height="144" alt="Rex" />
  <h1>Rex</h1>

  <p><strong>The lightweight workspace terminal.</strong></p>
</div>

<p align="center">
  <a href="docs/readme/README.zh-CN.md">简体中文</a> |
  <a href="docs/readme/README.es.md">Español</a> |
  <a href="docs/readme/README.de.md">Deutsch</a> |
  <a href="docs/readme/README.fr.md">Français</a> |
  <a href="docs/readme/README.ja.md">日本語</a> |
  <a href="docs/readme/README.ko.md">한국어</a> |
  <a href="docs/readme/README.pt-BR.md">Português</a> |
  <a href="docs/readme/README.pl.md">Polski</a> |
  <a href="docs/readme/README.ru.md">Русский</a> |
  <a href="docs/readme/README.id.md">Bahasa Indonesia</a> |
  <a href="docs/readme/README.hi.md">हिन्दी</a>
</p>

---

<img src="public/preview.webp" alt="Rex workspace terminal" width="100%" />

Rex is a lightweight, open-source workspace terminal built on Tauri 2 + Rust and React 19. A GPU-accelerated terminal and a code editor in one fast native app, with a file explorer, source control with a git graph, and a web preview pane built in. About 7-8 MB on disk. No telemetry. No account.

## Features

### Terminal

- GPU-accelerated renderer: WebGPU by default, WebGL fallback (libghostty-vt terminal model)
- Multi-tab with background streaming, horizontal and vertical splits
- Block-based command input with shell integration (OSC 7 / OSC 133)
- Native PTY backend via `portable-pty` (zsh, bash, pwsh, fish, cmd)
- Inline search, link detection, true-color
- Drag files from the explorer or desktop into a terminal as shell-safe quoted paths
- Private tabs
- Per-tab workspace environments on Windows (Local, or any installed WSL distro)
- Spaces restore tabs, working directories, and split layouts across launches
- Bundled `rex` CLI: `rex open <file> --line <n>` opens files from any shell

### Code editor

- CodeMirror 6 (TS/JS, Rust, Python, Go, C/C++, Java, HTML/CSS, JSON, Markdown, and more)
- Rendered Markdown plus image, video, audio, and PDF viewing
- Opt-in language server support with diagnostics, navigation, completion, formatting, and custom servers
- Format on save (biome, prettier, ruff, rustfmt, gofmt, clang-format, shfmt, zig, or a custom command)
- Vim mode
- Built-in editor themes including Kanagawa, Catppuccin, Rosé Pine, Everforest, Dracula, Solarized, Nord, Tokyo Night, GitHub, and Xcode

### Source control

- Stage / unstage hunks, commit (Cmd+Enter / Ctrl+Enter), push with upstream awareness
- Branch display and checkout, including detached HEAD state
- Git history pane with a real commit graph (lane rendering for merges and branches)
- Commit search and filter, click through to the remote commit page
- One-click AI commit message generation (sends the staged diff and repo name to a free keyless endpoint)

### File explorer

- Catppuccin icon theme
- Fuzzy search, keyboard navigation, inline rename, context actions
- Live updates when files change on disk

### Web preview

- Auto-detects local dev servers and opens them in a preview tab
- External URL preview via a native child webview

### Themes and customization

- Custom themes built in-app, switch between bundled presets and your own
- Create your own themes, share them or import from the community
- Background images with adjustable opacity and blur
- Editor theme is independent from the app theme

## Install

Latest installers are on the [Releases](https://github.com/crynta/terax-ai/releases/latest) page. Rex auto-updates from there.

### Windows notes

- Default shell detection: `pwsh.exe` (PowerShell 7+) -> `powershell.exe` (Windows PowerShell 5.1) -> `cmd.exe`.
- WSL is a first-class workspace environment, not a wrapped subprocess.
- "Open in Rex" context-menu entries for folders and drives are installed per-user.

### Linux notes

- **Arch / AUR:** `yay -S terax-bin` (or `paru`, etc.). Tracks the latest release.
- **NixOS / Nix**: use the official flake - `nix profile install github:crynta/terax-ai` (non-NixOS), or import the flake and add `inputs.rex.packages.${pkgs.system}.rex` to `environment.systemPackages` (NixOS). The `nixosModules.rex` output is also available for a simpler setup.
- **AppImage:** needs FUSE. Without it: `./Terax_*.AppImage --appimage-extract-and-run`. On Wayland with rendering glitches, try `WEBKIT_DISABLE_DMABUF_RENDERER=1`. Otherwise the `.deb` / `.rpm` packages link against the system GTK stack and tend to be smoother.

## Build from source

**Prerequisites**
- Rust (stable), https://rustup.rs
- Node 22+ and [pnpm](https://pnpm.io)
- Tauri prerequisites for your platform, https://tauri.app/start/prerequisites/

**Run**
```bash
pnpm install
pnpm tauri dev          # development
pnpm tauri build        # production bundle
```

**Checks**
```bash
pnpm lint
pnpm check-types
pnpm test
cd src-tauri && cargo clippy --all-targets --locked -- -D warnings   # Rust lint (matches CI)
cd src-tauri && cargo nextest run --locked                           # or: cargo test --locked
```

## Tech stack

Tauri 2, Rust, `portable-pty`, React 19, TypeScript, Vite, libghostty-vt (Ghostty), CodeMirror 6, Tailwind v4, Zustand.

## Contributing

Issues and PRs are welcome! Feel free to open issues, suggest features, or submit pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md) and the [architecture docs](docs/README.md) for more details.

## Credits

Rex is a fork of [Terax](https://github.com/crynta/terax-ai), created and maintained by [@crynta](https://github.com/crynta). All credit for the original project goes to Crynta.

## Code signing

<a href="https://signpath.org"><img src="https://avatars.githubusercontent.com/u/34448643?s=200&v=4" width="80" alt="SignPath" align="left" /></a>

Windows builds are signed with a free code signing certificate provided by [SignPath.io](https://signpath.io), certificate by the [SignPath Foundation](https://signpath.org).

<br clear="left" />

## License

Rex is licensed under the Apache-2.0 License. For more information on our dependencies, see [Apache License 2.0](LICENSE).
