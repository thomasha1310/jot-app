import { describe, expect, it } from "vitest";
import type { AppState, Todo } from "../types";
import { mergeStates } from "./merge";

/** Small fake timestamps need a matching "now", or retention prunes them. */
const NOW = 100;
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const todo = (n: number, name: string, updatedAt: number, isCompleted = false): Todo => ({
    id: id(n), name, updatedAt, isCompleted,
});
const base = (patch: Partial<AppState> = {}): AppState => ({
    version: "0.2.0",
    courses: [],
    courseItems: [],
    todos: [],
    settings: { autoCompleteExams: false, showGreeting: true, quoteSource: "local", customQuotes: [] },
    settingsUpdatedAt: 0,
    deletions: {},
    ...patch,
});

describe("mergeStates", () => {
    it("keeps records that exist on only one side", () => {
        const merged = mergeStates(base({ todos: [todo(1, "a", 1)] }), base({ todos: [todo(2, "b", 1)] }));
        expect(merged.todos.map((t) => t.name)).toEqual(["a", "b"]);
    });

    it("keeps the newer copy of a record edited on both sides", () => {
        const local = base({ todos: [todo(1, "old", 10)] });
        const remote = base({ todos: [todo(1, "new", 20, true)] });
        expect(mergeStates(local, remote).todos).toEqual([todo(1, "new", 20, true)]);
        expect(mergeStates(remote, local).todos).toEqual([todo(1, "new", 20, true)]);
    });

    it("drops a record deleted on the other side after its last edit", () => {
        const local = base({ todos: [todo(1, "a", 10)] });
        const remote = base({ deletions: { [id(1)]: 15 } });
        const merged = mergeStates(local, remote, NOW);
        expect(merged.todos).toEqual([]);
        expect(merged.deletions[id(1)]).toBe(15);
    });

    it("keeps a record edited after it was deleted elsewhere", () => {
        const local = base({ todos: [todo(1, "edited later", 20)] });
        const remote = base({ deletions: { [id(1)]: 15 } });
        expect(mergeStates(local, remote, NOW).todos.map((t) => t.name)).toEqual(["edited later"]);
    });

    it("keeps the first side's order and appends the other side's new records", () => {
        const local = base({ todos: [todo(3, "c", 1), todo(1, "a", 1)] });
        const remote = base({ todos: [todo(2, "b", 1), todo(1, "a", 1), todo(4, "d", 1)] });
        expect(mergeStates(local, remote).todos.map((t) => t.name)).toEqual(["c", "a", "b", "d"]);
    });

    it("takes settings from whichever side changed them last", () => {
        const local = base({ settingsUpdatedAt: 5 });
        const remote = base({
            settingsUpdatedAt: 9,
            settings: { ...base().settings, quoteSource: "online" },
        });
        expect(mergeStates(local, remote).settings.quoteSource).toBe("online");
        expect(mergeStates(local, remote).settingsUpdatedAt).toBe(9);
    });

    it("forgets deletion markers older than the retention window", () => {
        const now = 1_000 * 86_400_000;
        const merged = mergeStates(
            base({ deletions: { [id(1)]: now - 400 * 86_400_000, [id(2)]: now - 10 } }),
            base(),
            now,
        );
        expect(Object.keys(merged.deletions)).toEqual([id(2)]);
    });

    it("is idempotent", () => {
        const a = base({ todos: [todo(1, "a", 3)], deletions: { [id(9)]: 4 } });
        const b = base({ todos: [todo(2, "b", 5)] });
        const once = mergeStates(a, b, NOW);
        expect(once.deletions).toEqual({ [id(9)]: 4 });
        expect(mergeStates(once, b, NOW)).toEqual(once);
        expect(mergeStates(once, once, NOW)).toEqual(once);
    });
});
