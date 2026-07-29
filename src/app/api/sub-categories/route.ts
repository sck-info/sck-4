import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offeringSubCategories } from "@/db/schema";
import { auth } from "@/lib/auth";
import { asc, sql, eq } from "drizzle-orm";
import { parsePaginationParams, createPaginationMeta } from "@/lib/pagination";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);
    const categoryId = searchParams.get("categoryId");

    const condition = categoryId
      ? eq(offeringSubCategories.categoryId, categoryId)
      : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(offeringSubCategories)
      .where(condition);

    const total = Number(countResult[0]?.count || 0);

    const data = await db
      .select()
      .from(offeringSubCategories)
      .where(condition)
      .orderBy(asc(offeringSubCategories.sortOrder))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data,
      pagination: createPaginationMeta({ page, limit, total }),
    });
  } catch (err) {
    console.error("GET sub-categories error:", err);
    return NextResponse.json({ error: "Failed to fetch sub-categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (!categoryId || !name) {
      return NextResponse.json({ error: "Category ID and Name are required" }, { status: 400 });
    }

    const [newSubCategory] = await db
      .insert(offeringSubCategories)
      .values({
        categoryId,
        paymentQrId: paymentQrId || null,
        name,
        description,
        topTags: topTags || null,
        tags: tags || null,
        requiresBooking: requiresBooking ?? true,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      })
      .returning();

    return NextResponse.json({ success: true, data: newSubCategory });
  } catch (err) {
    console.error("POST sub-categories error:", err);
    return NextResponse.json({ error: "Failed to create sub-category" }, { status: 500 });
  }
}
