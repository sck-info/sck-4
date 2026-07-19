import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts } from "@/db/schema/contacts";
import { auth } from "@/lib/auth";
import { eq, not } from "drizzle-orm";
import { z } from "zod";

const contactSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  instagramLink: z.string().url().optional().or(z.literal("")),
  linkedinLink: z.string().url().optional().or(z.literal("")),
  youtubeLink: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    // If setting active, deactivate others
    if (parsed.data.isActive) {
      await db.update(contacts).set({ isActive: false }).where(not(eq(contacts.id, id)));
    }

    const updated = await db
      .update(contacts)
      .set({
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        location: parsed.data.location || null,
        instagramLink: parsed.data.instagramLink || null,
        linkedinLink: parsed.data.linkedinLink || null,
        youtubeLink: parsed.data.youtubeLink || null,
        isActive: parsed.data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("PUT contact error:", error);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await db
      .delete(contacts)
      .where(eq(contacts.id, id))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("DELETE contact error:", error);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
