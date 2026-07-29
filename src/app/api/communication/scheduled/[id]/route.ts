import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledMessages } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if the scheduled message exists
    const [msg] = await db
      .select()
      .from(scheduledMessages)
      .where(eq(scheduledMessages.id, id));

    if (!msg) {
      return NextResponse.json({ error: "Scheduled message not found." }, { status: 404 });
    }

    if (msg.isSent) {
      return NextResponse.json({ error: "Cannot delete a message that has already been sent." }, { status: 400 });
    }

    await db
      .delete(scheduledMessages)
      .where(eq(scheduledMessages.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE scheduled message error:", err);
    return NextResponse.json({ error: "Failed to cancel scheduled message." }, { status: 500 });
  }
}
