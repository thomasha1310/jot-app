import { useEffect, useState } from "react";
import { getDailyQuote, type QuoteResult } from "../lib/quotes";
import { todayISO } from "../lib/dates";
import { useAppStore } from "../store";

export function QuoteCard() {
    const quoteSource = useAppStore((s) => s.settings.quoteSource);
    const customQuotes = useAppStore((s) => s.settings.customQuotes);
    const [result, setResult] = useState<QuoteResult | null>(null);
    const [day, setDay] = useState(todayISO);

    // Roll over to a new quote if the app stays open past midnight.
    useEffect(() => {
        const id = setInterval(() => setDay(todayISO()), 60_000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (quoteSource === "off") return;
        const controller = new AbortController();
        getDailyQuote({ quoteSource, customQuotes }, day, controller.signal)
            .then(setResult)
            .catch(() => {});
        return () => controller.abort();
    }, [quoteSource, customQuotes, day]);

    if (quoteSource === "off" || !result) return null;

    return (
        <figure className="rounded-lg bg-blotter px-5 py-4">
            <blockquote className="text-[1.05rem] leading-relaxed text-pretty">
                {result.quote.text}
            </blockquote>
            <figcaption className="mt-2 text-sm italic text-pencil">
                {result.quote.author}
            </figcaption>
            {result.fellBack && (
                <p className="mt-2 text-xs text-pencil">
                    Couldn't reach Wikiquote, so this one's from your list.
                </p>
            )}
        </figure>
    );
}
