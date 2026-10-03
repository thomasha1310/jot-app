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

    const generateDays = (targetMonthDelta: number) => {
        const days = [];
        const now = new Date();
        const targetYear =
            now.getFullYear() + Math.floor(targetMonthDelta / 12);
        const targetMonth = now.getMonth() + (targetMonthDelta % 12);
        const firstOfMonth = new Date(targetYear, targetMonth, 1);
        const firstDay = new Date(
            targetYear,
            targetMonth,
            firstOfMonth.getDate() - firstOfMonth.getDay(),
        );

        const lastOfMonth = new Date(targetYear, targetMonth + 1, 0);
        const lastDay = new Date(
            targetYear,
            targetMonth,
            lastOfMonth.getDate() + (6 - lastOfMonth.getDay()),
        );

        for (
            let day = new Date(firstDay);
            day <= lastDay;
            day.setDate(day.getDate() + 1)
        ) {
            const num = day.getDate();
            const monthLabel = day.toLocaleString(undefined, {
                month: "short",
            });
            days.push({
                num,
                label: num === 1 ? `${monthLabel} ${num}` : String(num),
                dateStr: day.toDateString(),
            });
        }
        return days;
    };

    const handleEditTask = (task: CourseItem) => {
        setEditingTask(task);
    };

    return (
        <div className="flex-1 overflow-auto">
            <DragDropProvider onDragEnd={handleDragEnd}>
                <div className="min-w-238">
                    <div className="grid grid-cols-7">
                        <div className="text-center">SUN</div>
                        <div className="text-center">MON</div>
                        <div className="text-center">TUE</div>
                        <div className="text-center">WED</div>
                        <div className="text-center">THU</div>
                        <div className="text-center">FRI</div>
                        <div className="text-center">SAT</div>
                    </div>
                    <div className="grid grid-cols-7 border border-neutral-300 dark:border-neutral-700">
                        {generateDays(0).map((day) => (
                            <CalendarDay
                                key={day.dateStr}
                                dateStr={day.dateStr}
                                dayLabel={day.label}
                                courses={courses}
                                onEditTask={handleEditTask}
                                tasks={courseItems.filter(
                                    (t) => t.date === day.dateStr,
                                )}
                            />
                        ))}
                    </div>
                </div>
            </DragDropProvider>
        </div>
    );
}
