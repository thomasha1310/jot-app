import { X } from "lucide-react";
import { inkClass, inkColor } from "../../lib/ink";
import { relativeDay } from "../../lib/dates";
import { useAppStore } from "../../store";
import type { Todo } from "../../types";
import { Checkbox } from "../ui/Checkbox";

interface TodoItemProps {
    todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
    const toggleTodo = useAppStore((s) => s.toggleTodo);
    const deleteTodo = useAppStore((s) => s.deleteTodo);
    const item = useAppStore((s) =>
        todo.linkedItemId
            ? s.courseItems.find((i) => i.id === todo.linkedItemId)
            : undefined,
    );
    const course = useAppStore((s) =>
        item ? s.courses.find((c) => c.id === item.courseId) : undefined,
    );

    // Linked todos wear their item's ink (course colour, status) until they're done.
    const ink = todo.isCompleted ? "ink ink-done" : item ? inkClass(item.status) : "ink ink-plain";

    return (
        <li className="group flex items-start gap-2.5">
            <Checkbox
                checked={todo.isCompleted}
                onChange={() => toggleTodo(todo.id)}
                label={todo.name}
            />
            <div className="min-w-0 flex-1">
                <span className={ink} style={inkColor(course?.color)}>
                    {todo.name}
                </span>
                {item && (
                    <span className="block font-serif text-xs text-pencil">
                        {course?.name ?? "no course"}, due {relativeDay(item.date)}
                    </span>
                )}
            </div>
            <button
                type="button"
                onClick={() => deleteTodo(todo.id)}
                aria-label={`Remove “${todo.name}”`}
                className="mt-1 shrink-0 rounded p-0.5 text-pencil opacity-0 hover:text-paper focus-visible:opacity-100 group-hover:opacity-100"
            >
                <X className="size-4" />
            </button>
        </li>
    );
}
