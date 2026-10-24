<div align="center">
  <img src="../../public/logo.png" width="144" height="144" alt="Rex" />
  <h1>Rex</h1>

  <p><strong>Lekki terminal przestrzeni roboczej.</strong></p>
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

<img src="../../public/preview.webp" alt="Terminal przestrzeni roboczej Rex" width="100%" />

Rex to lekki, otwartoźródłowy terminal przestrzeni roboczej zbudowany na Tauri 2 + Rust i React 19. Terminal akcelerowany przez GPU i edytor kodu w jednej szybkiej aplikacji natywnej, z wbudowanym eksploratorem plików, kontrolą źródła z grafem git i panelem podglądu WWW. Około 7-8 MB na dysku. Bez telemetrii. Bez konta.

## Funkcje

### Terminal

- Renderowanie akcelerowane przez GPU: domyślnie WebGPU, fallback WebGL (model terminala libghostty-vt)
- Wiele kart ze streamingiem w tle, podziały poziome i pionowe
- Blokowe wprowadzanie poleceń z integracją z powłoką (OSC 7 / OSC 133)
- Natywny backend PTY przez `portable-pty` (zsh, bash, pwsh, fish, cmd)
- Wyszukiwanie w linii, wykrywanie linków, true-color
- Przeciągnij pliki z eksploratora lub pulpitu do terminala jako bezpieczne dla powłoki ścieżki w cudzysłowach
- Prywatne karty
- Środowiska przestrzeni roboczej per karta w Windows (Lokalne lub dowolna zainstalowana dystrybucja WSL)
- Spaces przywracają karty, katalogi robocze i układy podziałów między uruchomieniami
- Dołączona aparatura `rex` CLI: `rex open <file> --line <n>` otwiera pliki z dowolnej powłoki

### Edytor kodu

- CodeMirror 6 (TS/JS, Rust, Python, Go, C/C++, Java, HTML/CSS, JSON, Markdown i więcej)
- Renderowany Markdown oraz podgląd obrazów, wideo, audio i PDF
- Opcjonalna obsługa serwerów języków: diagnostyka, nawigacja, uzupełnianie, formatowanie i własne serwery
- Formatowanie przy zapisie (biome, prettier, ruff, rustfmt, gofmt, clang-format, shfmt, zig lub własne polecenie)
- Tryb Vim
- Wbudowane motywy edytora: Kanagawa, Catppuccin, Rosé Pine, Everforest, Dracula, Solarized, Nord, Tokyo Night, GitHub i Xcode

### Kontrola źródła

- Stage / unstage hunków, commit (Cmd+Enter / Ctrl+Enter), push ze świadomością upstream
- Wyświetlanie i przełączanie gałęzi, w tym stan detached HEAD
- Panel historii git z prawdziwym grafem commitów (renderowanie pasów dla merge'ów i gałęzi)
- Wyszukiwanie i filtrowanie commitów, kliknięcie otwiera stronę zdalnego commita
- Generowanie komunikatu commita przez AI jednym kliknięciem (wysyła zestagowany diff i nazwę repozytorium do bezpłatnego punktu końcowego bez klucza)

### Eksplorator plików

- Motyw ikon Catppuccin
- Wyszukiwanie rozmyte, nawigacja klawiaturą, zmiana nazwy w miejscu, akcje kontekstowe
- Aktualizacje na żywo, gdy pliki zmieniają się na dysku

### Podgląd WWW

- Automatycznie wykrywa lokalne serwery deweloperskie i otwiera je w karcie podglądu
- Podgląd zewnętrznych adresów URL przez natywną podrzędną webview

### Motywy i personalizacja

- Własne motywy tworzone w aplikacji, przełączaj między wbudowanymi presetami a własnymi
- Twórz własne motywy, udostępniaj je lub importuj ze społeczności
- Obrazy tła z regulowaną kryciem i rozmyciem
- Motyw edytora jest niezależny od motywu aplikacji

## Instalacja

Najnowsze instalatory są na stronie [Releases](https://github.com/crynta/terax-ai/releases/latest). Rex aktualizuje się automatycznie z tego źródła.

### Uwagi dla Windows

- Domyślne wykrywanie powłoki: `pwsh.exe` (PowerShell 7+) -> `powershell.exe` (Windows PowerShell 5.1) -> `cmd.exe`.
- WSL to pełnoprawne środowisko przestrzeni roboczej, a nie opakowany podproces.
- Wpisy menu kontekstowego „Open in Rex" dla folderów i dysków są instalowane per użytkownik.

### Uwagi dla Linuksa

- **Arch / AUR:** `yay -S terax-bin` (lub `paru` itp.). Śledzi najnowsze wydanie.
- **NixOS / Nix**: użyj oficjalnego flake'a - `nix profile install github:crynta/terax-ai` (poza NixOS) albo zaimportuj flake i dodaj `inputs.rex.packages.${pkgs.system}.rex` do `environment.systemPackages` (NixOS). Output `nixosModules.rex` jest też dostępny dla prostszej konfiguracji.
- **AppImage:** wymaga FUSE. Bez niego: `./Terax_*.AppImage --appimage-extract-and-run`. Pod Waylandem przy problemach z renderowaniem spróbuj `WEBKIT_DISABLE_DMABUF_RENDERER=1`. Pakiety `.deb` / `.rpm` linkują z systemowym stosem GTK i zwykle działają płynniej.

## Budowanie ze źródeł

**Wymagania wstępne**
- Rust (stable), https://rustup.rs
- Node 22+ i [pnpm](https://pnpm.io)
- Wymagania Tauri dla twojej platformy, https://tauri.app/start/prerequisites/

**Uruchamianie**
```bash
pnpm install
pnpm tauri dev          # rozwój
pnpm tauri build        # pakiet produkcyjny
```

**Sprawdzenia**
```bash
pnpm lint
pnpm check-types
pnpm test
cd src-tauri && cargo clippy --all-targets --locked -- -D warnings   # lint Rust (jak w CI)
cd src-tauri && cargo nextest run --locked                           # lub: cargo test --locked
```

## Stos technologiczny

Tauri 2, Rust, `portable-pty`, React 19, TypeScript, Vite, libghostty-vt (Ghostty), CodeMirror 6, Tailwind v4, Zustand.

## Wkład

Issues i PR są mile widziane! Zgłaszaj problemy, proponuj funkcje lub wysyłaj pull requesty. Szczegóły w [CONTRIBUTING.md](../../CONTRIBUTING.md) i w [dokumentacji architektury](../README.md).

## Zasługi

Rex jest forkiem projektu [Terax](https://github.com/crynta/terax-ai), tworzonym i utrzymywanym przez [@crynta](https://github.com/crynta). Cały wkład w oryginalny projekt należy do Crynty.

## Podpisywanie kodu

<a href="https://signpath.org"><img src="https://avatars.githubusercontent.com/u/34448643?s=200&v=4" width="80" alt="SignPath" align="left" /></a>

Buildy Windows są podpisywane darmowym certyfikatem podpisywania kodu od [SignPath.io](https://signpath.io), certyfikat od [SignPath Foundation](https://signpath.org).

<br clear="left" />

## Licencja

Rex jest licencjonowany na warunkach Apache-2.0. Więcej o naszych zależnościach: [Apache License 2.0](../../LICENSE).
