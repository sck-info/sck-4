"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_PAGE_LIMIT,
  PAGE_LIMIT_OPTIONS,
  type PaginationMeta,
} from "@/lib/pagination";
import { cn } from "@/lib/utils";

type TablePaginationFooterProps = {
  pagination: PaginationMeta;
  variant?: "top" | "bottom";
};

export default function TablePaginationFooter({
  pagination,
  variant = "bottom",
}: TablePaginationFooterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Math.max(1, pagination.page);
  const totalPages = Math.max(1, pagination.totalPages);
  const limit = pagination.limit || DEFAULT_PAGE_LIMIT;
  
  const limitOptions = useMemo(() => {
    const options = new Set<number>(PAGE_LIMIT_OPTIONS);
    if (limit > 0) options.add(limit);
    return [...options].sort((a, b) => a - b);
  }, [limit]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, "ellipsis", totalPages] as const;
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "ellipsis",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ] as const;
    }

    return [
      1,
      "ellipsis",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis",
      totalPages,
    ] as const;
  }, [currentPage, totalPages]);

  const buildPaginationHref = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => params.set(key, value));
    return `${pathname}?${params.toString()}`;
  };

  const updatePagination = (updates: Record<string, string>) => {
    router.push(buildPaginationHref(updates));
  };

  const previousDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  const previousControl = (compact = false) => (
    <PaginationPrevious
      href={buildPaginationHref({ page: String(currentPage - 1) })}
      aria-disabled={previousDisabled}
      tabIndex={previousDisabled ? -1 : undefined}
      onClick={(event) => {
        event.preventDefault();
        if (!previousDisabled) {
          updatePagination({ page: String(currentPage - 1) });
        }
      }}
      className={cn(
        "border-0 bg-transparent px-0 font-medium text-black shadow-none hover:bg-transparent hover:text-black cursor-pointer",
        compact ? "h-7 px-0 text-xs" : "h-8 px-0 text-sm",
        previousDisabled && "pointer-events-none opacity-50",
      )}
    />
  );

  const nextControl = (compact = false) => (
    <PaginationNext
      href={buildPaginationHref({ page: String(currentPage + 1) })}
      aria-disabled={nextDisabled}
      tabIndex={nextDisabled ? -1 : undefined}
      onClick={(event) => {
        event.preventDefault();
        if (!nextDisabled) {
          updatePagination({ page: String(currentPage + 1) });
        }
      }}
      className={cn(
        "border-0 bg-transparent px-0 font-medium text-black shadow-none hover:bg-transparent hover:text-black cursor-pointer",
        compact ? "h-7 px-0 text-xs" : "h-8 px-0 text-sm",
        nextDisabled && "pointer-events-none opacity-50",
      )}
    />
  );

  const paginationNav = (compact = false) => (
    <Pagination
      className={cn(
        "mx-0 w-full justify-center overflow-x-auto sm:w-auto sm:justify-start",
        variant === "top" && "justify-end",
      )}
    >
      <PaginationContent className={compact ? "gap-2" : "gap-3"}>
        <PaginationItem>{previousControl(compact)}</PaginationItem>
        {visiblePages.map((page, index) =>
          page === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis className={compact ? "size-7" : "size-8"} />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                href={buildPaginationHref({ page: String(page) })}
                isActive={page === currentPage}
                onClick={(event) => {
                  event.preventDefault();
                  updatePagination({ page: String(page) });
                }}
                className={cn(
                  compact
                    ? "size-7 rounded-md text-xs"
                    : "size-8 rounded-md text-sm",
                  "border border-slate-200 bg-white font-medium text-black hover:bg-slate-50 cursor-pointer",
                  page === currentPage &&
                    "border-[#6C63FF] bg-[#6C63FF] text-white hover:bg-[#6C63FF] hover:text-white",
                )}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>{nextControl(compact)}</PaginationItem>
      </PaginationContent>
    </Pagination>
  );

  const recordSelector = (
    <div className="flex items-center justify-center gap-3">
      <Select
        value={String(limit)}
        onValueChange={(value) => updatePagination({ limit: value, page: "1" })}
      >
        <SelectTrigger className="h-9 w-36 rounded-xl border-slate-200 px-3 text-sm text-slate-700 shadow-none cursor-pointer">
          <span>Showing</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {limitOptions.map((option) => (
            <SelectItem key={option} value={String(option)} className="cursor-pointer">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="whitespace-nowrap text-sm text-black">
        of {pagination.total}
      </span>
    </div>
  );

  const hasNextPage = pagination.total > limit;
  if (!hasNextPage) return null;

  if (variant === "top") {
    return (
      <div className="mb-3 hidden justify-end sm:flex">
        {paginationNav(true)}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 border-t bg-white px-3 py-3 text-sm text-slate-600 sm:flex-row sm:justify-between">
      {paginationNav(false)}
      <div className="flex w-full justify-center sm:w-auto sm:justify-end">
        {recordSelector}
      </div>
    </div>
  );
}
