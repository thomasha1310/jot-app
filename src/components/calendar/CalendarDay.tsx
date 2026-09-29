import { useDroppable } from "@dnd-kit/react";
import type { CourseItem, Course } from "../../types";
import { TaskCard } from "../TaskCard";

interface CalendarDayProps {
    dateStr: string;
    dayNum: number;
    tasks: CourseItem[];
    courses: Course[];
    onEditTask: (task: CourseItem) => void;
}

export function CalendarDay({
    dateStr,
    dayNum,
    tasks,
    courses,
    onEditTask,
}: CalendarDayProps) {
    const { ref, isDropTarget } = useDroppable({
        id: dateStr,
    });

    return (
        <div
            ref={ref}
            className={`min-h-40 p-2 border-r border-b border-neutral-200 dark:border-neutral-700 transition-colors ${
                isDropTarget
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "bg-transparent"
            }`}
        >
            <div className="text-right text-sm text-neutral-400 mb-2 font-medium">
                {dayNum}
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
