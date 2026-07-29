import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, offeringSubCategories, offeringSlots } from "@/db/schema";
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
        status: bookings.status,
        subCategory: {
          name: offeringSubCategories.name,
        },
        slot: {
          slotDate: offeringSlots.slotDate,
          startTime: offeringSlots.startTime,
          endTime: offeringSlots.endTime,
        },
      })
      .from(bookings)
      .innerJoin(offeringSubCategories, eq(bookings.subCategoryId, offeringSubCategories.id))
      .leftJoin(offeringSlots, eq(bookings.slotId, offeringSlots.id))
      .where(and(eq(bookings.id, bookingId), eq(bookings.userId, session.user.id)))
      .limit(1);

    if (list.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: list[0] });
  } catch (err) {
    console.error("GET booking detail error:", err);
    return NextResponse.json({ error: "Failed to fetch booking details" }, { status: 500 });
  }
}
