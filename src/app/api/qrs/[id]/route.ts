import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentQrs } from "@/db/schema";
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
    const { name, qrImageUrl } = body;

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (qrImageUrl !== undefined) updateFields.qrImageUrl = qrImageUrl;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const [updatedQR] = await db
      .update(paymentQrs)
      .set(updateFields)
      .where(eq(paymentQrs.id, id))
      .returning();

    if (!updatedQR) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedQR });
  } catch (err) {
    console.error("PATCH QR error:", err);
    return NextResponse.json({ error: "Failed to update QR code" }, { status: 500 });
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

    const [deletedQR] = await db
      .delete(paymentQrs)
      .where(eq(paymentQrs.id, id))
      .returning();

    if (!deletedQR) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedQR });
  } catch (err) {
    console.error("DELETE QR error:", err);
    return NextResponse.json({ error: "Failed to delete QR code" }, { status: 500 });
  }
}
