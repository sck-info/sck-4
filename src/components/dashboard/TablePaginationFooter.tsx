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
        "border-0 bg-transparent px-0 font-bold text-[#1c1f4a] shadow-none hover:bg-transparent hover:text-[#b86a16] cursor-pointer transition-colors",
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
        "border-0 bg-transparent px-0 font-bold text-[#1c1f4a] shadow-none hover:bg-transparent hover:text-[#b86a16] cursor-pointer transition-colors",
        compact ? "h-7 px-0 text-xs" : "h-8 px-0 text-sm",
        nextDisabled && "pointer-events-none opacity-50",
      )}
    />
  );

  const paginationNav = (compact = false) => (
    <Pagination
      className={cn(
        "mx-0 w-full justify-center overflow-x-auto sm:w-auto sm:justify-start",
        variant === "top" && "justify-center sm:justify-end",
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
                    ? "size-7 rounded-lg text-xs"
                    : "size-8 rounded-lg text-sm",
                  "border border-[#e8dcc4] bg-[#faf7f2]/30 font-semibold text-[#1c1f4a] hover:bg-[#b86a16]/10 cursor-pointer transition-colors",
                  page === currentPage &&
                    "border-[#b86a16] bg-[#b86a16] text-white hover:bg-[#b86a16]/90 hover:text-white",
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
        <SelectTrigger className="h-9 w-32 rounded-xl border-[#e8dcc4] bg-[#faf7f2]/30 px-3 text-xs font-semibold text-[#1c1f4a] shadow-none cursor-pointer hover:bg-[#b86a16]/5 transition-colors">
          <span>Showing</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {limitOptions.map((option) => (
            <SelectItem
              key={option}
              value={String(option)}
              className="cursor-pointer text-xs"
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="whitespace-nowrap text-xs text-[#1c1f4a] font-bold">
        of {pagination.total}
      </span>
    </div>
  );

  const hasNextPage = pagination.total > limit;
  if (!hasNextPage) return null;

  if (variant === "top") {
    return (
      <div className="mb-3 flex justify-center sm:justify-end">
        {paginationNav(true)}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 border-t border-[#e8dcc4] bg-[#faf7f2]/10 px-3 py-3 text-xs text-[#5a5e7a] sm:flex-row sm:justify-between rounded-b-2xl">
      {paginationNav(true)}
      <div className="flex w-full justify-center sm:w-auto sm:justify-end">
        {recordSelector}
      </div>
    </div>
  );
}
