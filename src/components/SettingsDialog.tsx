import { useRef, useState } from "react";
import { useAppStore } from "../store";
import { handleExport, handleImport } from "../utils/fileSystem";
import type { Quote, QuoteSource } from "../types";
import { DeleteAllData } from "./DeleteAllData";
import { SyncSettings } from "./SyncSettings";
import { Choices } from "./ui/Choices";
import { Dialog, labelClass, quietButton } from "./ui/Dialog";

const QUOTE_OPTIONS: { value: QuoteSource; label: string; hint: string }[] = [
    { value: "local", label: "From my list", hint: "Built-in quotes plus your own. Works offline." },
    { value: "online", label: "Wikiquote's quote of the day", hint: "Needs internet. Falls back to your list when offline." },
    { value: "off", label: "No quote", hint: "" },
];

const formatQuotes = (quotes: Quote[]) =>
    quotes.map((q) => `${q.text} — ${q.author}`).join("\n");

/** One quote per line: "text — author". The author part is optional. */
const parseQuotes = (text: string): Quote[] =>
    text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const match = line.match(/^(.*\S)\s+(?:—|–|--|-)\s+(.+)$/);
            return match
                ? { text: match[1], author: match[2] }
                : { text: line, author: "unknown" };
        });

export function SettingsDialog({ onClose }: { onClose: () => void }) {
    const store = useAppStore();
    const { settings, updateSettings, importData } = store;
    const [quotesText, setQuotesText] = useState(() => formatQuotes(settings.customQuotes));
    const [importMessage, setImportMessage] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    return (
        <Dialog title="Settings" onClose={onClose}>
            <div className="space-y-6 [&>*+*]:border-t [&>*+*]:border-line [&>*+*]:pt-6">
                <Choices
                    legend="Daily quote"
                    name="quote-source"
                    stacked
                    value={settings.quoteSource}
                    onChange={(quoteSource) => updateSettings({ quoteSource })}
                    options={QUOTE_OPTIONS.map((o) => ({ value: o.value, label: o.label, hint: o.hint || undefined }))}
                />

                <div className="!border-0 !pt-0">
                    <label htmlFor="custom-quotes" className={labelClass}>
                        Your quotes, one per line, as “quote — author”
                    </label>
                    <textarea
                        id="custom-quotes"
                        rows={4}
                        value={quotesText}
                        onChange={(e) => setQuotesText(e.target.value)}
                        onBlur={() => updateSettings({ customQuotes: parseQuotes(quotesText) })}
                        placeholder="Well begun is half done. — Aristotle"
                        className="w-full rounded-md border border-line bg-desk px-3 py-2 text-sm text-paper placeholder:text-pencil/60 focus:border-pencil focus-visible:outline-none"
                    />
                </div>

                <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                        type="checkbox"
                        checked={settings.showGreeting}
                        onChange={(e) => updateSettings({ showGreeting: e.target.checked })}
                        className="accent-[var(--lamp)]"
                    />
                    Show greeting
                </label>

                <SyncSettings />

                <div>
                    <p className={labelClass}>Backups</p>
                    <p className="mb-3">
                        Export saves everything as a file. Import merges a backup into what's here,
                        keeping the newer copy of anything in both.
                    </p>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => handleExport(store)} className={`${quietButton} border border-line`}>
                            Export backup
                        </button>
                        <button type="button" onClick={() => fileRef.current?.click()} className={`${quietButton} border border-line`}>
                            Import backup
                        </button>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="application/json,.json"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const error = await handleImport(file, importData);
                                setImportMessage(error ?? "Backup merged in.");
                                e.target.value = "";
                            }}
                        />
                    </div>
                    {importMessage && <p role="status" className="mt-2 text-sm">{importMessage}</p>}
                </div>

                <DeleteAllData
                    onDeleted={() => {
                        // Otherwise the box would re-save the old quotes on blur.
                        setQuotesText("");
                        setImportMessage(null);
                    }}
                />
            </div>
        </Dialog>
    );
}
