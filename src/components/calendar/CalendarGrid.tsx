import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "../../store";
import {
    addDays,
    toISODate,
    todayISO,
    visibleDays,
    type CalendarView,
} from "../../lib/dates";
import type { CourseItem } from "../../types";
import { CalendarDay } from "./CalendarDay";
import { TaskEditorModal } from "./TaskEditorModal";

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

type Editing = { mode: "edit"; task: CourseItem } | { mode: "new"; date: string } | null;

export function CalendarGrid() {
    const courseItems = useAppStore((s) => s.courseItems);
    const courses = useAppStore((s) => s.courses);
    const [view, setView] = useState<CalendarView>("week");
    const [anchor, setAnchor] = useState(() => new Date());
    const [editing, setEditing] = useState<Editing>(null);

    const days = useMemo(() => visibleDays(view, anchor), [view, anchor]);
    const today = todayISO();

    const itemsByDay = useMemo(() => {
        const map = new Map<string, CourseItem[]>();
        for (const item of courseItems) {
            const list = map.get(item.date) ?? [];
            list.push(item);
            map.set(item.date, list);
        }
        return map;
    }, [courseItems]);

    const step = (dir: 1 | -1) =>
        setAnchor((a) =>
            view === "week"
                ? addDays(a, 7 * dir)
                : new Date(a.getFullYear(), a.getMonth() + dir, 1),
        );

    const title = anchor
        .toLocaleDateString("en-GB", { month: "long", year: "numeric" })
        .toLowerCase();

    return (
        <section aria-label="Calendar" className="flex min-h-0 flex-1 flex-col">
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <h2 className="text-lg font-semibold">{title}</h2>
                <div className="flex items-center text-pencil">
                    <button type="button" onClick={() => step(-1)} aria-label={`Previous ${view}`} className="rounded p-1 hover:text-paper">
                        <ChevronLeft className="size-4" />
                    </button>
                    <button type="button" onClick={() => setAnchor(new Date())} className="rounded px-1.5 text-sm hover:text-paper">
                        today
                    </button>
                    <button type="button" onClick={() => step(1)} aria-label={`Next ${view}`} className="rounded p-1 hover:text-paper">
                        <ChevronRight className="size-4" />
                    </button>
                </div>
                <div role="radiogroup" aria-label="Calendar view" className="ml-auto flex gap-3 text-sm">
                    {(["week", "month"] as const).map((v) => (
                        <button
                            key={v}
                            type="button"
                            role="radio"
                            aria-checked={view === v}
                            onClick={() => setView(v)}
                            className={view === v ? "text-paper underline decoration-lamp decoration-2 underline-offset-4" : "text-pencil hover:text-paper"}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
                <div
                    className={`grid min-w-[44rem] grid-cols-7 gap-x-1.5 gap-y-3 ${
                        view === "week" ? "h-full grid-rows-[auto_1fr]" : ""
                    }`}
                >
                    {WEEKDAYS.map((d) => (
                        <div key={d} className="px-2.5 text-sm text-pencil">
                            {d}
                        </div>
                    ))}
                    {days.map((date) => {
                        const iso = toISODate(date);
                        return (
                            <CalendarDay
                                key={iso}
                                date={date}
                                iso={iso}
                                isToday={iso === today}
                                isOutsideMonth={view === "month" && date.getMonth() !== anchor.getMonth()}
                                tall={view === "week"}
                                tasks={itemsByDay.get(iso) ?? []}
                                courses={courses}
                                onEditTask={(task) => setEditing({ mode: "edit", task })}
                                onAddTask={(d) => setEditing({ mode: "new", date: d })}
                            />
                        );
                    })}
                </div>
            </div>

            {editing && (
                <TaskEditorModal
                    key={editing.mode === "edit" ? editing.task.id : editing.date}
                    task={editing.mode === "edit" ? editing.task : undefined}
                    date={editing.mode === "new" ? editing.date : undefined}
                    onClose={() => setEditing(null)}
                />
            )}
        </section>
    );
}
