import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns, campaignResponses, campaignQuestions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { normalizeAnswerValue, replaceResponseAnswers, questionsForValidation } from "@/lib/campaigns";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
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
        { status: 400 }
      );
    }

    const { respondentName, respondentEmail, answers } = await req.json();

    const questionsList = await questionsForValidation(campaign.id);
    const validatedAnswers: Record<string, any> = {};

    for (const question of questionsList) {
      const ansVal = answers[question.id];
      const check = normalizeAnswerValue(question, ansVal);
      if (!check.ok) {
        return NextResponse.json(
          { success: false, message: `${question.prompt}: ${check.message}` },
          { status: 400 }
        );
      }
      validatedAnswers[question.id] = check.value;
    }

    // Insert response and answers inside a transaction
    const responseId = await db.transaction(async (tx) => {
      const [resp] = await tx
        .insert(campaignResponses)
        .values({
          campaignId: campaign.id,
          respondentName: respondentName?.trim() || null,
          respondentEmail: respondentEmail?.trim() || null,
        })
        .returning();

      return resp.id;
    });

    await replaceResponseAnswers(responseId, questionsList.map((q) => q.id), validatedAnswers);

    return NextResponse.json({ success: true, responseId });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message || "Server Error" }, { status: 500 });
  }
}
