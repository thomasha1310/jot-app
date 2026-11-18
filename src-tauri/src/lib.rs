mod storage;

use std::path::PathBuf;
use std::time::Duration;

#[derive(serde::Serialize)]
struct GitResult {
    code: i32,
    stdout: String,
    stderr: String,
}

#[tauri::command]
fn read_data(dir: String) -> Result<Option<String>, String> {
    storage::read_data(&PathBuf::from(dir))
}

#[tauri::command]
fn write_data(dir: String, contents: String) -> Result<(), String> {
    storage::write_data(&PathBuf::from(dir), &contents)
}

/// Network git (fetch/push) can be slow, so it runs off the main thread.
#[tauri::command]
async fn git(dir: String, args: Vec<String>) -> Result<GitResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        storage::run_git(&PathBuf::from(dir), &args, Duration::from_secs(30))
    })
    .await
    .map_err(|e| e.to_string())?
    .map(|o| GitResult { code: o.code, stdout: o.stdout, stderr: o.stderr })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![read_data, write_data, git])
        .run(tauri::generate_context!())
        .expect("error while running jot");
}
