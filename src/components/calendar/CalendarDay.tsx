import { useDroppable } from "@dnd-kit/react";
import { Plus } from "lucide-react";
import type { Course, CourseItem } from "../../types";
import { TaskCard } from "./TaskCard";

interface CalendarDayProps {
    date: Date;
    iso: string;
    isToday: boolean;
    isOutsideMonth: boolean;
    tall: boolean;
    tasks: CourseItem[];
    courses: Course[];
    onEditTask: (task: CourseItem) => void;
    onAddTask: (iso: string) => void;
}

export function CalendarDay({
    date,
    iso,
    isToday,
    isOutsideMonth,
    tall,
    tasks,
    courses,
    onEditTask,
    onAddTask,
}: CalendarDayProps) {
    const { ref, isDropTarget } = useDroppable({ id: iso });
    const label = date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

    return (
        <div
            ref={ref}
            onClick={() => onAddTask(iso)}
            className={`group relative flex flex-col gap-1.5 border-t-2 p-1.5 transition-colors ${
                tall ? "min-h-64" : "min-h-28"
            } ${isToday ? "border-lamp" : "border-line"} ${
                isDropTarget ? "bg-blotter/60" : ""
            }`}
        >
            <div className="flex items-center justify-between px-1">
                <span
                    className={`text-sm tabular-nums ${
                        isToday
                            ? "font-semibold text-lamp"
                            : isOutsideMonth
                              ? "text-pencil/60"
                              : "text-pencil"
                    }`}
                >
                    {date.getDate() === 1 && !tall
                        ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toLowerCase()
                        : date.getDate()}
                    {isToday && <span className="sr-only"> (today)</span>}
                </span>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddTask(iso);
                    }}
                    aria-label={`Add to ${label}`}
                    className="rounded p-0.5 text-pencil opacity-0 hover:text-paper focus-visible:opacity-100 group-hover:opacity-100"
                >
                    <Plus className="size-3.5" />
                </button>
            </div>

            {tasks.map((task) => (
                <TaskCard
                    key={task.id}
                    task={task}
                    course={courses.find((c) => c.id === task.courseId)}
                    onEdit={onEditTask}
                />
            ))}
        </div>
    );
}
