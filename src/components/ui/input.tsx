import type * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  search?: boolean;
}

function Input({ className, type, search, ...props }: InputProps) {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;

    setTimeout(() => {
      try {
        const value = input.value;
        input.setSelectionRange(value.length, value.length);
      } catch {}
    }, 0);
  };

  if (search) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 min-h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-base shadow-xs transition-[color,box-shadow,background-color] hover:bg-gray-100",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
      >
        <Search className="h-4 w-4 text-gray-400 shrink-0" />

        <input
          type={type}
          data-slot="input"
          onFocus={handleFocus}
          className="file:text-foreground placeholder:text-gray-400 selection:bg-blue-500 selection:text-white dark:bg-input/30 w-full min-w-0 border-0 bg-transparent outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      type={type}
      data-slot="input"
      onFocus={handleFocus}
      className={cn(
        "file:text-foreground placeholder:text-gray-400 selection:bg-blue-500 selection:text-white dark:bg-input/30 border border-gray-300 min-h-9.5 w-full min-w-0 rounded-md bg-transparent pl-3 pr-3 py-1 text-base shadow-xs transition-[color,box-shadow,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "hover:bg-gray-100",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
