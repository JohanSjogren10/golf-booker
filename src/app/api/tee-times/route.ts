import { fetchCourses, fetchTeeTimes } from "@/lib/sweetspot";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { type NextRequest } from "next/server";

/**
 * GET /api/tee-times?courseId=xxx&date=YYYY-MM-DD
 *
 * Returns available tee times for the given course and date.
 * Requires authentication.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const courseId = searchParams.get("courseId");
  const date = searchParams.get("date");

  // If no params, return the list of courses
  if (!courseId && !date) {
    try {
      const courses = await fetchCourses();
      return Response.json({ courses });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return Response.json({ error: msg }, { status: 502 });
    }
  }

  if (!courseId || !date) {
    return Response.json(
      { error: "Both courseId and date are required" },
      { status: 400 }
    );
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json(
      { error: "date must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  try {
    const teeTimes = await fetchTeeTimes(courseId, date);
    return Response.json({ teeTimes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: msg }, { status: 502 });
  }
}
