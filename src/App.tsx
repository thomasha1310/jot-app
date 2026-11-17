import { DragDropProvider, type DragDropEventHandlers } from "@dnd-kit/react";
import { Dashboard } from "./components/Dashboard";
import { LeftColumn } from "./components/LeftColumn";
import { TODO_DROP_ID } from "./components/todo-list/TodoList";
import { useAppStore } from "./store";

type DragEnd = Parameters<NonNullable<DragDropEventHandlers["onDragEnd"]>>[0];

export default function App() {
    const updateTask = useAppStore((s) => s.updateTask);
    const addTodoFromItem = useAppStore((s) => s.addTodoFromItem);

    // Assignments can be dropped on a day (reschedule) or on the to-do list.
    const handleDragEnd = (event: DragEnd) => {
        if (event.canceled) return;
        const sourceId = event.operation.source?.id;
        const targetId = event.operation.target?.id;
        if (!sourceId || !targetId) return;

        if (targetId === TODO_DROP_ID) addTodoFromItem(String(sourceId));
        else updateTask(String(sourceId), { date: String(targetId) });
    };

    return (
        <DragDropProvider onDragEnd={handleDragEnd}>
            <div className="grid min-h-screen grid-cols-1 content-start gap-10 p-6 lg:h-screen lg:content-stretch lg:grid-cols-[19rem_minmax(0,1fr)] lg:overflow-hidden lg:p-8">
                <LeftColumn />
                <Dashboard />
            </div>
        </DragDropProvider>
    );
}
