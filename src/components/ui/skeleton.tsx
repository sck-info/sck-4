import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-[#e8dcc4]/50 animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
