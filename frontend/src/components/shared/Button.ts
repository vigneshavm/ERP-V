import React from "react";
import DesignButton from "./UI/Button";
import type { ButtonProps } from "./UI/Button";

export type { ButtonProps, ButtonSize, ButtonVariant } from "./UI/Button";

/**
 * `@/components/shared/Button` entry point.
 *
 * The bulk <button> -> <Button> conversion produced two kinds of call sites:
 *  - design-system buttons that pass `variant` / `size` / `loading` / `icon` / `iconRight` /
 *    `fullWidth` -- these render the real design-system Button (./UI/Button);
 *  - mechanical swaps that kept their original `className` and pass none of those props --
 *    these render a plain <button> so they look exactly as they did before the conversion
 *    (the design-system Button would otherwise add its primary colours and padding on top).
 * To move a call site onto the design system, give it a `variant` and drop the hand-written classes.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    const { variant, size, loading, icon, iconRight, fullWidth, ...nativeProps } = props;
    const usesDesignSystem =
        variant !== undefined || size !== undefined || loading !== undefined ||
        icon !== undefined || iconRight !== undefined || fullWidth !== undefined;

    if (usesDesignSystem) {
        return React.createElement(DesignButton, { ...props, ref });
    }
    return React.createElement("button", { ...nativeProps, ref });
});
Button.displayName = "Button";

export default Button;
