//! AI commit message generation through gli's keyless diny.run endpoint.
//! `reference/gli/internal/api/ai.go` is the wire-shape source of truth:
//! the payload, response, and conventional-commit enforcement mirror it.

use std::time::Duration;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use crate::modules::git::errors::{GitError, Result};
use crate::modules::git::process::{ensure_git_available, ensure_success, run_git_capped};
use crate::modules::git::types::DEFAULT_TIMEOUT_SECS;
use crate::modules::git::utils::authorized_repo_root;
use crate::modules::workspace::{WorkspaceEnv, WorkspaceRegistry};

const ENDPOINT: &str = "https://diny.run/api/requests";
const VERSION: &str = "v1.0.0";
/// ponytail: the outbound payload cap. gli ships the diff unbounded; upgrade
/// path is streaming or a per-file budget if 128 KiB proves too tight.
const MAX_DIFF_BYTES: usize = 128 * 1024;
const DIFF_TRUNCATION_MARKER: &str = "\n[... diff truncated ...]\n";
const HTTP_TIMEOUT: Duration = Duration::from_secs(30);
const CONVENTIONAL_TYPES: [&str; 11] = [
    "feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert",
];

// ----- pure core (unit-tested) -----

#[derive(Serialize)]
pub(crate) struct DinyRequest {
    #[serde(rename = "type")]
    kind: String,
    #[serde(rename = "userPrompt")]
    user_prompt: String,
    config: DinyConfig,
    version: String,
    name: String,
    #[serde(rename = "email")]
    email: String,
    #[serde(rename = "repoName")]
    repo_name: String,
    system: String,
}

/// Mirrors gli's `dinyConfig` including its field-name quirk: the Go field
/// `Commit` serializes as `"Request"`.
#[derive(Serialize)]
struct DinyConfig {
    #[serde(rename = "Theme")]
    theme: String,
    #[serde(rename = "Request")]
    request: DinyCommitConfig,
    #[serde(rename = "Prompts")]
    prompts: DinyPromptsConfig,
}

#[derive(Serialize)]
struct DinyCommitConfig {
    #[serde(rename = "Conventional")]
    conventional: bool,
    #[serde(rename = "Emoji")]
    emoji: bool,
    #[serde(rename = "Tone")]
    tone: String,
    #[serde(rename = "Length")]
    length: String,
    #[serde(rename = "CustomInstructions")]
    custom_instructions: String,
    #[serde(rename = "HashAfterCommit")]
    hash_after_commit: bool,
}

#[derive(Serialize)]
struct DinyPromptsConfig {
    #[serde(rename = "enabled")]
    enabled: bool,
}

#[derive(Deserialize)]
struct DinyResponse {
    #[serde(default)]
    error: Option<String>,
    #[serde(default)]
    data: Option<DinyRespData>,
}

#[derive(Deserialize)]
struct DinyRespData {
    #[serde(default)]
    message: String,
}

const CONVENTIONAL_INSTRUCTIONS: &str = "You MUST output ONLY a Conventional Commit message in the exact format: <type>[optional scope]: <description>. Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert. No explanation, no markdown, no quotes, no backticks. Just the commit message.";

pub(crate) fn build_payload(diff: &str, user_name: &str, repo_name: &str) -> DinyRequest {
    DinyRequest {
        kind: "commit".into(),
        user_prompt: diff.into(),
        version: VERSION.into(),
        name: user_name.into(),
        email: String::new(),
        repo_name: repo_name.into(),
        system: std::env::consts::OS.into(),
        config: DinyConfig {
            theme: "catppuccin".into(),
            request: DinyCommitConfig {
                conventional: true,
                emoji: false,
                tone: "casual".into(),
                length: "short".into(),
                custom_instructions: CONVENTIONAL_INSTRUCTIONS.into(),
                hash_after_commit: false,
            },
            prompts: DinyPromptsConfig { enabled: false },
        },
    }
}

pub(crate) fn parse_response(body: &[u8]) -> Result<String> {
    let parsed: DinyResponse = serde_json::from_slice(body)
        .map_err(|e| GitError::command("ai commit message", format!("bad response: {e}")))?;
    if let Some(error) = parsed.error {
        return Err(GitError::command("ai commit message", error));
    }
    let raw = parsed
        .data
        .map(|d| d.message)
        .ok_or_else(|| GitError::command("ai commit message", "no data in response"))?;
    let message = clean_message(&raw);
    if message.is_empty() {
        return Err(GitError::command(
            "ai commit message",
            "response missing commit message",
        ));
    }
    Ok(enforce_conventional(&message))
}

pub(crate) fn clean_message(raw: &str) -> String {
    let s = raw.trim();
    let s = s.strip_prefix('`').unwrap_or(s);
    let s = s.strip_suffix('`').unwrap_or(s);
    s.trim_matches(|c| c == '"' || c == '\'').trim().to_string()
}

pub(crate) fn enforce_conventional(msg: &str) -> String {
    let trimmed = msg.trim();
    let Some((first, rest)) = trimmed.split_once('\n') else {
        return with_conventional_prefix(trimmed);
    };
    let head = with_conventional_prefix(first.trim());
    if rest.is_empty() {
        head
    } else {
        format!("{head}\n{rest}")
    }
}

fn with_conventional_prefix(first_line: &str) -> String {
    let lower = first_line.to_lowercase();
    for t in CONVENTIONAL_TYPES {
        if lower.starts_with(&format!("{t}:")) || lower.starts_with(&format!("{t}(")) {
            return first_line.to_string();
        }
    }
    if first_line.is_empty() {
        return first_line.to_string();
    }
    format!("chore: {first_line}")
}

// ----- shell -----

#[derive(serde::Serialize)]
pub struct AiCommitContext {
    pub diff: String,
    pub user_name: String,
    pub repo_name: String,
}

pub fn collect_context(
    registry: &WorkspaceRegistry,
    repo_root: &str,
    workspace: &WorkspaceEnv,
) -> Result<AiCommitContext> {
    let repo = authorized_repo_root(registry, repo_root, workspace)?;
    ensure_git_available(&repo.workspace)?;
    let output = run_git_capped(
        &repo.workspace,
        Some(repo.local_path.to_string_lossy().as_ref()),
        ["diff", "--cached", "--no-ext-diff"],
        DEFAULT_TIMEOUT_SECS,
        MAX_DIFF_BYTES,
    )?;
    ensure_success(&output, "git diff --cached")?;
    let diff = if output.truncated {
        format!(
            "{}{}",
            String::from_utf8_lossy(&output.stdout),
            DIFF_TRUNCATION_MARKER
        )
    } else {
        String::from_utf8_lossy(&output.stdout).into_owned()
    };
    let user_name = git_config_value(&repo, ["config", "user.name"]).unwrap_or_default();
    let repo_name = repo
        .local_path
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default();
    Ok(AiCommitContext {
        diff,
        user_name,
        repo_name,
    })
}

fn git_config_value(repo: &crate::modules::git::utils::ResolvedGitDirectory, args: [&str; 2]) -> Option<String> {
    crate::modules::git::process::git_stdout_line_opt(
        &repo.workspace,
        repo.local_path.to_string_lossy().as_ref(),
        args,
    )
    .ok()
    .flatten()
}

async fn generate(context: AiCommitContext) -> Result<String> {
    let payload = build_payload(&context.diff, &context.user_name, &context.repo_name);
    let body = serde_json::to_vec(&payload)
        .map_err(|e| GitError::command("ai commit message", format!("encode: {e}")))?;
    let client = reqwest::Client::builder()
        .timeout(HTTP_TIMEOUT)
        .build()
        .map_err(|e| GitError::command("ai commit message", format!("client: {e}")))?;
    let response = client
        .post(ENDPOINT)
        .header(reqwest::header::CONTENT_TYPE, "application/json")
        .body(body)
        .send()
        .await
        .map_err(|e| GitError::command("ai commit message", format!("request failed: {e}")))?;
    let status = response.status();
    let bytes = response
        .bytes()
        .await
        .map_err(|e| GitError::command("ai commit message", format!("read failed: {e}")))?;
    if !status.is_success() {
        let detail = String::from_utf8_lossy(&bytes);
        let detail = detail.chars().take(300).collect::<String>();
        return Err(GitError::command(
            "ai commit message",
            format!("service returned {status}: {detail}"),
        ));
    }
    parse_response(&bytes)
}

#[tauri::command]
pub async fn git_ai_commit_message(
    repo_root: String,
    workspace: Option<WorkspaceEnv>,
    app: AppHandle,
) -> std::result::Result<String, String> {
    let workspace = WorkspaceEnv::from_option(workspace);
    let context = tauri::async_runtime::spawn_blocking(move || {
        let registry = app.state::<WorkspaceRegistry>();
        collect_context(&registry, &repo_root, &workspace)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())?;
    if context.diff.trim().is_empty() {
        return Err("nothing staged to summarize".to_string());
    }
    generate(context).await.map_err(|e| e.to_string())
}

// ----- tests -----

#[cfg(test)]
mod tests {
    use super::*;

    fn payload_json(diff: &str) -> serde_json::Value {
        serde_json::to_value(build_payload(diff, "Gazi", "rex")).unwrap()
    }

    #[test]
    fn payload_matches_gli_wire_shape() {
        let v = payload_json("diff --git a/x b/x");
        assert_eq!(v["type"], "commit");
        assert_eq!(v["userPrompt"], "diff --git a/x b/x");
        assert_eq!(v["version"], "v1.0.0");
        assert_eq!(v["name"], "Gazi");
        assert_eq!(v["email"], "");
        assert_eq!(v["repoName"], "rex");
        assert_eq!(v["system"], std::env::consts::OS);
        // gli's Go struct names the commit config "Request", not "Commit".
        assert_eq!(v["config"]["Theme"], "catppuccin");
        assert_eq!(v["config"]["Request"]["Conventional"], true);
        assert_eq!(v["config"]["Request"]["Emoji"], false);
        assert_eq!(v["config"]["Request"]["Tone"], "casual");
        assert_eq!(v["config"]["Request"]["Length"], "short");
        assert_eq!(v["config"]["Request"]["HashAfterCommit"], false);
        assert!(v["config"]["Request"]["CustomInstructions"]
            .as_str()
            .unwrap()
            .starts_with("You MUST output ONLY a Conventional Commit message"));
        assert_eq!(v["config"]["Prompts"]["enabled"], false);
    }

    #[test]
    fn parses_ok_response_and_enforces_conventional() {
        let body = br#"{"error":null,"data":{"message":"`add parser cache`"}}"#;
        assert_eq!(parse_response(body).unwrap(), "chore: add parser cache");
    }

    #[test]
    fn keeps_existing_conventional_type() {
        let body = br#"{"data":{"message":"feat(ui): tab badges"}}"#;
        assert_eq!(parse_response(body).unwrap(), "feat(ui): tab badges");
    }

    #[test]
    fn surfaces_service_error_and_missing_data() {
        let err = parse_response(br#"{"error":"rate limited"}"#).unwrap_err();
        assert!(err.to_string().contains("rate limited"));
        assert!(parse_response(br#"{}"#).is_err());
        assert!(parse_response(br#"{"data":{"message":"   "}}"#).is_err());
    }

    #[test]
    fn clean_message_strips_wrapping() {
        assert_eq!(clean_message("  `feat: x`  "), "feat: x");
        assert_eq!(clean_message("\"fix: y\""), "fix: y");
    }

    #[test]
    fn conventional_enforcement_keeps_body_lines() {
        assert_eq!(
            enforce_conventional("update docs\n\nlonger body"),
            "chore: update docs\n\nlonger body"
        );
        assert_eq!(
            enforce_conventional("perf: faster\n\nbody"),
            "perf: faster\n\nbody"
        );
        assert_eq!(enforce_conventional("CI: build"), "CI: build");
        assert_eq!(enforce_conventional("Update deps"), "chore: Update deps");
    }

}
