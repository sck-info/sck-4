import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

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
    const { isActive, name, gender, dateOfBirth, age } = body;

    const updates: Record<string, any> = { updatedAt: new Date() };

    if (typeof isActive === "boolean") {
      updates.isActive = isActive;
      updates.sessionVersion = sql`${users.sessionVersion} + 1`;
    }

    if (name !== undefined) updates.name = name;
    if (gender !== undefined) updates.gender = gender;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
    if (age !== undefined) updates.age = age;

    const updated = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning({ id: users.id, name: users.name, isActive: users.isActive });

    if (updated.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (err) {
    console.error("PATCH user error:", err);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}
