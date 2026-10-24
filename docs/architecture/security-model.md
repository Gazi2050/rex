# Security model

This guide elaborates on `REX.md`. If anything here conflicts with `REX.md`, `REX.md` wins.

Rex runs shells, reads and writes files, and makes a small set of well-defined outbound requests. The security model is defense-in-depth: no single guard is enough, so every boundary validates input before acting on it.

## Boundaries

The main trust boundaries are:

1. **IPC boundary** - commands registered in `src-tauri/src/lib.rs`, gated by `src-tauri/capabilities/default.json`.
2. **File-system boundary** - fs commands resolve paths inside a workspace-authorized root.
3. **Process boundary** - PTY and shell spawns go through the workspace authorization registry.
4. **Network boundary** - a short, explicit list of outbound requests (see Outbound network).
5. **Terminal escape-sequence boundary** - OSC sequences are parsed and acted on, but never blindly trusted to mutate state.

## Workspace authorization registry

`WorkspaceRegistry` (`src-tauri/src/modules/workspace.rs:20`) tracks directories that PTY spawns and git commands are allowed to operate in.

- `workspace_authorize` adds a directory.
- `authorize_spawn_cwd` rejects a spawn cwd outside an authorized root.
- `authorize_user_spawn_cwd` registers the user's chosen cwd as a new root instead of rejecting it.
- The registry is bootstrapped with the launch directory and the user's home directory (`workspace.rs:135`).

This is the allow side of the file-system boundary. Any new feature that spawns a shell or mutates files outside the current workspace must interact with this registry.

## Outbound network

The app itself makes three kinds of outbound requests, all from Rust:

- **Updater** (`tauri-plugin-updater`): release metadata and artifacts from the configured GitHub releases URL.
- **AI commit message** (`git/ai_commit.rs`): on an explicit button click, the staged diff (capped at 128 KiB with a truncation marker), the repo folder name, `git config user.name`, and the OS name are POSTed to gli's keyless endpoint `https://diny.run/api/requests` (30 s timeout). No key material is involved. The response fills the editable commit box; nothing is committed, staged, or pushed by the service.
- **Language servers**: spawned locally over stdio; they make their own connections per their configuration.

There is no generic HTTP proxy surface in the app; the former AI provider proxy (`net::*`) was removed with the AI subsystem.

## OSC trust gating

The terminal parses OSC sequences from the PTY byte stream:

- **OSC 7** updates the tab cwd.
- **OSC 133 A/B/C/D** marks prompt/command boundaries (cwd tracking, command duration).

OSC handling is driven **only by well-formed OSC sequences**, never by raw output.

## Invariants

- New file-system-touching commands must respect the workspace authorization registry.
- New outbound requests belong in the explicit Outbound network list, with a timeout and a bounded payload.
- New plugin APIs must be added to `src-tauri/capabilities/default.json`.

## See also

- [`REX.md`](../../REX.md) - the architecture source of truth
- [`docs/README.md`](../README.md) - index of contributor guides
- [Two-process model](two-process-model.md) - IPC boundary and command catalog
