import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

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
    const { title, description, link, type, isActive, eventDate } = body;

    const updateFields: any = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (link !== undefined) updateFields.link = link || null;
    if (type !== undefined) {
      if (type !== "event" && type !== "update") {
        return NextResponse.json({ error: "Invalid type. Must be 'event' or 'update'." }, { status: 400 });
      }
      updateFields.type = type;
    }
    if (isActive !== undefined) updateFields.isActive = isActive;
    if (eventDate !== undefined) updateFields.eventDate = new Date(eventDate);
    updateFields.updatedAt = new Date();

    const [updatedEvent] = await db
      .update(events)
      .set(updateFields)
      .where(eq(events.id, id))
      .returning();

    if (!updatedEvent) {
      return NextResponse.json({ error: "Event/Update not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedEvent });
  } catch (err) {
    console.error("PATCH event error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const [deletedEvent] = await db
      .delete(events)
      .where(eq(events.id, id))
      .returning();

    if (!deletedEvent) {
      return NextResponse.json({ error: "Event/Update not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedEvent });
  } catch (err) {
    console.error("DELETE event error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
