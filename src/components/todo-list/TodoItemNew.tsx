import { useState } from "react";
import { useAppStore } from "../../store";
import { Square } from "lucide-react";

export function TodoItemNew() {
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
        <li>
            <form
                onSubmit={handleAdd}
                className={`flex ${newTask ? "text-neutral-800 dark:text-neutral-200" : "text-neutral-400 dark:text-neutral-500"} transition-colors`}
            >
                <span className="mr-3 mt-1 shrink-0">
                    <Square className="w-5 h-5" />
                </span>
                <input
                    type="text"
                    placeholder="Add a new task..."
                    className="gaegu-regular min-w-0 flex-1 text-lg text-left focus:outline-none field-sizing-fixed placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                />
            </form>
        </li>
    );
}
