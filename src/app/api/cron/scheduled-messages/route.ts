import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledMessages, users, roles } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { enforceCronSecurity } from "@/lib/cron-guard";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function GET(req: Request) {
  return handleCron(req);
}

export async function POST(req: Request) {
  return handleCron(req);
}

async function handleCron(req: Request) {
  // Enforce security check, but allow manual trigger via ?force=true from the admin dashboard
  const auth = enforceCronSecurity(req, true);
  if (!auth.allowed) {
    return auth.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Determine today's date in IST (Asia/Kolkata)
    const todayIST = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());

    const [dd, mm, yyyy] = todayIST.split("/");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    console.log(`[Cron] Executing scheduled dispatches for date: ${dateStr}`);

    // Query all unsent scheduled messages for today
    const pending = await db
      .select()
      .from(scheduledMessages)
      .where(
        and(
          eq(scheduledMessages.scheduledDate, dateStr),
          eq(scheduledMessages.isSent, false)
        )
      );

    if (pending.length === 0) {
      return NextResponse.json({ message: `No pending scheduled messages for ${dateStr}.` });
    }

    let totalDispatched = 0;

    for (const msg of pending) {
      // Fetch active phone numbers for ALL active seekers (excluding ADMINs)
      const targets = await db
        .select({ phone: users.phone })
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(
          and(
            eq(users.isActive, true),
            eq(roles.roleName, "USER")
          )
        );

      // Send to each target user
      for (const t of targets) {
        if (t.phone) {
          try {
            await sendWhatsApp(t.phone, msg.message);
            totalDispatched++;
          } catch (sendErr) {
            console.error(`[Cron] Error dispatching to phone ${t.phone}:`, sendErr);
          }
        }
      }

      // Mark this scheduled message as completed
      await db
        .update(scheduledMessages)
        .set({
          isSent: true,
          sentAt: new Date(),
        })
        .where(eq(scheduledMessages.id, msg.id));
    }

    return NextResponse.json({
      success: true,
      processedCount: pending.length,
      dispatchedMessagesCount: totalDispatched,
    });
  } catch (err: any) {
    console.error("Scheduled messages cron error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process scheduled messages cron." },
      { status: 500 }
    );
  }
}
