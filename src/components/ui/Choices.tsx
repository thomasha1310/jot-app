import type { ReactNode } from "react";
import { labelClass } from "./Dialog";

interface ChoicesProps<T extends string> {
    legend: string;
    name: string;
    value: T;
    options: { value: T; label: ReactNode; hint?: string }[];
    onChange: (value: T) => void;
    /** Stack options with their hints instead of laying them in a row. */
    stacked?: boolean;
}

/** Radio tiles. Native radios underneath, so arrow keys and screen readers work. */
export function Choices<T extends string>({
    legend,
    name,
    value,
    options,
    onChange,
    stacked,
}: ChoicesProps<T>) {
    return (
        <fieldset>
            <legend className={labelClass}>{legend}</legend>
            <div className={stacked ? "mt-1 grid gap-2" : "mt-1 flex flex-wrap gap-2"}>
                {options.map((opt) => (
                    <label key={opt.value} className="block">
                        <input
                            type="radio"
                            name={name}
                            value={opt.value}
                            checked={value === opt.value}
                            onChange={() => onChange(opt.value)}
                            className="peer sr-only"
                        />
                        <span
                            className={`block rounded-md border border-line whitespace-nowrap px-3 py-1.5 text-pencil transition-colors hover:border-pencil hover:text-paper peer-checked:border-pencil peer-checked:bg-desk peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lamp ${
                                stacked ? "py-2.5" : ""
                            }`}
                        >
                            {opt.label}
                            {opt.hint && <span className="block text-sm whitespace-normal text-pencil">{opt.hint}</span>}
                        </span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}
