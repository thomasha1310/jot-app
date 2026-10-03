import { useAppStore } from "../store";
import type { Todo } from "../types";
import { SquareCheck, Square, Trash } from "lucide-react";

interface TodoItemProps {
    todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
    const { toggleTodo, deleteTodo } = useAppStore();

    return (
        <li className="group flex items-start justify-between gap-2">
            <button
                className={`flex min-w-0 flex-1 cursor-pointer ${todo.isCompleted ? "text-neutral-400 dark:text-neutral-500" : "text-neutral-800 dark:text-neutral-200"} transition-colors`}
                onClick={() => toggleTodo(todo.id)}
            >
                <span className="mr-3 mt-1 shrink-0">
                    {todo.isCompleted ? (
                        <SquareCheck className="w-5 h-5" />
                    ) : (
                        <Square className="w-5 h-5" />
                    )}
                </span>
                <span className="gaegu-regular min-w-0 text-lg text-left break-normal">
                    {todo.name}
                </span>
            </button>
            <button
                onClick={() => deleteTodo(todo.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all focus:outline-none"
            >
                <Trash className="w-4 h-4" />
            </button>
        </li>
    );
}
