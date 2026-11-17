import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useAppStore } from "../../store";

export function TodoItemNew() {
    const addTodo = useAppStore((s) => s.addTodo);
    const [text, setText] = useState("");
    // Escape clears and blurs; the blur that follows must not add anything.
    const discarding = useRef(false);

    const commit = () => {
        const name = text.trim();
        if (name) addTodo({ id: crypto.randomUUID(), name, isCompleted: false });
        setText("");
    };

    return (
        <li>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    commit(); // Enter adds and keeps focus for the next one.
                }}
                className="flex items-start gap-2.5"
            >
                <Plus className="mt-[0.25em] size-[1.1em] shrink-0 text-pencil" aria-hidden />
                <input
                    type="text"
                    aria-label="New to-do"
                    placeholder="jot something down…"
                    className="min-w-0 flex-1 bg-transparent placeholder:text-pencil focus:outline-none"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key !== "Escape") return;
                        discarding.current = true;
                        setText("");
                        e.currentTarget.blur();
                    }}
                    onBlur={() => {
                        if (discarding.current) discarding.current = false;
                        else commit();
                    }}
                />
            </form>
        </li>
    );
}
