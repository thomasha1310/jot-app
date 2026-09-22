import { useState, useEffect } from "react";

export default function useDarkMode() {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        const saved = localStorage.getItem("jot-theme");
        if (saved) return saved === "dark";
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDarkMode);
        localStorage.setItem("jot-theme", isDarkMode ? "dark" : "light");
    }, [isDarkMode]);

    return { isDarkMode, toggleDarkMode: () => setIsDarkMode((prev) => !prev) };
}
