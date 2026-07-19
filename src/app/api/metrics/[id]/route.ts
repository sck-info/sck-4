import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { metrics } from "@/db/schema/metrics";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { num, label, sortOrder, isActive } = body;

    const [updatedMetric] = await db
      .update(metrics)
      .set({
        num,
        label,
        sortOrder: typeof sortOrder === "number" ? sortOrder : parseInt(sortOrder) || 0,
        isActive: isActive !== false,
        updatedAt: new Date(),
      })
      .where(eq(metrics.id, id))
      .returning();

    if (!updatedMetric) {
      return NextResponse.json({ error: "Metric not found" }, { status: 404 });
    }

    return NextResponse.json(updatedMetric);
  } catch (err: any) {
    console.error("PUT /api/metrics/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to update metric" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const [deletedMetric] = await db
      .delete(metrics)
      .where(eq(metrics.id, id))
      .returning();

    if (!deletedMetric) {
      return NextResponse.json({ error: "Metric not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Metric deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/metrics/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete metric" }, { status: 500 });
  }
}
