"use client";

import * as React from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Search,
} from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex min-w-0 items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

const SelectContentContext = React.createContext<{
  searchTerm: string;
} | null>(null);

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  showSearch = true,
  searchPlaceholder = "Search...",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & {
  showSearch?: boolean;
  searchPlaceholder?: string;
}) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const itemsCount = React.useMemo(() => {
    let count = 0;
    const countItems = (node: React.ReactNode) => {
      React.Children.forEach(node, (child) => {
        if (React.isValidElement(child)) {
          const props = child.props as {
            "data-slot"?: string;
            children?: React.ReactNode;
          };
          const isSelItem =
            child.type === SelectItem ||
            (child.type as any)?.isSelectItem === true ||
            props["data-slot"] === "select-item" ||
            (child.type as any)?.name === "SelectItem";

          if (isSelItem) {
            count++;
          } else if (props.children) {
            countItems(props.children);
          }
        }
      });
    };
    countItems(children);
    return count;
  }, [children]);

  const shouldDisplaySearch = showSearch && itemsCount > 5;

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:-translate-y-1 relative z-50 max-h-[260px] min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1 w-[var(--radix-select-trigger-width)]",
          className,
        )}
        position={position}
        align={align}
        {...props}
      >
        {shouldDisplaySearch && (
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-popover z-10">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-xs h-8 pl-8 pr-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600 bg-white text-gray-900"
              />
            </div>
          </div>
        )}
        <SelectContentContext.Provider value={{ searchTerm }}>
          <SelectPrimitive.Viewport
            className={cn(
              "p-1 overflow-y-auto max-h-[220px] scrollbar",
              position === "popper" &&
                "w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
            )}
          >
            {children}
          </SelectPrimitive.Viewport>
        </SelectContentContext.Provider>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  );
}

const getSelectTextContent = (children: React.ReactNode): string => {
  let text = "";
  React.Children.forEach(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      text += child;
    } else if (React.isValidElement(child)) {
      const props = child.props as { children?: React.ReactNode };
      if (props && props.children) {
        text += getSelectTextContent(props.children);
      }
    }
  });
  return text;
};

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  const context = React.useContext(SelectContentContext);

  const matches = React.useMemo(() => {
    if (!context || !context.searchTerm) return true;
    const text = getSelectTextContent(children);
    return text.toLowerCase().includes(context.searchTerm.toLowerCase());
  }, [context?.searchTerm, children]);

  if (!matches) return null;

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span
        data-slot="select-item-indicator"
        className="absolute right-2 flex size-3.5 items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

SelectItem.isSelectItem = true;

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
