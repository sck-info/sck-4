import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feedbacks, bookings, users, offeringSubCategories } from "@/db/schema";
import { auth } from "@/lib/auth";
import { desc, sql, eq, and, or, ilike } from "drizzle-orm";
import { parsePaginationParams, createPaginationMeta } from "@/lib/pagination";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);

    const conditions = [];

    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      conditions.push(
        or(
          ilike(users.name, searchPattern),
          ilike(offeringSubCategories.name, searchPattern),
          ilike(feedbacks.rawFeedback, searchPattern),
          ilike(feedbacks.enhancedFeedback, searchPattern)
        ) as any
      );
    }

    const ratingQuery = searchParams.get("rating");
    if (ratingQuery && ratingQuery !== "all") {
      conditions.push(eq(feedbacks.rating, parseInt(ratingQuery) || 0));
    }

    const statusQuery = searchParams.get("status");
    if (statusQuery === "active") {
      conditions.push(eq(feedbacks.isActive, true));
    } else if (statusQuery === "inactive") {
      conditions.push(eq(feedbacks.isActive, false));
    }

    const condition = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(feedbacks)
      .innerJoin(bookings, eq(feedbacks.bookingId, bookings.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .innerJoin(offeringSubCategories, eq(bookings.subCategoryId, offeringSubCategories.id))
      .where(condition);

    const total = Number(countResult[0]?.count || 0);

    const data = await db
      .select({
        id: feedbacks.id,
        rating: feedbacks.rating,
        comments: feedbacks.rawFeedback,
        enhancedFeedback: feedbacks.enhancedFeedback,
        isActive: feedbacks.isActive,
        createdAt: feedbacks.createdAt,
        userName: users.name,
        subCategoryName: offeringSubCategories.name,
      })
      .from(feedbacks)
      .innerJoin(bookings, eq(feedbacks.bookingId, bookings.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .innerJoin(offeringSubCategories, eq(bookings.subCategoryId, offeringSubCategories.id))
      .where(condition)
      .orderBy(desc(feedbacks.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data,
      pagination: createPaginationMeta({ page, limit, total }),
    });
  } catch (err) {
    console.error("GET feedbacks error:", err);
    return NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 });
  }
}
