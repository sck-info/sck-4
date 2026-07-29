import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feedbacks, bookings, users, offeringSubCategories } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const activeReviews = await db
      .select({
        id: feedbacks.id,
        rating: feedbacks.rating,
        rawFeedback: feedbacks.rawFeedback,
        enhancedFeedback: feedbacks.enhancedFeedback,
        user: {
          name: users.name,
          image: users.image,
        },
        subCategory: {
          name: offeringSubCategories.name,
        },
      })
      .from(feedbacks)
      .innerJoin(bookings, eq(feedbacks.bookingId, bookings.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .innerJoin(offeringSubCategories, eq(bookings.subCategoryId, offeringSubCategories.id))
      .where(eq(feedbacks.isActive, true))
      .orderBy(desc(feedbacks.createdAt));

    const formatted = activeReviews.map((r) => ({
      name: r.user.name,
      role: "Client",
      text: r.enhancedFeedback || r.rawFeedback,
      rating: r.rating,
      therapy: r.subCategory.name,
      avatar: r.user.image || null,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error("GET active feedbacks error:", err);
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}
