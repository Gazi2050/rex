<div align="center">
  <img src="../../public/logo.png" width="144" height="144" alt="Rex" />
  <h1>Rex</h1>

  <p><strong>Das leichtgewichtige Workspace-Terminal.</strong></p>
</div>

<p align="center">
  <a href="../../README.md">English</a> |
  <a href="README.zh-CN.md">简体中文</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.pt-BR.md">Português</a> |
  <a href="README.pl.md">Polski</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.id.md">Bahasa Indonesia</a> |
  <a href="README.hi.md">हिन्दी</a>
</p>

---

<img src="../../public/preview.webp" alt="Rex Workspace-Terminal" width="100%" />

Rex ist ein leichtgewichtiges, quelloffenes Workspace-Terminal, gebaut mit Tauri 2 + Rust und React 19. Ein GPU-beschleunigtes Terminal und ein Code-Editor in einer schnellen nativen App, mit Datei-Explorer, Quellcodeverwaltung mit Git-Graph und einem Web-Preview-Bereich. Etwa 7-8 MB auf der Festplatte. Keine Telemetrie. Kein Konto.

## Funktionen

### Terminal

- GPU-beschleunigtes Rendering: standardmäßig WebGPU, WebGL als Fallback (libghostty-vt-Terminalmodell)
- Mehrere Tabs mit Hintergrund-Streaming, horizontale und vertikale Teilung
- Blockbasierter Befehlseingabe mit Shell-Integration (OSC 7 / OSC 133)
- natives PTY-Backend über `portable-pty` (zsh, bash, pwsh, fish, cmd)
- Inline-Suche, Link-Erkennung, True Color
- Dateien aus dem Explorer oder Desktop per Drag-and-Drop ins Terminal ziehen, als shell-sichere Pfade in Anführungszeichen
- Private Tabs
- Pro-Tab-Arbeitsumgebungen unter Windows (Lokal oder jede installierte WSL-Distribution)
- Spaces stellen Tabs, Arbeitsverzeichnisse und Split-Layouts über Neustarts hinweg wieder her
- Gebündelte `rex`-CLI: `rex open <file> --line <n>` öffnet Dateien aus jeder Shell

### Code-Editor

- CodeMirror 6 (TS/JS, Rust, Python, Go, C/C++, Java, HTML/CSS, JSON, Markdown und mehr)
- Gerendertes Markdown plus Anzeige von Bildern, Videos, Audio und PDF
- Opt-in-Sprachserverunterstützung mit Diagnose, Navigation, Vervollständigung, Formatierung und eigenen Servern
- Formatieren beim Speichern (biome, prettier, ruff, rustfmt, gofmt, clang-format, shfmt, zig oder ein eigener Befehl)
- Vim-Modus
- Eingebaute Editor-Themes: Kanagawa, Catppuccin, Rosé Pine, Everforest, Dracula, Solarized, Nord, Tokyo Night, GitHub und Xcode

### Quellcodeverwaltung

- Stagen / Unstagen von Hunks, Committen (Cmd+Enter / Ctrl+Enter), Push mit Upstream-Erkennung
- Branch-Anzeige und -Wechsel, einschließlich Detached-HEAD-Zustand
- Git-Historie mit echtem Commit-Graphen (Lane-Rendering für Merges und Branches)
- Commit-Suche und -Filter, Klick zur Remote-Commit-Seite
- KI-Commit-Message auf einen Klick (sendet den gestagten Diff und den Repo-Namen an einen kostenlosen Endpoint ohne Schlüssel)

### Datei-Explorer

- Catppuccin-Icon-Theme
- Fuzzy-Suche, Tastaturnavigation, Inline-Umbenennen, Kontextaktionen
- Live-Updates, wenn sich Dateien auf der Festplatte ändern

### Web-Preview

- Erkennt lokale Dev-Server automatisch und öffnet sie in einem Preview-Tab
- Vorschau externer URLs über eine native Child-Webview

### Themes und Anpassung

- Eigene Themes direkt in der App erstellen, zwischen mitgelieferten Presets und deinen eigenen wechseln
- Eigene Themes erstellen, teilen oder aus der Community importieren
- Hintergrundbilder mit einstellbarer Deckkraft und Unschärfe
- Das Editor-Theme ist unabhängig vom App-Theme

## Installation

Die neuesten Installer findest du auf der [Releases](https://github.com/crynta/terax-ai/releases/latest)-Seite. Rex aktualisiert sich von dort automatisch.

### Windows-Hinweise

- Standard-Shell-Erkennung: `pwsh.exe` (PowerShell 7+) -> `powershell.exe` (Windows PowerShell 5.1) -> `cmd.exe`.
- WSL ist eine erstklassige Arbeitsumgebung, kein gewickelter Subprozess.
- "Open in Rex"-Kontextmenüeinträge für Ordner und Laufwerke werden pro Benutzer installiert.

### Linux-Hinweise

- **Arch / AUR:** `yay -S terax-bin` (oder `paru` etc.). Folgt der neuesten Version.
- **NixOS / Nix**: benutze das offizielle Flake - `nix profile install github:crynta/terax-ai` (nicht NixOS), oder importiere das Flake und füge `inputs.rex.packages.${pkgs.system}.rex` zu `environment.systemPackages` hinzu (NixOS). Der `nixosModules.rex`-Output ist für eine einfachere Einrichtung ebenfalls verfügbar.
- **AppImage:** braucht FUSE. Ohne: `./Terax_*.AppImage --appimage-extract-and-run`. Bei Rendering-Problemen unter Wayland: `WEBKIT_DISABLE_DMABUF_RENDERER=1`. Die `.deb`-/`.rpm`-Pakete linken gegen den System-GTK-Stack und laufen meist runder.

## Aus dem Quellcode bauen

**Voraussetzungen**
- Rust (stable), https://rustup.rs
- Node 22+ und [pnpm](https://pnpm.io)
- Tauri-Voraussetzungen für deine Plattform, https://tauri.app/start/prerequisites/

**Ausführen**
```bash
pnpm install
pnpm tauri dev          # Entwicklung
pnpm tauri build        # Produktions-Bundle
```

**Prüfungen**
```bash
pnpm lint
pnpm check-types
pnpm test
cd src-tauri && cargo clippy --all-targets --locked -- -D warnings   # Rust-Lint (wie in CI)
cd src-tauri && cargo nextest run --locked                           # oder: cargo test --locked
```

## Tech-Stack

Tauri 2, Rust, `portable-pty`, React 19, TypeScript, Vite, libghostty-vt (Ghostty), CodeMirror 6, Tailwind v4, Zustand.

## Mitwirken

Issues und PRs sind willkommen! Öffne Issues, schlage Funktionen vor oder reiche Pull Requests ein. Siehe [CONTRIBUTING.md](../../CONTRIBUTING.md) und die [Architektur-Dokumentation](../README.md).

## Danksagung

Rex ist ein Fork von [Terax](https://github.com/crynta/terax-ai), erstellt und gepflegt von [@crynta](https://github.com/crynta). Alle Anerkennung für das Originalprojekt gebührt Crynta.

## Code-Signierung

<a href="https://signpath.org"><img src="https://avatars.githubusercontent.com/u/34448643?s=200&v=4" width="80" alt="SignPath" align="left" /></a>

Windows-Builds werden mit einem kostenlosen Code-Signing-Zertifikat von [SignPath.io](https://signpath.io) signiert, Zertifikat von der [SignPath Foundation](https://signpath.org).

<br clear="left" />

## Lizenz

Rex ist unter der Apache-2.0-Lizenz lizenziert. Informationen zu unseren Abhängigkeiten findest du unter [Apache License 2.0](../../LICENSE).
