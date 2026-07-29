import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userQueries } from "@/db/schema";
import { auth } from "@/lib/auth";
import { desc, sql, and, or, ilike, eq } from "drizzle-orm";
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
      const searchPattern = `%${searchQuery}%`;
      conditions.push(
        or(
          ilike(userQueries.name, searchPattern),
          ilike(userQueries.email, searchPattern),
          ilike(userQueries.phone, searchPattern),
          ilike(userQueries.message, searchPattern)
        ) as any
      );
    }

    const statusQuery = searchParams.get("status");
    if (statusQuery && statusQuery !== "all") {
      conditions.push(eq(userQueries.status, statusQuery));
    }

    const condition = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userQueries)
      .where(condition);

    const total = Number(countResult[0]?.count || 0);

    const data = await db
      .select()
      .from(userQueries)
      .where(condition)
      .orderBy(desc(userQueries.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data,
      pagination: createPaginationMeta({ page, limit, total }),
    });
  } catch (err) {
    console.error("GET queries error:", err);
    return NextResponse.json({ error: "Failed to fetch queries" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, phoneCode, phone, message } = await req.json();

    if (!name || !email || !phoneCode || !phone || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    // Clean phone number (leave digits only)
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit phone number." },
        { status: 400 }
      );
    }

    const newQuery = await db
      .insert(userQueries)
      .values({
        name,
        email,
        phoneCode,
        phone: cleanPhone,
        message,
        status: "pending",
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Query submitted successfully.",
      data: newQuery[0],
    });
  } catch (err) {
    console.error("POST query error:", err);
    return NextResponse.json({ error: "Failed to submit query" }, { status: 500 });
  }
}
