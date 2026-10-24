# Security

Rex runs shells, reads/writes files, and makes a small, explicit set of outbound requests, so security bugs matter. If you find one, please tell us before posting it publicly.

## Reporting

Open an issue at **[github.com/Gazi2050/rex/issues](https://github.com/Gazi2050/rex/issues)**. Include:

- What the issue is and what it lets an attacker do
- Steps to reproduce (a small PoC is great)
- Version, OS, arch

We'll get back to you within a few days. Once it's fixed, we'll credit you in the release notes - unless you'd rather stay anonymous.

## Supported versions

Until `1.0.0`, only the latest minor gets security fixes. See the current version in `package.json` or on the [Releases page](https://github.com/crynta/terax-ai/releases). 

## What's in scope

- The Rust backend in `src-tauri/` (PTY, FS, IPC, plugins)
- The frontend in `src/` - anywhere untrusted input lands (terminal output, file content)
- Release artifacts on GitHub
- The auto-updater

## What's not

- Bugs in upstream deps (Tauri, xterm.js, CodeMirror…) - report those upstream. We'll ship the fix once it's released.
- Anything that needs an already-compromised machine or a local attacker with shell access
- Older versions (`< 0.5`)

## What we do to keep things safe

- **Workspace authorization.** Shells, git, and file commands only operate inside directories the user has authorized. The allow and deny sides are tested.
- **No generic network egress.** Rex talks to the network only for update checks and the one-click AI commit message (see below). Web preview loads the dev server you already run.
- **Trust gating in the terminal.** OSC sequences are parsed and validated before they can change state (cwd tracking, prompt boundaries). Nothing from raw output is executed.
- **No Node in the renderer.** The frontend only reaches the host through the allow-listed Tauri commands.
- **Signed releases.** Updates are verified before they're applied.

## What we can't promise

- Rex runs whatever you tell it to run, with your permissions. That's kind of the point of a terminal.
- The AI commit message feature sends the staged diff (capped at 128 KiB), the repo folder name, your git user name, and your OS name to a third-party service (`diny.run`) when you click the button. Nothing is sent automatically. Don't use it with secrets staged.
