# Pagination System & Helpers

This document outlines how pagination works, detailing the helper utilities, types, URL search parameter binding, and the reusable pagination footer component.

## Database & Helper Utilities

All paginated list endpoints import standard helper methods from **[pagination.ts](file:///d:/sck/sck-4/src/lib/pagination.ts)**:

```typescript
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
```

---

## Server Route Integration

In API endpoints (e.g. `src/app/api/contacts/route.ts`), pagination is implemented by extraction and DB limit calculations:

```typescript
import { parsePaginationParams, createPaginationMeta } from "@/lib/pagination";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  // 1. Parse page, limit, and offset (automatically assigns defaults if absent)
  const { page, limit, offset } = parsePaginationParams(searchParams);

  // 2. Fetch the total count of database entries
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(contacts);
  const total = Number(countResult[0]?.count || 0);

  // 3. Query the data subset
  const data = await db
    .select()
    .from(contacts)
    .orderBy(desc(contacts.createdAt))
    .limit(limit)
    .offset(offset);

  // 4. Return paginated JSON response
  return NextResponse.json({
    data,
    pagination: createPaginationMeta({ page, limit, total }),
  });
}
```

---

## Client Routing & Footer Component

We use **[TablePaginationFooter.tsx](file:///d:/sck/sck-4/src/components/dashboard/TablePaginationFooter.tsx)** to render pagination controls.

### How it operates:
*   **State Alignment**: Page indices and page limits are read directly from URL Query Parameters.
*   **URL Syncing**: Clicking "Next", "Previous", or specific page buttons calls `router.push()` to update the address bar, keeping state bookmarks intact.
*   **Ellipsis Simplification**: If the total page count exceeds 6, the footer dynamically inserts ellipses (e.g., `1 ... 5 [6] 7 ... 12`) to preserve layout space.
*   **Hide on Single Page**: If the total count is less than the current display limit, the component returns `null` and remains hidden.

### Implementation Example

To add pagination to your CRUD page:

```typescript
"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";

export default function MyList() {
  const searchParams = useSearchParams();
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";

  // Data fetching hook uses page and limit variables...
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  return (
    <div>
      {/* 1. Optionally show pagination top-aligned without selectors */}
      <TablePaginationFooter pagination={pagination} variant="top" />

      {/* Render Table rows */}

      {/* 2. Show bottom-aligned pagination with page-limit dropdown select */}
      <TablePaginationFooter pagination={pagination} variant="bottom" />
    </div>
  );
}
```
