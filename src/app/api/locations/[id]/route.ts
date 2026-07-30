import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionLocations } from "@/db/schema";
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
    const { name, type, url } = body;

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (type !== undefined) {
      if (type !== "online" && type !== "offline") {
        return NextResponse.json({ error: "Type must be online or offline" }, { status: 400 });
      }
      updateFields.type = type;
    }
    if (url !== undefined) updateFields.url = url;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const [updatedLocation] = await db
      .update(sessionLocations)
      .set(updateFields)
      .where(eq(sessionLocations.id, id))
      .returning();

    if (!updatedLocation) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedLocation });
  } catch (err) {
    console.error("PATCH location error:", err);
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
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

    const [deletedLocation] = await db
      .delete(sessionLocations)
      .where(eq(sessionLocations.id, id))
      .returning();

    if (!deletedLocation) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedLocation });
  } catch (err: any) {
    console.error("DELETE location error:", err);
    if (err.code === "23503" || (err.message && err.message.includes("foreign key constraint"))) {
      return NextResponse.json(
        { 
          error: "dependency_conflict",
          message: "This location cannot be deleted because it is still referenced by other active bookings or records." 
        }, 
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to delete location" }, { status: 500 });
  }
}
