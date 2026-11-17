import { useDragOperation, useDroppable } from "@dnd-kit/react";
import { useAppStore } from "../../store";
import { TodoItem } from "./TodoItem";
import { TodoItemNew } from "./TodoItemNew";

export const TODO_DROP_ID = "todo-list";

export function TodoList() {
    const todos = useAppStore((s) => s.todos);
    const clearCompletedTodos = useAppStore((s) => s.clearCompletedTodos);
    const { ref, isDropTarget } = useDroppable({ id: TODO_DROP_ID });
    const { source } = useDragOperation();
    const isDragging = Boolean(source);
    const doneCount = todos.filter((t) => t.isCompleted).length;

    return (
        <section
            ref={ref}
            aria-labelledby="todo-heading"
            className={`relative flex min-h-0 flex-1 flex-col rounded-lg px-1 transition-colors ${
                isDropTarget ? "bg-blotter" : ""
            }`}
        >
            <h2 id="todo-heading" className="mb-2 text-lg font-semibold">
                to-do
            </h2>

            {/* Padding gives the checkbox flicks room: a scroll container clips both axes. */}
            <ul className="-mx-6 -mt-4 min-h-0 space-y-3 overflow-y-auto px-6 pt-4 pb-2 font-hand text-xl leading-snug">
                {todos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} />
                ))}
                <TodoItemNew />
            </ul>

            {isDragging && (
                <p
                    className={`pointer-events-none mt-3 rounded-md border border-dashed px-3 py-3 text-center text-sm transition-colors ${
                        isDropTarget
                            ? "border-lamp text-paper"
                            : "border-line text-pencil"
                    }`}
                >
                    drop here to add it to your list
                </p>
            )}

            {doneCount > 0 && !isDragging && (
                <button
                    type="button"
                    onClick={clearCompletedTodos}
                    className="mt-3 self-start text-sm text-pencil hover:text-paper"
                >
                    clear {doneCount} done
                </button>
            )}
        </section>
    );
}
