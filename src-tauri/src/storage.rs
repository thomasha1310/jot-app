//! File and git access for sync. Plain std, so it builds and tests without Tauri.

use std::fs::{self, File};
use std::io::{ErrorKind, Read, Write};
use std::path::Path;
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

pub const DATA_FILE: &str = "jot.json";
const TEMP_FILE: &str = ".jot.json.tmp";

/// The only git subcommands the app may run (see src/sync/core.ts).
const ALLOWED_GIT: &[&str] = &[
    "add", "commit", "diff", "fetch", "merge", "push", "remote", "rev-list", "rev-parse", "show",
    "status",
];

pub struct GitOutput {
    pub code: i32,
    pub stdout: String,
    pub stderr: String,
}

fn require_dir(dir: &Path) -> Result<(), String> {
    if dir.is_dir() {
        Ok(())
    } else {
        Err(format!("{} isn't a folder (was it moved or unmounted?)", dir.display()))
    }
}

pub fn read_data(dir: &Path) -> Result<Option<String>, String> {
    require_dir(dir)?;
    match fs::read_to_string(dir.join(DATA_FILE)) {
        Ok(text) => Ok(Some(text)),
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(None),
        Err(e) => Err(format!("couldn't read {DATA_FILE}: {e}")),
    }
}

/// Write to a temp file, flush it to disk, then rename over the real file, so a
/// sync client or a sudden reboot never sees half a file.
pub fn write_data(dir: &Path, contents: &str) -> Result<(), String> {
    require_dir(dir)?;
    let temp = dir.join(TEMP_FILE);
    let write = || -> std::io::Result<()> {
        let mut file = File::create(&temp)?;
        file.write_all(contents.as_bytes())?;
        file.sync_all()?;
        fs::rename(&temp, dir.join(DATA_FILE))
    };
    write().map_err(|e| {
        let _ = fs::remove_file(&temp);
        format!("couldn't save {DATA_FILE}: {e}")
    })
}

/// Runs the system git (so your SSH keys and credential helpers just work),
/// never waits on a prompt, and gives up after `timeout`.
pub fn run_git(dir: &Path, args: &[String], timeout: Duration) -> Result<GitOutput, String> {
    let sub = args.first().ok_or("missing git subcommand")?;
    if !ALLOWED_GIT.contains(&sub.as_str()) {
        return Err(format!("git {sub} isn't allowed"));
    }
    require_dir(dir)?;

    let mut cmd = Command::new("git");
    cmd.arg("-C")
        .arg(dir)
        .args(args)
        .env("GIT_TERMINAL_PROMPT", "0")
        .env("LC_ALL", "C")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("couldn't run git ({e}). Is git installed and on your PATH?"))?;

    // Drain both pipes on their own threads so a chatty git can't block on a full pipe.
    let drain = |mut pipe: Box<dyn Read + Send>| {
        thread::spawn(move || {
            let mut buf = Vec::new();
            let _ = pipe.read_to_end(&mut buf);
            String::from_utf8_lossy(&buf).into_owned()
        })
    };
    let stdout = drain(Box::new(child.stdout.take().expect("piped stdout")));
    let stderr = drain(Box::new(child.stderr.take().expect("piped stderr")));

    let started = Instant::now();
    let status = loop {
        if let Some(status) = child.try_wait().map_err(|e| e.to_string())? {
            break status;
        }
        if started.elapsed() > timeout {
            let _ = child.kill();
            let _ = child.wait();
            return Err(format!("git {sub} timed out after {}s", timeout.as_secs()));
        }
        thread::sleep(Duration::from_millis(25));
    };

    Ok(GitOutput {
        code: status.code().unwrap_or(-1),
        stdout: stdout.join().unwrap_or_default(),
        stderr: stderr.join().unwrap_or_default(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("jot-storage-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn missing_file_reads_as_none() {
        assert_eq!(read_data(&temp_dir("missing")).unwrap(), None);
    }

    #[test]
    fn write_then_read_round_trips_and_leaves_no_temp_file() {
        let dir = temp_dir("roundtrip");
        write_data(&dir, "{\"a\":1}\n").unwrap();
        write_data(&dir, "{\"a\":2}\n").unwrap();
        assert_eq!(read_data(&dir).unwrap().as_deref(), Some("{\"a\":2}\n"));
        assert!(!dir.join(TEMP_FILE).exists());
    }

    #[test]
    fn missing_folder_is_a_clear_error() {
        let err = write_data(Path::new("/definitely/not/here"), "x").unwrap_err();
        assert!(err.contains("isn't a folder"), "{err}");
    }

    #[test]
    fn rejects_git_subcommands_outside_the_allowlist() {
        let dir = temp_dir("allow");
        for bad in ["reset", "clean", "config", "-c"] {
            let err = run_git(&dir, &[bad.to_string()], Duration::from_secs(5)).err().unwrap();
            assert!(err.contains("isn't allowed"), "{bad}: {err}");
        }
    }

    #[test]
    fn runs_git_and_reports_exit_codes() {
        let dir = temp_dir("git");
        let args = ["rev-parse", "--is-inside-work-tree"].map(String::from);
        let out = run_git(&dir, &args, Duration::from_secs(10)).unwrap();
        assert_ne!(out.code, 0, "a plain temp folder isn't a repo");
        assert!(out.stderr.contains("not a git repository"), "{}", out.stderr);
    }
}
