import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        phoneCode: users.phoneCode,
        gender: users.gender,
        dateOfBirth: users.dateOfBirth,
        age: users.age,
        isPhoneVerified: users.isPhoneVerified,
        roleId: users.roleId,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (err) {
    console.error("GET profile error:", err);
    return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, gender, dateOfBirth, age, currentPassword, newPassword } = body;

    const user = await db
      .select({ id: users.id, password: users.password })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updates: Record<string, any> = { updatedAt: new Date() };

    if (name !== undefined) updates.name = name;
    if (gender !== undefined) updates.gender = gender;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
    if (age !== undefined) updates.age = age;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to set a new password." }, { status: 400 });
      }

      const isValid = await bcrypt.compare(currentPassword, user[0].password);
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
      }

      updates.password = await bcrypt.hash(newPassword, 12);
    }

    const updated = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, session.user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        gender: users.gender,
        dateOfBirth: users.dateOfBirth,
        age: users.age,
      });

    return NextResponse.json(updated[0]);
  } catch (err) {
    console.error("PATCH profile error:", err);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
