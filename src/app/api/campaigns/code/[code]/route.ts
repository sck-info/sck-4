import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns, campaignContacts, campaignSections, campaignQuestions } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.code, code))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ success: false, message: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status !== "PUBLISHED") {
      return NextResponse.json(
        { success: false, message: "This campaign is no longer accepting responses." },
        { status: 403 }
      );
    }

    const [contacts, sections, questions] = await Promise.all([
      db
        .select()
        .from(campaignContacts)
        .where(eq(campaignContacts.campaignId, campaign.id))
        .orderBy(asc(campaignContacts.sortOrder)),
      db
        .select()
        .from(campaignSections)
        .where(eq(campaignSections.campaignId, campaign.id))
        .orderBy(asc(campaignSections.sortOrder)),
      db
        .select()
        .from(campaignQuestions)
        .where(and(eq(campaignQuestions.campaignId, campaign.id), eq(campaignQuestions.isDeleted, false)))
        .orderBy(asc(campaignQuestions.sortOrder)),
    ]);

    return NextResponse.json({
      success: true,
      campaign,
      contacts,
      sections,
      questions,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message || "Server Error" }, { status: 500 });
  }
}
