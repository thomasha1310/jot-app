import { useDraggable } from "@dnd-kit/react";
import type { CourseItem, Course } from "../types";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface TaskCardProps {
    task: CourseItem;
    course?: Course;
    onDoubleClick: (task: CourseItem) => void;
}

export function TaskCard({ task, course, onDoubleClick }: TaskCardProps) {
    const { ref, draggable } = useDraggable({
        id: task.id,
        data: task,
    });

    const renderStatus = () => {
        if (task.status === "complete")
            return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
        if (task.status === "in_progress" && task.type === "assignment")
            return <Clock className="w-4 h-4 text-amber-500" />;
        return <Circle className="w-4 h-4 text-neutral-400" />;
    };

    return (
        <div
            ref={ref}
            onDoubleClick={() => onDoubleClick(task)}
            className={`bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing mb-2 hover:shadow-md transition-shadow ${
                draggable.isDragging ? "opacity-50" : "opacity-100"
            }`}
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-lg">{task.name}</h4>
                {renderStatus()}
            </div>

            {course && (
                <div
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-sm mb-2"
                    style={{
                        backgroundColor: `${course.color}20`,
                        color: course.color,
                    }}
                >
                    <span>{course.icon}</span>
                    <span className="font-medium">{course.name}</span>
                </div>
            )}

            <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-neutral-500 dark:text-neutral-400">
                    All Day
                </span>
                <span className="bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded text-xs uppercase tracking-wider">
                    {task.type}
                </span>
            </div>
        </div>
    );
}
