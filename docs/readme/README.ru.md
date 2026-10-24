<div align="center">
  <img src="../../public/logo.png" width="144" height="144" alt="Rex" />
  <h1>Rex</h1>

  <p><strong>Легковесный терминал рабочего пространства.</strong></p>
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

<img src="../../public/preview.webp" alt="Терминал рабочего пространства Rex" width="100%" />

Rex - это легковесный терминал рабочего пространства с открытым исходным кодом, построенный на Tauri 2 + Rust и React 19. Терминал с ускорением на GPU и редактор кода в одном быстром нативном приложении, со встроенными проводником файлов, контролем версий с git-графом и панелью веб-предпросмотра. Около 7-8 МБ на диске. Без телеметрии. Без аккаунта.

## Возможности

### Терминал

- Рендеринг с ускорением на GPU: WebGPU по умолчанию, WebGL как резерв (модель терминала libghostty-vt)
- Несколько вкладок с фоновой трансляцией, горизонтальное и вертикальное разделение
- Блочный ввод команд с интеграцией оболочки (OSC 7 / OSC 133)
- Нативный PTY-бэкенд через `portable-pty` (zsh, bash, pwsh, fish, cmd)
- Встроенный поиск, обнаружение ссылок, true-color
- Перетащите файлы из проводника или рабочего стола в терминал - путь будет безопасно закавычен для оболочки
- Приватные вкладки
- Окружения рабочего пространства на уровне вкладок в Windows (Локальное или любой установленный дистрибутив WSL)
- Spaces восстанавливают вкладки, рабочие каталоги и схемы разделения между запусками
- Встроенный CLI `rex`: `rex open <file> --line <n>` открывает файлы из любой оболочки

### Редактор кода

- CodeMirror 6 (TS/JS, Rust, Python, Go, C/C++, Java, HTML/CSS, JSON, Markdown и другие)
- Отрендеренный Markdown плюс просмотр изображений, видео, аудио и PDF
- Опциональная поддержка серверов языка: диагностика, навигация, дополнение, форматирование и свои серверы
- Форматирование при сохранении (biome, prettier, ruff, rustfmt, gofmt, clang-format, shfmt, zig или своя команда)
- Режим Vim
- Встроенные темы редактора: Kanagawa, Catppuccin, Rosé Pine, Everforest, Dracula, Solarized, Nord, Tokyo Night, GitHub и Xcode

### Контроль версий

- Стадия / снятие со стадии ханков, коммит (Cmd+Enter / Ctrl+Enter), push с учётом upstream
- Отображение и переключение веток, включая состояние detached HEAD
- Панель истории git с настоящим графом коммитов (отрисовка дорожек для merge и веток)
- Поиск и фильтрация коммитов, переход к странице удалённого коммита по клику
- Генерация сообщения коммита через ИИ в один клик (отправляет застейдженный дифф и имя репозитория на бесплатный эндпоинт без ключа)

### Проводник файлов

- Тема иконок Catppuccin
- Нечёткий поиск, навигация с клавиатуры, переименование на месте, контекстные действия
- Обновление в реальном времени при изменении файлов на диске

### Веб-предпросмотр

- Автоматически обнаруживает локальные dev-серверы и открывает их во вкладке предпросмотра
- Предпросмотр внешних URL через нативную дочернюю webview

### Темы и настройка

- Пользовательские темы создаются в приложении, переключайтесь между встроенными пресетами и своими
- Создавайте свои темы, делитесь ими или импортируйте из сообщества
- Фоновые изображения с настраиваемой прозрачностью и размытием
- Тема редактора независима от темы приложения

## Установка

Последние установщики на странице [Releases](https://github.com/crynta/terax-ai/releases/latest). Rex обновляется автоматически оттуда.

### Примечания для Windows

- Определение оболочки по умолчанию: `pwsh.exe` (PowerShell 7+) -> `powershell.exe` (Windows PowerShell 5.1) -> `cmd.exe`.
- WSL - это полноценное окружение рабочего пространства, а не обёрнутый подпроцесс.
- Пункты контекстного меню «Open in Rex» для папок и дисков устанавливаются на уровне пользователя.

### Примечания для Linux

- **Arch / AUR:** `yay -S terax-bin` (или `paru` и т.п.). Следит за последним релизом.
- **NixOS / Nix**: используйте официальный flake - `nix profile install github:crynta/terax-ai` (не NixOS), либо импортируйте flake и добавьте `inputs.rex.packages.${pkgs.system}.rex` в `environment.systemPackages` (NixOS). Для более простой настройки доступен также выход `nixosModules.rex`.
- **AppImage:** нужен FUSE. Без него: `./Terax_*.AppImage --appimage-extract-and-run`. При артефактах рендеринга под Wayland попробуйте `WEBKIT_DISABLE_DMABUF_RENDERER=1`. Пакеты `.deb` / `.rpm` линкуются с системным стеком GTK и обычно работают стабильнее.

## Сборка из исходников

**Предварительные требования**
- Rust (stable), https://rustup.rs
- Node 22+ и [pnpm](https://pnpm.io)
- Требования Tauri для вашей платформы, https://tauri.app/start/prerequisites/

**Запуск**
```bash
pnpm install
pnpm tauri dev          # разработка
pnpm tauri build        # продакшен-сборка
```

**Проверки**
```bash
pnpm lint
pnpm check-types
pnpm test
cd src-tauri && cargo clippy --all-targets --locked -- -D warnings   # Rust lint (как в CI)
cd src-tauri && cargo nextest run --locked                           # или: cargo test --locked
```

## Технологический стек

Tauri 2, Rust, `portable-pty`, React 19, TypeScript, Vite, libghostty-vt (Ghostty), CodeMirror 6, Tailwind v4, Zustand.

## Участие в разработке

Issues и PR приветствуются! Открывайте issues, предлагайте функции или присылайте pull request'ы. Подробности в [CONTRIBUTING.md](../../CONTRIBUTING.md) и [документации по архитектуре](../README.md).

## Благодарности

Rex - это форк [Terax](https://github.com/crynta/terax-ai), созданного и поддерживаемого [@crynta](https://github.com/crynta). Все заслуги за оригинальный проект принадлежат Crynta.

## Подпись кода

<a href="https://signpath.org"><img src="https://avatars.githubusercontent.com/u/34448643?s=200&v=4" width="80" alt="SignPath" align="left" /></a>

Сборки для Windows подписываются бесплатным сертификатом подписи кода от [SignPath.io](https://signpath.org), сертификат предоставлен [SignPath Foundation](https://signpath.org).

<br clear="left" />

## Лицензия

Rex распространяется по лицензии Apache-2.0. Подробнее о наших зависимостях см. [Apache License 2.0](../../LICENSE).
