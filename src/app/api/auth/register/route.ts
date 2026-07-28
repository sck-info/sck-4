import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, roles } from "@/db/schema";
import { eq } from "drizzle-orm";

const WHATSAPP_GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || "http://localhost:3001";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { name, email, password, phone, phoneCode } = await req.json();

    if (!name || !email || !password || !phone || !phoneCode) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const existingPhone = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    if (existingPhone.length > 0) {
      return NextResponse.json({ error: "Phone number already registered." }, { status: 409 });
    }

    const userRole = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.roleName, "USER"))
      .limit(1);

    if (userRole.length === 0) {
      return NextResponse.json({ error: "USER role not found." }, { status: 500 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const cleanPhone = phone.replace(/\D/g, "").replace(/^91/, "");

    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      phone: cleanPhone,
      phoneCode,
      isPhoneVerified: false,
      otp,
      otpExpiry,
      roleId: userRole[0].id,
    });

    const fullPhone = `${phoneCode}${cleanPhone}`;
    const message = `Dear ${name},\n\nHere is your OTP for SCK Login: ${otp}\n\nThis code expires in 10 minutes. Please do not share it with anyone.\n\nThank You,\nSharath Kancherla Admin Team.`;

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

    return NextResponse.json({
      success: true,
      message: "Registration successful. OTP sent to your WhatsApp.",
      phone,
    }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
