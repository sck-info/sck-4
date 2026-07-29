import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, offeringSubCategories, offeringSlots, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

const WHATSAPP_GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || "http://localhost:3001";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const ADMIN_NOTIFICATION_PHONE = process.env.ADMIN_NOTIFICATION_PHONE;

async function sendWhatsApp(to: string, message: string) {
  if (!WHATSAPP_API_TOKEN) return;
  try {
    const formattedPhone = to.replace(/\+/g, "").replace(/\D/g, "");
    await fetch(`${WHATSAPP_GATEWAY_URL}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: formattedPhone,
        message,
        token: WHATSAPP_API_TOKEN,
      }),
    });
  } catch (err) {
    console.error("Failed to send WhatsApp message:", err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, reason } = body;

    if (!bookingId || !reason) {
      return NextResponse.json({ error: "Booking ID and reason are required" }, { status: 400 });
    }

    // Fetch existing booking
    const existing = await db
      .select({
        id: bookings.id,
        status: bookings.status,
        user: {
          name: users.name,
        },
        subCategory: {
          name: offeringSubCategories.name,
        },
        slot: {
          slotDate: offeringSlots.slotDate,
        },
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .innerJoin(offeringSubCategories, eq(bookings.subCategoryId, offeringSubCategories.id))
      .leftJoin(offeringSlots, eq(bookings.slotId, offeringSlots.id))
      .where(and(eq(bookings.id, bookingId), eq(bookings.userId, session.user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const bookingData = existing[0];
    const allowedStatuses = ["pending", "confirmed"];
    if (!allowedStatuses.includes(bookingData.status)) {
      return NextResponse.json({ error: "Booking status cannot request cancellation" }, { status: 400 });
    }

    const [updated] = await db
      .update(bookings)
      .set({
        status: "cancellation_pending" as any,
        userCancellationReason: reason,
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Trigger Admin Notification
    if (ADMIN_NOTIFICATION_PHONE) {
      const dateStr = bookingData.slot ? String(bookingData.slot.slotDate) : "TBD";
      const adminMsg = `User ${bookingData.user.name} requested cancellation for ${bookingData.subCategory.name} on date ${dateStr}.\n\nReason: ${reason}`;
      await sendWhatsApp(ADMIN_NOTIFICATION_PHONE, adminMsg);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("POST booking cancel error:", err);
    return NextResponse.json({ error: "Failed to request cancellation" }, { status: 500 });
  }
}
