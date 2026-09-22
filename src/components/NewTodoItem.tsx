import { useState } from "react";
import { Square } from "lucide-react";
import type { Task } from "../types";

export default function NewTodoItem(props: {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) {
    const [newTaskText, setNewTaskText] = useState<string>("");

    return (
        <li>
            <div
                className={`flex m-5 px-2 ${newTaskText ? "text-gray-800 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"} transition-colors`}
            >
                <span className="mr-4 mt-1">
                    <Square />
                </span>
                <input
                    type="text"
                    placeholder="Add a new task..."
                    className="gaegu-regular text-2xl text-left focus:outline-none field-sizing-fixed"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => {
                        const trimmed = newTaskText.trim();
                        if (e.key === "Enter" && trimmed !== "") {
                            const newTask: Task = {
                                id: crypto.randomUUID(),
                                text: trimmed,
                                completed: false,
                            };
                            props.setTasks([...props.tasks, newTask]);
                            setNewTaskText("");
                        }
                    }}
                ></input>
            </div>
        </li>
    );
}
