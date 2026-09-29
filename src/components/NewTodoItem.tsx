import { useState } from "react";
import { useAppStore } from "../store";
import { Plus } from "lucide-react";

export function NewTodoItem() {
    const addTodo = useAppStore((state) => state.addTodo);
    const [newTask, setNewTask] = useState("");

    const handleAdd = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        addTodo({
            id: crypto.randomUUID(),
            name: newTask.trim(),
            isCompleted: false,
        });
        setNewTask("");
    };

    return (
        <form onSubmit={handleAdd} className="mb-4 flex gap-2">
            <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            <button
                type="submit"
                className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg p-2 hover:opacity-90 transition-opacity"
            >
                <Plus className="w-5 h-5" />
            </button>
        </form>
    );
}
