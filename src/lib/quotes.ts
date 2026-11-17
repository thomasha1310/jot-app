import { BUILT_IN_QUOTES } from "../data/quotes";
import type { Quote, Settings } from "../types";

/** Same quote all day, a different one tomorrow. */
export function dailyLocalQuote(isoDate: string, custom: Quote[]): Quote {
    const pool = [...custom, ...BUILT_IN_QUOTES];
    let hash = 0;
    for (const ch of isoDate) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return pool[hash % pool.length];
}

const MAX_ONLINE_LENGTH = 320;

/**
 * Wikiquote's quote of the day. The MediaWiki API allows cross-origin requests
 * (origin=*), so this works in the browser and in a desktop wrapper alike.
 */
async function fetchWikiquote(date: Date, signal: AbortSignal): Promise<Quote | null> {
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const page = `Wikiquote:Quote_of_the_day/${month}_${date.getDate()},_${date.getFullYear()}`;
    const url = `https://en.wikiquote.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json&formatversion=2&origin=*`;

    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const json = await res.json();
    const html: string | undefined = json?.parse?.text;
    if (!html) return null;

    const doc = new DOMParser().parseFromString(html, "text/html");
    const cells = doc.querySelectorAll("table.cquote td");
    const text = cells[1]?.textContent?.replace(/\s+/g, " ").trim();
    const author = doc.querySelector("table.cquote cite")?.textContent?.replace(/^[—–-]\s*/, "").trim();
    if (!text || !author || text.length > MAX_ONLINE_LENGTH) return null;
    return { text, author };
}

const cacheKey = (iso: string) => `jot-quote-${iso}`;

function readCache(iso: string): Quote | null {
    try {
        const raw = localStorage.getItem(cacheKey(iso));
        return raw ? (JSON.parse(raw) as Quote) : null;
    } catch {
        return null;
    }
}

function writeCache(iso: string, quote: Quote) {
    try {
        // Only today's quote is worth keeping.
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith("jot-quote-")) localStorage.removeItem(key);
        }
        localStorage.setItem(cacheKey(iso), JSON.stringify(quote));
    } catch {
        /* storage unavailable; we'll just fetch again */
    }
}

export interface QuoteResult {
    quote: Quote;
    /** True when online was requested but we fell back to the local list. */
    fellBack: boolean;
}

export async function getDailyQuote(
    settings: Pick<Settings, "quoteSource" | "customQuotes">,
    isoDate: string,
    signal: AbortSignal,
): Promise<QuoteResult> {
    const local = dailyLocalQuote(isoDate, settings.customQuotes);
    if (settings.quoteSource !== "online") return { quote: local, fellBack: false };

    const cached = readCache(isoDate);
    if (cached) return { quote: cached, fellBack: false };

    try {
        const [y, m, d] = isoDate.split("-").map(Number);
        const online = await fetchWikiquote(new Date(y, m - 1, d), signal);
        if (online) {
            writeCache(isoDate, online);
            return { quote: online, fellBack: false };
        }
    } catch (err) {
        if ((err as Error).name === "AbortError") throw err;
    }
    return { quote: local, fellBack: true };
}
