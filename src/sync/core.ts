import { normalizeState, pickData } from "../store";
import { AppStateSchema, type AppState } from "../types";
import { mergeStates } from "./merge";

export const DATA_FILE = "jot.json";

export interface GitResult {
    code: number;
    stdout: string;
    stderr: string;
}

/** What the sync logic needs from the outside world. Tauri in the app, Node in tests. */
export interface Backend {
    readData(dir: string): Promise<string | null>;
    /** Must be atomic (write a temp file, then rename) so a sync client never sees half a file. */
    writeData(dir: string, contents: string): Promise<void>;
    git(dir: string, args: string[]): Promise<GitResult>;
}

/**
 * Canonical, pretty output: records sorted, and keys in schema order (zod rebuilds
 * objects in shape order). Otherwise each machine would rewrite the file in its own
 * key order and every sync would commit noise.
 */
export function serialize(state: AppState): string {
    const data = pickData(state);
    const sorted: AppState = {
        ...data,
        courseItems: [...data.courseItems].sort(
            (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
        ),
        deletions: Object.fromEntries(
            Object.entries(data.deletions).sort(([a], [b]) => a.localeCompare(b)),
        ),
    };
    return JSON.stringify(AppStateSchema.parse(sorted), null, 2) + "\n";
}

export class DataFileError extends Error {}

export function parse(text: string): AppState {
    let raw: unknown;
    try {
        raw = JSON.parse(text);
    } catch {
        throw new DataFileError(`${DATA_FILE} isn't valid JSON.`);
    }
    const result = AppStateSchema.safeParse(raw);
    if (!result.success) {
        throw new DataFileError(`${DATA_FILE} doesn't match jot's data format.`);
    }
    return normalizeState(result.data);
}

/** Reads the folder's file (if any), merges it with local data, and writes the result back. */
export async function syncFolder(backend: Backend, dir: string, local: AppState): Promise<AppState> {
    const text = await backend.readData(dir);
    const merged = text ? mergeStates(local, parse(text)) : local;
    const out = serialize(merged);
    if (out !== text) await backend.writeData(dir, out);
    return merged;
}

export class GitError extends Error {
    /** Network or auth trouble: worth retrying later rather than alarming anyone. */
    readonly offline: boolean;
    constructor(message: string, offline = false) {
        super(message);
        this.offline = offline;
    }
}

export type GitSyncResult = { state: AppState; pushed: boolean };

const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");

/**
 * "sync from Linux, 2026-11-17 18:42 -05:00". Local time with its UTC offset, so the
 * time stays unambiguous even when the two systems disagree about the clock.
 */
export function commitMessage(machine: string, at = new Date()): string {
    const offset = -at.getTimezoneOffset();
    const date = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
    const time = `${pad(at.getHours())}:${pad(at.getMinutes())}`;
    const zone = `${offset >= 0 ? "+" : "-"}${pad(Math.trunc(offset / 60))}:${pad(offset % 60)}`;
    return `sync from ${machine}, ${date} ${time} ${zone}`;
}

/**
 * Commit local changes, bring in the other machine's commits, merge the data
 * ourselves (git never sees a conflict), and push.
 */
export async function syncGit(
    backend: Backend,
    dir: string,
    local: AppState,
    message: string,
): Promise<GitSyncResult> {
    const git = async (args: string[], allowFail = false) => {
        const r = await backend.git(dir, args);
        if (r.code !== 0 && !allowFail) {
            throw new GitError(`git ${args[0]} failed: ${(r.stderr || r.stdout).trim()}`);
        }
        return r;
    };
    const commitIfChanged = async (msg: string, amend = false) => {
        await git(["add", "--", DATA_FILE]);
        const staged = await git(["diff", "--cached", "--quiet", "--", DATA_FILE], true);
        if (staged.code === 0 && !amend) return;
        await git(amend ? ["commit", "--amend", "--no-edit"] : ["commit", "-m", msg, "--", DATA_FILE]);
    };

    // 1. Our current data, committed.
    let state = await syncFolder(backend, dir, local);
    await commitIfChanged(message);

    // 2. What does the other machine have?
    const fetched = await git(["fetch", "--quiet"], true);
    if (fetched.code !== 0) {
        throw new GitError(`Couldn't reach the remote: ${fetched.stderr.trim()}`, true);
    }

    const upstream = await git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], true);
    if (upstream.code !== 0) {
        // First sync from this repo: publish the branch.
        const pushed = await git(["push", "--quiet", "-u", "origin", "HEAD"], true);
        if (pushed.code !== 0) throw new GitError(`Couldn't push: ${pushed.stderr.trim()}`, true);
        return { state, pushed: true };
    }

    const counts = await git(["rev-list", "--left-right", "--count", "HEAD...@{u}"]);
    const [ahead, behind] = counts.stdout.trim().split(/\s+/).map(Number);

    // 3. Bring theirs in. Merge the data in the app, never in git.
    if (behind > 0) {
        const theirs = await git(["show", `@{u}:./${DATA_FILE}`], true);
        const remote = theirs.code === 0 ? parse(theirs.stdout) : null;
        const merged = remote ? mergeStates(state, remote) : state;

        if (ahead === 0) {
            await git(["merge", "--ff-only", "--quiet", "@{u}"]);
            await backend.writeData(dir, serialize(merged));
            await commitIfChanged(message);
        } else {
            // Record both histories, but with our merged data as the result. Histories
            // are unrelated when both machines cloned the repo while it was still empty.
            await git([
                "merge", "-s", "ours", "--allow-unrelated-histories", "--quiet",
                "-m", `${message} (merged with the other system's changes)`, "@{u}",
            ]);
            await backend.writeData(dir, serialize(merged));
            await commitIfChanged(message, true);
        }
        state = merged;
    }

    // 4. Publish.
    const after = await git(["rev-list", "--left-right", "--count", "HEAD...@{u}"]);
    const [aheadNow] = after.stdout.trim().split(/\s+/).map(Number);
    if (aheadNow > 0) {
        const pushed = await git(["push", "--quiet"], true);
        if (pushed.code !== 0) {
            // Usually the other machine pushed in the meantime; the next sync merges it.
            throw new GitError(`Couldn't push: ${pushed.stderr.trim()}`, true);
        }
        return { state, pushed: true };
    }
    return { state, pushed: false };
}

/** What kind of folder is this? */
export async function inspectFolder(backend: Backend, dir: string) {
    const repo = await backend.git(dir, ["rev-parse", "--is-inside-work-tree"]);
    if (repo.code !== 0 || repo.stdout.trim() !== "true") return { isRepo: false as const };
    const remote = await backend.git(dir, ["remote", "get-url", "origin"]);
    return {
        isRepo: true as const,
        remote: remote.code === 0 ? remote.stdout.trim() : null,
    };
}
