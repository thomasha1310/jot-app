import * as z from "zod";

export const CourseSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    color: z.string(),
    icon: z.string(),
    isArchived: z.boolean().optional(),
});

export const Coursework = z.object({
    id: z.uuid(),
    courseId: z.string(),
    name: z.string(),
    /** Local calendar day, "YYYY-MM-DD". */
    date: z.string(),
});

export const AssignmentSchema = Coursework.extend({
    type: z.literal("assignment"),
    status: z.enum(["not_started", "in_progress", "complete"]),
});

export const ExamSchema = Coursework.extend({
    type: z.literal("exam"),
    status: z.enum(["not_started", "complete"]),
});

export const CourseItemSchema = z.discriminatedUnion("type", [
    AssignmentSchema,
    ExamSchema,
]);

export const TodoSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    isCompleted: z.boolean(),
    /** Set when the todo was made by dragging an assignment/exam into the list. */
    linkedItemId: z.string().optional(),
});

export const QuoteSchema = z.object({
    text: z.string(),
    author: z.string(),
});

export const QuoteSourceSchema = z.enum(["off", "local", "online"]);

export const SettingsSchema = z.object({
    autoCompleteExams: z.boolean().default(false),
    showGreeting: z.boolean().default(true),
    /** off: no quote. local: built-in + your own. online: Wikiquote's quote of the day. */
    quoteSource: QuoteSourceSchema.default("local"),
    customQuotes: z.array(QuoteSchema).default([]),
});

export const AppStateSchema = z.object({
    version: z.string().regex(
        /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
    ),
    courses: z.array(CourseSchema),
    courseItems: z.array(CourseItemSchema),
    todos: z.array(TodoSchema),
    settings: SettingsSchema,
});

export type AppState = z.infer<typeof AppStateSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type CourseItem = z.infer<typeof CourseItemSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export type Exam = z.infer<typeof ExamSchema>;
export type Todo = z.infer<typeof TodoSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
export type QuoteSource = z.infer<typeof QuoteSourceSchema>;
