import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offeringCategories } from "@/db/schema";
import { auth } from "@/lib/auth";
import { asc, sql } from "drizzle-orm";
import { parsePaginationParams, createPaginationMeta } from "@/lib/pagination";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(offeringCategories);

    const total = Number(countResult[0]?.count || 0);

    const data = await db
      .select()
      .from(offeringCategories)
      .orderBy(asc(offeringCategories.sortOrder))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data,
      pagination: createPaginationMeta({ page, limit, total }),
    });
  } catch (err) {
    console.error("GET categories error:", err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, sanskritText, sanskritMeaning, sortOrder, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [newCategory] = await db
      .insert(offeringCategories)
      .values({
        name,
        description,
        sanskritText,
        sanskritMeaning,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      })
      .returning();

    return NextResponse.json({ success: true, data: newCategory });
  } catch (err) {
    console.error("POST categories error:", err);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
