import { useDraggable } from "@dnd-kit/react";
import { ListChecks } from "lucide-react";
import { inkClass, inkColor, STATUS_LABEL } from "../../lib/ink";
import { useAppStore } from "../../store";
import type { Course, CourseItem } from "../../types";

interface TaskCardProps {
    task: CourseItem;
    course?: Course;
    onEdit: (task: CourseItem) => void;
}

export function TaskCard({ task, course, onEdit }: TaskCardProps) {
    const { ref, isDragging } = useDraggable({ id: task.id, data: task });
    const onList = useAppStore((s) => s.todos.some((t) => t.linkedItemId === task.id));
    const isExam = task.type === "exam";

    return (
        <div
            ref={ref}
            role="button"
            tabIndex={0}
            onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") onEdit(task);
            }}
            aria-label={`${task.name}, ${course?.name ?? "no course"}, ${isExam ? "exam" : "assignment"}, ${STATUS_LABEL[task.status]}. Drag to move or to your to-do list.`}
            className={`cursor-grab rounded-md bg-blotter px-2.5 py-2 text-left active:cursor-grabbing ${
                isDragging ? "opacity-40" : ""
            }`}
        >
            <p className={`leading-snug ${isExam ? "italic" : "font-semibold"}`}>
                <span className={inkClass(task.status)} style={inkColor(course?.color)}>
                    {task.name}
                </span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-pencil">
                <span className="truncate">
                    {course?.name ?? "no course"}
                    {isExam && " exam"}
                </span>
                {onList && (
                    <span title="on your to-do list" className="ml-auto shrink-0">
                        <ListChecks className="size-3.5" aria-hidden />
                    </span>
                )}
            </p>
        </div>
    );
}
