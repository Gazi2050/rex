<div align="center">
  <img src="../../public/logo.png" width="144" height="144" alt="Rex" />
  <h1>Rex</h1>

  <p><strong>가벼운 워크스페이스 터미널.</strong></p>
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

<img src="../../public/preview.webp" alt="Rex 워크스페이스 터미널" width="100%" />

Rex는 Tauri 2 + Rust와 React 19 기반으로 만들어진 가볍고 오픈 소스인 워크스페이스 터미널입니다. GPU 가속 터미널과 코드 에디터를 하나의 빠른 네이티브 앱에 담고, 파일 탐색기, git 그래프가 있는 소스 컨트롤, 웹 미리보기 패널까지 내장했습니다. 디스크 약 7-8 MB. 텔레메트리 없음. 계정 불필요.

## 기능

### 터미널

- GPU 가속 렌더링: 기본 WebGPU, 폴백 WebGL (libghostty-vt 터미널 모델)
- 백그라운드 스트리밍이 가능한 멀티 탭, 가로/세로 분할
- 셸 통합이 적용된 블록 기반 명령 입력 (OSC 7 / OSC 133)
- `portable-pty` 기반 네이티브 PTY 백엔드 (zsh, bash, pwsh, fish, cmd)
- 인라인 검색, 링크 감지, 트루컬러
- 탐색기나 바탕화면에서 터미널로 파일을 드래그하면 셸에 안전한 따옴표 경로로 삽입
- 프라이빗 탭
- Windows에서 탭별 워크스페이스 환경 (로컬 또는 설치된 모든 WSL 배포판)
- Spaces가 탭, 작업 디렉터리, 분할 레이아웃을 실행 간에 복원
- 번들 `rex` CLI: `rex open <file> --line <n>` 으로 어떤 셸에서든 파일 열기

### 코드 에디터

- CodeMirror 6 (TS/JS, Rust, Python, Go, C/C++, Java, HTML/CSS, JSON, Markdown 등)
- 렌더링된 Markdown과 이미지·비디오·오디오·PDF 보기
- 옵트인 언어 서버 지원: 진단, 탐색, 완성, 포맷팅, 사용자 지정 서버
- 저장 시 포맷 (biome, prettier, ruff, rustfmt, gofmt, clang-format, shfmt, zig 또는 사용자 지정 명령)
- Vim 모드
- 내장 에디터 테마: Kanagawa, Catppuccin, Rosé Pine, Everforest, Dracula, Solarized, Nord, Tokyo Night, GitHub, Xcode

### 소스 컨트롤

- 헝크 스테이지 / 언스테이지, 커밋 (Cmd+Enter / Ctrl+Enter), 업스트림을 인식하는 푸시
- 브랜치 표시 및 전환, detached HEAD 상태 포함
- 실제 커밋 그래프를 그리는 git 히스토리 패인 (머지와 브랜치의 레인 렌더링)
- 커밋 검색 및 필터, 원격 커밋 페이지로 클릭 이동
- 원클릭 AI 커밋 메시지 생성 (스테이지된 diff와 저장소 이름을 키가 필요 없는 무료 엔드포인트로 전송)

### 파일 탐색기

- Catppuccin 아이콘 테마
- 퍼지 검색, 키보드 탐색, 인라인 이름 바꾸기, 컨텍스트 작업
- 디스크에서 파일이 변경되면 실시간 갱신

### 웹 미리보기

- 로컬 개발 서버를 자동 감지하여 미리보기 탭으로 열기
- 네이티브 자식 webview를 통한 외부 URL 미리보기

### 테마 및 커스터마이징

- 앱 안에서 직접 만드는 커스텀 테마, 내장 프리셋과 내 테마 전환
- 자신만의 테마를 만들어 공유하거나 커뮤니티에서 가져오기
- 불투명도와 블러를 조절할 수 있는 배경 이미지
- 에디터 테마는 앱 테마와 독립적

## 설치

최신 설치 프로그램은 [Releases](https://github.com/Gazi2050/rex/releases/latest) 페이지에 있습니다. Rex는 그곳에서 자동 업데이트됩니다.

### Windows 참고

- 기본 셸 감지 순서: `pwsh.exe` (PowerShell 7+) -> `powershell.exe` (Windows PowerShell 5.1) -> `cmd.exe`.
- WSL은 감싼 서브프로세스가 아니라 일급 워크스페이스 환경입니다.
- 폴더와 드라이브용 "Open in Rex" 컨텍스트 메뉴가 사용자 단위로 설치됩니다.

### Linux 참고

- **NixOS / Nix**: 공식 flake 사용 - `nix profile install github:Gazi2050/rex` (비 NixOS), 또는 flake를 가져와서 `inputs.rex.packages.${pkgs.system}.rex`를 `environment.systemPackages`에 추가 (NixOS). 더 간단한 설정을 위해 `nixosModules.rex` 출력도 제공됩니다.
- **AppImage:** FUSE 필요. 없으면: `./Rex_*.AppImage --appimage-extract-and-run`. Wayland에서 렌더링 문제가 있으면 `WEBKIT_DISABLE_DMABUF_RENDERER=1`을 시도하세요. `.deb` / `.rpm` 패키지는 시스템 GTK 스택에 링크되어 대체로 더 안정적입니다.

## 소스에서 빌드

**사전 요구 사항**
- Rust (stable), https://rustup.rs
- Node 22+ 및 [pnpm](https://pnpm.io)
- 플랫폼별 Tauri 요구 사항, https://tauri.app/start/prerequisites/

**실행**
```bash
pnpm install
pnpm tauri dev          # 개발
pnpm tauri build        # 프로덕션 번들
```

**검사**
```bash
pnpm lint
pnpm check-types
pnpm test
cd src-tauri && cargo clippy --all-targets --locked -- -D warnings   # Rust lint (CI와 동일)
cd src-tauri && cargo nextest run --locked                           # 또는: cargo test --locked
```

## 기술 스택

Tauri 2, Rust, `portable-pty`, React 19, TypeScript, Vite, libghostty-vt (Ghostty), CodeMirror 6, Tailwind v4, Zustand.

## 기여

이슈와 PR을 환영합니다! 이슈를 열거나, 기능을 제안하거나, 풀 리퀘스트를 보내주세요. 자세한 내용은 [CONTRIBUTING.md](../../CONTRIBUTING.md)과 [아키텍처 문서](../README.md)를 참고하세요.

## 크레딧

Rex는 [@crynta](https://github.com/crynta)가 만들고 관리하는 [Terax](https://github.com/crynta/terax-ai)의 포크입니다. 원본 프로젝트의 모든 공로는 Crynta에게 있습니다.

## 라이선스

Rex는 Apache-2.0 라이선스에 따라 배포됩니다. 의존성에 대한 자세한 내용은 [Apache License 2.0](../../LICENSE)을 참조하세요.
