import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts } from "@/db/schema/contacts";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const data = await db
      .select()
      .from(contacts)
      .where(eq(contacts.isActive, true))
      .orderBy(desc(contacts.updatedAt))
      .limit(1);

    if (data.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("GET active contact error:", error);
    return NextResponse.json({ error: "Failed to fetch active contact" }, { status: 500 });
  }
}
