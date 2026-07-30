import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns, campaignQuestions, campaignResponses, campaignAnswers } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq, asc, inArray, count } from "drizzle-orm";
import { parsePaginationParams, createPaginationMeta } from "@/lib/pagination";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, id))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ success: false, message: "Campaign not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const isExport = searchParams.get("export") === "true";

    const questionsList = await db
      .select()
      .from(campaignQuestions)
      .where(and(eq(campaignQuestions.campaignId, id), eq(campaignQuestions.isDeleted, false)))
      .orderBy(asc(campaignQuestions.sortOrder));

    let responsesList;
    let paginationMeta;

    if (isExport) {
      responsesList = await db
        .select()
        .from(campaignResponses)
        .where(eq(campaignResponses.campaignId, id))
        .orderBy(asc(campaignResponses.submittedAt));
    } else {
      const { page, limit, offset } = parsePaginationParams(searchParams);

      const [totalCountRow] = await db
        .select({ value: count() })
        .from(campaignResponses)
        .where(eq(campaignResponses.campaignId, id));

      const totalCount = totalCountRow?.value || 0;
      paginationMeta = createPaginationMeta({ page, limit, total: totalCount });

      responsesList = await db
        .select()
        .from(campaignResponses)
        .where(eq(campaignResponses.campaignId, id))
        .orderBy(asc(campaignResponses.submittedAt))
        .limit(limit)
        .offset(offset);
    }

    const responseIds = responsesList.map((r) => r.id);
    const answersList = responseIds.length
      ? await db
          .select()
          .from(campaignAnswers)
          .where(inArray(campaignAnswers.responseId, responseIds))
      : [];

    const formattedResponses = responsesList.map((resp) => {
      const answersMap: Record<string, any> = {};
      const respAnswers = answersList.filter((ans) => ans.responseId === resp.id);
      respAnswers.forEach((ans) => {
        answersMap[ans.questionId] = ans.value;
      });
      return {
        id: resp.id,
        respondentName: resp.respondentName,
        respondentEmail: resp.respondentEmail,
        submittedAt: resp.submittedAt?.toISOString(),
        answers: answersMap,
      };
    });

    return NextResponse.json({
      success: true,
      campaign,
      questions: questionsList,
      responses: formattedResponses,
      pagination: paginationMeta,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message || "Server Error" }, { status: 500 });
  }
}
