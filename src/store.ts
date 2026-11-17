import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeDate } from "./lib/dates";
import type { AppState, Course, CourseItem, Todo } from "./types";

interface AppStore extends AppState {
    addCourse: (course: Course) => void;
    updateCourse: (id: string, updates: Partial<Course>) => void;
    archiveCourse: (id: string) => void;
    addTask: (task: CourseItem) => void;
    updateTask: (id: string, updates: Partial<CourseItem>) => void;
    deleteTask: (id: string) => void;
    addTodo: (todo: Todo) => void;
    /** Adds a todo linked to an assignment/exam. Returns false if one already exists. */
    addTodoFromItem: (itemId: string) => boolean;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    clearCompletedTodos: () => void;
    updateSettings: (settings: Partial<AppState["settings"]>) => void;
    importData: (data: AppState) => void;
}

const defaultSettings: AppState["settings"] = {
    autoCompleteExams: false,
    showGreeting: true,
    quoteSource: "local",
    customQuotes: [],
};

/** Brings data from older versions (or an imported file) up to the current shape. */
export function normalizeState(data: AppState): AppState {
    return {
        ...data,
        version: "0.1.0",
        courseItems: data.courseItems.map((item) => ({
            ...item,
            date: normalizeDate(item.date),
        })),
        settings: { ...defaultSettings, ...data.settings },
    };
}

const reopenedStatus = (item: CourseItem): CourseItem["status"] =>
    item.type === "assignment" ? "in_progress" : "not_started";

export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            version: "0.1.0",
            courses: [],
            courseItems: [],
            todos: [],
            settings: defaultSettings,

            addCourse: (course) =>
                set((state) => ({ courses: [...state.courses, course] })),
            updateCourse: (id, updates) =>
                set((state) => ({
                    courses: state.courses.map((c) =>
                        c.id === id ? { ...c, ...updates } : c,
                    ),
                })),
            archiveCourse: (id) =>
                set((state) => ({
                    courses: state.courses.map((c) =>
                        c.id === id ? { ...c, isArchived: !c.isArchived } : c,
                    ),
                })),

            addTask: (task) =>
                set((state) => ({ courseItems: [...state.courseItems, task] })),
            updateTask: (id, updates) =>
                set((state) => {
                    const before = state.courseItems.find((t) => t.id === id);
                    const courseItems = state.courseItems.map((t) =>
                        t.id === id ? { ...t, ...updates } : t,
                    ) as CourseItem[];

                    // Keep linked todos in step with the item's completion.
                    let todos = state.todos;
                    if (before && updates.status && updates.status !== before.status) {
                        const done = updates.status === "complete";
                        todos = todos.map((todo) =>
                            todo.linkedItemId === id
                                ? { ...todo, isCompleted: done, name: updates.name ?? todo.name }
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
                            ? { ...todo, linkedItemId: undefined }
                            : todo,
                    ),
                })),

            addTodo: (todo) =>
                set((state) => ({ todos: [...state.todos, todo] })),
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
                            t.id === id ? { ...t, isCompleted: done } : t,
                        ),
                        courseItems: todo.linkedItemId
                            ? (state.courseItems.map((item) =>
                                  item.id === todo.linkedItemId
                                      ? { ...item, status: done ? "complete" : reopenedStatus(item) }
                                      : item,
                              ) as CourseItem[])
                            : state.courseItems,
                    };
                }),
            deleteTodo: (id) =>
                set((state) => ({
                    todos: state.todos.filter((t) => t.id !== id),
                })),
            clearCompletedTodos: () =>
                set((state) => ({
                    todos: state.todos.filter((t) => !t.isCompleted),
                })),

            updateSettings: (updates) =>
                set((state) => ({
                    settings: { ...state.settings, ...updates },
                })),
            importData: (data) => set(() => normalizeState(data)),
        }),
        {
            name: "jot-app-storage",
            version: 1,
            migrate: (persisted) => normalizeState(persisted as AppState),
        },
    ),
);
