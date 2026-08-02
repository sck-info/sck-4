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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

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
    if (startDate) {
      conditions.push(sql`date(${offeringSlots.slotDate}) >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`date(${offeringSlots.slotDate}) <= ${endDate}`);
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
    const {
      subCategoryId,
      locationIds,
      repeatType = "once",
      slotDate,
      startDate,
      endDate,
      daysOfWeek = [],
      timings,
    } = body;

    if (!subCategoryId) {
      return NextResponse.json({ error: "Missing offering sub-category" }, { status: 400 });
    }

    // Fallback for single slot inputs to maintain backward compatibility
    let finalTimings = timings;
    if (!finalTimings && body.startTime && body.endTime) {
      finalTimings = [{ startTime: body.startTime, endTime: body.endTime }];
    }

    if (!finalTimings || !Array.isArray(finalTimings) || finalTimings.length === 0) {
      return NextResponse.json({ error: "Please specify at least one timings slot" }, { status: 400 });
    }

    // Validate times
    for (const t of finalTimings) {
      if (!t.startTime || !t.endTime) {
        return NextResponse.json({ error: "Timings must specify start and end times" }, { status: 400 });
      }
      if (t.startTime >= t.endTime) {
        return NextResponse.json({ error: "End time must be greater than start time" }, { status: 400 });
      }
    }

    // Calculate the array of local target dates based on repeat selection
    let dates: string[] = [];
    if (repeatType === "once") {
      const targetDate = slotDate || body.slotDate;
      if (!targetDate) {
        return NextResponse.json({ error: "Missing slotDate for one-time slot" }, { status: 400 });
      }
      dates = [targetDate];
    } else if (repeatType === "daily" || repeatType === "weekly") {
      if (!startDate || !endDate) {
        return NextResponse.json({ error: "Missing startDate or endDate for repeating slots" }, { status: 400 });
      }

      const parseLocalDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split("-").map(Number);
        return new Date(y, m - 1, d);
      };

      const start = parseLocalDate(startDate);
      const end = parseLocalDate(endDate);
      if (start > end) {
        return NextResponse.json({ error: "Start date must be on or before end date" }, { status: 400 });
      }

      let current = new Date(start);
      while (current <= end) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, "0");
        const dd = String(current.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        if (repeatType === "daily") {
          dates.push(dateStr);
        } else if (repeatType === "weekly") {
          const dayOfWeek = current.getDay(); // 0 = Sunday
          if (daysOfWeek.includes(dayOfWeek)) {
            dates.push(dateStr);
          }
        }
        current.setDate(current.getDate() + 1);
      }
    } else {
      return NextResponse.json({ error: "Invalid repeatType value" }, { status: 400 });
    }

    if (dates.length === 0) {
      return NextResponse.json({ error: "No target dates found for the specified range and weekday selections" }, { status: 400 });
    }

    const duplicates: { date: string; startTime: string; endTime: string; subCategoryName: string }[] = [];
    let createdCount = 0;

    // Perform validation and insert inside a transaction
    await db.transaction(async (tx) => {
      for (const date of dates) {
        for (const timing of finalTimings) {
          // Check for clashing overlapping slots on this date
          const clashing = await tx
            .select({
              id: offeringSlots.id,
              subCategoryId: offeringSlots.subCategoryId,
              slotDate: offeringSlots.slotDate,
              startTime: offeringSlots.startTime,
              endTime: offeringSlots.endTime,
              subCategoryName: offeringSubCategories.name,
            })
            .from(offeringSlots)
            .innerJoin(offeringSubCategories, eq(offeringSlots.subCategoryId, offeringSubCategories.id))
            .where(
              and(
                eq(offeringSlots.slotDate, date),
                sql`${offeringSlots.status} != 'suspended'`,
                sql`${offeringSlots.startTime} < ${timing.endTime}::time`,
                sql`${offeringSlots.endTime} > ${timing.startTime}::time`
              )
            );

          if (clashing.length > 0) {
            duplicates.push({
              date,
              startTime: timing.startTime,
              endTime: timing.endTime,
              subCategoryName: clashing[0].subCategoryName,
            });
          } else {
            // Insert single slot timing
            const [newSlot] = await tx
              .insert(offeringSlots)
              .values({
                subCategoryId,
                slotDate: date,
                startTime: timing.startTime,
                endTime: timing.endTime,
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
            createdCount++;
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      createdCount,
      skippedCount: duplicates.length,
      duplicates,
    });
  } catch (err) {
    console.error("POST slots error:", err);
    return NextResponse.json({ error: "Failed to create slots" }, { status: 500 });
  }
}
