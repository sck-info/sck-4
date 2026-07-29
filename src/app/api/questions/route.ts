import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formQuestions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { desc, sql } from "drizzle-orm";
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
      .from(formQuestions);

    const total = Number(countResult[0]?.count || 0);

    const data = await db
      .select()
      .from(formQuestions)
      .orderBy(desc(formQuestions.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data,
      pagination: createPaginationMeta({ page, limit, total }),
    });
  } catch (err) {
    console.error("GET questions error:", err);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fieldLabel, fieldType, options, allowOther } = body;

    if (!fieldLabel || !fieldType) {
      return NextResponse.json({ error: "Field Label and Type are required" }, { status: 400 });
    }

    // Validate enum
    const validTypes = [
      "short_answer",
      "long_answer",
      "date",
      "time",
      "number",
      "star_rating",
      "single_select",
      "multi_select",
      "url",
    ];
    if (!validTypes.includes(fieldType)) {
      return NextResponse.json({ error: "Invalid field type" }, { status: 400 });
    }

    const [newQuestion] = await db
      .insert(formQuestions)
      .values({
        fieldLabel,
        fieldType,
        options: options || null,
        allowOther: allowOther ?? false,
      })
      .returning();

    return NextResponse.json({ success: true, data: newQuestion });
  } catch (err) {
    console.error("POST questions error:", err);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}
