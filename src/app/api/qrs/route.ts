import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentQrs } from "@/db/schema";
import { auth } from "@/lib/auth";
import { desc, sql } from "drizzle-orm";
import { parsePaginationParams, createPaginationMeta } from "@/lib/pagination";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(paymentQrs);

    const total = Number(countResult[0]?.count || 0);

    const data = await db
      .select()
      .from(paymentQrs)
      .orderBy(desc(paymentQrs.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data,
      pagination: createPaginationMeta({ page, limit, total }),
    });
  } catch (err) {
    console.error("GET QRs error:", err);
    return NextResponse.json({ error: "Failed to fetch QR codes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, qrImageUrl } = await req.json();

    if (!name || !qrImageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [newQR] = await db
      .insert(paymentQrs)
      .values({ name, qrImageUrl })
      .returning();

    return NextResponse.json({ success: true, data: newQR });
  } catch (err) {
    console.error("POST QRs error:", err);
    return NextResponse.json({ error: "Failed to create QR code" }, { status: 500 });
  }
}
