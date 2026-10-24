<div align="center">
  <img src="../../public/logo.png" width="144" height="144" alt="Rex" />
  <h1>Rex</h1>

  <p><strong>軽量ワークスペースターミナル。</strong></p>
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

<img src="../../public/preview.webp" alt="Rex ワークスペースターミナル" width="100%" />

Rex は Tauri 2 + Rust と React 19 上に構築された、軽量なオープンソースのワークスペースターミナルです。GPU 加速されたターミナルとコードエディタを 1 つの高速なネイティブアプリに統合し、ファイルエクスプローラー、git グラフ付きのソース管理、Web プレビューぺインを内蔵しています。ディスク使用量は約 7-8 MB。テレメトリーなし。アカウント不要。

## 機能

### ターミナル

- GPU 加速レンダリング：デフォルトは WebGPU、フォールバックは WebGL（libghostty-vt ターミナルモデル）
- バックグラウンドストリーミング対応のマルチタブ、水平・垂直分割
- シェル統合付きのブロックベースのコマンド入力（OSC 7 / OSC 133）
- `portable-pty` によるネイティブ PTY バックエンド（zsh、bash、pwsh、fish、cmd）
- インライン検索、リンク検出、トゥルーカラー
- エクスプローラーやデスクトップからファイルをドラッグ＆ドロップすると、シェルセーフにクォートされたパスとして挿入
- プライベートタブ
- Windows でのタブごとのワークスペース環境（ローカル、またはインストール済みの任意の WSL ディストロ）
- Spaces でタブ、作業ディレクトリ、分割レイアウトを起動間で復元
- バンドル版 `rex` CLI：`rex open <file> --line <n>` でどのシェルからでもファイルを開ける

### コードエディタ

- CodeMirror 6（TS/JS、Rust、Python、Go、C/C++、Java、HTML/CSS、JSON、Markdown など）
- レンダリングされた Markdown に加えて、画像・動画・音声・PDF の表示
- オプトインの言語サーバー対応：診断、ナビゲーション、補完、フォーマット、カスタムサーバー
- 保存時フォーマット（biome、prettier、ruff、rustfmt、gofmt、clang-format、shfmt、zig、またはカスタムコマンド）
- Vim モード
- 内蔵エディタテーマ：Kanagawa、Catppuccin、Rosé Pine、Everforest、Dracula、Solarized、Nord、Tokyo Night、GitHub、Xcode

### ソース管理

- ハンクのステージ / アンステージ、コミット（Cmd+Enter / Ctrl+Enter）、上流を考慮したプッシュ
- ブランチの表示と切り替え（detached HEAD 状態を含む）
- 実際のコミットグラフを描く git 履歴ペイン（マージやブランチのレーン描画）
- コミットの検索とフィルタ、リモートのコミットページへのクリック遷移
- ワンクリック AI コミットメッセージ生成（ステージされた diff とリポジトリ名をキー不要の無料エンドポイントへ送信）

### ファイルエクスプローラー

- Catppuccin アイコンテーマ
- あいまい検索、キーボードナビゲーション、インラインリネーム、コンテキスト操作
- ディスク上のファイル変更をライブで反映

### Web プレビュー

- ローカル開発サーバーを自動検出してプレビュータブで開く
- ネイティブ子 webview による外部 URL のプレビュー

### テーマとカスタマイズ

- アプリ内でカスタムテーマを作成、同梱プリセットと自分のテーマを切り替え
- 自分のテーマを作成して共有、コミュニティからインポートも可能
- 不透明度とブラーを調整できる背景画像
- エディタテーマはアプリテーマから独立

## インストール

最新のインストーラーは [Releases](https://github.com/Gazi2050/rex/releases/latest) ページにあります。Rex はそこから自動更新されます。

### Windows に関する注意

- デフォルトのシェル検出：`pwsh.exe`（PowerShell 7+）-> `powershell.exe`（Windows PowerShell 5.1）-> `cmd.exe`。
- WSL はラップされたサブプロセスではなく、第一級のワークスペース環境です。
- フォルダとドライブ用の「Open in Rex」コンテキストメニューはユーザーごとにインストールされます。

### Linux に関する注意

- **NixOS / Nix**：公式 flake を使用 - `nix profile install github:Gazi2050/rex`（非 NixOS）、または flake をインポートして `inputs.rex.packages.${pkgs.system}.rex` を `environment.systemPackages` に追加（NixOS）。より簡単な設定には `nixosModules.rex` 出力も利用できます。
- **AppImage：** FUSE が必要です。ない場合：`./Rex_*.AppImage --appimage-extract-and-run`。Wayland で描画が乱れる場合は `WEBKIT_DISABLE_DMABUF_RENDERER=1` を試してください。`.deb` / `.rpm` パッケージはシステムの GTK スタックにリンクしており、概して安定します。

## ソースからビルド

**前提条件**
- Rust（stable）、https://rustup.rs
- Node 22+ と [pnpm](https://pnpm.io)
- お使いのプラットフォームの Tauri 前提条件、https://tauri.app/start/prerequisites/

**実行**
```bash
pnpm install
pnpm tauri dev          # 開発
pnpm tauri build        # 本番バンドル
```

**チェック**
```bash
pnpm lint
pnpm check-types
pnpm test
cd src-tauri && cargo clippy --all-targets --locked -- -D warnings   # Rust lint（CI と同一）
cd src-tauri && cargo nextest run --locked                           # または: cargo test --locked
```

## 技術スタック

Tauri 2、Rust、`portable-pty`、React 19、TypeScript、Vite、libghostty-vt（Ghostty）、CodeMirror 6、Tailwind v4、Zustand。

## コントリビュート

Issue と PR を歓迎します！機能の提案やプルリクエストの送信も自由です。詳細は [CONTRIBUTING.md](../../CONTRIBUTING.md) と[アーキテクチャドキュメント](../README.md)を参照してください。

## クレジット

Rex は [@crynta](https://github.com/crynta) が作成・保守している [Terax](https://github.com/crynta/terax-ai) のフォークです。オリジナルプロジェクトの全ての功績は Crynta に帰属します。

## ライセンス

Rex は Apache-2.0 ライセンスの下で提供されています。依存関係の詳細は [Apache License 2.0](../../LICENSE) を参照してください。
