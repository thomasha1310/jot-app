import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeDate } from "./lib/dates";
import { mergeStates } from "./sync/merge";
import type { AppState, Course, CourseItem, Settings, Todo } from "./types";

type NewRecord<T> = Omit<T, "updatedAt">;

interface AppStore extends AppState {
    addCourse: (course: NewRecord<Course>) => void;
    updateCourse: (id: string, updates: Partial<Course>) => void;
    archiveCourse: (id: string) => void;
    addTask: (task: NewRecord<CourseItem>) => void;
    updateTask: (id: string, updates: Partial<CourseItem>) => void;
    deleteTask: (id: string) => void;
    addTodo: (todo: NewRecord<Todo>) => void;
    /** Adds a todo linked to an assignment/exam. Returns false if one already exists. */
    addTodoFromItem: (itemId: string) => boolean;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    clearCompletedTodos: () => void;
    updateSettings: (settings: Partial<Settings>) => void;
    /**
     * Merges a backup into the current data, keeping newer edits. Anything in the
     * backup that was deleted here comes back.
     */
    importData: (data: AppState) => void;
    /**
     * Removes every course, item and todo and resets settings. Records deletion
     * markers so the next sync removes them elsewhere instead of merging them back.
     */
    deleteAllData: () => void;
}

export const DATA_VERSION = "0.2.0";

const defaultSettings: Settings = {
    autoCompleteExams: false,
    showGreeting: true,
    quoteSource: "local",
    customQuotes: [],
};

/** Brings data from older versions (or an imported file) up to the current shape. */
export function normalizeState(data: Partial<AppState>): AppState {
    const stamp = <T extends { updatedAt?: number }>(r: T) => ({ ...r, updatedAt: r.updatedAt ?? 0 });
    return {
        version: DATA_VERSION,
        courses: (data.courses ?? []).map(stamp),
        courseItems: (data.courseItems ?? []).map((item) => ({
            ...stamp(item),
            date: normalizeDate(item.date),
        })),
        todos: (data.todos ?? []).map(stamp),
        settings: { ...defaultSettings, ...data.settings },
        settingsUpdatedAt: data.settingsUpdatedAt ?? 0,
        deletions: data.deletions ?? {},
    };
}

/** Just the data, without the store's functions. */
export const pickData = (s: AppState): AppState => ({
    version: s.version,
    courses: s.courses,
    courseItems: s.courseItems,
    todos: s.todos,
    settings: s.settings,
    settingsUpdatedAt: s.settingsUpdatedAt,
    deletions: s.deletions,
});

const reopenedStatus = (item: CourseItem): CourseItem["status"] =>
    item.type === "assignment" ? "in_progress" : "not_started";

export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => {
            const now = () => Date.now();
            const deleted = (ids: string[]) => ({
                ...get().deletions,
                ...Object.fromEntries(ids.map((id) => [id, now()])),
            });

            return {
                version: DATA_VERSION,
                courses: [],
                courseItems: [],
                todos: [],
                settings: defaultSettings,
                settingsUpdatedAt: 0,
                deletions: {},

                addCourse: (course) =>
                    set((state) => ({ courses: [...state.courses, { ...course, updatedAt: now() }] })),
                updateCourse: (id, updates) =>
                    set((state) => ({
                        courses: state.courses.map((c) =>
                            c.id === id ? { ...c, ...updates, updatedAt: now() } : c,
                        ),
                    })),
                archiveCourse: (id) =>
                    set((state) => ({
                        courses: state.courses.map((c) =>
                            c.id === id ? { ...c, isArchived: !c.isArchived, updatedAt: now() } : c,
                        ),
                    })),

                addTask: (task) =>
                    set((state) => ({
                        courseItems: [...state.courseItems, { ...task, updatedAt: now() } as CourseItem],
                    })),
                updateTask: (id, updates) =>
                    set((state) => {
                        const before = state.courseItems.find((t) => t.id === id);
                        const courseItems = state.courseItems.map((t) =>
                            t.id === id ? { ...t, ...updates, updatedAt: now() } : t,
                        ) as CourseItem[];

                        // Keep linked todos in step with the item's completion.
                        let todos = state.todos;
                        if (before && updates.status && updates.status !== before.status) {
                            const done = updates.status === "complete";
                            todos = todos.map((todo) =>
                                todo.linkedItemId === id
                                    ? { ...todo, isCompleted: done, name: updates.name ?? todo.name, updatedAt: now() }
                                    : todo,
                            );
                        }
                        return { courseItems, todos };
                    }),
                deleteTask: (id) =>
                    set((state) => ({
                        courseItems: state.courseItems.filter((t) => t.id !== id),
                        // The todo stays as plain handwriting once its item is gone.
                        todos: state.todos.map((todo) =>
                            todo.linkedItemId === id
                                ? { ...todo, linkedItemId: undefined, updatedAt: now() }
                                : todo,
                        ),
                        deletions: deleted([id]),
                    })),

                addTodo: (todo) =>
                    set((state) => ({ todos: [...state.todos, { ...todo, updatedAt: now() }] })),
                addTodoFromItem: (itemId) => {
                    const { courseItems, todos } = get();
                    const item = courseItems.find((t) => t.id === itemId);
                    if (!item || todos.some((t) => t.linkedItemId === itemId)) return false;
                    set({
                        todos: [
                            ...todos,
                            {
                                id: crypto.randomUUID(),
                                name: item.name,
                                isCompleted: item.status === "complete",
                                linkedItemId: itemId,
                                updatedAt: now(),
                            },
                        ],
                    });
                    return true;
                },
                toggleTodo: (id) =>
                    set((state) => {
                        const todo = state.todos.find((t) => t.id === id);
                        if (!todo) return {};
                        const done = !todo.isCompleted;
                        return {
                            todos: state.todos.map((t) =>
                                t.id === id ? { ...t, isCompleted: done, updatedAt: now() } : t,
                            ),
                            courseItems: todo.linkedItemId
                                ? (state.courseItems.map((item) =>
                                      item.id === todo.linkedItemId
                                          ? {
                                                ...item,
                                                status: done ? "complete" : reopenedStatus(item),
                                                updatedAt: now(),
                                            }
                                          : item,
                                  ) as CourseItem[])
                                : state.courseItems,
                        };
                    }),
                deleteTodo: (id) =>
                    set((state) => ({
                        todos: state.todos.filter((t) => t.id !== id),
                        deletions: deleted([id]),
                    })),
                clearCompletedTodos: () =>
                    set((state) => ({
                        todos: state.todos.filter((t) => !t.isCompleted),
                        deletions: deleted(state.todos.filter((t) => t.isCompleted).map((t) => t.id)),
                    })),

                updateSettings: (updates) =>
                    set((state) => ({
                        settings: { ...state.settings, ...updates },
                        settingsUpdatedAt: now(),
                    })),
                importData: (data) =>
                    set((state) => {
                        const incoming = normalizeState(data);
                        // Importing is a deliberate choice, so it brings back anything that
                        // was deleted. Restored records are stamped just after their deletion
                        // so they also win against the other machine's copy of that marker.
                        // Records that weren't deleted merge normally: newer edits are kept.
                        const remaining = { ...state.deletions };
                        const restore = <T extends { id: string; updatedAt: number }>(records: T[]) =>
                            records.map((r) => {
                                if (!(r.id in remaining)) return r;
                                const deletedAt = remaining[r.id];
                                delete remaining[r.id];
                                return { ...r, updatedAt: Math.max(now(), deletedAt + 1) };
                            });
                        const restored = {
                            ...incoming,
                            courses: restore(incoming.courses),
                            courseItems: restore(incoming.courseItems),
                            todos: restore(incoming.todos),
                        };
                        return mergeStates({ ...pickData(state), deletions: remaining }, restored);
                    }),
                deleteAllData: () =>
                    set((state) => ({
                        courses: [],
                        courseItems: [],
                        todos: [],
                        deletions: deleted([
                            ...state.courses.map((c) => c.id),
                            ...state.courseItems.map((i) => i.id),
                            ...state.todos.map((t) => t.id),
                        ]),
                        settings: defaultSettings,
                        settingsUpdatedAt: now(),
                    })),
            };
        },
        {
            name: "jot-app-storage",
            version: 2,
            migrate: (persisted) => normalizeState(persisted as Partial<AppState>),
        },
    ),
);
