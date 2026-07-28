import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const WHATSAPP_GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || "http://localhost:3001";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { phone, phoneCode } = await req.json();

    if (!phone || !phoneCode) {
      return NextResponse.json({ error: "Phone number and country code are required." }, { status: 400 });
    }

    const fullPhone = `${phoneCode}${phone}`;

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const existingUser = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    const userName = existingUser.length > 0 ? existingUser[0].name : "User";

    if (existingUser.length > 0) {
      await db
        .update(users)
        .set({ otp, otpExpiry })
        .where(eq(users.id, existingUser[0].id));
    }

    const message = `Dear ${userName},\n\nHere is your OTP for SCK Login: ${otp}\n\nThis code expires in 10 minutes. Please do not share it with anyone.\n\nThank You,\nSharath Kancherla Admin Team.`;

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
      console.error("WhatsApp gateway error:", gatewayData);
      return NextResponse.json({ error: "Failed to send OTP via WhatsApp." }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "OTP sent successfully." });
  } catch (err) {
    console.error("Send OTP error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
