import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feedbacks } from "@/db/schema";
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
    const { enhancedFeedback, isActive } = body;

    const updateFields: any = {};
    if (enhancedFeedback !== undefined) updateFields.enhancedFeedback = enhancedFeedback;
    if (isActive !== undefined) updateFields.isActive = isActive;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const [updatedFeedback] = await db
      .update(feedbacks)
      .set(updateFields)
      .where(eq(feedbacks.id, id))
      .returning();

    if (!updatedFeedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedFeedback });
  } catch (err) {
    console.error("PATCH feedback error:", err);
    return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
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

    const [deletedFeedback] = await db
      .delete(feedbacks)
      .where(eq(feedbacks.id, id))
      .returning();

    if (!deletedFeedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedFeedback });
  } catch (err) {
    console.error("DELETE feedback error:", err);
    return NextResponse.json({ error: "Failed to delete feedback" }, { status: 500 });
  }
}
