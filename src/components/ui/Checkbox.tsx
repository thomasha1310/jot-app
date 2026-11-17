import { useState } from "react";

interface CheckboxProps {
    checked: boolean;
    onChange: () => void;
    label: string;
}

const FLICK_ANGLES = [-70, -35, 0, 35, 70, 110, 250];

/** A pencil-drawn box. Checking it draws the tick and throws a few graphite flicks. */
export function Checkbox({ checked, onChange, label }: CheckboxProps) {
    const [burst, setBurst] = useState(0);

    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-label={label}
            onClick={() => {
                if (!checked) setBurst((n) => n + 1);
                onChange();
            }}
            className="relative mt-[0.2em] inline-flex size-[1.15em] shrink-0 cursor-pointer text-pencil hover:text-paper aria-checked:text-pencil"
        >
            <span key={burst} className={burst ? "press inline-flex" : "inline-flex"}>
                <svg viewBox="0 0 20 20" className="size-full overflow-visible" fill="none">
                    <path
                        d="M3.2 3.6 C7 3.1 12.5 3.3 16.7 3.4 C16.9 7.6 16.6 12.4 16.8 16.6 C12.3 16.9 7.5 16.6 3.3 16.8 C3.1 12.4 3.4 8 3.2 3.6Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                    />
                    <path
                        className="tick-path"
                        d="M5.6 10.4 L8.7 13.6 L15.2 5.2"
                        stroke="var(--paper)"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </span>
            {burst > 0 &&
                checked &&
                FLICK_ANGLES.map((a) => (
                    <span
                        key={`${burst}-${a}`}
                        className="flick"
                        style={{ "--a": `${a}deg` } as React.CSSProperties}
                        aria-hidden
                    />
                ))}
        </button>
    );
}
