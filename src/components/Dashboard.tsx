import { useAppStore } from "../store";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { TodoList } from "./todo-list/TodoList";

export function Dashboard() {
    const { settings } = useAppStore();

    const getDayPeriod = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "morning";
        if (hour < 17) return "afternoon";
        return "evening";
    };

    const dateString = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    })
        .format(new Date())
        .toLowerCase();

    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-950 mx-8 gap-y-6">
            {/* Top Header Section */}
            {settings.showGreeting && (
                <div className="pt-3 pb-4 space-y-1 border-b border-neutral-200 mr-auto">
                    <h2 className="text-3xl">good {getDayPeriod()}!</h2>
                    <h1 className="text-5xl">today is {dateString}.</h1>
                </div>
            )}

            {/* Overdue Section (Placeholder) */}
            {/* <OverdueSection /> */}

            {/* Main Split Content */}
            <div className="flex flex-row overflow-hidden gap-x-4">
                <div className="w-80 overflow-hidden">
                    <TodoList />
                </div>
            </div>
        </div>
    );
}
