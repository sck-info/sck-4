# Database Operations Sheet & Runbook

This operations sheet provides direct commands and step-by-step procedures for managing database migrations, custom SQL scripts, triggers, realtime settings, and database seeding.

---

## 1. Drizzle Migrations

We use **Drizzle ORM** and **Drizzle Kit** to manage schemas and database migrations.

### Step 1: Generate the Migration File
When you alter or create schemas under `src/db/schema/`, you must generate a new migration SQL file.
> [!IMPORTANT]
> You **must** provide a meaningful name using the `--name` parameter to describe what the migration accomplishes. Do not leave the name blank (which generates random timestamp names).

```bash
# Generate migration with a descriptive name
npx drizzle-kit generate --name add_new_feature_table
```

### Step 2: Apply the Migration
After generating the migration SQL file, apply the changes to your target database:

```bash
# Run migration
npm run db:migrate
```

---

## 2. Custom SQL Triggers, Functions, & Realtime

Once migrations are applied, you must register custom SQL trigger functions, bind them to the database tables, and update Supabase publication rules.

### Execute All Setup Commands (Recommended)
This runs the function registration, table trigger attachments, and realtime publication alterations in sequence:

```bash
npm run db:setup-all
```

### Running Individual SQL Steps
If you need to update only a specific layer of the system:

```bash
# 1. Update/Create the universal trigger function notify_app_event()
npm run db:function

# 2. Attach trigger hooks onto system tables
npm run db:trigger

# 3. Alter replica identity and publication streams for Supabase Realtime
npm run db:realtime
```

---

## 3. Database Seeding

To populate the database with default roles, administrative accounts, slides, and starter gallery content:

```bash
# Run the main seed script
npx tsx src/db/seed.ts

# Run separate seed files
npx tsx src/db/seed-metrics.ts
npx tsx src/db/seed-about-slides.ts
npx tsx src/db/seed-gallery.ts
```
