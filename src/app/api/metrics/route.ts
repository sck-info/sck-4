import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { metrics } from "@/db/schema/metrics";
import { auth } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get("all") === "true";

    if (fetchAll) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const list = await db.select().from(metrics).orderBy(asc(metrics.sortOrder));
      return NextResponse.json(list);
    }

    const list = await db
      .select()
      .from(metrics)
      .where(eq(metrics.isActive, true))
      .orderBy(asc(metrics.sortOrder));

    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET /api/metrics error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch metrics" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { num, label, sortOrder, isActive } = body;

    if (!num || !label) {
      return NextResponse.json({ error: "Metric value and label description are required." }, { status: 400 });
    }

    const [newMetric] = await db
      .insert(metrics)
      .values({
        num,
        label,
        sortOrder: typeof sortOrder === "number" ? sortOrder : parseInt(sortOrder) || 0,
        isActive: isActive !== false,
      })
      .returning();

    return NextResponse.json(newMetric, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/metrics error:", err);
    return NextResponse.json({ error: err.message || "Failed to create metric" }, { status: 500 });
  }
}
