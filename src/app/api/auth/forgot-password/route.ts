import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendResetEmail } from "@/lib/email";

const WHATSAPP_GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || "http://localhost:3001";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const { method, email, phone, phoneCode } = await req.json();

    if (!method || (method !== "email" && method !== "whatsapp")) {
      return NextResponse.json({ error: "Invalid method." }, { status: 400 });
    }

    if (method === "email" && !email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (method === "whatsapp" && (!phone || !phoneCode)) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const condition = method === "email"
      ? eq(users.email, email)
      : eq(users.phone, phone.replace(/\D/g, "").replace(/^91/, ""));

    const result = await db
      .select({ id: users.id, name: users.name, email: users.email, phone: users.phone, phoneCode: users.phoneCode })
      .from(users)
      .where(condition)
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const user = result[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    if (method === "email") {
      const resetUrl = `${APP_URL}/reset-password?token=${token}&email=${user.email}`;
      await sendResetEmail(user.email, user.name, resetUrl);

      return NextResponse.json({ success: true, message: "Reset link sent to your email." });
    } else {
      const fullPhone = `${user.phoneCode}${user.phone}`;
      const resetUrl = `${APP_URL}/reset-password?token=${token}&phone=${user.phone}`;
      const message = `Dear ${user.name},\n\nUse the link below to reset your SCK password:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, please ignore.\n\nThank You,\nSharath Kancherla Admin Team.`;

      const gatewayRes = await fetch(`${WHATSAPP_GATEWAY_URL}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: fullPhone, message, token: WHATSAPP_API_TOKEN }),
      });

      const gatewayData = await gatewayRes.json();

      if (!gatewayRes.ok || !gatewayData.success) {
        console.error("WhatsApp gateway error:", gatewayData);
        return NextResponse.json({ error: "Failed to send reset link via WhatsApp." }, { status: 502 });
      }

      return NextResponse.json({ success: true, message: "Reset link sent to your WhatsApp." });
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
