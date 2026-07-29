import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, roles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const activeUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        phoneCode: users.phoneCode,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(
        and(
          eq(users.isActive, true),
          eq(roles.roleName, "USER")
        )
      );

    return NextResponse.json({ data: activeUsers });
  } catch (err: any) {
    console.error("GET communication users error:", err);
    return NextResponse.json({ error: "Failed to load active users." }, { status: 500 });
  }
}
