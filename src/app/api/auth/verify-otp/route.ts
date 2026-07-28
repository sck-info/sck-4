import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, roles } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone number and OTP are required." }, { status: 400 });
    }

    const now = new Date();

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: roles.roleName,
        sessionVersion: users.sessionVersion,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(
        and(
          eq(users.phone, phone),
          eq(users.otp, otp),
          gt(users.otpExpiry, now)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 400 });
    }

    const user = result[0];

    await db
      .update(users)
      .set({ isPhoneVerified: true, otp: null, otpExpiry: null })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: "Phone verified successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sessionVersion: user.sessionVersion,
        isPhoneVerified: true,
      },
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
