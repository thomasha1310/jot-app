import * as z from "zod";

export const CourseSchema = z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    icon: z.string(),
    isArchived: z.boolean().optional(),
});

export const Coursework = z.object({
    id: z.string(),
    courseId: z.string(),
    name: z.string(),
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
    id: z.string(),
    name: z.string(),
    isCompleted: z.boolean(),
});

export const AppStateSchema = z.object({
    version: z.number(),
    courses: z.array(CourseSchema),
    courseItems: z.array(CourseItemSchema),
    todos: z.array(TodoSchema),
    settings: z.object({
        autoCompleteExams: z.boolean(),
        showGreeting: z.boolean(),
    }),
});

export type AppState = z.infer<typeof AppStateSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type CourseItem = z.infer<typeof CourseItemSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export type Exam = z.infer<typeof ExamSchema>;
export type Todo = z.infer<typeof TodoSchema>;
