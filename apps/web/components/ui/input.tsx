import * as React from "react";
import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-10 rounded-md border border-border bg-transparent px-3 text-sm outline-none", props.className)} />;
}
