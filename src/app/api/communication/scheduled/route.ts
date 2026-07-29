import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledMessages } from "@/db/schema";
import { desc, count } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "25"));
    const offset = (page - 1) * limit;

    // Fetch total count of scheduled messages
    const [totalRes] = await db.select({ val: count() }).from(scheduledMessages);
    const total = totalRes?.val || 0;

    // Fetch paginated messages sorted by creation time
    const data = await db
      .select()
      .from(scheduledMessages)
      .orderBy(desc(scheduledMessages.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error("GET scheduled messages error:", err);
    return NextResponse.json({ error: "Failed to load scheduled messages." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, scheduledDate, userIds } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message content is required." }, { status: 400 });
    }
    if (!scheduledDate) {
      return NextResponse.json({ error: "Scheduled date is required." }, { status: 400 });
    }
    const [inserted] = await db
      .insert(scheduledMessages)
      .values({
        message: message.trim(),
        scheduledDate,
      })
      .returning();

    return NextResponse.json({ data: inserted });
  } catch (err: any) {
    console.error("POST scheduled message error:", err);
    return NextResponse.json({ error: "Failed to schedule message." }, { status: 500 });
  }
}
