import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marquees } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();

    // Query the currently active marquee
    const activeList = await db
      .select()
      .from(marquees)
      .where(eq(marquees.isActive, true))
      .orderBy(desc(marquees.updatedAt))
      .limit(1);

    const active = activeList[0];

    if (!active) {
      return NextResponse.json({ data: null });
    }

    // 1. Check if End Date has passed
    // If end_date is 09-09-2026, it is visible throughout 09-09-2026 until 23:59:59.
    // From 10-09-2026 00:00:00 onwards, it must not be visible.
    if (active.endDate) {
      const endOfEndDay = new Date(active.endDate);
      endOfEndDay.setHours(23, 59, 59, 999);

      if (now.getTime() > endOfEndDay.getTime()) {
        // Automatically deactivate expired marquee
        await db
          .update(marquees)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(marquees.id, active.id));

        return NextResponse.json({ data: null });
      }
    }

    // 2. Check if Start Date is in the future
    if (active.startDate) {
      const startOfStartDay = new Date(active.startDate);
      startOfStartDay.setHours(0, 0, 0, 0);

      if (now.getTime() < startOfStartDay.getTime()) {
        // Scheduled for future
        return NextResponse.json({ data: null });
      }
    }

    return NextResponse.json({ data: active });
  } catch (err: any) {
    console.error("GET /api/marquees/active error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch active marquee" },
      { status: 500 }
    );
  }
}
