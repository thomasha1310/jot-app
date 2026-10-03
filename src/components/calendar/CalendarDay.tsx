import { useDroppable } from "@dnd-kit/react";
import type { CourseItem, Course } from "../../types";
import { TaskCard } from "../TaskCard";

interface CalendarDayProps {
    dateStr: string;
    dayLabel: string;
    tasks: CourseItem[];
    courses: Course[];
    onEditTask: (task: CourseItem) => void;
}

export function CalendarDay({
    dateStr,
    dayLabel,
    tasks,
    courses,
    onEditTask,
}: CalendarDayProps) {
    const { ref, isDropTarget } = useDroppable({
        id: dateStr,
    });

    // 

    return (
        <div
            ref={ref}
            className={`min-h-36 p-1 border ${new Date().toDateString() == dateStr ? `border-blue-500` : `border-neutral-300`} transition-colors ${
                isDropTarget
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "bg-white dark:bg-neutral-900"
            }`}
        >
            <div className={`text-right text-sm text-neutral-500 pt-0.5 pr-2`}>
                {dayLabel}
            </div>

            <div className="flex flex-col gap-2">
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        course={courses.find((c) => c.id === task.courseId)}
                        onDoubleClick={onEditTask}
                    />
                ))}
            </div>
        </div>
    );
}
