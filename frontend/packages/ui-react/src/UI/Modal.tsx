import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export const Modal = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;
export const ModalPortal = Dialog.Portal;

export const ModalOverlay = React.forwardRef<
    React.ElementRef<typeof Dialog.Overlay>,
    React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(({ className, ...props }, ref) => (
    <Dialog.Overlay
        ref={ref}
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 ${className || ""}`}
        {...props}
    />
));
ModalOverlay.displayName = "ModalOverlay";

export const ModalContent = React.forwardRef<
    React.ElementRef<typeof Dialog.Content>,
    React.ComponentPropsWithoutRef<typeof Dialog.Content>
>(({ className, children, ...props }, ref) => (
    <ModalPortal>
        <ModalOverlay />
        <Dialog.Content
            ref={ref}
            className={`fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-2xl border bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 dark:bg-neutral-900 dark:border-neutral-800 ${className || ""}`}
            {...props}
        >
            {children}
            <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary disabled:pointer-events-none">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </Dialog.Close>
        </Dialog.Content>
    </ModalPortal>
));
ModalContent.displayName = "ModalContent";

export const ModalHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={`flex flex-col space-y-1.5 text-center sm:text-left ${className || ""}`}
        {...props}
    />
);
ModalHeader.displayName = "ModalHeader";

export const ModalTitle = React.forwardRef<
    React.ElementRef<typeof Dialog.Title>,
    React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(({ className, ...props }, ref) => (
    <Dialog.Title
        ref={ref}
        className={`text-lg font-semibold leading-none tracking-tight text-neutral-900 dark:text-neutral-100 ${className || ""}`}
        {...props}
    />
));
ModalTitle.displayName = "ModalTitle";

export const ModalDescription = React.forwardRef<
    React.ElementRef<typeof Dialog.Description>,
    React.ComponentPropsWithoutRef<typeof Dialog.Description>
>(({ className, ...props }, ref) => (
    <Dialog.Description
        ref={ref}
        className={`text-sm text-neutral-500 dark:text-neutral-400 ${className || ""}`}
        {...props}
    />
));
ModalDescription.displayName = "ModalDescription";
