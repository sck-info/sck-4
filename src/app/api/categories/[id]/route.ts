import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offeringCategories } from "@/db/schema";
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
    const { name, description, sanskritText, sanskritMeaning, sortOrder, isActive } = body;

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (sanskritText !== undefined) updateFields.sanskritText = sanskritText;
    if (sanskritMeaning !== undefined) updateFields.sanskritMeaning = sanskritMeaning;
    if (sortOrder !== undefined) updateFields.sortOrder = sortOrder;
    if (isActive !== undefined) updateFields.isActive = isActive;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const [updatedCategory] = await db
      .update(offeringCategories)
      .set(updateFields)
      .where(eq(offeringCategories.id, id))
      .returning();

    if (!updatedCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedCategory });
  } catch (err) {
    console.error("PATCH category error:", err);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
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

    const [deletedCategory] = await db
      .delete(offeringCategories)
      .where(eq(offeringCategories.id, id))
      .returning();

    if (!deletedCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedCategory });
  } catch (err) {
    console.error("DELETE category error:", err);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
