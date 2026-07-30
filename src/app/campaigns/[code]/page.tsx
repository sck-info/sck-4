import { db } from "@/lib/db";
import { campaigns } from "@/db/schema";
import { getCampaignBundle } from "@/lib/campaigns";
import { eq } from "drizzle-orm";
import { PublicCampaignClient } from "./PublicCampaignClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ code: string }>;
};

function serialize(data: any) {
  return JSON.parse(JSON.stringify(data));
}

export default async function Page({ params }: Props) {
  const { code } = await params;
  const [camp] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.code, code))
    .limit(1);

  if (!camp) {
    return (
      <PublicCampaignClient
        code={code}
        initialBundle={null}
        initialMessage="Campaign not found"
      />
    );
  }

  if (camp.status !== "PUBLISHED") {
    return (
      <PublicCampaignClient
        code={code}
        initialBundle={null}
        initialMessage="This campaign is no longer accepting responses."
      />
    );
  }

  const bundle = await getCampaignBundle(camp.id);
  const serializedBundle = serialize(bundle);

  return (
    <PublicCampaignClient
      code={code}
      initialBundle={serializedBundle}
      initialMessage=""
    />
  );
}
