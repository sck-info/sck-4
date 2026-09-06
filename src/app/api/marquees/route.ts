import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marquees } from "@/db/schema";
import { auth } from "@/lib/auth";
import { desc, and, eq, gte, lte, sql, or, ilike } from "drizzle-orm";
import { parsePaginationParams, createPaginationMeta } from "@/lib/pagination";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";

    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);
    const conditions = [];

    // Status filter
    const status = searchParams.get("status");
    if (!isAdmin) {
      conditions.push(eq(marquees.isActive, true));
    } else if (status === "active") {
      conditions.push(eq(marquees.isActive, true));
    } else if (status === "inactive") {
      conditions.push(eq(marquees.isActive, false));
    }

    // Date range filter
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");

    if (startParam) {
      const startDate = new Date(startParam);
      startDate.setHours(0, 0, 0, 0);
      conditions.push(gte(marquees.createdAt, startDate));
    }
    if (endParam) {
      const endDate = new Date(endParam);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(marquees.createdAt, endDate));
    }

    // Search query
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      const pattern = `%${searchQuery}%`;
      conditions.push(
        or(
          ilike(marquees.title, pattern),
          ilike(marquees.content, pattern),
          ilike(marquees.linkText, pattern)
        ) as any
      );
    }

    const condition = conditions.length > 0 ? and(...conditions) : undefined;

    // Total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(marquees)
      .where(condition);
    const total = Number(countResult[0]?.count || 0);

    // Rows
    const data = await db
      .select()
      .from(marquees)
      .where(condition)
      .orderBy(desc(marquees.isActive), desc(marquees.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data,
      pagination: createPaginationMeta({ page, limit, total }),
    });
  } catch (err: any) {
    console.error("GET /api/marquees error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch marquees." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, link, linkText, isActive, startDate, endDate } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Content is required." }, { status: 400 });
    }

    const isMarkedActive = Boolean(isActive);

    // If activating this marquee, ensure only ONE marquee is active at any time
    if (isMarkedActive) {
      await db.update(marquees).set({ isActive: false, updatedAt: new Date() });
    }

    const [created] = await db
      .insert(marquees)
      .values({
        title: title.trim(),
        content: content.trim(),
        link: link ? link.trim() : null,
        linkText: linkText ? linkText.trim() : null,
        isActive: isMarkedActive,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      })
      .returning();

    return NextResponse.json({ success: true, data: created });
  } catch (err: any) {
    console.error("POST /api/marquees error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create marquee." },
      { status: 500 }
    );
  }
}
