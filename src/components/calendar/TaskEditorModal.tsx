import { useState } from "react";
import { fromISODate, relativeDay } from "../../lib/dates";
import { inkClass, inkColor } from "../../lib/ink";
import { useAppStore } from "../../store";
import type { CourseItem } from "../../types";
import { Choices } from "../ui/Choices";
import {
    Dialog,
    DialogActions,
    fieldClass,
    labelClass,
    primaryButton,
    quietButton,
} from "../ui/Dialog";

interface TaskEditorModalProps {
    /** Editing an existing item… */
    task?: CourseItem;
    /** …or adding a new one on this day. */
    date?: string;
    onClose: () => void;
}

const STATUS_OPTIONS = {
    assignment: [
        ["not_started", "not started"],
        ["in_progress", "in progress"],
        ["complete", "done"],
    ],
    exam: [
        ["not_started", "not started"],
        ["complete", "done"],
    ],
} as const;

const longDate = (iso: string) =>
    fromISODate(iso)
        .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
        .toLowerCase();

export function TaskEditorModal({ task, date, onClose }: TaskEditorModalProps) {
    const allCourses = useAppStore((s) => s.courses);
    const courses = allCourses.filter((c) => !c.isArchived || c.id === task?.courseId);
    const { addTask, updateTask, deleteTask } = useAppStore();
    const isNew = !task;
    const [confirmDelete, setConfirmDelete] = useState(false);

    const [form, setForm] = useState<CourseItem>(
        task ?? {
            id: crypto.randomUUID(),
            type: "assignment",
            name: "",
            courseId: courses[0]?.id ?? "",
            date: date ?? "",
            status: "not_started",
        },
    );
    const color = courses.find((c) => c.id === form.courseId)?.color;

    const setType = (type: CourseItem["type"]) =>
        setForm((f) =>
            ({
                ...f,
                type,
                // Exams have no "in progress".
                status: type === "exam" && f.status === "in_progress" ? "not_started" : f.status,
            }) as CourseItem,
        );

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const item = { ...form, name: form.name.trim() } as CourseItem;
        if (isNew) addTask(item);
        else updateTask(item.id, item);
        onClose();
    };

    const noun = form.type === "exam" ? "exam" : "assignment";

    if (courses.length === 0) {
        return (
            <Dialog title="Add a course first" onClose={onClose}>
                <p className="text-pencil">
                    Assignments and exams belong to a course. Add one with “add course” above the
                    calendar, then click a day again.
                </p>
                <DialogActions>
                    <button type="button" onClick={onClose} className={`ml-auto ${primaryButton}`}>
                        OK
                    </button>
                </DialogActions>
            </Dialog>
        );
    }

    return (
        <Dialog
            title={isNew ? `New ${noun}` : `Edit ${noun}`}
            subtitle={form.date ? `due ${isNew ? longDate(form.date) : relativeDay(form.date)}` : undefined}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="task-name" className={labelClass}>
                        Name
                    </label>
                    <input
                        id="task-name"
                        type="text"
                        autoFocus
                        required
                        placeholder={form.type === "exam" ? "Midterm 2" : "HW 9"}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={`${fieldClass} text-xl font-semibold`}
                    />
                </div>

                <Choices
                    legend="Type"
                    name="type"
                    value={form.type}
                    onChange={setType}
                    options={[
                        { value: "assignment", label: "assignment" },
                        { value: "exam", label: <span className="italic">exam</span> },
                    ]}
                />

                <Choices
                    legend="Course"
                    name="course"
                    value={form.courseId}
                    onChange={(courseId) => setForm({ ...form, courseId })}
                    options={courses.map((c) => ({
                        value: c.id,
                        label: (
                            <span className="ink ink-doing" style={inkColor(c.color)}>
                                {c.name}
                            </span>
                        ),
                    }))}
                />

                <Choices
                    legend="Status"
                    name="status"
                    value={form.status}
                    onChange={(status) => setForm({ ...form, status } as CourseItem)}
                    options={STATUS_OPTIONS[form.type].map(([value, label]) => ({
                        value,
                        label: (
                            <span className={inkClass(value)} style={inkColor(color)}>
                                {label}
                            </span>
                        ),
                    }))}
                />

                <div className="w-44">
                    <label htmlFor="task-date" className={labelClass}>
                        Due
                    </label>
                    <input
                        id="task-date"
                        type="date"
                        required
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className={fieldClass}
                    />
                </div>

                <DialogActions>
                    {!isNew && (
                        <button
                            type="button"
                            onClick={() => {
                                if (!confirmDelete) return setConfirmDelete(true);
                                deleteTask(form.id);
                                onClose();
                            }}
                            onBlur={() => setConfirmDelete(false)}
                            className={`rounded-md px-3 py-2 transition-colors ${
                                confirmDelete
                                    ? "bg-red-500/15 text-red-500"
                                    : "text-pencil hover:text-red-500"
                            }`}
                        >
                            {confirmDelete ? "Click again to delete" : "Delete"}
                        </button>
                    )}
                    <button type="button" onClick={onClose} className={`ml-auto ${quietButton}`}>
                        Cancel
                    </button>
                    <button type="submit" className={primaryButton}>
                        {isNew ? `Add ${noun}` : "Save changes"}
                    </button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
