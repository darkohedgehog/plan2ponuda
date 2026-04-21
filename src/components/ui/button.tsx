import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/helpers";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-blue-600 text-white hover:bg-blue-700",
        variant === "secondary" &&
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
