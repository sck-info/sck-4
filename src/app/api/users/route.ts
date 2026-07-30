import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, roles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { parsePaginationParams, createPaginationMeta } from "@/lib/pagination";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);

    const conditions = [eq(roles.roleName, "USER")];

    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      conditions.push(
        or(
          ilike(users.name, searchPattern),
          ilike(users.email, searchPattern),
          ilike(users.phone, searchPattern)
        ) as any
      );
    }

    const statusQuery = searchParams.get("status");
    if (statusQuery === "active") {
      conditions.push(eq(users.isActive, true));
    } else if (statusQuery === "inactive") {
      conditions.push(eq(users.isActive, false));
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(and(...conditions)!);

    const total = Number(countResult[0]?.count || 0);

    const data = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        gender: users.gender,
        dateOfBirth: users.dateOfBirth,
        age: users.age,
        isActive: users.isActive,
        isPhoneVerified: users.isPhoneVerified,
        image: users.image,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(and(...conditions)!)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data,
      pagination: createPaginationMeta({ page, limit, total }),
    });
  } catch (err) {
    console.error("GET users error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
