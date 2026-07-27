# Developer Documentation Index

Welcome to the Developer Documentation for this project. This documentation aims to guide you through our standards, architectural patterns, database configurations, and UI/API development methodologies.

## Documentation Modules

Explore the topics below to understand the conventions and implementation details of our codebase:

### 1. [Database & Triggers (database.md)](file:///d:/sck/sck-4/docs/database.md)
Learn about database schema structures and PostgreSQL Drizzle migrations (using `generate` and `migrate` commands). Covers custom SQL trigger functions, and replica identity rules.

### 2. [Admin Panel & Architecture (admin-panel.md)](file:///d:/sck/sck-4/docs/admin-panel.md)
Understand how the administrative dashboard is built. Explains layout wrappers, navigation state, dashboard statistics generation, page-level routing, and authentication boundaries using `NextAuth.js`.

### 3. [API Coding Standards (api-standards.md)](file:///d:/sck/sck-4/docs/api-standards.md)
Review standards for developing REST API Route Handlers. Covers Zod schema validation, response payloads, authentication middleware checks, Drizzle ORM query styles, and server error handling.

### 4. [UI Design & Component Standards (ui-standards.md)](file:///d:/sck/sck-4/docs/ui-standards.md)
Discover our UI standards and design system tokens. Highlights the color palette, typography guidelines, Tailwind CSS configurations, Radix / Shadcn components, animation logic with Framer Motion, and global toast notifications.

### 5. [Realtime Consideration & Pub/Sub (realtime-considerations.md)](file:///d:/sck/sck-4/docs/realtime-considerations.md)
Explore our live data sync framework built over Supabase. Explains replica identities, Postgres notification channels, the custom client-side `useRealtime` hook, and how updates automatically synchronize components without page reloads.

### 6. [Pagination System & Helpers (pagination.md)](file:///d:/sck/sck-4/docs/pagination.md)
Read the standards for managing paginated data. Details pagination helper utilities, parsing query parameters, formatting metadata payloads, page limit options, and integrating the reusable `TablePaginationFooter` component in dashboard views.

### 7. [Operations Sheet & Runbook (operations-sheet.md)](file:///d:/sck/sck-4/docs/operations-sheet.md)
A quick operations cheatsheet detailing the exact commands to run database migrations, apply functions & triggers, and execute seed scripts.

---

> [!NOTE]
> All new database tables must follow the Drizzle migration naming standards (use a meaningful `--name` parameter when running generate) and apply the Realtime and Pagination standards defined in these docs.
