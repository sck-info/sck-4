import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  aboutSlides,
  metrics,
  gallery,
  userQueries,
  users,
  bookings,
  bookingDrafts,
  offeringSlots,
  feedbacks,
  offeringCategories,
  offeringSubCategories,
  sessionLocations,
  paymentQrs,
  formQuestions,
} from "@/db/schema";
import { sql, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. General counts
    const aboutCount = await db.select({ count: sql<number>`count(*)` }).from(aboutSlides);
    const metricsCount = await db.select({ count: sql<number>`count(*)` }).from(metrics);
    const galleryCount = await db.select({ count: sql<number>`count(*)` }).from(gallery);
    const queriesCount = await db.select({ count: sql<number>`count(*)` }).from(userQueries);
    const pendingQueriesCount = await db.select({ count: sql<number>`count(*)` }).from(userQueries).where(eq(userQueries.status, "pending"));
    const usersCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const bookingsCount = await db.select({ count: sql<number>`count(*)` }).from(bookings);
    const draftsCount = await db.select({ count: sql<number>`count(*)` }).from(bookingDrafts);
    const slotsCount = await db.select({ count: sql<number>`count(*)` }).from(offeringSlots);

    // Additional Stats
    const categoriesCount = await db.select({ count: sql<number>`count(*)` }).from(offeringCategories);
    const offeringsCount = await db.select({ count: sql<number>`count(*)` }).from(offeringSubCategories);
    const locationsCount = await db.select({ count: sql<number>`count(*)` }).from(sessionLocations);
    const paymentQrsCount = await db.select({ count: sql<number>`count(*)` }).from(paymentQrs);
    const questionsCount = await db.select({ count: sql<number>`count(*)` }).from(formQuestions);

    // 2. Booking Status Breakdown
    const bookingsByStatus = await db
      .select({
        status: bookings.status,
        count: sql<number>`count(*)`
      })
      .from(bookings)
      .groupBy(bookings.status);

    // 3. Service Format Distribution
    const bookingsByFormat = await db
      .select({
        format: bookings.selectedFormat,
        count: sql<number>`count(*)`
      })
      .from(bookings)
      .groupBy(bookings.selectedFormat);

    // 4. Slots Status Breakdown
    const slotsByStatus = await db
      .select({
        status: offeringSlots.status,
        count: sql<number>`count(*)`
      })
      .from(offeringSlots)
      .groupBy(offeringSlots.status);

    // 5. Testimonial Average Rating
    const avgRatingRes = await db
      .select({
        avg: sql<number>`coalesce(avg(${feedbacks.rating}), 0)`
      })
      .from(feedbacks);

    // 6. Recent Registrations List (Bookings)
    const recentBookingsList = await db
      .select({
        id: bookings.id,
        seekerName: users.name,
        seekerEmail: users.email,
        status: bookings.status,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .orderBy(sql`${bookings.createdAt} desc`)
      .limit(6);

    // 7. Bookings by Subcategory (Offering Program Wise stats)
    const bookingsBySubCategoryList = await db
      .select({
        subCategoryName: offeringSubCategories.name,
        count: sql<number>`count(*)`
      })
      .from(bookings)
      .innerJoin(offeringSubCategories, eq(bookings.subCategoryId, offeringSubCategories.id))
      .groupBy(offeringSubCategories.name);

    return NextResponse.json({
      data: {
        totalAboutSlides: Number(aboutCount[0]?.count || 0),
        totalMetrics: Number(metricsCount[0]?.count || 0),
        totalGallery: Number(galleryCount[0]?.count || 0),
        totalQueries: Number(queriesCount[0]?.count || 0),
        pendingQueries: Number(pendingQueriesCount[0]?.count || 0),
        totalUsers: Number(usersCount[0]?.count || 0),
        totalBookings: Number(bookingsCount[0]?.count || 0),
        totalDrafts: Number(draftsCount[0]?.count || 0),
        totalSlots: Number(slotsCount[0]?.count || 0),
        totalCategories: Number(categoriesCount[0]?.count || 0),
        totalOfferings: Number(offeringsCount[0]?.count || 0),
        totalLocations: Number(locationsCount[0]?.count || 0),
        totalPaymentQrs: Number(paymentQrsCount[0]?.count || 0),
        totalQuestions: Number(questionsCount[0]?.count || 0),
        bookingsByStatus: bookingsByStatus.map((row) => ({
          status: row.status,
          count: Number(row.count),
        })),
        bookingsByFormat: bookingsByFormat.map((row) => ({
          format: row.format,
          count: Number(row.count),
        })),
        slotsByStatus: slotsByStatus.map((row) => ({
          status: row.status,
          count: Number(row.count),
        })),
        averageRating: Math.round(Number(avgRatingRes[0]?.avg || 0) * 10) / 10,
        recentBookings: recentBookingsList.map((row) => ({
          id: row.id,
          seekerName: row.seekerName,
          seekerEmail: row.seekerEmail,
          status: row.status,
          createdAt: row.createdAt,
        })),
        bookingsBySubCategory: bookingsBySubCategoryList.map((row) => ({
          name: row.subCategoryName.toUpperCase(),
          Bookings: Number(row.count),
        })),
      }
    });
  } catch (err: any) {
    console.error("Dashboard stats gather error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
