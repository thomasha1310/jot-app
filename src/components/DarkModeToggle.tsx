import { useDarkMode } from "../hooks/useDarkMode";
import { Sun, Moon } from "lucide-react";

export function DarkModeToggle() {
    const { isDarkMode, toggleDarkMode } = useDarkMode();

    return (
        <button
            onClick={toggleDarkMode}
            className="cursor-pointer p-2 rounded-full transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
        >
            {isDarkMode ? (
                <Sun className="text-yellow-500" />
            ) : (
                <Moon className="text-neutral-800" />
            )}
        </button>
    );
}
