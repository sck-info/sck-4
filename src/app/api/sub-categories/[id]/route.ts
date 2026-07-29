import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offeringSubCategories, paymentQrs } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subCategoryList = await db
      .select()
      .from(offeringSubCategories)
      .where(eq(offeringSubCategories.id, id))
      .limit(1);

    if (subCategoryList.length === 0) {
      return NextResponse.json({ error: "Sub-category not found" }, { status: 404 });
    }

    const subCategory = subCategoryList[0];

    let paymentQr = null;
    if (subCategory.paymentQrId) {
      const qrList = await db
        .select()
        .from(paymentQrs)
        .where(eq(paymentQrs.id, subCategory.paymentQrId))
        .limit(1);
      if (qrList.length > 0) {
        paymentQr = qrList[0];
      }
    }

    return NextResponse.json({ success: true, data: { subCategory, paymentQr } });
  } catch (err) {
    console.error("GET sub-category error:", err);
    return NextResponse.json({ error: "Failed to fetch sub-category" }, { status: 500 });
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
    const {
      categoryId,
      paymentQrId,
      name,
      description,
      topTags,
      tags,
      requiresBooking,
      sortOrder,
      isActive,
    } = body;

    const updateFields: any = {};
    if (categoryId !== undefined) updateFields.categoryId = categoryId;
    if (paymentQrId !== undefined) updateFields.paymentQrId = paymentQrId || null;
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (topTags !== undefined) updateFields.topTags = topTags || null;
    if (tags !== undefined) updateFields.tags = tags || null;
    if (requiresBooking !== undefined) updateFields.requiresBooking = requiresBooking;
    if (sortOrder !== undefined) updateFields.sortOrder = sortOrder;
    if (isActive !== undefined) updateFields.isActive = isActive;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const [updatedSubCategory] = await db
      .update(offeringSubCategories)
      .set(updateFields)
      .where(eq(offeringSubCategories.id, id))
      .returning();

    if (!updatedSubCategory) {
      return NextResponse.json({ error: "Sub-category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedSubCategory });
  } catch (err) {
    console.error("PATCH sub-category error:", err);
    return NextResponse.json({ error: "Failed to update sub-category" }, { status: 500 });
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

    const [deletedSubCategory] = await db
      .delete(offeringSubCategories)
      .where(eq(offeringSubCategories.id, id))
      .returning();

    if (!deletedSubCategory) {
      return NextResponse.json({ error: "Sub-category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedSubCategory });
  } catch (err) {
    console.error("DELETE sub-category error:", err);
    return NextResponse.json({ error: "Failed to delete sub-category" }, { status: 500 });
  }
}
