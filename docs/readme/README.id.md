<div align="center">
  <img src="../../public/logo.png" width="144" height="144" alt="Rex" />
  <h1>Rex</h1>

  <p><strong>Terminal workspace yang ringan.</strong></p>
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

<img src="../../public/preview.webp" alt="Terminal workspace Rex" width="100%" />

Rex adalah terminal workspace ringan dan open source yang dibangun di atas Tauri 2 + Rust dan React 19. Terminal dengan akselerasi GPU dan editor kode dalam satu aplikasi native yang cepat, dilengkapi penjelajah file, source control dengan graf git, dan panel pratinjau web. Sekitar 7-8 MB di disk. Tanpa telemetri. Tanpa akun.

## Fitur

### Terminal

- Rendering dengan akselerasi GPU: WebGPU secara bawaan, WebGL sebagai fallback (model terminal libghostty-vt)
- Multi-tab dengan streaming latar belakang, split horizontal dan vertikal
- Input perintah berbasis blok dengan integrasi shell (OSC 7 / OSC 133)
- Backend PTY native via `portable-pty` (zsh, bash, pwsh, fish, cmd)
- Pencarian inline, deteksi tautan, true-color
- Seret file dari explorer atau desktop ke terminal sebagai path yang aman untuk shell dengan tanda kutip
- Tab privat
- Lingkungan workspace per tab di Windows (Lokal, atau distro WSL apa pun yang terinstal)
- Spaces memulihkan tab, direktori kerja, dan tata letak split antar peluncuran
- CLI `rex` bawaan: `rex open <file> --line <n>` membuka file dari shell mana pun

### Editor kode

- CodeMirror 6 (TS/JS, Rust, Python, Go, C/C++, Java, HTML/CSS, JSON, Markdown, dan lainnya)
- Markdown yang dirender plus penampil gambar, video, audio, dan PDF
- Dukungan language server opt-in dengan diagnostik, navigasi, completion, pemformatan, dan server kustom
- Format saat menyimpan (biome, prettier, ruff, rustfmt, gofmt, clang-format, shfmt, zig, atau perintah kustom)
- Mode Vim
- Tema editor bawaan: Kanagawa, Catppuccin, Rosé Pine, Everforest, Dracula, Solarized, Nord, Tokyo Night, GitHub, dan Xcode

### Source control

- Stage / unstage hunk, commit (Cmd+Enter / Ctrl+Enter), push dengan kesadaran upstream
- Tampilan dan pergantian branch, termasuk kondisi detached HEAD
- Panel riwayat git dengan graf commit yang sebenarnya (rendering lajur untuk merge dan branch)
- Pencarian dan filter commit, klik untuk membuka halaman commit remote
- Pembuatan pesan commit AI sekali klik (mengirim diff yang di-stage dan nama repo ke endpoint gratis tanpa kunci)

### Penjelajah file

- Tema ikon Catppuccin
- Pencarian fuzzy, navigasi keyboard, penggantian nama inline, aksi kontekstual
- Pembaruan langsung saat file berubah di disk

### Pratinjau web

- Mendeteksi dev server lokal secara otomatis dan membukanya di tab pratinjau
- Pratinjau URL eksternal melalui webview anak native

### Tema dan kustomisasi

- Tema kustom dibuat langsung di aplikasi, beralih antara preset bawaan dan milik Anda
- Buat tema Anda sendiri, bagikan atau impor dari komunitas
- Gambar latar dengan opasitas dan blur yang dapat diatur
- Tema editor independen dari tema aplikasi

## Instalasi

Pemasang terbaru ada di halaman [Releases](https://github.com/Gazi2050/rex/releases/latest). Rex memperbarui dirinya secara otomatis dari sana.

### Catatan Windows

- Deteksi shell bawaan: `pwsh.exe` (PowerShell 7+) -> `powershell.exe` (Windows PowerShell 5.1) -> `cmd.exe`.
- WSL adalah lingkungan workspace kelas satu, bukan subproses yang dibungkus.
- Entri menu konteks "Open in Rex" untuk folder dan drive diinstal per pengguna.

### Catatan Linux

- **NixOS / Nix**: gunakan flake resmi - `nix profile install github:Gazi2050/rex` (bukan NixOS), atau impor flake dan tambahkan `inputs.rex.packages.${pkgs.system}.rex` ke `environment.systemPackages` (NixOS). Output `nixosModules.rex` juga tersedia untuk penyiapan yang lebih sederhana.
- **AppImage:** butuh FUSE. Tanpa itu: `./Rex_*.AppImage --appimage-extract-and-run`. Di Wayland dengan gangguan rendering, coba `WEBKIT_DISABLE_DMABUF_RENDERER=1`. Paket `.deb` / `.rpm` menaut ke stack GTK sistem dan cenderung lebih lancar.

## Membangun dari sumber

**Prasyarat**
- Rust (stable), https://rustup.rs
- Node 22+ dan [pnpm](https://pnpm.io)
- Prasyarat Tauri untuk platform Anda, https://tauri.app/start/prerequisites/

**Menjalankan**
```bash
pnpm install
pnpm tauri dev          # pengembangan
pnpm tauri build        # bundle produksi
```

**Pemeriksaan**
```bash
pnpm lint
pnpm check-types
pnpm test
cd src-tauri && cargo clippy --all-targets --locked -- -D warnings   # lint Rust (sama dengan CI)
cd src-tauri && cargo nextest run --locked                           # atau: cargo test --locked
```

## Stack teknologi

Tauri 2, Rust, `portable-pty`, React 19, TypeScript, Vite, libghostty-vt (Ghostty), CodeMirror 6, Tailwind v4, Zustand.

## Berkontribusi

Issue dan PR diterima dengan senang hati! Buka issue, sarankan fitur, atau kirim pull request. Lihat [CONTRIBUTING.md](../../CONTRIBUTING.md) dan [dokumentasi arsitektur](../README.md) untuk detailnya.

## Kredit

Rex adalah fork dari [Terax](https://github.com/crynta/terax-ai), yang dibuat dan dirawat oleh [@crynta](https://github.com/crynta). Seluruh kredit untuk proyek asli diberikan kepada Crynta.

## Lisensi

Rex dilisensikan di bawah Lisensi Apache-2.0. Untuk informasi tentang dependensi kami, lihat [Apache License 2.0](../../LICENSE).
