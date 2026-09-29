import { AppStateSchema, type AppState } from "../types";

export const handleImport = async (
    file: File,
    importData: (data: AppState) => void,
) => {
    try {
        const text = await file.text();
        const rawData = JSON.parse(text);

        const result = AppStateSchema.safeParse(rawData);

        if (!result.success) {
            alert(
                "Invalid backup file. The data structure does not match the required format.",
            );
            return;
        }

        importData(result.data);
        alert("Data imported successfully!");
    } catch (error) {
        alert("Failed to parse the file. Ensure it is a valid JSON document.");
    }
};
