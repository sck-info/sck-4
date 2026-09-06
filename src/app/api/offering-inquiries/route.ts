import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offeringInquiries } from "@/db/schema";
import { auth } from "@/lib/auth";
import { sendWhatsApp } from "@/lib/whatsapp";
import { eq, and, sql, desc, ilike, or } from "drizzle-orm";
import { parsePaginationParams, createPaginationMeta } from "@/lib/pagination";

const ADMIN_NOTIFICATION_PHONE = process.env.ADMIN_NOTIFICATION_PHONE;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// POST (Public): Submit new offering guidance request
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phoneCode = "+91", phone, email } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Full Name is required." }, { status: 400 });
    }

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "WhatsApp Phone Number is required." }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Please enter a valid phone number (at least 10 digits)." }, { status: 400 });
    }

    const cleanCode = phoneCode.startsWith("+") ? phoneCode : `+${phoneCode.replace(/\D/g, "")}`;
    const cleanEmail = email && typeof email === "string" && email.trim() ? email.trim() : null;

    const [newInquiry] = await db
      .insert(offeringInquiries)
      .values({
        name: name.trim(),
        phoneCode: cleanCode,
        phone: cleanPhone,
        email: cleanEmail,
        status: "pending",
      })
      .returning();

    // 1. Send automated WhatsApp confirmation to the seeker
    const seekerPhone = `${cleanCode.replace(/\+/g, "")}${cleanPhone}`;
    const seekerMsg = `Dear ${name.trim()},\n\nWe received your request for guidance regarding our offerings. Sharath Kancherla's team will get back to you soon.\n\nThank you,\nSharath Kancherla Admin Team.`;

    try {
      await sendWhatsApp(seekerPhone, seekerMsg);
    } catch (sendErr) {
      console.error("[Offering Inquiries] Error dispatching WhatsApp to seeker:", sendErr);
    }

    // 2. Send instant alert notification to Admin
    if (ADMIN_NOTIFICATION_PHONE) {
      const adminTarget = ADMIN_NOTIFICATION_PHONE.replace(/\+/g, "").replace(/\D/g, "");
      const adminMsg = `New Offering Guidance Request received from ${name.trim()} (${cleanCode} ${cleanPhone})!\n\nReview details here: ${APP_URL}/dashboard/offering-inquiries`;
      try {
        await sendWhatsApp(adminTarget, adminMsg);
      } catch (adminErr) {
        console.error("[Offering Inquiries] Error dispatching WhatsApp to admin:", adminErr);
      }
    }

    return NextResponse.json({ success: true, data: newInquiry }, { status: 201 });
  } catch (err: any) {
    console.error("POST offering-inquiries error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit guidance request." }, { status: 500 });
  }
}

// GET (Admin only): List inquiries with pagination, filters, and export
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isExport = searchParams.get("export") === "true";
    const { page, limit, offset } = parsePaginationParams(searchParams);

    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const conditions = [];

    if (status && status !== "all") {
      conditions.push(eq(offeringInquiries.status, status));
    }

    if (search && search.trim()) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(offeringInquiries.name, pattern),
          ilike(offeringInquiries.phone, pattern),
          ilike(offeringInquiries.email, pattern)
        )
      );
    }

    if (startDate) {
      conditions.push(sql`date(${offeringInquiries.createdAt}) >= ${startDate}`);
    }

    if (endDate) {
      conditions.push(sql`date(${offeringInquiries.createdAt}) <= ${endDate}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    if (isExport) {
      const allRows = await db
        .select()
        .from(offeringInquiries)
        .where(whereClause)
        .orderBy(desc(offeringInquiries.createdAt));

      return NextResponse.json({ success: true, data: allRows });
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(offeringInquiries)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    const data = await db
      .select()
      .from(offeringInquiries)
      .where(whereClause)
      .orderBy(desc(offeringInquiries.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data,
      pagination: createPaginationMeta({ page, limit, total }),
    });
  } catch (err: any) {
    console.error("GET offering-inquiries error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch offering inquiries." }, { status: 500 });
  }
}
