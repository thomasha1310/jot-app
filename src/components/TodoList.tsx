import { useAppStore } from "../store";
import { TodoItem } from "./TodoItem";
import { NewTodoItem } from "./NewTodoItem";

export function TodoList() {
    const todos = useAppStore((state) => state.todos);

    return (
        <div className="flex flex-col h-full">
            <h1 className="text-2xl text-neutral-400 text-center mb-2">
                tasks for today
            </h1>

            <ul className="w-full max-w-lg">
                {todos.map((todo) => (
                    <TodoItem todo={todo} />
                ))}
                <NewTodoItem />
            </ul>
        </div>
    );
}
