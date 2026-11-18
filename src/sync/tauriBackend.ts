import { invoke } from "@tauri-apps/api/core";
import type { Backend, GitResult } from "./core";

export const isDesktop = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/** Talks to the Rust side (src-tauri/src/storage.rs). */
export const tauriBackend: Backend = {
    readData: (dir) => invoke<string | null>("read_data", { dir }),
    writeData: (dir, contents) => invoke<void>("write_data", { dir, contents }),
    async git(dir, args) {
        try {
            return await invoke<GitResult>("git", { dir, args });
        } catch (e) {
            // Git missing, timed out, or folder gone: report it like a failed command.
            return { code: -1, stdout: "", stderr: String(e) };
        }
    },
};
