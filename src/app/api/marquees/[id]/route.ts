import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marquees } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, ne } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [item] = await db.select().from(marquees).where(eq(marquees.id, id));

    if (!item) {
      return NextResponse.json({ error: "Marquee not found" }, { status: 404 });
    }

    return NextResponse.json({ data: item });
  } catch (err: any) {
    console.error("GET /api/marquees/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch marquee" },
      { status: 500 }
    );
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

    const [existing] = await db
      .select()
      .from(marquees)
      .where(eq(marquees.id, id));

    if (!existing) {
      return NextResponse.json({ error: "Marquee not found" }, { status: 404 });
    }

    const updateData: Partial<typeof marquees.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = String(body.title).trim();
    if (body.content !== undefined) updateData.content = String(body.content).trim();
    if (body.link !== undefined) updateData.link = body.link ? String(body.link).trim() : null;
    if (body.linkText !== undefined) updateData.linkText = body.linkText ? String(body.linkText).trim() : null;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;

    if (body.isActive !== undefined) {
      const activeBool = Boolean(body.isActive);
      updateData.isActive = activeBool;

      // If activating this marquee, automatically deactivate all other marquees
      if (activeBool) {
        await db
          .update(marquees)
          .set({ isActive: false, updatedAt: new Date() })
          .where(ne(marquees.id, id));
      }
    }

    const [updated] = await db
      .update(marquees)
      .set(updateData)
      .where(eq(marquees.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("PATCH /api/marquees/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update marquee" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const [deleted] = await db
      .delete(marquees)
      .where(eq(marquees.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Marquee not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deleted });
  } catch (err: any) {
    console.error("DELETE /api/marquees/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete marquee" },
      { status: 500 }
    );
  }
}
