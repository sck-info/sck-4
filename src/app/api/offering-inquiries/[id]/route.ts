import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offeringInquiries } from "@/db/schema";
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
    const { name, phoneCode, phone, email, status, notes } = body;

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateFields.name = name.trim();
    if (phoneCode !== undefined) updateFields.phoneCode = phoneCode;
    if (phone !== undefined) updateFields.phone = phone.replace(/\D/g, "");
    if (email !== undefined) updateFields.email = email ? email.trim() : null;
    if (status !== undefined) {
      const validStatuses = ["pending", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updateFields.status = status;
    }
    if (notes !== undefined) updateFields.notes = notes;

    const [updated] = await db
      .update(offeringInquiries)
      .set(updateFields)
      .where(eq(offeringInquiries.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Offering inquiry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("PATCH offering-inquiries error:", err);
    return NextResponse.json({ error: err.message || "Failed to update inquiry." }, { status: 500 });
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

    const [deleted] = await db
      .delete(offeringInquiries)
      .where(eq(offeringInquiries.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Offering inquiry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Inquiry deleted successfully." });
  } catch (err: any) {
    console.error("DELETE offering-inquiries error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete inquiry." }, { status: 500 });
  }
}
