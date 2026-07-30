import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subCategoryQuestions, formQuestions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, asc, and, ilike, inArray, sql } from "drizzle-orm";
import { parsePaginationParams, createPaginationMeta } from "@/lib/pagination";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);

    const searchQuery = searchParams.get("search") || searchParams.get("q") || "";
    const fieldTypesParam = searchParams.get("fieldTypes") || "";

    const conditions = [eq(subCategoryQuestions.subCategoryId, id)];
    if (searchQuery) {
      conditions.push(ilike(formQuestions.fieldLabel, `%${searchQuery}%`));
    }
    if (fieldTypesParam) {
      const types = fieldTypesParam.split(",").map((t) => t.trim()).filter(Boolean) as any[];
      if (types.length > 0) {
        conditions.push(inArray(formQuestions.fieldType, types));
      }
    }

    const whereClause = and(...conditions);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(subCategoryQuestions)
      .innerJoin(formQuestions, eq(subCategoryQuestions.questionId, formQuestions.id))
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    const data = await db
      .select({
        id: formQuestions.id,
        fieldLabel: formQuestions.fieldLabel,
        fieldType: formQuestions.fieldType,
        options: formQuestions.options,
        allowOther: formQuestions.allowOther,
        isRequired: subCategoryQuestions.isRequired,
        sortOrder: subCategoryQuestions.sortOrder,
      })
      .from(subCategoryQuestions)
      .innerJoin(formQuestions, eq(subCategoryQuestions.questionId, formQuestions.id))
      .where(whereClause)
      .orderBy(asc(subCategoryQuestions.sortOrder))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data,
      pagination: createPaginationMeta({ page, limit, total }),
    });
  } catch (err) {
    console.error("GET sub-category questions error:", err);
    return NextResponse.json({ error: "Failed to fetch linked questions" }, { status: 500 });
  }
}

export async function POST(
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
    const { questionId, sortOrder, isRequired } = body;

    if (!questionId) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    // Check if duplicate exists
    const existing = await db
      .select()
      .from(subCategoryQuestions)
      .where(
        and(
          eq(subCategoryQuestions.subCategoryId, id),
          eq(subCategoryQuestions.questionId, questionId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "This question is already linked to this offering form." }, { status: 400 });
    }

    const [newLink] = await db
      .insert(subCategoryQuestions)
      .values({
        subCategoryId: id,
        questionId,
        sortOrder: sortOrder ?? 0,
        isRequired: isRequired ?? true,
      })
      .returning();

    return NextResponse.json({ success: true, data: newLink });
  } catch (err) {
    console.error("POST sub-category question link error:", err);
    return NextResponse.json({ error: "Failed to link question" }, { status: 500 });
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
    const { questionIdsWithOrder } = body;

    if (!Array.isArray(questionIdsWithOrder)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      for (const item of questionIdsWithOrder) {
        await tx
          .update(subCategoryQuestions)
          .set({ sortOrder: item.sortOrder })
          .where(
            and(
              eq(subCategoryQuestions.subCategoryId, id),
              eq(subCategoryQuestions.questionId, item.questionId)
            )
          );
      }
    });

    return NextResponse.json({ success: true, message: "Sort orders updated" });
  } catch (err) {
    console.error("PATCH sub-category questions reorder error:", err);
    return NextResponse.json({ error: "Failed to reorder questions" }, { status: 500 });
  }
}
