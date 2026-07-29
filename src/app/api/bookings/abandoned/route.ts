import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingDrafts, users, offeringSubCategories, offeringCategories, offeringSlots, sessionLocations } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, sql, desc, or, ilike } from "drizzle-orm";
import { parsePaginationParams, createPaginationMeta } from "@/lib/pagination";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");
    const subCategoryId = searchParams.get("subCategoryId");
    const isExport = searchParams.get("export") === "true";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
          users.phone ? ilike(users.phone, `%${search}%`) : undefined
        )
      );
    }
    if (startDate) {
      conditions.push(sql`date(${bookingDrafts.createdAt}) >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`date(${bookingDrafts.createdAt}) <= ${endDate}`);
    }
    if (categoryId) {
      conditions.push(eq(offeringSubCategories.categoryId, categoryId));
    }
    if (subCategoryId) {
      conditions.push(eq(bookingDrafts.subCategoryId, subCategoryId));
    }

    const condition = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookingDrafts)
      .innerJoin(users, eq(bookingDrafts.userId, users.id))
      .innerJoin(offeringSubCategories, eq(bookingDrafts.subCategoryId, offeringSubCategories.id))
      .where(condition);

    const total = Number(countResult[0]?.count || 0);

    const baseQuery = db
      .select({
        id: bookingDrafts.id,
        selectedFormat: bookingDrafts.selectedFormat,
        formResponses: bookingDrafts.formResponses,
        createdAt: bookingDrafts.createdAt,
        updatedAt: bookingDrafts.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
        },
        category: {
          id: offeringCategories.id,
          name: offeringCategories.name,
        },
        subCategory: {
          id: offeringSubCategories.id,
          name: offeringSubCategories.name,
        },
        slot: {
          id: offeringSlots.id,
          slotDate: offeringSlots.slotDate,
          startTime: offeringSlots.startTime,
          endTime: offeringSlots.endTime,
        },
        location: {
          id: sessionLocations.id,
          name: sessionLocations.name,
        },
      })
      .from(bookingDrafts)
      .innerJoin(users, eq(bookingDrafts.userId, users.id))
      .innerJoin(offeringSubCategories, eq(bookingDrafts.subCategoryId, offeringSubCategories.id))
      .innerJoin(offeringCategories, eq(offeringSubCategories.categoryId, offeringCategories.id))
      .leftJoin(offeringSlots, eq(bookingDrafts.slotId, offeringSlots.id))
      .leftJoin(sessionLocations, eq(bookingDrafts.selectedLocationId, sessionLocations.id))
      .where(condition)
      .orderBy(desc(bookingDrafts.updatedAt));

    if (!isExport) {
      baseQuery.limit(limit).offset(offset);
    }

    const data = await baseQuery;

    return NextResponse.json({
      data,
      pagination: isExport ? null : createPaginationMeta({ page, limit, total }),
    });
  } catch (err: any) {
    console.error("GET abandoned bookings error:", err);
    return NextResponse.json({ error: "Failed to fetch draft bookings" }, { status: 500 });
  }
}
