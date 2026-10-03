import { useAppStore } from "../store";
import { TodoItem } from "./TodoItem";
import { TodoItemNew } from "./TodoItemNew";

export function TodoList() {
    const todos = useAppStore((state) => state.todos);

    return (
        <div className="flex min-w-0 flex-col h-full w-full max-w-lg">
            <h1 className="text-2xl text-neutral-500 text-center mb-2 underline">
                tasks
            </h1>

            <ul className="w-full min-w-0">
                {todos.map((todo) => (
                    <TodoItem todo={todo} />
                ))}
                <TodoItemNew />
            </ul>
        </div>
    );
}
