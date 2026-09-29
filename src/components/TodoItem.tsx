import { useAppStore } from "../store";
import type { Todo } from "../types";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";

interface TodoItemProps {
    todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
    const { toggleTodo, deleteTodo } = useAppStore();

    return (
        <div className="flex items-start justify-between gap-2 p-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg group transition-colors">
            <div
                className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer"
                onClick={() => toggleTodo(todo.id)}
            >
                <button className="mt-0.5 shrink-0 focus:outline-none">
                    {todo.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                        <Circle className="w-5 h-5 text-neutral-400 group-hover:text-neutral-500 transition-colors" />
                    )}
                </button>
                <span
                    className={`text-base font-medium truncate ${todo.isCompleted ? "line-through text-neutral-400" : ""}`}
                >
                    {todo.name}
                </span>
            </div>
            <button
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all focus:outline-none"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}
