import { useEffect, useState } from "react";
import { useSyncStore } from "../sync/engine";

const ago = (at: number) => {
    const mins = Math.floor((Date.now() - at) / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    return hours < 24 ? `${hours} h ago` : "over a day ago";
};

/** One quiet line: is it safe to reboot into the other OS? */
export function SyncStatusLine({ onOpenSettings }: { onOpenSettings: () => void }) {
    const status = useSyncStore((s) => s.status);
    const gitSync = useSyncStore((s) => s.gitSync);
    const [, tick] = useState(0);

    useEffect(() => {
        const id = setInterval(() => tick((n) => n + 1), 30_000);
        return () => clearInterval(id);
    }, []);

    if (status.kind === "off") return null;

    const text =
        status.kind === "syncing"
            ? "syncing…"
            : status.kind === "idle"
              ? `${gitSync ? "synced" : "saved"} ${ago(status.at)}`
              : status.kind === "offline"
                ? "offline, will sync later"
                : "sync problem, see settings";

    return (
        <p role="status" className="text-sm text-pencil">
            {status.kind === "error" ? (
                <button type="button" onClick={onOpenSettings} className="text-paper underline decoration-red-500 underline-offset-4">
                    {text}
                </button>
            ) : (
                <span title={status.kind === "offline" ? status.message : undefined}>{text}</span>
            )}
        </p>
    );
}
