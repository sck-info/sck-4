import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { aboutSlides, metrics, gallery, userQueries, users } from "@/db/schema";
import { sql, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const aboutCount = await db.select({ count: sql<number>`count(*)` }).from(aboutSlides);
    const metricsCount = await db.select({ count: sql<number>`count(*)` }).from(metrics);
    const galleryCount = await db.select({ count: sql<number>`count(*)` }).from(gallery);
    const queriesCount = await db.select({ count: sql<number>`count(*)` }).from(userQueries);
    const pendingQueriesCount = await db.select({ count: sql<number>`count(*)` }).from(userQueries).where(eq(userQueries.status, "pending"));
    const usersCount = await db.select({ count: sql<number>`count(*)` }).from(users);

    return NextResponse.json({
      data: {
        totalAboutSlides: Number(aboutCount[0]?.count || 0),
        totalMetrics: Number(metricsCount[0]?.count || 0),
        totalGallery: Number(galleryCount[0]?.count || 0),
        totalQueries: Number(queriesCount[0]?.count || 0),
        pendingQueries: Number(pendingQueriesCount[0]?.count || 0),
        totalUsers: Number(usersCount[0]?.count || 0),
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
