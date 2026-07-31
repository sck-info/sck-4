import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { enforceCronSecurity } from "@/lib/cron-guard";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function GET(req: Request) {
  return handleCron(req);
}

export async function POST(req: Request) {
  return handleCron(req);
}

async function handleCron(req: Request) {
  const auth = enforceCronSecurity(req, true);
  if (!auth.allowed) {
    return auth.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get current date parts in Indian Standard Time (Asia/Kolkata)
    const formatter = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(new Date());
    const dayVal = parts.find((p) => p.type === "day")?.value;
    const monthVal = parts.find((p) => p.type === "month")?.value;

    if (!dayVal || !monthVal) {
      throw new Error("Unable to parse current date parts.");
    }

    const currentDay = parseInt(dayVal, 10);
    const currentMonth = parseInt(monthVal, 10);

    console.log(`[Birthday Cron] Fetching birthday users for month: ${currentMonth}, day: ${currentDay}`);

    // Fetch active users whose DOB matches the current day and month
    const bdayList = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.isActive, true),
          sql`date_part('month', ${users.dateOfBirth}) = ${currentMonth}`,
          sql`date_part('day', ${users.dateOfBirth}) = ${currentDay}`
        )
      );

    if (bdayList.length === 0) {
      return NextResponse.json({ success: true, message: "No birthdays today." });
    }

    let dispatched = 0;
    for (const u of bdayList) {
      if (u.phone) {
        const message = `Happy Birthday, ${u.name}! 🎂🎉 Wishing you a fantastic day filled with joy, success, and good health! Have a wonderful year ahead! Best regards.`;
        try {
          await sendWhatsApp(u.phone, message);
          dispatched++;
        } catch (sendErr) {
          console.error(`[Birthday Cron] Failed to send WhatsApp wish to ${u.phone} (${u.name}):`, sendErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Birthday dispatches complete. Sent wishes to ${dispatched} users.`,
    });
  } catch (err: any) {
    console.error("Birthday wishes cron error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process birthday wishes cron." },
      { status: 500 }
    );
  }
}
