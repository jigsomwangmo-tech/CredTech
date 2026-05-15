import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  const variantClass =
    variant === "outline"
      ? "border border-border bg-transparent hover:bg-muted"
      : variant === "ghost"
        ? "bg-transparent hover:bg-muted"
        : "bg-primary text-white hover:opacity-90";

  return (
    <button
      className={cn("inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition", variantClass, className)}
      {...props}
    />
  );
}
