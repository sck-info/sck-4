import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-[#e8dcc4] placeholder:text-gray-400 focus-visible:border-[#b86a16] focus-visible:ring-1 focus-visible:ring-[#b86a16] aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex min-h-24 w-full rounded-xl border bg-white px-3 py-2 text-xs shadow-2xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-xs text-[#1c1f4a]",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
