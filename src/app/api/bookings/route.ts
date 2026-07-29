import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, users, offeringSubCategories, offeringSlots, feedbacks } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, sql, desc } from "drizzle-orm";
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
    const subCategoryId = searchParams.get("subCategoryId");
    const categoryId = searchParams.get("categoryId");

    const conditions = [];
    if (status) {
      conditions.push(eq(bookings.status, status as any));
    }
    if (subCategoryId) {
      conditions.push(eq(bookings.subCategoryId, subCategoryId));
    }
    if (categoryId) {
      conditions.push(eq(offeringSubCategories.categoryId, categoryId));
    }

    // Security Filter: non-admin users can ONLY retrieve their own bookings
    if (session.user.role !== "ADMIN") {
      conditions.push(eq(bookings.userId, session.user.id));
    }

    const condition = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(condition);

    const total = Number(countResult[0]?.count || 0);

    const data = await db
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
        },
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .innerJoin(offeringSubCategories, eq(bookings.subCategoryId, offeringSubCategories.id))
      .leftJoin(offeringSlots, eq(bookings.slotId, offeringSlots.id))
      .leftJoin(feedbacks, eq(bookings.id, feedbacks.bookingId))
      .where(condition)
      .orderBy(desc(bookings.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data,
      pagination: createPaginationMeta({ page, limit, total }),
    });
  } catch (err) {
    console.error("GET bookings error:", err);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
