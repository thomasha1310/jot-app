import { AppStateSchema, type AppState } from "../types";

/** Returns an error message, or null on success. */
export const handleImport = async (
    file: File,
    importData: (data: AppState) => void,
): Promise<string | null> => {
    let raw: unknown;
    try {
        raw = JSON.parse(await file.text());
    } catch {
        return "That file isn't valid JSON. Choose a backup exported from jot.";
    }
    const result = AppStateSchema.safeParse(raw);
    if (!result.success) {
        return "That file doesn't match jot's backup format, so nothing was changed.";
    }
    importData(result.data);
    return null;
};

export const handleExport = (state: AppState) => {
    const data: AppState = {
        version: state.version,
        courses: state.courses,
        courseItems: state.courseItems,
        todos: state.todos,
        settings: state.settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jot-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
};
