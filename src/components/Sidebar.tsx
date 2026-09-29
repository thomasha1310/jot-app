import { Home, BookOpen, Settings, Plus } from "lucide-react";
import { useAppStore } from "../store";
import { DarkModeToggle } from "./DarkModeToggle";

export function Sidebar() {
    const { courses } = useAppStore();

    return (
        <aside className="xl:w-64 w-52 shrink-0 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 flex flex-col h-full z-10 rounded-2xl shadow-sm dark:shadow-none">
            <h1 className="text-6xl gaegu-regular py-8 text-gray-800 dark:text-gray-100 text-center">
                jot.
            </h1>

            <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                    <ul className="space-y-1">
                        <li>
                            <button className="cursor-pointer w-full flex items-center gap-4 px-5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-left transition-colors text-xl">
                                <Home className="w-4 h-4" />
                                Dashboard
                            </button>
                        </li>
                        <li>
                            <button className="cursor-pointer w-full flex items-center gap-4 px-5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-left transition-colors text-xl">
                                <BookOpen className="w-4 h-4" />
                                Logbook
                            </button>
                        </li>
                    </ul>
                </div>

                <div>
                    <div className="flex items-center justify-between px-3 mb-2 text-neutral-500 dark:text-neutral-400">
                        <h2 className="text-md font-semibold uppercase tracking-wider">
                            Courses
                        </h2>
                        <button className="p-1.5 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <ul className="space-y-1">
                        {courses
                            .filter((c) => !c.isArchived)
                            .map((course) => (
                                <li key={course.id}>
                                    <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg text-left transition-colors">
                                        <span>{course.icon}</span>
                                        <span className="truncate">
                                            {course.name}
                                        </span>
                                    </button>
                                </li>
                            ))}
                    </ul>
                </div>
            </nav>

            <div className="flex flex-h gap-2 p-4 m-auto border-t border-neutral-200 dark:border-neutral-600">
                <button className="cursor-pointer p-2 rounded-full transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700">
                    <Settings className="text-neutral-800 dark:text-neutral-300" />
                </button>
                <DarkModeToggle />
            </div>
        </aside>
    );
}
