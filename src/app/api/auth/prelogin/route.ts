import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, roles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email/Phone is required." }, { status: 400 });
    }

    const isEmail = email.includes("@");
    const condition = isEmail
      ? eq(users.email, email)
      : eq(users.phone, email.replace(/\D/g, "").replace(/^91/, ""));

    const result = await db
      .select({
        id: users.id,
        isActive: users.isActive,
        role: roles.roleName,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(condition)
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ status: "ACCOUNT_NOT_FOUND" });
    }

    if (!result[0].isActive) {
      return NextResponse.json({ status: "ACCOUNT_DEACTIVATED" });
    }

    return NextResponse.json({ status: "OK" });
  } catch (err) {
    console.error("Prelogin error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
