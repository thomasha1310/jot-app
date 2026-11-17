import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface DialogProps {
    title: string;
    /** A quiet line under the title, e.g. the day an item is due. */
    subtitle?: string;
    onClose: () => void;
    children: ReactNode;
}

/** Native <dialog>: focus trap, Esc to close and a backdrop for free. */
export function Dialog({ title, subtitle, onClose, children }: DialogProps) {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const el = ref.current;
        el?.showModal();
        return () => el?.close();
    }, []);

    return (
        <dialog
            ref={ref}
            // StrictMode's mount→cleanup→mount calls close() then showModal(), and the
            // queued "close" event lands after the dialog is open again. Ignore it.
            onClose={() => {
                if (!ref.current?.open) onClose();
            }}
            onClick={(e) => e.target === ref.current && onClose()}
            className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-xl border border-line bg-blotter p-0 text-paper shadow-[0_24px_60px_-12px_rgb(0_0_0/0.5)]"
        >
            <div className="flex items-start justify-between gap-4 px-7 pt-6">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
                    {subtitle && <p className="text-pencil">{subtitle}</p>}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="-mr-2 mt-1 rounded p-1.5 text-pencil hover:text-paper"
                >
                    <X className="size-4" />
                </button>
            </div>
            <div className="px-7 pb-7 pt-5">{children}</div>
        </dialog>
    );
}

/** Ruled-line field, like writing on a notebook line. */
export const fieldClass =
    "block w-full border-0 border-b border-line bg-transparent px-0 pt-1 pb-1.5 text-paper placeholder:text-pencil/60 transition-colors hover:border-pencil focus:border-paper focus-visible:outline-none";

export const labelClass = "mb-1 block text-sm text-pencil";

export const primaryButton =
    "rounded-md bg-paper px-4 py-2 font-semibold text-desk transition-opacity hover:opacity-90";

export const quietButton = "rounded-md px-3 py-2 text-pencil transition-colors hover:text-paper";

/** Footer row: destructive/secondary on the left, cancel + primary on the right. */
export function DialogActions({ children }: { children: ReactNode }) {
    return <div className="mt-7 flex items-center gap-2">{children}</div>;
}
