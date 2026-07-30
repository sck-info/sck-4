import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, sql, and, ne } from "drizzle-orm";

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
    const { isActive, name, gender, dateOfBirth, age, email, phone, phoneCode } = body;

    const updates: Record<string, any> = { updatedAt: new Date() };

    if (typeof isActive === "boolean") {
      updates.isActive = isActive;
      updates.sessionVersion = sql`${users.sessionVersion} + 1`;
    }

    if (name !== undefined) updates.name = name;
    if (gender !== undefined) updates.gender = gender;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
    if (age !== undefined) updates.age = age;

    if (email !== undefined && email !== "") {
      const emailCheck = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), ne(users.id, id)))
        .limit(1);
      if (emailCheck.length > 0) {
        return NextResponse.json({ error: "Email is already in use by another user." }, { status: 400 });
      }
      updates.email = email;
      // If email changes, force session reload
      updates.sessionVersion = sql`${users.sessionVersion} + 1`;
    }

    if (phone !== undefined && phone !== "") {
      const phoneCheck = await db
        .select()
        .from(users)
        .where(and(eq(users.phone, phone), ne(users.id, id)))
        .limit(1);
      if (phoneCheck.length > 0) {
        return NextResponse.json({ error: "Phone number is already in use by another user." }, { status: 400 });
      }

      const [existing] = await db
        .select({ phone: users.phone, name: users.name })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (existing && existing.phone !== phone) {
        updates.phone = phone;
        if (phoneCode !== undefined) updates.phoneCode = phoneCode;

        // Generate and store OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        updates.otp = otp;
        updates.otpExpiry = otpExpiry;
        updates.isPhoneVerified = false; // Require re-verification
        updates.sessionVersion = sql`${users.sessionVersion} + 1`;

        // Send OTP via WhatsApp gateway
        const WHATSAPP_GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || "http://localhost:3001";
        const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
        const fullPhone = `${phoneCode || "91"}${phone}`;
        const message = `Dear ${existing.name},\n\nYour phone number was updated by SCK Admin. Here is your OTP to verify: ${otp}\n\nThis code expires in 10 minutes.\n\nThank You,\nSharath Kancherla Admin Team.`;

        try {
          const gatewayRes = await fetch(`${WHATSAPP_GATEWAY_URL}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: fullPhone,
              message,
              token: WHATSAPP_API_TOKEN,
            }),
          });
          const gatewayData = await gatewayRes.json();
          if (!gatewayRes.ok || !gatewayData.success) {
            console.error("WhatsApp gateway error on admin phone update:", gatewayData);
          }
        } catch (err) {
          console.error("Failed to send WhatsApp OTP on admin update:", err);
        }
      } else {
        if (phoneCode !== undefined) updates.phoneCode = phoneCode;
      }
    }

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
