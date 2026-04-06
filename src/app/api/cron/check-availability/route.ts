import { checkAvailability } from "@/lib/checker";
import { type NextRequest } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/check-availability
 *
 * Triggered by a Vercel Cron Job (configured in vercel.json) or
 * any external scheduler (e.g. cron-job.org, GitHub Actions).
 *
 * Optionally secured with a CRON_SECRET environment variable.
 */
export async function GET(request: NextRequest) {
  // Validate secret if configured
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await checkAvailability();
    console.log("[cron] check-availability result:", result);
    return Response.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron] check-availability failed:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
