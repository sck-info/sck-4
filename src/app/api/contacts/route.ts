import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts } from "@/db/schema/contacts";
import { auth } from "@/lib/auth";
import { desc, sql } from "drizzle-orm";
import { z } from "zod";
import { parsePaginationParams, createPaginationMeta } from "@/lib/pagination";

const contactSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  instagramLink: z.string().url().optional().or(z.literal("")),
  linkedinLink: z.string().url().optional().or(z.literal("")),
  youtubeLink: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts);
    const total = Number(countResult[0]?.count || 0);

    const data = await db
      .select()
      .from(contacts)
      .orderBy(desc(contacts.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data,
      pagination: createPaginationMeta({ page, limit, total }),
    });
  } catch (error) {
    console.error("GET contacts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.format() },
        { status: 400 },
      );
    }

    // If setting active, deactivate others
    if (parsed.data.isActive) {
      await db.update(contacts).set({ isActive: false });
    }

    const inserted = await db
      .insert(contacts)
      .values({
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        location: parsed.data.location || null,
        instagramLink: parsed.data.instagramLink || null,
        linkedinLink: parsed.data.linkedinLink || null,
        youtubeLink: parsed.data.youtubeLink || null,
        isActive: parsed.data.isActive,
      })
      .returning();

    return NextResponse.json(inserted[0], { status: 201 });
  } catch (error) {
    console.error("POST contacts error:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 },
    );
  }
}
