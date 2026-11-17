import { useState } from "react";
import { Plus } from "lucide-react";
import { inkColor } from "../../lib/ink";
import { useAppStore } from "../../store";
import type { Course } from "../../types";
import { CourseEditor } from "./CourseEditor";

export function CourseStrip() {
    const courses = useAppStore((s) => s.courses);
    const courseItems = useAppStore((s) => s.courseItems);
    const [editing, setEditing] = useState<Course | "new" | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    const archivedCount = courses.filter((c) => c.isArchived).length;
    const visible = courses.filter((c) => showArchived || !c.isArchived);
    // With no courses yet, "add course" is the only thing here, so keep it visible.
    const revealOnHover = visible.length > 0;

    const progress = (courseId: string) => {
        const items = courseItems.filter((i) => i.courseId === courseId);
        if (items.length === 0) return null;
        const done = items.filter((i) => i.status === "complete").length;
        return Math.round((done / items.length) * 100);
    };

    return (
        <section aria-label="Courses" className="group/courses">
            {visible.length > 0 && (
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-x-10 gap-y-4">
                    {visible.map((course) => {
                        const pct = progress(course.id);
                        return (
                            <li key={course.id} className={course.isArchived ? "opacity-50" : ""}>
                                <button
                                    type="button"
                                    onClick={() => setEditing(course)}
                                    className="w-full rounded text-left"
                                    aria-label={`${course.name}, ${pct === null ? "nothing added yet" : `${pct}% done`}. Edit course.`}
                                >
                                    <span className="flex items-baseline justify-between gap-3">
                                        <span className="font-semibold whitespace-nowrap">
                                            <span className="ink ink-doing" style={inkColor(course.color)}>
                                                {course.name}
                                            </span>
                                        </span>
                                        {pct !== null && (
                                            <span className="text-sm tabular-nums text-pencil">{pct}%</span>
                                        )}
                                    </span>
                                    {pct === null ? (
                                        <span className="mt-1 block text-sm text-pencil">nothing added yet</span>
                                    ) : (
                                        <span className="mt-2 block h-[3px] rounded-full bg-line">
                                            <span
                                                className="block h-full rounded-full transition-[width] duration-500"
                                                style={{ width: `${pct}%`, background: course.color }}
                                            />
                                        </span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <div
                className={`flex items-center gap-4 text-sm transition-opacity ${
                    revealOnHover
                        ? "mt-2 opacity-0 group-hover/courses:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100"
                        : ""
                }`}
            >
                <button
                    type="button"
                    onClick={() => setEditing("new")}
                    className="flex items-center gap-1.5 text-pencil hover:text-paper"
                >
                    <Plus className="size-3.5" aria-hidden /> add course
                </button>
                {archivedCount > 0 && (
                    <button
                        type="button"
                        onClick={() => setShowArchived((v) => !v)}
                        className="text-pencil hover:text-paper"
                    >
                        {showArchived ? "hide archived" : `show ${archivedCount} archived`}
                    </button>
                )}
            </div>

            {editing && (
                <CourseEditor
                    course={editing === "new" ? undefined : editing}
                    onClose={() => setEditing(null)}
                />
            )}
        </section>
    );
}
