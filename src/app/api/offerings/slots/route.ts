import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offeringSlots, slotLocationsMap, sessionLocations } from "@/db/schema";
import { eq, and, gt, asc } from "drizzle-orm";
import { getTodayIST } from "@/lib/format";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subCategoryId = searchParams.get("subCategoryId");

    if (!subCategoryId) {
      return NextResponse.json({ error: "subCategoryId is required" }, { status: 400 });
    }

    const todayStr = getTodayIST();

    const slots = await db
      .select()
      .from(offeringSlots)
      .where(
        and(
          eq(offeringSlots.subCategoryId, subCategoryId),
          eq(offeringSlots.status, "available" as any), // satisfy enum type
          gt(offeringSlots.slotDate, todayStr)
        )
      )
      .orderBy(asc(offeringSlots.slotDate), asc(offeringSlots.startTime));

    const data = await Promise.all(
      slots.map(async (slot) => {
        const locations = await db
          .select({
            id: sessionLocations.id,
            name: sessionLocations.name,
            type: sessionLocations.type,
            url: sessionLocations.url,
          })
          .from(slotLocationsMap)
          .innerJoin(sessionLocations, eq(slotLocationsMap.locationId, sessionLocations.id))
          .where(eq(slotLocationsMap.slotId, slot.id));

        return {
          ...slot,
          locations,
        };
      })
    );

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("GET public slots error:", err);
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
  }
}
