import React from "react";
import * as Label from "@radix-ui/react-label";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, id, ...props }, ref) => {
        const inputId = id || React.useId();

        return (
            <div className="flex flex-col space-y-1.5 w-full">
                {label && (
                    <Label.Root
                        htmlFor={inputId}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-neutral-700 dark:text-neutral-300"
                    >
                        {label}
                    </Label.Root>
                )}
                <input
                    id={inputId}
                    ref={ref}
                    className={`flex h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 ${error ? "border-red-500 focus-visible:ring-red-500" : ""
                        } ${className || ""}`}
                    {...props}
                />
                {error && (
                    <p className="text-xs font-medium text-red-500">{error}</p>
                )}
                {helperText && !error && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;
