import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * DELETE /api/watches/[id]
 * Deactivates (soft-deletes) a watch owned by the current user.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const watch = await prisma.watch.findUnique({ where: { id } });

  if (!watch) {
    return Response.json({ error: "Watch not found" }, { status: 404 });
  }

  if (watch.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.watch.update({ where: { id }, data: { active: false } });

  return Response.json({ success: true });
}
