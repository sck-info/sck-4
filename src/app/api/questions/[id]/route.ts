import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formQuestions } from "@/db/schema";
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
    const { fieldLabel, fieldType, options, allowOther } = body;

    const updateFields: any = {};
    if (fieldLabel !== undefined) updateFields.fieldLabel = fieldLabel;
    if (fieldType !== undefined) {
      const validTypes = [
        "short_answer",
        "long_answer",
        "date",
        "time",
        "number",
        "star_rating",
        "single_select",
        "multi_select",
        "url",
      ];
      if (!validTypes.includes(fieldType)) {
        return NextResponse.json({ error: "Invalid field type" }, { status: 400 });
      }
      updateFields.fieldType = fieldType;
    }
    if (options !== undefined) updateFields.options = options || null;
    if (allowOther !== undefined) updateFields.allowOther = allowOther;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const [updatedQuestion] = await db
      .update(formQuestions)
      .set(updateFields)
      .where(eq(formQuestions.id, id))
      .returning();

    if (!updatedQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedQuestion });
  } catch (err) {
    console.error("PATCH question error:", err);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
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

    const [deletedQuestion] = await db
      .delete(formQuestions)
      .where(eq(formQuestions.id, id))
      .returning();

    if (!deletedQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedQuestion });
  } catch (err) {
    console.error("DELETE question error:", err);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
