import { useState, useEffect } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import TodoItem from "./components/TodoItem";
import NewTodoItem from "./components/NewTodoItem";

import type { Task } from "./types";

import useDarkMode from "./hooks/useDarkMode";
import { Sun, Moon } from "lucide-react";

function App() {
    const [tasks, setTasks] = useState<Task[]>(() => {
        try {
            const savedTasks = localStorage.getItem("jot-tasks");
            return savedTasks ? JSON.parse(savedTasks) : [];
        } catch (error) {
            console.error("Error loading tasks from localStorage:", error);
            return [];
        }
    });
    const { isDarkMode, toggleDarkMode } = useDarkMode();

    const onToggleTask = (taskId: string) => {
        setTasks(
            tasks.map((t) =>
                t.id === taskId ? { ...t, completed: !t.completed } : t,
            ),
        );
    };

    useEffect(() => {
        localStorage.setItem("jot-tasks", JSON.stringify(tasks));
    }, [tasks]);

    return (
        <>
            <Sidebar />
            <section
                id="content"
                className="flex flex-col items-center min-h-screen bg-white dark:bg-gray-900 transition-colors"
            >
                <button
                    onClick={toggleDarkMode}
                    className="absolute top-4 right-4 p-2 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                    {isDarkMode ? (
                        <Sun className="text-yellow-500" />
                    ) : (
                        <Moon className="text-gray-800" />
                    )}
                </button>
                <ul className="w-full max-w-lg">
                    {tasks.map((task) => (
                        <TodoItem
                            key={task.id}
                            text={task.text}
                            completed={task.completed}
                            onToggle={() => onToggleTask(task.id)}
                        />
                    ))}
                    <NewTodoItem tasks={tasks} setTasks={setTasks} />
                </ul>
                <div className="w-full max-w-lg items-center px-8">
                    <button
                        onClick={() => {
                            setTasks(tasks.filter((task) => !task.completed));
                        }}
                        className="gaegu-regular text-left transition-colors mr-auto text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-400 dark:hover:text-gray-400"
                    >
                        clear completed tasks
                    </button>
                </div>
            </section>
        </>
    );
}

export default App;
