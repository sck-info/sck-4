import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, users, offeringSubCategories, offeringSlots, feedbacks, offeringCategories } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, sql, desc, inArray, or, ilike } from "drizzle-orm";
import { parsePaginationParams, createPaginationMeta } from "@/lib/pagination";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);
    const status = searchParams.get("status");
    const statusGroup = searchParams.get("statusGroup");
    const subCategoryId = searchParams.get("subCategoryId");
    const categoryId = searchParams.get("categoryId");
    const categoryName = searchParams.get("category");
    const subCategoryName = searchParams.get("subCategory");
    const searchQuery = searchParams.get("search");

    const conditions = [];
    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      conditions.push(
        or(
          ilike(users.name, searchPattern),
          ilike(users.email, searchPattern),
          ilike(users.phone, searchPattern)
        ) as any
      );
    }

    if (status && status !== "all") {
      conditions.push(eq(bookings.status, status as any));
    } else if (statusGroup === "active") {
      conditions.push(
        inArray(bookings.status, ["pending", "confirmed", "cancellation_pending"] as any[])
      );
    } else if (statusGroup === "past") {
      conditions.push(
        inArray(bookings.status, ["completed", "cancelled"] as any[])
      );
    }
    if (subCategoryId) {
      conditions.push(eq(bookings.subCategoryId, subCategoryId));
    }
    if (categoryId) {
      conditions.push(eq(offeringSubCategories.categoryId, categoryId));
    }
    if (subCategoryName) {
      conditions.push(eq(offeringSubCategories.name, subCategoryName));
    }
    if (categoryName) {
      conditions.push(eq(offeringCategories.name, categoryName));
    }

    // Security Filter: non-admin users can ONLY retrieve their own bookings
    if (session.user.role !== "ADMIN") {
      conditions.push(eq(bookings.userId, session.user.id));
    }

    const condition = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .leftJoin(offeringSubCategories, eq(bookings.subCategoryId, offeringSubCategories.id))
      .leftJoin(offeringCategories, eq(offeringSubCategories.categoryId, offeringCategories.id))
      .where(condition);

    const total = Number(countResult[0]?.count || 0);

    const baseQuery = db
      .select({
        id: bookings.id,
        status: bookings.status,
        selectedFormat: bookings.selectedFormat,
        formResponses: bookings.formResponses,
        userCancellationReason: bookings.userCancellationReason,
        adminCancellationReason: bookings.adminCancellationReason,
        paymentReceiptUrl: bookings.paymentReceiptUrl,
        createdAt: bookings.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
        },
        category: {
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
        feedback: {
          id: feedbacks.id,
          rating: feedbacks.rating,
          rawFeedback: feedbacks.rawFeedback,
          enhancedFeedback: feedbacks.enhancedFeedback,
        },
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .innerJoin(offeringSubCategories, eq(bookings.subCategoryId, offeringSubCategories.id))
      .innerJoin(offeringCategories, eq(offeringSubCategories.categoryId, offeringCategories.id))
      .leftJoin(offeringSlots, eq(bookings.slotId, offeringSlots.id))
      .leftJoin(feedbacks, eq(bookings.id, feedbacks.bookingId))
      .where(condition)
      .orderBy(desc(bookings.createdAt));

    const isExport = searchParams.get("export") === "true";
    if (!isExport) {
      baseQuery.limit(limit).offset(offset);
    }

    const data = await baseQuery;

    return NextResponse.json({
      data,
      pagination: isExport ? null : createPaginationMeta({ page, limit, total }),
    });
  } catch (err) {
    console.error("GET bookings error:", err);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
