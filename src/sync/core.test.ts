// Integration tests: real git, a bare repo as "GitHub", two clones as the two OSes.
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { beforeEach, describe, expect, it } from "vitest";
import type { AppState, Todo } from "../types";
import { commitMessage, DATA_FILE, GitError, serialize, syncFolder, syncGit, type Backend } from "./core";

const run = promisify(execFile);
const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "test", GIT_AUTHOR_EMAIL: "test@example.com",
    GIT_COMMITTER_NAME: "test", GIT_COMMITTER_EMAIL: "test@example.com",
    GIT_TERMINAL_PROMPT: "0", GIT_CONFIG_NOSYSTEM: "1", LC_ALL: "C",
};

const backend: Backend = {
    async readData(dir) {
        const p = join(dir, DATA_FILE);
        return existsSync(p) ? readFileSync(p, "utf8") : null;
    },
    async writeData(dir, contents) {
        const p = join(dir, DATA_FILE);
        writeFileSync(p + ".tmp", contents);
        renameSync(p + ".tmp", p);
    },
    async git(dir, args) {
        try {
            // Same flags as the Rust runner (src-tauri/src/storage.rs).
            const { stdout, stderr } = await run("git", ["-C", dir, "-c", "core.autocrlf=false", ...args], { env });
            return { code: 0, stdout, stderr };
        } catch (e) {
            const err = e as { code?: number; stdout?: string; stderr?: string };
            return { code: typeof err.code === "number" ? err.code : 1, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
        }
    },
};

const git = (dir: string, ...args: string[]) => backend.git(dir, args);
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const todo = (n: number, name: string, updatedAt: number, isCompleted = false): Todo => ({ id: id(n), name, updatedAt, isCompleted });
const state = (todos: Todo[], deletions: Record<string, number> = {}): AppState => ({
    version: "0.2.0", courses: [], courseItems: [], todos,
    settings: { autoCompleteExams: false, showGreeting: true, quoteSource: "local", customQuotes: [] },
    settingsUpdatedAt: 0, deletions,
});
const names = (s: AppState) => s.todos.map((t) => t.name).sort();
const T = Date.now();

let remote: string, linux: string, windows: string;

beforeEach(async () => {
    const root = mkdtempSync(join(tmpdir(), "jot-sync-"));
    remote = join(root, "remote.git");
    linux = join(root, "linux");
    windows = join(root, "windows");
    await run("git", ["init", "--quiet", "--bare", "-b", "main", remote], { env });
    await run("git", ["clone", "--quiet", remote, linux], { env });
    await run("git", ["clone", "--quiet", remote, windows], { env });
});

describe("syncGit", () => {
    it("publishes the first sync to an empty remote", async () => {
        const result = await syncGit(backend, linux, state([todo(1, "math hw", T)]), "sync");
        expect(result.pushed).toBe(true);
        const log = await git(remote, "log", "--oneline", "main");
        expect(log.stdout.trim().split("\n")).toHaveLength(1);
    });

    it("brings one OS's data to the other", async () => {
        await syncGit(backend, linux, state([todo(1, "math hw", T)]), "sync");
        const { state: onWindows } = await syncGit(backend, windows, state([]), "sync");
        expect(names(onWindows)).toEqual(["math hw"]);
    });

    it("merges edits made on both OSes without git conflicts", async () => {
        const shared = state([todo(1, "math hw", T), todo(2, "email prof", T)]);
        await syncGit(backend, linux, shared, "sync");
        await syncGit(backend, windows, state([]), "sync");

        // Offline on both: Linux checks off math hw, Windows deletes the email and adds a todo.
        const onLinux = state([todo(1, "math hw", T + 10, true), todo(2, "email prof", T)]);
        const onWindows = state([todo(1, "math hw", T), todo(3, "lab report", T + 20)], { [id(2)]: T + 20 });

        await syncGit(backend, linux, onLinux, "linux edits");
        const w = await syncGit(backend, windows, onWindows, "windows edits"); // diverged → merged
        const l = await syncGit(backend, linux, onLinux, "linux again"); // fast-forward

        expect(names(w.state)).toEqual(["lab report", "math hw"]);
        expect(w.state.todos.find((t) => t.id === id(1))?.isCompleted).toBe(true);
        expect(serialize(l.state)).toBe(serialize(w.state));

        const file = readFileSync(join(linux, DATA_FILE), "utf8");
        expect(file).not.toMatch(/^(<<<<<<<|=======|>>>>>>>)/m);
        expect(file).toBe(serialize(w.state));
        const status = await git(windows, "status", "--porcelain");
        expect(status.stdout).toBe("");

        const subjects = (await git(remote, "log", "--format=%s", "main")).stdout.trim().split("\n");
        expect(subjects).toContain("windows edits (merged with the other system's changes)");
        expect(subjects.some((s) => s.startsWith("Merge "))).toBe(false);
    });

    it("does nothing when there's nothing new", async () => {
        const s = state([todo(1, "math hw", T)]);
        await syncGit(backend, linux, s, "sync");
        const again = await syncGit(backend, linux, s, "sync");
        expect(again.pushed).toBe(false);
        const log = await git(remote, "log", "--oneline", "main");
        expect(log.stdout.trim().split("\n")).toHaveLength(1);
    });

    it("reports an unreachable remote as offline, keeping the local commit", async () => {
        await syncGit(backend, linux, state([todo(1, "a", T)]), "sync");
        await git(linux, "remote", "set-url", "origin", join(remote, "..", "missing.git"));
        const err = await syncGit(backend, linux, state([todo(1, "a", T), todo(2, "b", T)]), "sync").catch((e) => e);
        expect(err).toBeInstanceOf(GitError);
        expect((err as GitError).offline).toBe(true);
        const log = await git(linux, "log", "--oneline");
        expect(log.stdout.trim().split("\n")).toHaveLength(2);
    });
});

describe("syncFolder", () => {
    it("merges a file written by the other OS (shared folder or Dropbox)", async () => {
        await backend.writeData(linux, serialize(state([todo(1, "from windows", T)])));
        const merged = await syncFolder(backend, linux, state([todo(2, "from linux", T)]));
        expect(names(merged)).toEqual(["from linux", "from windows"]);
        expect(readFileSync(join(linux, DATA_FILE), "utf8")).toBe(serialize(merged));
    });
});

describe("commitMessage", () => {
    it("names the system and gives local time with its UTC offset", () => {
        const at = new Date(2026, 10, 17, 18, 42);
        const msg = commitMessage("Linux", at);
        expect(msg).toMatch(/^sync from Linux, 2026-11-17 18:42 [+-]\d{2}:\d{2}$/);

        const offset = -at.getTimezoneOffset() || 0; // UTC gives -0
        const [, sign, hh, mm] = msg.match(/([+-])(\d{2}):(\d{2})$/)!;
        expect((sign === "-" ? -1 : 1) * (Number(hh) * 60 + Number(mm))).toBe(offset);
    });
});
