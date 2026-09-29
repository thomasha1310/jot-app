import { useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { useAppStore } from "../../store";
import { CalendarDay } from "./CalendarDay";
import type { CourseItem } from "../../types";

export function CalendarGrid() {
    const { courseItems, courses, updateTask } = useAppStore();
    const [editingTask, setEditingTask] = useState<CourseItem | null>(null);

    const handleDragEnd = (event: any) => {
        const sourceId = event.operation?.source?.id;
        const targetId = event.operation?.target?.id;

        if (targetId && sourceId !== targetId) {
            updateTask(sourceId as string, { date: targetId as string });
        }
    };

    const generateDays = () => {
        const days = [];
        for (let i = 27; i <= 30; i++) {
            days.push({ num: i, dateStr: `2026-09-${i}` });
        }
        for (let i = 1; i <= 17; i++) {
            const dayStr = i < 10 ? `0${i}` : `${i}`;
            days.push({ num: i, dateStr: `2026-10-${dayStr}` });
        }
        return days;
    };

    const handleEditTask = (task: CourseItem) => {
        setEditingTask(task);
    };

    return (
        <div className="flex-1 overflow-auto p-6">
            <DragDropProvider onDragEnd={handleDragEnd}>
                {/* min-w-[800px] ensures the calendar grid doesn't squash too much on small screens */}
                <div className="grid grid-cols-7 border-t border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-sm min-w-[800px]">
                    {generateDays().map((day) => (
                        <CalendarDay
                            key={day.dateStr}
                            dateStr={day.dateStr}
                            dayNum={day.num}
                            courses={courses}
                            onEditTask={handleEditTask}
                            tasks={courseItems.filter(
                                (t) => t.date === day.dateStr,
                            )}
                        />
                    ))}
                </div>
            </DragDropProvider>
        </div>
    );
}
