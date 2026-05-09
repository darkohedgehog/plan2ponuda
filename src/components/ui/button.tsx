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
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-deep-twilight-600 text-white shadow-deep-twilight-900/10 hover:bg-deep-twilight-700",
        variant === "secondary" &&
          "border border-frosted-blue-200 bg-white text-deep-twilight-800 hover:border-bright-teal-blue-200 hover:bg-frosted-blue-50 hover:text-deep-twilight-950",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
