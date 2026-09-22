import { SquareCheck, Square } from "lucide-react";

export default function TodoItem(props: {
    text: string;
    completed: boolean;
    onToggle: () => void;
}) {
    return (
        <li>
            <button
                className={`flex m-5 px-2 cursor-pointer ${props.completed ? "text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"} transition-colors`}
                onClick={props.onToggle}
            >
                <span className="mr-4 mt-1">
                    {props.completed ? <SquareCheck /> : <Square />}
                </span>
                <span
                    className={`gaegu-regular text-2xl text-left ${props.completed ? "line-through" : ""}`}
                >
                    {props.text}
                </span>
            </button>
        </li>
    );
}
