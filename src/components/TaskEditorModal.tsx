import { useState } from "react";
import { useAppStore } from "../store";
import type { CourseItem } from "../types";
import { X, Trash2 } from "lucide-react";

interface TaskEditorModalProps {
    task: CourseItem;
    onClose: () => void;
}

export function TaskEditorModal({ task, onClose }: TaskEditorModalProps) {
    const { courses, updateTask, deleteTask } = useAppStore();

    // Local state for the form so we don't spam Zustand on every keystroke
    const [formData, setFormData] = useState<CourseItem>(task);

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        updateTask(task.id, formData);
        onClose();
    };

    const handleDelete = () => {
        deleteTask(task.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-xl font-bold">
                        Edit {task.type === "exam" ? "Exam" : "Assignment"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Course
                        </label>
                        <select
                            value={formData.courseId}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    courseId: e.target.value,
                                })
                            }
                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2"
                        >
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.icon} {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        date: e.target.value,
                                    })
                                }
                                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    status: e.target.value as any,
                                })
                            }
                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2"
                        >
                            {formData.type === "assignment" ? (
                                <>
                                    <option value="not_started">
                                        Not Started
                                    </option>
                                    <option value="in_progress">
                                        In Progress
                                    </option>
                                    <option value="complete">Complete</option>
                                </>
                            ) : (
                                <>
                                    <option value="incomplete">
                                        Incomplete
                                    </option>
                                    <option value="complete">Complete</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium rounded-lg hover:opacity-90 transition-opacity"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
