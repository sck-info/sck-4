export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 25;
export const PAGE_LIMIT_OPTIONS = [25, 50, 75, 100] as const;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationMeta;
};

export function parsePaginationParams(searchParams: URLSearchParams) {
  const pageValue = Number.parseInt(searchParams.get("page") ?? "", 10);
  const limitValue = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const page =
    Number.isFinite(pageValue) && pageValue > 0 ? pageValue : DEFAULT_PAGE;
  const limit =
    Number.isFinite(limitValue) && limitValue > 0
      ? limitValue
      : DEFAULT_PAGE_LIMIT;

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function createPaginationMeta({
  page,
  limit,
  total,
}: {
  page: number;
  limit: number;
  total: number;
}): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
