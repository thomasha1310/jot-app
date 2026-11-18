import type { AppState } from "../types";

/** Deletion markers are kept this long; both machines will have synced by then. */
const DELETION_RETENTION_MS = 180 * 86_400_000;

interface Versioned {
    id: string;
    updatedAt: number;
}

function mergeRecords<T extends Versioned>(
    first: T[],
    second: T[],
    deletions: Record<string, number>,
): T[] {
    const byId = new Map<string, T>();
    // `first`'s order wins; records only `second` has are appended in its order.
    for (const record of [...first, ...second]) {
        const existing = byId.get(record.id);
        if (!existing || record.updatedAt > existing.updatedAt) byId.set(record.id, record);
    }
    const order = [...new Set([...first, ...second].map((r) => r.id))];
    return order
        .map((id) => byId.get(id)!)
        .filter((r) => !(r.id in deletions) || r.updatedAt > deletions[r.id]);
}

/**
 * Combines two copies of the data, record by record, keeping the newest edit
 * of each. Deterministic and idempotent, so it's safe to run on every sync.
 */
export function mergeStates(first: AppState, second: AppState, now = Date.now()): AppState {
    const deletions: Record<string, number> = {};
    for (const [id, at] of [
        ...Object.entries(first.deletions),
        ...Object.entries(second.deletions),
    ]) {
        if (now - at > DELETION_RETENTION_MS) continue;
        deletions[id] = Math.max(deletions[id] ?? 0, at);
    }

    const newerSettings = second.settingsUpdatedAt > first.settingsUpdatedAt ? second : first;

    return {
        version: first.version,
        courses: mergeRecords(first.courses, second.courses, deletions),
        courseItems: mergeRecords(first.courseItems, second.courseItems, deletions),
        todos: mergeRecords(first.todos, second.todos, deletions),
        settings: newerSettings.settings,
        settingsUpdatedAt: newerSettings.settingsUpdatedAt,
        deletions,
    };
}
