import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { type NextRequest } from "next/server";

const watchSchema = z.object({
  courseId: z.string().min(1),
  courseName: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  timeFrom: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Must be HH:MM")
    .default("06:00"),
  timeTo: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Must be HH:MM")
    .default("20:00"),
  players: z.number().int().min(1).max(4).default(1),
});

/**
 * GET /api/watches
 * Returns all active watches for the authenticated user.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const watches = await prisma.watch.findMany({
    where: { userId: session.user.id },
    orderBy: [{ date: "asc" }, { timeFrom: "asc" }],
  });

  return Response.json({ watches });
}

/**
 * POST /api/watches
 * Create a new tee time watch.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = watchSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { courseId, courseName, date, timeFrom, timeTo, players } =
      parsed.data;

    // Prevent duplicate watches for same course/date/window
    const existing = await prisma.watch.findFirst({
      where: {
        userId: session.user.id,
        courseId,
        date,
        timeFrom,
        timeTo,
        active: true,
      },
    });

    if (existing) {
      return Response.json(
        { error: "You already have an active watch for this time slot" },
        { status: 409 }
      );
    }

    const watch = await prisma.watch.create({
      data: {
        userId: session.user.id,
        courseId,
        courseName,
        date,
        timeFrom,
        timeTo,
        players,
      },
    });

    return Response.json({ watch }, { status: 201 });
  } catch (err) {
    console.error("Create watch error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
