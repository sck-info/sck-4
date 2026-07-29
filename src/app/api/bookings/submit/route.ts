import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, offeringSlots, offeringSubCategories, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, gt } from "drizzle-orm";
import { uploadImages } from "@/lib/cloudinaryUpload";
import { formatDate } from "@/lib/format";

const WHATSAPP_GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || "http://localhost:3001";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const ADMIN_NOTIFICATION_PHONE = process.env.ADMIN_NOTIFICATION_PHONE;
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

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let subCategoryId = "";
    let slotId = null;
    let selectedFormat = null;
    let selectedLocationId = null;
    let formResponses = null;
    let paymentReceiptUrl = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      subCategoryId = formData.get("subCategoryId") as string;
      slotId = (formData.get("slotId") as string) || null;
      selectedFormat = (formData.get("selectedFormat") as string) || null;
      selectedLocationId = (formData.get("selectedLocationId") as string) || null;
      formResponses = JSON.parse((formData.get("formResponses") as string) || "{}");

      const file = formData.get("receiptFile") as File | null;
      if (file) {
        const urls = await uploadImages([file], "receipts");
        paymentReceiptUrl = urls[0];
      }
    } else {
      const body = await req.json();
      subCategoryId = body.subCategoryId;
      slotId = body.slotId;
      selectedFormat = body.selectedFormat;
      selectedLocationId = body.selectedLocationId;
      formResponses = body.formResponses;
    }

    if (!subCategoryId || !formResponses) {
      return NextResponse.json({ error: "Sub-category and form responses are required" }, { status: 400 });
    }

    // Verify sub-category exists
    const subCatList = await db
      .select()
      .from(offeringSubCategories)
      .where(eq(offeringSubCategories.id, subCategoryId))
      .limit(1);

    if (subCatList.length === 0) {
      return NextResponse.json({ error: "Offering sub-category not found" }, { status: 404 });
    }

    const subCategory = subCatList[0];

    // If slotId is provided, perform checks
    let slotRecord = null;
    if (slotId) {
      const todayStr = new Date().toISOString().split("T")[0];
      const slotList = await db
        .select()
        .from(offeringSlots)
        .where(
          and(
            eq(offeringSlots.id, slotId),
            eq(offeringSlots.subCategoryId, subCategoryId),
            eq(offeringSlots.status, "available" as any),
            gt(offeringSlots.slotDate, todayStr)
          )
        )
        .limit(1);

      if (slotList.length === 0) {
        return NextResponse.json({ error: "Selected time slot is no longer available" }, { status: 400 });
      }
      slotRecord = slotList[0];
    }

    const newBooking = await db.transaction(async (tx) => {
      const [res] = await tx
        .insert(bookings)
        .values({
          userId: session.user.id,
          slotId: slotId || null,
          subCategoryId,
          selectedFormat: selectedFormat || null,
          selectedLocationId: selectedLocationId || null,
          status: "pending" as any,
          formResponses,
          paymentReceiptUrl,
        })
        .returning();

      if (slotId) {
        await tx
          .update(offeringSlots)
          .set({ status: "booked" as any })
          .where(eq(offeringSlots.id, slotId));
      }

      return res;
    });

    // Fetch user details for notification
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (userList.length > 0) {
      const user = userList[0];
      const userPhone = `${user.phoneCode || "91"}${user.phone}`;
      const dateStr = slotRecord ? formatDate(slotRecord.slotDate) : "TBD";

      // 1. Send confirmation/receipt to User
      const userMsg = `Dear ${user.name},\n\nYour slot is pending for the booking ${subCategory.name} on date ${dateStr}.\n\nOur team will review and update you in 12-24 hours.\n\nThank you,\nSharath Kancherla Admin Team.`;
      await sendWhatsApp(userPhone, userMsg);

      // 2. Send Alert to Admin if number configured
      if (ADMIN_NOTIFICATION_PHONE) {
        const adminMsg = `New booking received from ${user.name} for ${subCategory.name}!\n\nReview details here: ${APP_URL}/dashboard/bookings`;
        await sendWhatsApp(ADMIN_NOTIFICATION_PHONE, adminMsg);
      }
    }

    return NextResponse.json({ success: true, data: newBooking });
  } catch (err) {
    console.error("POST booking submit error:", err);
    return NextResponse.json({ error: "Failed to submit booking" }, { status: 500 });
  }
}
