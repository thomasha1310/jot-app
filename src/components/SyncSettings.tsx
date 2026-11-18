import { useEffect, useState } from "react";
import { chooseFolder, describeFolder, syncNow, useSyncStore } from "../sync/engine";
import { isDesktop } from "../sync/tauriBackend";
import { labelClass, quietButton } from "./ui/Dialog";

type FolderInfo = Awaited<ReturnType<typeof describeFolder>>;

const outlineButton = `${quietButton} border border-line`;

export function SyncSettings() {
    const { dataDir, gitSync, status } = useSyncStore();
    const [info, setInfo] = useState<FolderInfo | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!dataDir) return;
        let cancelled = false;
        void describeFolder(dataDir).then((i) => !cancelled && setInfo(i));
        return () => {
            cancelled = true;
        };
    }, [dataDir]);

    if (!isDesktop) {
        return (
            <div>
                <p className={labelClass}>Sync</p>
                <p>
                    Saving to a folder and git sync work in the desktop app. In the browser,
                    your data stays in this browser only.
                </p>
            </div>
        );
    }

    const pick = async () => {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const dir = await open({ directory: true, title: "Choose where jot keeps its data" });
        if (typeof dir !== "string") return;
        setBusy(true);
        try {
            setInfo(await describeFolder(dir));
            await chooseFolder(dir);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-3">
            <p className={labelClass}>Sync</p>

            {dataDir ? (
                <>
                    <p className="break-all font-mono text-sm">{dataDir}</p>
                    <p className="text-sm text-pencil">
                        {info === null
                            ? "Checking folder…"
                            : gitSync
                              ? `Saved as jot.json, then committed and pushed to ${info.isRepo ? info.remote : "origin"}. Jot pulls on start, every 5 minutes, and before closing.`
                              : info.isRepo
                                ? "This folder is a git repo without a remote named “origin”, so jot only saves here. Add a remote to sync with git."
                                : "Saved as jot.json in this folder. To sync with git, choose a folder that's a clone of a private repo."}
                    </p>
                    {status.kind === "error" && (
                        <p role="alert" className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500">
                            {status.message}
                        </p>
                    )}
                    {status.kind === "offline" && (
                        <p className="text-sm text-pencil">
                            Offline: {status.message} Jot will try again later.
                        </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                        {gitSync && (
                            <button
                                type="button"
                                disabled={status.kind === "syncing"}
                                onClick={() => void syncNow()}
                                className={outlineButton}
                            >
                                {status.kind === "syncing" ? "Syncing…" : "Sync now"}
                            </button>
                        )}
                        <button type="button" disabled={busy} onClick={pick} className={outlineButton}>
                            Change folder
                        </button>
                        <button type="button" onClick={() => void chooseFolder(null)} className={quietButton}>
                            Stop using this folder
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <p>
                        Keep your data as a file in a folder, like a git clone or a Dropbox folder,
                        to use it on both of your systems.
                    </p>
                    <button type="button" disabled={busy} onClick={pick} className={outlineButton}>
                        {busy ? "Setting up…" : "Choose folder"}
                    </button>
                </>
            )}
        </div>
    );
}
