import { beforeEach, describe, expect, it } from "vitest";
import { normalizeState, pickData, useAppStore } from "./store";
import { mergeStates } from "./sync/merge";

const reset = () =>
    useAppStore.setState({ courses: [], courseItems: [], todos: [], deletions: {}, settingsUpdatedAt: 0 });

describe("deleteAllData", () => {
    beforeEach(reset);

    it("empties everything and resets settings", () => {
        const s = useAppStore.getState();
        s.addCourse({ id: crypto.randomUUID(), name: "MATH 0350", color: "#ef7fa8", icon: "" });
        s.addTodo({ id: crypto.randomUUID(), name: "math hw", isCompleted: false });
        s.updateSettings({ quoteSource: "online", customQuotes: [{ text: "x", author: "y" }] });

        useAppStore.getState().deleteAllData();

        const after = useAppStore.getState();
        expect(after.courses).toEqual([]);
        expect(after.courseItems).toEqual([]);
        expect(after.todos).toEqual([]);
        expect(after.settings.quoteSource).toBe("local");
        expect(after.settings.customQuotes).toEqual([]);
    });

    it("stays deleted when an older synced copy is merged back in", () => {
        const s = useAppStore.getState();
        s.addCourse({ id: crypto.randomUUID(), name: "MATH 0350", color: "#ef7fa8", icon: "" });
        s.addTodo({ id: crypto.randomUUID(), name: "math hw", isCompleted: false });
        s.updateSettings({ quoteSource: "online" });
        const otherMachine = pickData(useAppStore.getState());

        useAppStore.getState().deleteAllData();
        const merged = mergeStates(pickData(useAppStore.getState()), otherMachine);

        expect(merged.courses).toEqual([]);
        expect(merged.todos).toEqual([]);
        expect(merged.settings.quoteSource).toBe("local");
    });
});

describe("importData", () => {
    beforeEach(reset);

    const backup = () => {
        const courseId = crypto.randomUUID();
        return normalizeState({
            courses: [{ id: courseId, name: "MATH 0350", color: "#ef7fa8", icon: "", updatedAt: 0 }],
            courseItems: [
                { id: crypto.randomUUID(), courseId, name: "HW 9", date: "2026-11-16", type: "assignment", status: "complete", updatedAt: 0 },
            ],
            todos: [],
        });
    };

    it("restores records after delete-all when the same backup is imported again", () => {
        const file = backup();
        useAppStore.getState().importData(file);
        useAppStore.getState().deleteAllData();
        expect(useAppStore.getState().courseItems).toEqual([]);

        useAppStore.getState().importData(file);

        const after = useAppStore.getState();
        expect(after.courses.map((c) => c.name)).toEqual(["MATH 0350"]);
        expect(after.courseItems.map((i) => i.name)).toEqual(["HW 9"]);
        expect(after.deletions).toEqual({});
    });

    it("restored records stay restored when the other machine's older deletion syncs in", () => {
        const file = backup();
        useAppStore.getState().importData(file);
        useAppStore.getState().deleteAllData();
        const otherMachine = pickData(useAppStore.getState()); // still has the deletion markers
        useAppStore.getState().importData(file);

        const merged = mergeStates(pickData(useAppStore.getState()), otherMachine);
        expect(merged.courseItems.map((i) => i.name)).toEqual(["HW 9"]);
    });

    it("doesn't overwrite edits made after importing when re-importing", () => {
        const file = backup();
        useAppStore.getState().importData(file);
        const id = file.courseItems[0].id;
        useAppStore.getState().updateTask(id, { name: "HW 9 (resubmitted)" });

        useAppStore.getState().importData(file);

        expect(useAppStore.getState().courseItems.map((i) => i.name)).toEqual(["HW 9 (resubmitted)"]);
    });
});
