import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pickData, useAppStore } from "../store";
import { commitMessage, GitError, inspectFolder, serialize, syncFolder, syncGit } from "./core";
import { mergeStates } from "./merge";
import { isDesktop, tauriBackend as backend } from "./tauriBackend";

export type SyncStatus =
    | { kind: "off" }
    | { kind: "syncing" }
    | { kind: "idle"; at: number }
    | { kind: "offline"; message: string }
    | { kind: "error"; message: string };

interface SyncStore {
    /** Per machine (each OS keeps its own), so it lives outside the synced data. */
    dataDir: string | null;
    gitSync: boolean;
    status: SyncStatus;
}

export const useSyncStore = create<SyncStore>()(
    persist(
        (): SyncStore => ({ dataDir: null, gitSync: false, status: { kind: "off" } }),
        {
            name: "jot-device",
            partialize: ({ dataDir, gitSync }) => ({ dataDir, gitSync }),
        },
    ),
);

const setStatus = (status: SyncStatus) => useSyncStore.setState({ status });

const SAVE_DELAY = 1_000;
const PUSH_DELAY = 30_000;
const FOCUS_MIN_GAP = 60_000;
const POLL_EVERY = 5 * 60_000;
const CLOSE_TIMEOUT = 10_000;

const machineName = () => {
    const ua = navigator.userAgent;
    return ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Linux") ? "Linux" : "desktop";
};

/** Last data we wrote or merged, so our own updates don't schedule another sync. */
let lastSerialized = "";
let running: Promise<void> | null = null;
/** A sync requested mid-run; true if any of those callers wanted git. */
let queued: boolean | null = null;
let lastSyncAt = 0;

function applyMerged(result: ReturnType<typeof pickData>) {
    // The store may have changed while we were syncing: merge, never overwrite.
    useAppStore.setState((current) => mergeStates(pickData(current), result));
    lastSerialized = serialize(pickData(useAppStore.getState()));
}

async function run(withGit: boolean) {
    const { dataDir, gitSync } = useSyncStore.getState();
    if (!isDesktop || !dataDir) {
        setStatus({ kind: "off" });
        return;
    }

    const local = pickData(useAppStore.getState());
    const useGit = withGit && gitSync;
    if (useGit) setStatus({ kind: "syncing" });
    try {
        const state = useGit
            ? (await syncGit(backend, dataDir, local, commitMessage(machineName()))).state
            : await syncFolder(backend, dataDir, local);
        applyMerged(state);
        // In git mode a plain save isn't a sync, so the status keeps the last real one.
        if (useGit || !gitSync) {
            lastSyncAt = Date.now();
            setStatus({ kind: "idle", at: lastSyncAt });
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setStatus(e instanceof GitError && e.offline ? { kind: "offline", message } : { kind: "error", message });
    }
}

/** Save to the folder and, in git mode, commit/fetch/merge/push. Calls overlap safely. */
export function syncNow(withGit = true): Promise<void> {
    if (running) {
        queued = (queued ?? false) || withGit;
        return running;
    }
    const current = (async () => {
        try {
            await run(withGit);
        } finally {
            running = null;
            if (queued !== null) {
                const next = queued;
                queued = null;
                void syncNow(next);
            }
        }
    })();
    running = current;
    return current;
}

export async function describeFolder(dir: string) {
    return inspectFolder(backend, dir);
}

/** Point this machine at a folder (or null to stop) and sync straight away. */
export async function chooseFolder(dir: string | null) {
    if (!dir) {
        useSyncStore.setState({ dataDir: null, gitSync: false });
        return setStatus({ kind: "off" });
    }
    const info = await inspectFolder(backend, dir);
    useSyncStore.setState({ dataDir: dir, gitSync: info.isRepo && info.remote !== null });
    await syncNow();
}

/** Starts the timers and listeners. Returns a cleanup function. */
export function startSyncEngine(): () => void {
    if (!isDesktop) return () => {};

    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let pushTimer: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = useAppStore.subscribe((state) => {
        if (!useSyncStore.getState().dataDir) return;
        if (serialize(pickData(state)) === lastSerialized) return;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => void syncNow(false), SAVE_DELAY);
        if (useSyncStore.getState().gitSync) {
            clearTimeout(pushTimer);
            pushTimer = setTimeout(() => void syncNow(true), PUSH_DELAY);
        }
    });

    const onFocus = () => {
        if (Date.now() - lastSyncAt > FOCUS_MIN_GAP) void syncNow();
    };
    window.addEventListener("focus", onFocus);
    const poll = setInterval(() => {
        if (useSyncStore.getState().gitSync) void syncNow();
    }, POLL_EVERY);

    // One last sync before the window closes, so the other OS sees today's changes.
    let unlistenClose: (() => void) | undefined;
    let disposed = false;
    let closing = false;
    void import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        const win = getCurrentWindow();
        void win
            .onCloseRequested(async (event) => {
                if (closing || !useSyncStore.getState().dataDir) return;
                event.preventDefault();
                closing = true;
                clearTimeout(saveTimer);
                clearTimeout(pushTimer);
                await Promise.race([
                    syncNow(true),
                    new Promise((resolve) => setTimeout(resolve, CLOSE_TIMEOUT)),
                ]);
                await win.destroy();
            })
            .then((unlisten) => {
                // StrictMode can clean up before this resolves.
                if (disposed) unlisten();
                else unlistenClose = unlisten;
            });
    });

    void syncNow();

    return () => {
        disposed = true;
        unsubscribe();
        clearTimeout(saveTimer);
        clearTimeout(pushTimer);
        clearInterval(poll);
        window.removeEventListener("focus", onFocus);
        unlistenClose?.();
    };
}
