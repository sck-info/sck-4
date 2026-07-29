import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subCategoryQuestions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, questionId } = await params;

    const [deletedLink] = await db
      .delete(subCategoryQuestions)
      .where(
        and(
          eq(subCategoryQuestions.subCategoryId, id),
          eq(subCategoryQuestions.questionId, questionId)
        )
      )
      .returning();

    if (!deletedLink) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedLink });
  } catch (err) {
    console.error("DELETE sub-category question link error:", err);
    return NextResponse.json({ error: "Failed to unlink question" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, questionId } = await params;
    const body = await req.json();
    const { isRequired, sortOrder } = body;

    const [updatedLink] = await db
      .update(subCategoryQuestions)
      .set({
        ...(isRequired !== undefined && { isRequired }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      })
      .where(
        and(
          eq(subCategoryQuestions.subCategoryId, id),
          eq(subCategoryQuestions.questionId, questionId)
        )
      )
      .returning();

    if (!updatedLink) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedLink });
  } catch (err) {
    console.error("PATCH sub-category question link error:", err);
    return NextResponse.json({ error: "Failed to update link details" }, { status: 500 });
  }
}
