import { Moon, Sun } from "lucide-react";
import { useDarkMode } from "../hooks/useDarkMode";

export function DarkModeToggle() {
    const { isDarkMode, toggleDarkMode } = useDarkMode();

    return (
        <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded p-1.5 text-pencil hover:text-paper"
        >
            {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
    );
}
