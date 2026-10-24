//! End-to-end checks against a real temp git repo: the exact surface the
//! source-control panel drives (status -> stage -> diff -> commit -> log),
//! plus the AI-commit context collection. Requires a git binary; skipped
//! cleanly where none exists.

use super::operations;
use crate::modules::git::ai_commit::collect_context;
use crate::modules::git::types::DiscardEntry;
use crate::modules::workspace::{WorkspaceEnv, WorkspaceRegistry};

fn repo() -> Option<(tempfile::TempDir, WorkspaceRegistry, String)> {
    let which = which::which("git").ok()?;
    let _ = which;
    let dir = tempfile::tempdir().ok()?;
    let root = dir.path().to_string_lossy().into_owned();
    for args in [
        ["init", "-b", "main"],
        ["config", "user.name", "Rex Test"],
        ["config", "user.email", "test@rex.local"],
        ["config", "commit.gpgsign", "false"],
    ] {
        std::process::Command::new("git")
            .args(args)
            .current_dir(dir.path())
            .status()
            .ok()?
            .success()
            .then_some(())
            .expect("git init");
    }
    let registry = WorkspaceRegistry::default();
    registry.authorize(dir.path()).expect("authorize temp dir");
    Some((dir, registry, root))
}

fn write(root: &str, rel: &str, contents: &str) {
    let path = std::path::Path::new(root).join(rel);
    std::fs::create_dir_all(path.parent().unwrap()).unwrap();
    std::fs::write(path, contents).unwrap();
}

#[test]
fn status_stage_commit_log_round_trip() {
    let Some((_dir, registry, root)) = repo() else {
        eprintln!("git not available; skipping");
        return;
    };
    let ws = WorkspaceEnv::from_option(None);

    write(&root, "src/app.rs", "fn main() {}\n");
    let status = operations::status(&registry, &root, &ws).expect("status");
    assert_eq!(status.branch, "main");
    assert!(
        status
            .changed_files
            .iter()
            .any(|f| f.path == "src/app.rs" && f.untracked),
        "untracked file should appear"
    );

    operations::stage(&registry, &root, &["src/app.rs".to_string()], &ws)
        .expect("stage");
    let status = operations::status(&registry, &root, &ws).expect("status after stage");
    let entry = status
        .changed_files
        .iter()
        .find(|f| f.path == "src/app.rs");
    assert!(
        entry.is_some_and(|f| f.staged && !f.unstaged),
        "file shows as staged"
    );

    let diff = operations::diff(&registry, &root, None, true, &ws).expect("staged diff");
    assert!(diff.diff_text.contains("fn main()"), "diff shows the content");

    let result = operations::commit(&registry, &root, "feat: initial", &ws)
        .expect("commit");
    assert_eq!(result.commit_sha.len(), 40, "full sha: {}", result.commit_sha);

    let log = operations::log(&registry, &root, 5, None, &ws).expect("log");
    assert_eq!(log[0].sha, result.commit_sha);
    assert_eq!(log[0].subject, "feat: initial");

    let status = operations::status(&registry, &root, &ws).expect("clean status");
    assert!(status.changed_files.is_empty(), "worktree clean after commit");
}

#[test]
fn unstage_and_discard_round_trip() {
    let Some((_dir, registry, root)) = repo() else {
        eprintln!("git not available; skipping");
        return;
    };
    let ws = WorkspaceEnv::from_option(None);

    write(&root, "a.txt", "one\n");
    operations::stage(&registry, &root, &["a.txt".to_string()], &ws).expect("stage");
    operations::unstage(&registry, &root, &["a.txt".to_string()], &ws).expect("unstage");
    let status = operations::status(&registry, &root, &ws).expect("status");
    let entry = status.changed_files.iter().find(|f| f.path == "a.txt").unwrap();
    assert!(entry.untracked && !entry.staged);

    operations::discard(
        &registry,
        &root,
        &[DiscardEntry {
            path: "a.txt".into(),
            untracked: true,
        }],
        &ws,
    )
    .expect("discard untracked");
    let status = operations::status(&registry, &root, &ws).expect("status");
    assert!(status.changed_files.is_empty(), "untracked file discarded");
}

#[test]
fn ai_commit_context_collects_staged_diff_and_repo_identity() {
    let Some((_dir, registry, root)) = repo() else {
        eprintln!("git not available; skipping");
        return;
    };
    let ws = WorkspaceEnv::from_option(None);

    write(&root, "lib.rs", "pub fn answer() -> u8 { 42 }\n");
    operations::stage(&registry, &root, &["lib.rs".to_string()], &ws).expect("stage");

    let ctx = collect_context(&registry, &root, &ws).expect("collect");
    assert!(ctx.diff.contains("pub fn answer"), "staged diff in context");
    assert!(!ctx.repo_name.is_empty(), "repo folder name resolved");
    assert_eq!(ctx.user_name, "Rex Test");
}
