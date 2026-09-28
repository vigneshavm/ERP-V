import React from "react";
import DesignInput from "./Form/Input";
import type { InputProps as DesignInputProps } from "./Form/Input";

export type { InputSize, InputStatus, InputType } from "./Form/Input";

/** Design-system Input props, but accepting any native input `type` (date, time, checkbox, ...). */
export type InputProps = Omit<DesignInputProps, "type"> & { type?: React.HTMLInputTypeAttribute };

/**
 * `@/components/shared/Input` entry point.
 *
 * Call sites that use design-system props (`label`, `helperText`, `error`, `success`, `warning`,
 * `size`, `status`, `icon`, `iconRight`, `showPasswordToggle`, `wrapperClassName`,
 * `labelClassName`) render the real design-system Input (./Form/Input).
 * Everything else -- the mechanical <input> -> <Input> swaps that kept their own `className` --
 * renders a plain <input>, so layout and styling are exactly what they were before the conversion
 * (the design-system Input wraps the field in a div and adds its own border/padding).
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
    const {
        label, helperText, error, success, warning, size, status, icon, iconRight,
        showPasswordToggle, wrapperClassName, labelClassName, ...nativeProps
    } = props;
    const usesDesignSystem = [
        label, helperText, error, success, warning, size, status, icon, iconRight,
        showPasswordToggle, wrapperClassName, labelClassName,
    ].some((value) => value !== undefined);

    if (usesDesignSystem) {
        return React.createElement(DesignInput, { ...(props as DesignInputProps), ref });
    }
    return React.createElement("input", { ...nativeProps, ref });
});
Input.displayName = "Input";

export default Input;
