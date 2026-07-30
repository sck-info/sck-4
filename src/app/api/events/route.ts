import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/db/schema";
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

    // Admin status filtering
    const status = searchParams.get("status");
    if (!isAdmin) {
      conditions.push(eq(events.isActive, true));
    } else {
      if (status === "active") {
        conditions.push(eq(events.isActive, true));
      } else if (status === "inactive") {
        conditions.push(eq(events.isActive, false));
      }
    }

    // Date range filter
    const now = new Date();
    const isPublic = !isAdmin;
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");

    if (isPublic || startParam || endParam) {
      const defaultStart = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // -5 days
      const defaultEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +1 month

      const startDate = startParam ? new Date(startParam) : defaultStart;
      const endDate = endParam ? new Date(endParam) : defaultEnd;

      if (startParam) {
        startDate.setHours(0, 0, 0, 0);
      }
      if (endParam) {
        endDate.setHours(23, 59, 59, 999);
      }

      conditions.push(gte(events.eventDate, startDate));
      conditions.push(lte(events.eventDate, endDate));
    }

    const typeFilter = searchParams.get("type");
    if (typeFilter && typeFilter !== "both" && typeFilter !== "all") {
      conditions.push(eq(events.type, typeFilter as any));
    }

    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      const pattern = `%${searchQuery}%`;
      conditions.push(
        or(
          ilike(events.title, pattern),
          ilike(events.description, pattern)
        ) as any
      );
    }

    const condition = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(condition);
    const total = Number(countResult[0]?.count || 0);

    const data = await db
      .select()
      .from(events)
      .where(condition)
      .orderBy(desc(events.eventDate))
      .limit(limit)
      .offset(offset);

    const pagination = createPaginationMeta({ page, limit, total });

    return NextResponse.json({ success: true, data, pagination });
  } catch (err) {
    console.error("GET events error:", err);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, link, type, isActive, eventDate } = await req.json();

    if (!title || !description || !type || !eventDate) {
      return NextResponse.json({ error: "Title, description, type, and eventDate are required." }, { status: 400 });
    }

    if (type !== "event" && type !== "update") {
      return NextResponse.json({ error: "Invalid type. Must be 'event' or 'update'." }, { status: 400 });
    }

    const [newEvent] = await db
      .insert(events)
      .values({
        title,
        description,
        link: link || null,
        type,
        isActive: isActive !== undefined ? isActive : true,
        eventDate: new Date(eventDate),
      })
      .returning();

    return NextResponse.json({ success: true, data: newEvent });
  } catch (err) {
    console.error("POST event error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
