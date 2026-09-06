import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marquees } from "@/db/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { enforceCronSecurity } from "@/lib/cron-guard";
import { getTodayIST } from "@/lib/format";

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
    const todayIST = getTodayIST(); // "YYYY-MM-DD"
    console.log(`[Cron: Marquees] Running midnight check for marquees on ${todayIST}`);

    // Today at 00:00:00 IST
    // A marquee with endDate "2026-09-09" should remain active until end of 09-09.
    // Starting on 10-09-2026 00:00:00, it must become inactive.
    const startOfToday = new Date(`${todayIST}T00:00:00.000+05:30`);

    // Deactivate all active marquees whose endDate is strictly before start of today
    const deactivated = await db
      .update(marquees)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(marquees.isActive, true),
          sql`${marquees.endDate} < ${startOfToday.toISOString()}`
        )
      )
      .returning({
        id: marquees.id,
        title: marquees.title,
        endDate: marquees.endDate,
      });

    console.log(
      `[Cron: Marquees] Successfully shifted ${deactivated.length} marquee(s) to inactive.`
    );

    return NextResponse.json({
      success: true,
      todayIST,
      deactivatedCount: deactivated.length,
      deactivated,
    });
  } catch (err: any) {
    console.error("Marquees cron error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process marquee expiration cron." },
      { status: 500 }
    );
  }
}
