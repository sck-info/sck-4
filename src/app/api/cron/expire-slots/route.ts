import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offeringSlots } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";
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
    const todayIST = getTodayIST();
    console.log(`[Cron: Expire Slots] Executing expiration for unbooked slots on or before ${todayIST}`);

    // Update all unbooked ('available') slots whose date is <= todayIST to 'expired'
    const expiredSlots = await db
      .update(offeringSlots)
      .set({
        status: "expired",
      })
      .where(
        and(
          eq(offeringSlots.status, "available"),
          lte(offeringSlots.slotDate, todayIST)
        )
      )
      .returning({
        id: offeringSlots.id,
        slotDate: offeringSlots.slotDate,
        startTime: offeringSlots.startTime,
        endTime: offeringSlots.endTime,
      });

    console.log(`[Cron: Expire Slots] Successfully marked ${expiredSlots.length} slot(s) as expired.`);

    return NextResponse.json({
      success: true,
      todayIST,
      expiredCount: expiredSlots.length,
      expiredSlots,
    });
  } catch (err: any) {
    console.error("Expire slots cron error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process slot expiration cron." },
      { status: 500 }
    );
  }
}
