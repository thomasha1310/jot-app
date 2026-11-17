import { useState } from "react";
import { COURSE_COLORS, inkColor } from "../../lib/ink";
import { useAppStore } from "../../store";
import type { Course } from "../../types";
import {
    Dialog,
    DialogActions,
    fieldClass,
    labelClass,
    primaryButton,
    quietButton,
} from "../ui/Dialog";

interface CourseEditorProps {
    course?: Course;
    onClose: () => void;
}

export function CourseEditor({ course, onClose }: CourseEditorProps) {
    const { addCourse, updateCourse, archiveCourse } = useAppStore();
    const usedColors = useAppStore((s) => s.courses.map((c) => c.color).join());
    const isNew = !course;

    const [name, setName] = useState(course?.name ?? "");
    const [color, setColor] = useState(
        course?.color ??
            COURSE_COLORS.find((c) => !usedColors.includes(c.value))?.value ??
            COURSE_COLORS[0].value,
    );

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (isNew) {
            addCourse({ id: crypto.randomUUID(), name: name.trim(), color, icon: "" });
        } else {
            updateCourse(course.id, { name: name.trim(), color });
        }
        onClose();
    };

    return (
        <Dialog title={isNew ? "New course" : "Edit course"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="course-name" className={labelClass}>
                        Name
                    </label>
                    <input
                        id="course-name"
                        autoFocus
                        required
                        placeholder="MATH 0350"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`${fieldClass} text-xl font-semibold`}
                    />
                </div>

                <fieldset>
                    <legend className={labelClass}>Highlighter</legend>
                    <div className="mt-1 flex gap-2.5">
                        {COURSE_COLORS.map((c) => (
                            <label key={c.value} title={c.name}>
                                <input
                                    type="radio"
                                    name="color"
                                    value={c.value}
                                    checked={color === c.value}
                                    onChange={() => setColor(c.value)}
                                    className="peer sr-only"
                                />
                                <span
                                    className="block size-7 rounded-full ring-offset-2 ring-offset-blotter transition-transform hover:scale-110 peer-checked:ring-2 peer-checked:ring-paper peer-focus-visible:ring-2 peer-focus-visible:ring-lamp"
                                    style={{ background: c.value }}
                                />
                                <span className="sr-only">{c.name}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div aria-hidden className="rounded-md bg-desk px-4 py-3">
                    <p className="mb-2 text-sm text-pencil">preview</p>
                    <p className="flex flex-wrap gap-x-5 gap-y-1 whitespace-nowrap">
                        <span className="font-semibold">
                            <span className="ink" style={inkColor(color)}>HW 1</span>
                        </span>
                        <span className="font-semibold">
                            <span className="ink ink-doing" style={inkColor(color)}>HW 2</span>
                        </span>
                        <span className="font-semibold">
                            <span className="ink ink-done" style={inkColor(color)}>HW 3</span>
                        </span>
                    </p>
                </div>

                <DialogActions>
                    {!isNew && (
                        <button
                            type="button"
                            onClick={() => {
                                archiveCourse(course.id);
                                onClose();
                            }}
                            className={quietButton}
                        >
                            {course.isArchived ? "Unarchive" : "Archive"}
                        </button>
                    )}
                    <button type="button" onClick={onClose} className={`ml-auto ${quietButton}`}>
                        Cancel
                    </button>
                    <button type="submit" className={primaryButton}>
                        {isNew ? "Add course" : "Save changes"}
                    </button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
