import { NextResponse } from "next/server";

export function enforceCronSecurity(
  req: Request,
  allowManualForce = false,
): { allowed: boolean; response?: NextResponse } {
  const url = new URL(req.url);

  const isForced = allowManualForce && url.searchParams.get("force") === "true";

  if (isForced) {
    console.log("[Cron] Manual force execution:", url.pathname);
    return { allowed: true };
  }

  if (!process.env.CRON_SECRET) {
    console.error("[Cron] CRON_SECRET is not configured.");

    return {
      allowed: false,
      response: NextResponse.json(
        { message: "Server configuration error." },
        { status: 500 },
      ),
    };
  }

  const cronSecret = req.headers.get("x-cron-secret");

  if (cronSecret !== process.env.CRON_SECRET) {
    console.warn(
      `[Cron] Unauthorized request for ${url.pathname} from ${
        req.headers.get("x-forwarded-for") ??
        req.headers.get("host") ??
        "Unknown"
      }`,
    );

    return {
      allowed: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  return { allowed: true };
}
