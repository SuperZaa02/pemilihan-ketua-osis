"use client";

import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingText?: string;
  confirmMessage?: string;
};

export function FormSubmitButton({
  children,
  className,
  confirmMessage,
  disabled,
  onClick,
  pendingText = "Memproses...",
  type = "submit",
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (pending) {
      event.preventDefault();
      return;
    }

    if (confirmMessage && !window.confirm(confirmMessage)) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
  }

  return (
    <button
      {...props}
      type={type}
      className={className}
      disabled={disabled || pending}
      onClick={handleClick}
    >
      {pending ? (
        <>
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
