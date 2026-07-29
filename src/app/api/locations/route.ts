import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionLocations } from "@/db/schema";
import { auth } from "@/lib/auth";
import { desc, sql, and, eq, ilike } from "drizzle-orm";
import { parsePaginationParams, createPaginationMeta } from "@/lib/pagination";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);

    const conditions = [];

    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      conditions.push(ilike(sessionLocations.name, `%${searchQuery}%`));
    }

    const typeQuery = searchParams.get("type");
    if (typeQuery && typeQuery !== "all") {
      conditions.push(eq(sessionLocations.type, typeQuery as any));
    }

    const condition = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(sessionLocations)
      .where(condition);

    const total = Number(countResult[0]?.count || 0);

    const data = await db
      .select()
      .from(sessionLocations)
      .where(condition)
      .orderBy(desc(sessionLocations.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data,
      pagination: createPaginationMeta({ page, limit, total }),
    });
  } catch (err) {
    console.error("GET locations error:", err);
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, type, url } = await req.json();

    if (!name || !type || !url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (type !== "online" && type !== "offline") {
      return NextResponse.json({ error: "Type must be online or offline" }, { status: 400 });
    }

    const [newLocation] = await db
      .insert(sessionLocations)
      .values({ name, type, url })
      .returning();

    return NextResponse.json({ success: true, data: newLocation });
  } catch (err) {
    console.error("POST locations error:", err);
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 });
  }
}
