import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppState, Course, CourseItem, Todo } from "./types";

interface AppStore extends AppState {
    addCourse: (course: Course) => void;
    updateCourse: (id: string, updates: Partial<Course>) => void;
    archiveCourse: (id: string) => void;
    addTask: (task: CourseItem) => void;
    updateTask: (id: string, updates: Partial<CourseItem>) => void;
    deleteTask: (id: string) => void;
    addTodo: (todo: Todo) => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    updateSettings: (settings: Partial<AppState["settings"]>) => void;
    importData: (data: AppState) => void;
}

export const useAppStore = create<AppStore>()(
    persist(
        (set) => ({
            version: "0.0.1",
            courses: [],
            courseItems: [],
            todos: [],
            settings: {
                autoCompleteExams: false,
                showGreeting: true,
            },
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
                set((state) => ({
                    courseItems: state.courseItems.map((t) =>
                        t.id === id ? { ...t, ...updates } : t,
                    ) as CourseItem[],
                })),
            deleteTask: (id) =>
                set((state) => ({
                    courseItems: state.courseItems.filter((t) => t.id !== id),
                })),
            addTodo: (todo) =>
                set((state) => ({ todos: [...state.todos, todo] })),
            toggleTodo: (id) =>
                set((state) => ({
                    todos: state.todos.map((t) =>
                        t.id === id ? { ...t, isCompleted: !t.isCompleted } : t,
                    ),
                })),
            deleteTodo: (id) =>
                set((state) => ({
                    todos: state.todos.filter((t) => t.id !== id),
                })),
            updateSettings: (updates) =>
                set((state) => ({
                    settings: { ...state.settings, ...updates },
                })),
            importData: (data) => set(() => ({ ...data })),
        }),
        {
            name: "jot-app-storage",
        },
    ),
);
