import { useState } from "react";
import { useAppStore } from "../store";
import { useSyncStore } from "../sync/engine";
import { handleExport } from "../utils/fileSystem";
import { quietButton } from "./ui/Dialog";

/** Two steps: explain what goes (and where), offer a backup, then delete. */
export function DeleteAllData({ onDeleted }: { onDeleted: () => void }) {
    const [confirming, setConfirming] = useState(false);
    const [done, setDone] = useState(false);
    const { dataDir, gitSync } = useSyncStore();

    if (!confirming) {
        return (
            <div>
                <button
                    type="button"
                    onClick={() => {
                        setConfirming(true);
                        setDone(false);
                    }}
                    className="rounded-md px-3 py-2 text-pencil transition-colors hover:text-red-500"
                >
                    Delete all my data
                </button>
                {done && (
                    <p role="status" className="mt-1 text-sm">
                        All data deleted.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div role="alertdialog" aria-labelledby="delete-all-title" className="rounded-md border border-red-500/40 bg-red-500/5 p-4">
            <p id="delete-all-title" className="font-semibold">
                Delete all your data?
            </p>
            <p className="mt-1 text-sm">
                This removes every course, assignment, exam and to-do, and resets your settings.
                {dataDir &&
                    " Your data folder is cleared too, and your other system clears its copy the next time it syncs."}
                {gitSync && " Older versions stay in your git history."}
            </p>
            <p className="mt-2 text-sm">
                Might want it back?{" "}
                <button
                    type="button"
                    onClick={() => handleExport(useAppStore.getState())}
                    className="underline underline-offset-4 hover:text-paper"
                >
                    Export a backup first
                </button>
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setConfirming(false)} className={quietButton}>
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={() => {
                        useAppStore.getState().deleteAllData();
                        onDeleted();
                        setConfirming(false);
                        setDone(true);
                    }}
                    className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                >
                    Delete everything
                </button>
            </div>
        </div>
    );
}
