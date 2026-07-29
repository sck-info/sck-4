import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offeringSlots, slotLocationsMap, sessionLocations, offeringSubCategories } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, sql, desc } from "drizzle-orm";
import { parsePaginationParams, createPaginationMeta } from "@/lib/pagination";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);
    const subCategoryId = searchParams.get("subCategoryId");
    const status = searchParams.get("status");
    const dateParam = searchParams.get("date");

    const conditions = [];
    if (subCategoryId && subCategoryId !== "all") {
      conditions.push(eq(offeringSlots.subCategoryId, subCategoryId));
    }
    if (status && status !== "all") {
      conditions.push(eq(offeringSlots.status, status as any));
    }
    if (dateParam) {
      conditions.push(eq(offeringSlots.slotDate, dateParam));
    }
    const condition = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(offeringSlots)
      .where(condition);

    const total = Number(countResult[0]?.count || 0);

    const slots = await db
      .select({
        id: offeringSlots.id,
        subCategoryId: offeringSlots.subCategoryId,
        slotDate: offeringSlots.slotDate,
        startTime: offeringSlots.startTime,
        endTime: offeringSlots.endTime,
        status: offeringSlots.status,
        subCategoryName: offeringSubCategories.name,
      })
      .from(offeringSlots)
      .innerJoin(offeringSubCategories, eq(offeringSlots.subCategoryId, offeringSubCategories.id))
      .where(condition)
      .orderBy(desc(offeringSlots.slotDate), desc(offeringSlots.startTime))
      .limit(limit)
      .offset(offset);

    // Fetch locations mapping details for each slot
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

    return NextResponse.json({
      data,
      pagination: createPaginationMeta({ page, limit, total }),
    });
  } catch (err) {
    console.error("GET slots error:", err);
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subCategoryId, slotDate, startTime, endTime, locationIds } = body;

    if (!subCategoryId || !slotDate || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required slot fields" }, { status: 400 });
    }

    if (startTime >= endTime) {
      return NextResponse.json({ error: "End time must be greater than start time" }, { status: 400 });
    }

    // Double Booking Check: Query if there is an overlapping slot on the same date irrespective of subcategory
    const clashingSlots = await db
      .select()
      .from(offeringSlots)
      .where(
        and(
          eq(offeringSlots.slotDate, slotDate),
          sql`${offeringSlots.status} != 'suspended'`,
          sql`${offeringSlots.startTime} < ${endTime}::time`,
          sql`${offeringSlots.endTime} > ${startTime}::time`
        )
      );

    if (clashingSlots.length > 0) {
      return NextResponse.json(
        { error: "A slot already exists on the same date and overlapping time interval!" },
        { status: 400 }
      );
    }

    const newSlotResult = await db.transaction(async (tx) => {
      const [newSlot] = await tx
        .insert(offeringSlots)
        .values({
          subCategoryId,
          slotDate,
          startTime,
          endTime,
          status: "available",
        })
        .returning();

      if (Array.isArray(locationIds) && locationIds.length > 0) {
        for (const locId of locationIds) {
          await tx.insert(slotLocationsMap).values({
            slotId: newSlot.id,
            locationId: locId,
          });
        }
      }

      return newSlot;
    });

    return NextResponse.json({ success: true, data: newSlotResult });
  } catch (err) {
    console.error("POST slots error:", err);
    return NextResponse.json({ error: "Failed to create slot" }, { status: 500 });
  }
}
