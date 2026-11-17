import type { CSSProperties } from "react";
import type { CourseItem } from "../types";

/** Highlighter colours that read on both the dark desk and the light one. */
export const COURSE_COLORS = [
    { name: "pink", value: "#ef7fa8" },
    { name: "yellow", value: "#e9c53f" },
    { name: "green", value: "#6fcf8f" },
    { name: "blue", value: "#6fa6ef" },
    { name: "orange", value: "#f0955a" },
    { name: "violet", value: "#b48cf0" },
];

export function inkClass(status: CourseItem["status"]): string {
    if (status === "complete") return "ink ink-done";
    if (status === "in_progress") return "ink ink-doing";
    return "ink";
}

export const inkColor = (color?: string): CSSProperties =>
    (color ? { "--hl": color } : {}) as CSSProperties;

export const STATUS_LABEL: Record<CourseItem["status"], string> = {
    not_started: "not started",
    in_progress: "in progress",
    complete: "done",
};
