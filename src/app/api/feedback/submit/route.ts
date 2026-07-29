import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feedbacks, bookings } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, rating, rawFeedback } = body;

    if (!bookingId || !rating || !rawFeedback) {
      return NextResponse.json({ error: "Booking ID, rating, and feedback text are required" }, { status: 400 });
    }

    // Verify booking is completed and belongs to user
    const bookingList = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.userId, session.user.id)))
      .limit(1);

    if (bookingList.length === 0) {
      return NextResponse.json({ error: "Completed booking not found" }, { status: 404 });
    }

    const booking = bookingList[0];
    if (booking.status !== ("completed" as any)) {
      return NextResponse.json({ error: "Feedback can only be submitted for completed sessions" }, { status: 400 });
    }

    // Verify if feedback is already submitted
    const existingFeedback = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.bookingId, bookingId))
      .limit(1);

    if (existingFeedback.length > 0) {
      return NextResponse.json({ error: "Feedback has already been submitted for this session" }, { status: 400 });
    }

    const [newFeedback] = await db
      .insert(feedbacks)
      .values({
        bookingId,
        rating,
        rawFeedback,
        isActive: false, // requires admin review/approve to showcase
      })
      .returning();

    return NextResponse.json({ success: true, data: newFeedback });
  } catch (err) {
    console.error("POST feedback submit error:", err);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
