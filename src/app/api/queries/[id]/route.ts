import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userQueries } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

const WHATSAPP_GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || "http://localhost:3001";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;

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
    const { replyMessage } = await req.json();

    if (!replyMessage) {
      return NextResponse.json({ error: "Reply message is required." }, { status: 400 });
    }

    // Fetch existing query
    const existing = await db
      .select()
      .from(userQueries)
      .where(eq(userQueries.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Query not found." }, { status: 404 });
    }

    const queryData = existing[0];
    const fullPhone = `${queryData.phoneCode}${queryData.phone}`.replace(/\+/g, "");

    // Send WhatsApp notification via gateway
    const gatewayRes = await fetch(`${WHATSAPP_GATEWAY_URL}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: fullPhone,
        message: replyMessage,
        token: WHATSAPP_API_TOKEN,
      }),
    });

    const gatewayData = await gatewayRes.json();

    if (!gatewayRes.ok || !gatewayData.success) {
      console.error("WhatsApp gateway error:", gatewayData);
      return NextResponse.json(
        { error: "Failed to send reply via WhatsApp. Please check gateway." },
        { status: 502 }
      );
    }

    // Update query status & reply details in DB
    const updated = await db
      .update(userQueries)
      .set({
        status: "replied",
        replyMessage,
        repliedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userQueries.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Reply sent via WhatsApp successfully.",
      data: updated[0],
    });
  } catch (err) {
    console.error("PATCH query error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db.delete(userQueries).where(eq(userQueries.id, id));

    return NextResponse.json({
      success: true,
      message: "Query deleted successfully.",
    });
  } catch (err) {
    console.error("DELETE query error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
