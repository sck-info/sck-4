import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { campaignUpsertSchema } from "@/lib/validators/campaign";
import { getCampaignBundle, replaceCampaignStructure } from "@/lib/campaigns";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const bundle = await getCampaignBundle(id);
    if (!bundle) {
      return NextResponse.json({ success: false, message: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...bundle });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message || "Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const result = campaignUpsertSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Validation Error",
        errors: result.error.flatten(),
      }, { status: 400 });
    }

    const userId = session.user.id ? session.user.id : null;

    const [updatedCampaign] = await db.transaction(async (tx) => {
      const [camp] = await tx
        .update(campaigns)
        .set({
          title: result.data.title,
          description: result.data.description,
          allowMultipleSubmissions: result.data.allowMultipleSubmissions,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, id))
        .returning();

      if (!camp) {
        throw new Error("Campaign not found");
      }

      await replaceCampaignStructure(id, result.data, tx);
      return [camp];
    });

    return NextResponse.json({ success: true, id: updatedCampaign.id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message || "Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    const [updated] = await db
      .update(campaigns)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, message: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: updated.id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message || "Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const [deleted] = await db
      .delete(campaigns)
      .where(eq(campaigns.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ success: false, message: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Campaign deleted successfully" });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message || "Server Error" }, { status: 500 });
  }
}
