import React from "react";
import { Input, InputProps } from "./Input";

export interface AmountInputProps extends Omit<InputProps, 'type'> {
    value?: string | number;
}

export const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
    (props, ref) => {
        return (
            <Input 
                {...props}
                type="number"
                ref={ref}
                step="0.01"
            />
        );
    }
);

AmountInput.displayName = "AmountInput";

export default AmountInput;
