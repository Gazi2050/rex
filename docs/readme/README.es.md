<div align="center">
  <img src="../../public/logo.png" width="144" height="144" alt="Rex" />
  <h1>Rex</h1>

  <p><strong>El terminal de espacio de trabajo ligero.</strong></p>
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

<img src="../../public/preview.webp" alt="Terminal de espacio de trabajo Rex" width="100%" />

Rex es un terminal de espacio de trabajo ligero y de código abierto construido con Tauri 2 + Rust y React 19. Un terminal acelerado por GPU y un editor de código en una sola aplicación nativa y rápida, con explorador de archivos, control de código fuente con grafo de git y un panel de vista previa web integrados. Unos 7-8 MB en disco. Sin telemetría. Sin cuenta.

## Características

### Terminal

- Renderizado acelerado por GPU: WebGPU por defecto, WebGL como respaldo (modelo de terminal libghostty-vt)
- Múltiples pestañas con transmisión en segundo plano, divisiones horizontales y verticales
- Entrada de comandos basada en bloques con integración de shell (OSC 7 / OSC 133)
- Backend PTY nativo mediante `portable-pty` (zsh, bash, pwsh, fish, cmd)
- Búsqueda en línea, detección de enlaces, color verdadero
- Arrastra archivos del explorador o del escritorio al terminal como rutas seguras entre comillas
- Pestañas privadas
- Entornos de espacio de trabajo por pestaña en Windows (Local, o cualquier distribución WSL instalada)
- Los Spaces restauran pestañas, directorios de trabajo y diseños divididos entre sesiones
- CLI `rex` incluido: `rex open <file> --line <n>` abre archivos desde cualquier shell

### Editor de código

- CodeMirror 6 (TS/JS, Rust, Python, Go, C/C++, Java, HTML/CSS, JSON, Markdown y más)
- Markdown renderizado más visualización de imágenes, vídeo, audio y PDF
- Soporte opcional de servidores de lenguaje con diagnóstico, navegación, autocompletado, formateo y servidores personalizados
- Formato al guardar (biome, prettier, ruff, rustfmt, gofmt, clang-format, shfmt, zig o un comando personalizado)
- Modo Vim
- Temas de editor integrados: Kanagawa, Catppuccin, Rosé Pine, Everforest, Dracula, Solarized, Nord, Tokyo Night, GitHub y Xcode

### Control de código fuente

- Etapa / desetapar fragmentos, confirmar (Cmd+Enter / Ctrl+Enter), push con conocimiento del upstream
- Visualización y cambio de ramas, incluido el estado HEAD desconectado
- Panel de historial de git con un grafo de commits real (renderizado por carriles para fusiones y ramas)
- Búsqueda y filtrado de commits, con clic hacia la página del commit remoto
- Generación de mensajes de commit con IA en un clic (envía el diff preparado y el nombre del repo a un servicio gratuito sin clave)

### Explorador de archivos

- Tema de iconos Catppuccin
- Búsqueda difusa, navegación con teclado, renombrado en línea, acciones contextuales
- Actualizaciones en vivo cuando los archivos cambian en el disco

### Vista previa web

- Detecta automáticamente servidores de desarrollo locales y los abre en una pestaña de vista previa
- Vista previa de URLs externas mediante un webview hijo nativo

### Temas y personalización

- Temas personalizados creados en la aplicación, cambia entre presets incluidos y los tuyos
- Crea tus propios temas, compártelos o impórtalos de la comunidad
- Imágenes de fondo con opacidad y desenfoque ajustables
- El tema del editor es independiente del tema de la aplicación

## Instalación

Los instaladores más recientes están en la página de [Releases](https://github.com/Gazi2050/rex/releases/latest). Rex se actualiza automáticamente desde ahí.

### Notas de Windows

- Detección de shell por defecto: `pwsh.exe` (PowerShell 7+) -> `powershell.exe` (Windows PowerShell 5.1) -> `cmd.exe`.
- WSL es un entorno de espacio de trabajo de primera clase, no un subproceso envuelto.
- Las entradas del menú contextual "Open in Rex" para carpetas y unidades se instalan por usuario.

### Notas de Linux

- **NixOS / Nix**: usa el flake oficial - `nix profile install github:Gazi2050/rex` (no NixOS), o importa el flake y añade `inputs.rex.packages.${pkgs.system}.rex` a `environment.systemPackages` (NixOS). La salida `nixosModules.rex` también está disponible para una configuración más simple.
- **AppImage:** necesita FUSE. Sin él: `./Rex_*.AppImage --appimage-extract-and-run`. En Wayland con fallos de renderizado, prueba `WEBKIT_DISABLE_DMABUF_RENDERER=1`. Los paquetes `.deb` / `.rpm` enlazan contra la pila GTK del sistema y suelen funcionar mejor.

## Compilar desde el código fuente

**Requisitos previos**
- Rust (estable), https://rustup.rs
- Node 22+ y [pnpm](https://pnpm.io)
- Requisitos de Tauri para tu plataforma, https://tauri.app/start/prerequisites/

**Ejecutar**
```bash
pnpm install
pnpm tauri dev          # desarrollo
pnpm tauri build        # paquete de producción
```

**Comprobaciones**
```bash
pnpm lint
pnpm check-types
pnpm test
cd src-tauri && cargo clippy --all-targets --locked -- -D warnings   # lint de Rust (igual que CI)
cd src-tauri && cargo nextest run --locked                           # o: cargo test --locked
```

## Stack tecnológico

Tauri 2, Rust, `portable-pty`, React 19, TypeScript, Vite, libghostty-vt (Ghostty), CodeMirror 6, Tailwind v4, Zustand.

## Contribuir

¡Issues y PRs son bienvenidos! Abre issues, sugiere funciones o envía pull requests. Consulta [CONTRIBUTING.md](../../CONTRIBUTING.md) y la [documentación de arquitectura](../README.md) para más detalles.

## Créditos

Rex es un fork de [Terax](https://github.com/crynta/terax-ai), creado y mantenido por [@crynta](https://github.com/crynta). Todo el mérito del proyecto original es de Crynta.

## Licencia

Rex se distribuye bajo la Licencia Apache-2.0. Para más información sobre nuestras dependencias, consulta [Apache License 2.0](../../LICENSE).
