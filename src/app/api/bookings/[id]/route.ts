import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, users, offeringSubCategories, offeringSlots, sessionLocations } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { formatDate, formatTimeRange } from "@/lib/format";

const WHATSAPP_GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || "http://localhost:3001";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, adminCancellationReason } = body;

    const validStatuses = ["confirmed", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Fetch existing booking with details
    const existing = await db
      .select({
        id: bookings.id,
        slotId: bookings.slotId,
        selectedFormat: bookings.selectedFormat,
        selectedLocationId: bookings.selectedLocationId,
        user: {
          name: users.name,
          phone: users.phone,
          phoneCode: users.phoneCode,
        },
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
      .innerJoin(users, eq(bookings.userId, users.id))
      .innerJoin(offeringSubCategories, eq(bookings.subCategoryId, offeringSubCategories.id))
      .leftJoin(offeringSlots, eq(bookings.slotId, offeringSlots.id))
      .where(eq(bookings.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const bookingData = existing[0];
    const userPhone = `${bookingData.user.phoneCode || "91"}${bookingData.user.phone}`;

    await db.transaction(async (tx) => {
      // Update booking status
      await tx
        .update(bookings)
        .set({
          status,
          adminCancellationReason: adminCancellationReason || null,
        })
        .where(eq(bookings.id, id));

      // If cancelled, free up the slot
      if (status === "cancelled" && bookingData.slotId) {
        await tx
          .update(offeringSlots)
          .set({ status: "available" })
          .where(eq(offeringSlots.id, bookingData.slotId));
      }
    });

    // Trigger WhatsApp notification depending on state
    if (status === "confirmed") {
      let formatLabel = bookingData.selectedFormat || "Online";
      let locationLink = "";

      if (bookingData.selectedLocationId) {
        const loc = await db
          .select()
          .from(sessionLocations)
          .where(eq(sessionLocations.id, bookingData.selectedLocationId))
          .limit(1);
        if (loc.length > 0) {
          locationLink = loc[0].url;
          formatLabel = loc[0].type === "online" ? "Online" : "Offline";
        }
      }

      const dateStr = bookingData.slot ? formatDate(bookingData.slot.slotDate) : "TBD";
      const timingStr = bookingData.slot
        ? formatTimeRange(bookingData.slot.startTime, bookingData.slot.endTime)
        : "TBD";

      const message = `Dear ${bookingData.user.name},\n\nYour booking for ${bookingData.subCategory.name} has been CONFIRMED!\n\n📅 Date: ${dateStr}\n⏰ Time: ${timingStr}\n🌐 Format: ${formatLabel}\n🔗 Session Link/Map: ${locationLink}\n\nThank you,\nSharath Kancherla Admin Team.`;
      await sendWhatsApp(userPhone, message);

    } else if (status === "cancelled") {
      const dateStr = bookingData.slot ? formatDate(bookingData.slot.slotDate) : "TBD";
      const reason = adminCancellationReason || "Rescheduling conflict";
      const message = `Dear ${bookingData.user.name},\n\nYour booking for ${bookingData.subCategory.name} on date ${dateStr} has been cancelled.\n\nReason: ${reason}\n\nThank you,\nSharath Kancherla Admin Team.`;
      await sendWhatsApp(userPhone, message);

    } else if (status === "completed") {
      const feedbackUrl = `${APP_URL}/feedback?bookingId=${id}`;
      const message = `Dear ${bookingData.user.name},\n\nThank you for attending your session for ${bookingData.subCategory.name}.\n\nWe would appreciate it if you could share your feedback with us here:\n${feedbackUrl}\n\nThank you,\nSharath Kancherla Admin Team.`;
      await sendWhatsApp(userPhone, message);
    }

    return NextResponse.json({ success: true, message: `Booking status updated to ${status}` });
  } catch (err) {
    console.error("PATCH booking error:", err);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Retrieve slotId before deletion
    const existing = await db
      .select({ slotId: bookings.slotId })
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    await db.transaction(async (tx) => {
      // If there is an associated slot, free it up
      if (existing[0].slotId) {
        await tx
          .update(offeringSlots)
          .set({ status: "available" })
          .where(eq(offeringSlots.id, existing[0].slotId));
      }

      await tx.delete(bookings).where(eq(bookings.id, id));
    });

    return NextResponse.json({ success: true, message: "Booking deleted successfully" });
  } catch (err) {
    console.error("DELETE booking error:", err);
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
  }
}
