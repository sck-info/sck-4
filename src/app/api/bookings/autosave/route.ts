import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingDrafts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { subCategoryId, slotId, selectedFormat, selectedLocationId, formResponses } = body;

    if (!subCategoryId) {
      return NextResponse.json({ error: "Missing subCategoryId" }, { status: 400 });
    }

    // Check if draft already exists
    const existing = await db
      .select()
      .from(bookingDrafts)
      .where(
        and(
          eq(bookingDrafts.userId, userId),
          eq(bookingDrafts.subCategoryId, subCategoryId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update
      const draftId = existing[0].id;
      await db
        .update(bookingDrafts)
        .set({
          slotId: slotId || null,
          selectedFormat: selectedFormat || null,
          selectedLocationId: selectedLocationId || null,
          formResponses: formResponses || {},
          updatedAt: new Date(),
        })
        .where(eq(bookingDrafts.id, draftId));

      return NextResponse.json({ success: true, id: draftId, action: "updated" });
    } else {
      // Insert
      const [inserted] = await db
        .insert(bookingDrafts)
        .values({
          userId,
          subCategoryId,
          slotId: slotId || null,
          selectedFormat: selectedFormat || null,
          selectedLocationId: selectedLocationId || null,
          formResponses: formResponses || {},
        })
        .returning({ id: bookingDrafts.id });

      return NextResponse.json({ success: true, id: inserted.id, action: "inserted" });
    }
  } catch (err: any) {
    console.error("Booking autosave error:", err);
    return NextResponse.json({ error: err.message || "Failed to autosave progress" }, { status: 500 });
  }
}
