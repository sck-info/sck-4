import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { enforceCronSecurity } from "@/lib/cron-guard";

export async function GET(req: Request) {
  return handleCron(req);
}

export async function POST(req: Request) {
  return handleCron(req);
}

async function handleCron(req: Request) {
  const auth = enforceCronSecurity(req, true);
  if (!auth.allowed) {
    return auth.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.execute(sql`
      UPDATE users
      SET age = date_part('year', age(current_date, date_of_birth))
      WHERE date_of_birth IS NOT NULL;
    `);

    return NextResponse.json({ success: true, message: "User ages updated successfully." });
  } catch (err: any) {
    console.error("Age update cron error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process age update cron." },
      { status: 500 }
    );
  }
}
