<div align="center">
  <img src="../../public/logo.png" width="144" height="144" alt="Rex" />
  <h1>Rex</h1>

  <p><strong>轻量级工作区终端。</strong></p>
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

<img src="../../public/preview.webp" alt="Rex 工作区终端" width="100%" />

Rex 是一个基于 Tauri 2 + Rust 和 React 19 构建的轻量级开源工作区终端。GPU 加速的终端与代码编辑器合二为一，构成一个快速的本地应用，并内置文件资源管理器、带 git 图的源代码管理以及 Web 预览面板。磁盘占用约 7-8 MB。无遥测。无需账号。

## 功能

### 终端

- GPU 加速渲染：默认 WebGPU，WebGL 兜底（libghostty-vt 终端模型）
- 多标签页后台持续输出，支持水平与垂直分屏
- 基于块的命令输入与 shell 集成（OSC 7 / OSC 133）
- 通过 `portable-pty` 提供原生 PTY 后端（zsh、bash、pwsh、fish、cmd）
- 内联搜索、链接检测、真彩色
- 将文件从资源管理器或桌面拖入终端，自动进行 shell 安全的路径引号处理
- 私密标签页
- Windows 上每个标签页可选工作区环境（本地，或任何已安装的 WSL 发行版）
- Spaces 可在启动之间恢复标签页、工作目录和分屏布局
- 内置 `rex` CLI：`rex open <file> --line <n>` 可从任意 shell 打开文件

### 代码编辑器

- CodeMirror 6（TS/JS、Rust、Python、Go、C/C++、Java、HTML/CSS、JSON、Markdown 等）
- 渲染 Markdown，以及图片、视频、音频和 PDF 查看
- 可选的语言服务器（LSP）支持：诊断、导航、补全、格式化与自定义服务器
- 保存时格式化（biome、prettier、ruff、rustfmt、gofmt、clang-format、shfmt、zig 或自定义命令）
- Vim 模式
- 内置编辑器主题：Kanagawa、Catppuccin、Rosé Pine、Everforest、Dracula、Solarized、Nord、Tokyo Night、GitHub、Xcode

### 源代码管理

- 暂存 / 取消暂存代码块，提交（Cmd+Enter / Ctrl+Enter），感知上游的推送
- 分支显示与切换，包括分离 HEAD 状态
- Git 历史面板，呈现真实的提交图（合并与分支的车道渲染）
- 提交搜索与过滤，可点击跳转到远程提交页面
- 一键 AI 生成提交信息（将暂存的 diff 和仓库名发送到免费的无密钥接口）

### 文件资源管理器

- Catppuccin 图标主题
- 模糊搜索、键盘导航、内联重命名、上下文操作
- 文件在磁盘上变化时实时更新

### Web 预览

- 自动检测本地开发服务器并在预览标签页中打开
- 通过原生子 webview 预览外部 URL

### 主题与自定义

- 在应用内创建自定义主题，可在内置预设与个人主题之间切换
- 创建自己的主题，分享或从社区导入
- 背景图片，可调节不透明度与模糊
- 编辑器主题独立于应用主题

## 安装

最新安装包见 [Releases](https://github.com/Gazi2050/rex/releases/latest) 页面。Rex 会从那里自动更新。

### Windows 说明

- 默认 shell 检测顺序：`pwsh.exe`（PowerShell 7+）-> `powershell.exe`（Windows PowerShell 5.1）-> `cmd.exe`。
- WSL 是一等公民的工作区环境，而非包装的子进程。
- 会为文件夹和驱动器按用户级安装"Open in Rex"右键菜单项。

### Linux 说明

- **NixOS / Nix**：使用官方 flake - 非 NixOS 用户执行 `nix profile install github:Gazi2050/rex`；NixOS 用户导入 flake 并将 `inputs.rex.packages.${pkgs.system}.rex` 加入 `environment.systemPackages`。也可使用更简单的 `nixosModules.rex` 输出。
- **AppImage：** 需要 FUSE。没有 FUSE 时：`./Rex_*.AppImage --appimage-extract-and-run`。在 Wayland 上如遇渲染异常，可尝试 `WEBKIT_DISABLE_DMABUF_RENDERER=1`。此外，`.deb` / `.rpm` 包链接系统 GTK 栈，通常更流畅。

## 从源码构建

**前置要求**
- Rust（stable），https://rustup.rs
- Node 22+ 与 [pnpm](https://pnpm.io)
- 你所在平台的 Tauri 前置要求，https://tauri.app/start/prerequisites/

**运行**
```bash
pnpm install
pnpm tauri dev          # 开发
pnpm tauri build        # 生产打包
```

**检查**
```bash
pnpm lint
pnpm check-types
pnpm test
cd src-tauri && cargo clippy --all-targets --locked -- -D warnings   # Rust lint（与 CI 一致）
cd src-tauri && cargo nextest run --locked                           # 或：cargo test --locked
```

## 技术栈

Tauri 2、Rust、`portable-pty`、React 19、TypeScript、Vite、libghostty-vt（Ghostty）、CodeMirror 6、Tailwind v4、Zustand。

## 贡献

欢迎提交 Issue 和 PR！欢迎提出问题、建议功能或提交拉取请求。详情见 [CONTRIBUTING.md](../../CONTRIBUTING.md) 与[架构文档](../README.md)。

## 致谢

Rex 是 [Terax](https://github.com/crynta/terax-ai) 的 fork，原项目由 [@crynta](https://github.com/crynta) 创建并维护。原项目的所有荣誉归于 Crynta。

## 许可证

Rex 基于 Apache-2.0 许可证发布。依赖项目的许可信息见 [Apache License 2.0](../../LICENSE)。
