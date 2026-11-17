import { addDays, toISODate, todayISO } from "../lib/dates";
import { useAppStore } from "../store";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { CourseStrip } from "./courses/CourseStrip";

const dayPeriod = () => {
    const hour = new Date().getHours();
    if (hour < 5) return "still up?";
    if (hour < 12) return "good morning.";
    if (hour < 17) return "good afternoon.";
    return "good evening.";
};

export function Dashboard() {
    const showGreeting = useAppStore((s) => s.settings.showGreeting);
    const courseItems = useAppStore((s) => s.courseItems);

    const today = todayISO();
    const weekOut = toISODate(addDays(new Date(), 7));
    const dueSoon = courseItems.filter(
        (i) => i.status !== "complete" && i.date >= today && i.date < weekOut,
    ).length;
    const overdue = courseItems.filter((i) => i.status !== "complete" && i.date < today).length;

    const dateString = new Date()
        .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
        .toLowerCase();

    return (
        <main className="flex min-h-0 min-w-0 flex-col gap-8">
            <header>
                {showGreeting && <p className="text-pencil">{dayPeriod()}</p>}
                <h2 className="text-4xl font-semibold tracking-tight">{dateString}</h2>
                <p className="mt-1 text-pencil">
                    {dueSoon === 0 ? "nothing due in the next 7 days" : `${dueSoon} due in the next 7 days`}
                    {overdue > 0 && <span className="text-paper">, {overdue} overdue</span>}
                </p>
            </header>
            <CourseStrip />
            <CalendarGrid />
        </main>
    );
}
