<div align="center">
  <img src="../../public/logo.png" width="144" height="144" alt="Rex" />
  <h1>Rex</h1>

  <p><strong>Le terminal d'espace de travail léger.</strong></p>
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

<img src="../../public/preview.webp" alt="Terminal d'espace de travail Rex" width="100%" />

Rex est un terminal d'espace de travail léger et open source construit sur Tauri 2 + Rust et React 19. Un terminal accéléré par GPU et un éditeur de code dans une seule application native rapide, avec un explorateur de fichiers, une gestion de code source avec graphe git et un panneau d'aperçu web intégrés. Environ 7-8 Mo sur disque. Aucune télémétrie. Aucun compte.

## Fonctionnalités

### Terminal

- Rendu accéléré par GPU : WebGPU par défaut, WebGL en secours (modèle de terminal libghostty-vt)
- Multi-onglets avec streaming en arrière-plan, scissions horizontales et verticales
- Saisie de commandes par blocs avec intégration shell (OSC 7 / OSC 133)
- Backend PTY natif via `portable-pty` (zsh, bash, pwsh, fish, cmd)
- Recherche en ligne, détection de liens, true-color
- Glissez des fichiers de l'explorateur ou du bureau vers le terminal en tant que chemins sécurisés et quotés
- Onglets privés
- Environnements de travail par onglet sous Windows (Local, ou toute distribution WSL installée)
- Les Spaces restaurent les onglets, répertoires de travail et dispositions scindées entre les lancements
- CLI `rex` incluse : `rex open <file> --line <n>` ouvre des fichiers depuis n'importe quel shell

### Éditeur de code

- CodeMirror 6 (TS/JS, Rust, Python, Go, C/C++, Java, HTML/CSS, JSON, Markdown, etc.)
- Markdown rendu plus visualisation d'images, vidéos, audio et PDF
- Prise en charge optionnelle des serveurs de langage : diagnostics, navigation, complétion, formatage et serveurs personnalisés
- Formatage à la sauvegarde (biome, prettier, ruff, rustfmt, gofmt, clang-format, shfmt, zig ou une commande personnalisée)
- Mode Vim
- Thèmes d'éditeur intégrés : Kanagawa, Catppuccin, Rosé Pine, Everforest, Dracula, Solarized, Nord, Tokyo Night, GitHub et Xcode

### Gestion de code source

- Stage / unstage de hunks, commit (Cmd+Enter / Ctrl+Enter), push conscient de l'amont
- Affichage et changement de branche, y compris l'état HEAD détaché
- Volet d'historique git avec un vrai graphe de commits (rendu en couloirs pour les fusions et branches)
- Recherche et filtrage des commits, clic vers la page du commit distant
- Génération de message de commit par IA en un clic (envoie le diff stagé et le nom du dépôt à un service sans clé gratuit)

### Explorateur de fichiers

- Thème d'icônes Catppuccin
- Recherche floue, navigation clavier, renommage en ligne, actions contextuelles
- Mises à jour en direct quand les fichiers changent sur le disque

### Aperçu web

- Détecte automatiquement les serveurs de développement locaux et les ouvre dans un onglet d'aperçu
- Aperçu des URL externes via une webview enfant native

### Thèmes et personnalisation

- Thèmes personnalisés créés dans l'application, basculez entre les préréglages intégrés et les vôtres
- Créez vos propres thèmes, partagez-les ou importez-les de la communauté
- Images d'arrière-plan avec opacité et flou réglables
- Le thème de l'éditeur est indépendant du thème de l'application

## Installation

Les derniers installateurs sont sur la page [Releases](https://github.com/Gazi2050/rex/releases/latest). Rex se met à jour automatiquement depuis là.

### Notes Windows

- Détection du shell par défaut : `pwsh.exe` (PowerShell 7+) -> `powershell.exe` (Windows PowerShell 5.1) -> `cmd.exe`.
- WSL est un environnement de travail de premier ordre, pas un sous-processus emballé.
- Les entrées de menu contextuel « Open in Rex » pour les dossiers et lecteurs sont installées par utilisateur.

### Notes Linux

- **NixOS / Nix** : utilisez le flake officiel - `nix profile install github:Gazi2050/rex` (hors NixOS), ou importez le flake et ajoutez `inputs.rex.packages.${pkgs.system}.rex` à `environment.systemPackages` (NixOS). La sortie `nixosModules.rex` est aussi disponible pour une configuration plus simple.
- **AppImage :** nécessite FUSE. Sans : `./Rex_*.AppImage --appimage-extract-and-run`. Sous Wayland avec des artefacts de rendu, essayez `WEBKIT_DISABLE_DMABUF_RENDERER=1`. Les paquets `.deb` / `.rpm` se lient à la pile GTK du système et sont généralement plus fluides.

## Compiler depuis les sources

**Prérequis**
- Rust (stable), https://rustup.rs
- Node 22+ et [pnpm](https://pnpm.io)
- Prérequis Tauri pour votre plateforme, https://tauri.app/start/prerequisites/

**Lancer**
```bash
pnpm install
pnpm tauri dev          # développement
pnpm tauri build        # bundle de production
```

**Vérifications**
```bash
pnpm lint
pnpm check-types
pnpm test
cd src-tauri && cargo clippy --all-targets --locked -- -D warnings   # lint Rust (comme en CI)
cd src-tauri && cargo nextest run --locked                           # ou : cargo test --locked
```

## Stack technique

Tauri 2, Rust, `portable-pty`, React 19, TypeScript, Vite, libghostty-vt (Ghostty), CodeMirror 6, Tailwind v4, Zustand.

## Contribuer

Issues et PRs bienvenues ! Ouvrez des issues, suggérez des fonctionnalités ou soumettez des pull requests. Voir [CONTRIBUTING.md](../../CONTRIBUTING.md) et la [documentation d'architecture](../README.md) pour plus de détails.

## Crédits

Rex est un fork de [Terax](https://github.com/crynta/terax-ai), créé et maintenu par [@crynta](https://github.com/crynta). Tout le crédit du projet original revient à Crynta.

## Licence

Rex est sous licence Apache-2.0. Pour plus d'informations sur nos dépendances, voir [Apache License 2.0](../../LICENSE).
