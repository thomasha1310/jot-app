/** All course item dates are stored as local calendar days: "YYYY-MM-DD". */

export function toISODate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string): Date {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
}

export function todayISO(): string {
    return toISODate(new Date());
}

export function addDays(d: Date, n: number): Date {
    const next = new Date(d);
    next.setDate(next.getDate() + n);
    return next;
}

/** Earlier builds stored `Date.toDateString()` ("Tue Nov 17 2026"). */
export function normalizeDate(value: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : toISODate(parsed);
}

export type CalendarView = "week" | "month";

export function startOfWeek(d: Date): Date {
    return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -d.getDay());
}

/** Days shown for a view anchored on `anchor`: one week, or full weeks covering the month. */
export function visibleDays(view: CalendarView, anchor: Date): Date[] {
    const first =
        view === "week"
            ? startOfWeek(anchor)
            : startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    const count =
        view === "week"
            ? 7
            : (() => {
                  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
                  const end = addDays(startOfWeek(last), 6);
                  return Math.round((end.getTime() - first.getTime()) / 86_400_000) + 1;
              })();
    return Array.from({ length: count }, (_, i) => addDays(first, i));
}

/** "tomorrow", "yesterday", "thursday", or "21 nov" — relative to today. */
export function relativeDay(iso: string): string {
    const target = fromISODate(iso);
    const today = fromISODate(todayISO());
    const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
    if (diff === 0) return "today";
    if (diff === 1) return "tomorrow";
    if (diff === -1) return "yesterday";
    if (diff > 1 && diff < 7)
        return target.toLocaleDateString("en-GB", { weekday: "long" }).toLowerCase();
    return target
        .toLocaleDateString("en-GB", { day: "numeric", month: "short" })
        .toLowerCase();
}
