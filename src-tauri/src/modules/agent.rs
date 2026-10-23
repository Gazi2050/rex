// Only the Windows hook helper remains: agents whose settings were configured
// before the hook installer was removed still invoke `rex __rex_notify`, and
// that path must keep emitting the marker the PTY detector parses.
#[cfg(any(windows, test))]
fn conout_marker(agent: &str, event: &str) -> String {
    format!("\x1b]777;notify;Rex;{agent};{event}\x07")
}

// Windows has no /dev/tty: the hook calls `rex.exe __rex_notify ...` and we
// write the marker into the ConPTY console. GUI-subsystem release inherits no
// console, so attach to the hook runner's first.
#[cfg(windows)]
pub fn emit_conout_marker(agent: &str, event: &str) {
    use std::io::Write;
    use windows_sys::Win32::System::Console::{AttachConsole, ATTACH_PARENT_PROCESS};

    if std::env::var_os("REX_TERMINAL").is_none() {
        return;
    }
    unsafe {
        AttachConsole(ATTACH_PARENT_PROCESS);
    }
    if let Ok(mut f) = std::fs::OpenOptions::new()
        .read(true)
        .write(true)
        .open("CONOUT$")
    {
        let _ = f.write_all(conout_marker(agent, event).as_bytes());
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn conout_marker_matches_detector_format() {
        // Exactly the bytes pty/agent_detect parses (ESC ] 777 ; ... BEL).
        assert_eq!(
            conout_marker("gemini", "attention"),
            "\u{1b}]777;notify;Rex;gemini;attention\u{7}"
        );
    }
}
