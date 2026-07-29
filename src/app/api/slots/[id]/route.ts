import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offeringSlots, slotLocationsMap } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

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
    const { status, locationIds } = body;

    const updateFields: any = {};
    if (status !== undefined) {
      const validStatuses = ["available", "booked", "suspended"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updateFields.status = status;
    }

    const updatedSlot = await db.transaction(async (tx) => {
      let slotRecord = null;
      if (Object.keys(updateFields).length > 0) {
        const [res] = await tx
          .update(offeringSlots)
          .set(updateFields)
          .where(eq(offeringSlots.id, id))
          .returning();
        slotRecord = res;
      } else {
        const res = await tx
          .select()
          .from(offeringSlots)
          .where(eq(offeringSlots.id, id))
          .limit(1);
        slotRecord = res[0];
      }

      if (!slotRecord) return null;

      if (locationIds !== undefined) {
        // Sync locations mapping
        await tx.delete(slotLocationsMap).where(eq(slotLocationsMap.slotId, id));
        if (Array.isArray(locationIds) && locationIds.length > 0) {
          for (const locId of locationIds) {
            await tx.insert(slotLocationsMap).values({
              slotId: id,
              locationId: locId,
            });
          }
        }
      }

      return slotRecord;
    });

    if (!updatedSlot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedSlot });
  } catch (err) {
    console.error("PATCH slot error:", err);
    return NextResponse.json({ error: "Failed to update slot" }, { status: 500 });
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

    const [deletedSlot] = await db
      .delete(offeringSlots)
      .where(eq(offeringSlots.id, id))
      .returning();

    if (!deletedSlot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedSlot });
  } catch (err) {
    console.error("DELETE slot error:", err);
    return NextResponse.json({ error: "Failed to delete slot" }, { status: 500 });
  }
}
