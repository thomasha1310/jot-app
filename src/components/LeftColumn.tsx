import { useState } from "react";
import { Settings } from "lucide-react";
import { DarkModeToggle } from "./DarkModeToggle";
import { QuoteCard } from "./QuoteCard";
import { SettingsDialog } from "./SettingsDialog";
import { TodoList } from "./todo-list/TodoList";

export function LeftColumn() {
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <aside className="flex min-h-0 flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="pl-3 font-hand text-5xl leading-none">jot.</h1>
                <div className="flex items-center">
                    <DarkModeToggle />
                    <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        aria-label="Settings"
                        className="rounded p-1.5 text-pencil hover:text-paper"
                    >
                        <Settings className="size-4" />
                    </button>
                </div>
            </div>
            <QuoteCard />
            <TodoList />
            {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
        </aside>
    );
}
