# Database & Triggers Guide

This guide covers the database structure, custom migrations, database functions, triggers, and live replication configurations used in this project.

## Database Overview & Drizzle Migrations

We use **PostgreSQL** (hosted on Supabase) as our primary relational database, coupled with **Drizzle ORM** for schema declaration and migrations.

### Migrations Workflow
When updating database schemas, you must generate and apply migrations using Drizzle:

1.  **Generate Migration**: Always write migrations using `drizzle-kit generate`. You **must** provide a meaningful name using the `--name` parameter to describe what the schema change contains (e.g. `add_user_roles`). Do not use random/timestamp names.
    ```bash
    npx drizzle-kit generate --name <meaningful_name>
    ```
2.  **Migrate**: Apply the migration scripts to update the database schema structure:
    ```bash
    npm run db:migrate
    ```

### DB Schema Files
The schemas are written in TypeScript under `src/db/schema/` and compiled to SQL using Drizzle Kit:
*   [users.ts](file:///d:/sck/sck-4/src/db/schema/users.ts) — Authentication accounts.
*   [roles.ts](file:///d:/sck/sck-4/src/db/schema/roles.ts) — System access roles (`ADMIN`, etc.).
*   [contacts.ts](file:///d:/sck/sck-4/src/db/schema/contacts.ts) — Dynamic contact information details.
*   [metrics.ts](file:///d:/sck/sck-4/src/db/schema/metrics.ts) — Numeric landing page impact metrics.
*   [about_slides.ts](file:///d:/sck/sck-4/src/db/schema/about_slides.ts) — Slideshow asset attributes.
*   [gallery.ts](file:///d:/sck/sck-4/src/db/schema/gallery.ts) — Masonry image gallery cards.

---

## DB Apply and Setup Scripts

Rather than writing migrations for everything, dynamic application events and subscription channels are applied through raw SQL scripts loaded on top of our schema.

We manage these scripts in the `triggers/` directory:
1.  **[universal_function.sql](file:///d:/sck/sck-4/triggers/universal_function.sql)**: Contains the central trigger handler `notify_app_event()` that serializes database rows to JSON, filters sensitive fields, and executes `pg_notify`.
2.  **[universal_triggers.sql](file:///d:/sck/sck-4/triggers/universal_triggers.sql)**: Registers the triggers against system tables (e.g. `roles`, `users`, `contacts`, `metrics`, etc.) to trigger on `INSERT`, `UPDATE`, or `DELETE`.
3.  **[realtime.sql](file:///d:/sck/sck-4/triggers/realtime.sql)**: Configures all tables for Supabase Realtime pub/sub by altering their replica identity, adding tables to the `supabase_realtime` publication, and creating default select policies.

### Running SQL Scripts via Node.js
We use a runner utility script [db-apply.ts](file:///d:/sck/sck-4/scripts/db-apply.ts) which uses the `pg` client to establish a secure pool connection via the `DATABASE_URL` environment variable:

```bash
# To run individual files
npx tsx scripts/db-apply.ts triggers/universal_function.sql
npx tsx scripts/db-apply.ts triggers/universal_triggers.sql
npx tsx scripts/db-apply.ts triggers/realtime.sql

# To apply all at once (Recommended)
npm run db:setup-all
```

---

## Custom Database Triggers & pg_notify

The core mechanism for our reactive client state is the `notify_app_event` database function:

```sql
CREATE OR REPLACE FUNCTION notify_app_event()
RETURNS trigger AS $$
DECLARE
  rec RECORD;
  safe_data jsonb;
BEGIN
  rec := COALESCE(NEW, OLD);
  
  -- Prevent leaking credentials
  safe_data := to_jsonb(rec) - 'password' - 'two_factor_secret';

  PERFORM pg_notify(
    'app_events',
    json_build_object(
      'table', TG_TABLE_NAME,
      'action', TG_OP,
      'id', rec.id,
      'data', safe_data,
      'timestamp', now()
    )::text
  );

  RETURN rec;
END;
$$ LANGUAGE plpgsql;
```

When an event triggers, a PostgreSQL notification is broadcasted to the `app_events` listener. Our backend and client listeners leverage this stream to capture updates instantly.

> [!WARNING]
> When adding new tables to the project, remember to update `triggers/universal_triggers.sql` and `triggers/realtime.sql` to include the new table, then run `npm run db:setup-all` to register them in the database.
