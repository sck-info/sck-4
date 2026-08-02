import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, offeringSubCategories, offeringSlots, feedbacks } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const list = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        status: bookings.status,
        subCategoryId: bookings.subCategoryId,
        subCategory: {
          id: offeringSubCategories.id,
          name: offeringSubCategories.name,
        },
        slot: {
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
      .innerJoin(offeringSubCategories, eq(bookings.subCategoryId, offeringSubCategories.id))
      .leftJoin(offeringSlots, eq(bookings.slotId, offeringSlots.id))
      .leftJoin(feedbacks, eq(bookings.id, feedbacks.bookingId))
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (list.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const item = list[0];
    if (item.userId !== session.user.id) {
      return NextResponse.json({ error: "This booking is not for you" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (err) {
    console.error("GET booking detail error:", err);
    return NextResponse.json({ error: "Failed to fetch booking details" }, { status: 500 });
  }
}
