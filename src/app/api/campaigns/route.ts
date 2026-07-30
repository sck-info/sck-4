import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns, campaignResponses } from "@/db/schema";
import { auth } from "@/lib/auth";
import { desc, and, eq, sql, or, ilike, count } from "drizzle-orm";
import { parsePaginationParams, createPaginationMeta } from "@/lib/pagination";
import { campaignUpsertSchema } from "@/lib/validators/campaign";
import { generateCampaignCode, replaceCampaignStructure } from "@/lib/campaigns";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);
    const conditions = [];

    const status = searchParams.get("status");
    if (status && status !== "all") {
      conditions.push(eq(campaigns.status, status as any));
    }

    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      conditions.push(ilike(campaigns.title, `%${searchQuery}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count response count subquery
    const responseCountSubquery = db
      .select({
        campaignId: campaignResponses.campaignId,
        count: count(campaignResponses.id).as("resp_count"),
      })
      .from(campaignResponses)
      .groupBy(campaignResponses.campaignId)
      .as("rc");

    const list = await db
      .select({
        id: campaigns.id,
        code: campaigns.code,
        title: campaigns.title,
        description: campaigns.description,
        status: campaigns.status,
        allowMultipleSubmissions: campaigns.allowMultipleSubmissions,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        responseCount: sql<number>`coalesce(${responseCountSubquery.count}, 0)::int`,
      })
      .from(campaigns)
      .leftJoin(responseCountSubquery, eq(campaigns.id, responseCountSubquery.campaignId))
      .where(whereClause)
      .orderBy(desc(campaigns.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalRes] = await db
      .select({ count: count(campaigns.id) })
      .from(campaigns)
      .where(whereClause);

    const total = totalRes?.count || 0;
    const pagination = createPaginationMeta({ page, limit, total });

    return NextResponse.json({ success: true, data: list, pagination });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message || "Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = campaignUpsertSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Validation Error",
        errors: result.error.flatten(),
      }, { status: 400 });
    }

    const code = await generateCampaignCode();
    const userId = session.user.id ? session.user.id : null;

    const [campaign] = await db.transaction(async (tx) => {
      const [newCampaign] = await tx
        .insert(campaigns)
        .values({
          code,
          title: result.data.title,
          description: result.data.description,
          status: "DRAFT",
          allowMultipleSubmissions: result.data.allowMultipleSubmissions,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      await replaceCampaignStructure(newCampaign.id, result.data, tx);
      return [newCampaign];
    });

    return NextResponse.json({ success: true, id: campaign.id, code: campaign.code });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message || "Server Error" }, { status: 500 });
  }
}
