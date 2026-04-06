/**
 * Availability checker — polls Sweetspot for open tee times
 * and sends notifications when a watched slot becomes available.
 *
 * Called by the /api/cron/check-availability route handler,
 * which in turn is triggered by a Vercel Cron Job or an external scheduler.
 */

import { prisma } from "@/lib/db";
import { fetchTeeTimes } from "@/lib/sweetspot";
import { sendTeeTimeAvailableEmail } from "@/lib/notifications";

/**
 * Check every active watch against the Sweetspot API and
 * send notifications for newly available tee times.
 *
 * @returns Summary of watches checked and notifications sent.
 */
export async function checkAvailability(): Promise<{
  watchesChecked: number;
  notificationsSent: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let notificationsSent = 0;

  // Load all active watches together with owner email
  const watches = await prisma.watch.findMany({
    where: { active: true },
    include: { user: { select: { email: true, notifyEmail: true } } },
  });

  // Group watches by courseId + date to minimise API calls
  const grouped = new Map<string, typeof watches>();
  for (const watch of watches) {
    const key = `${watch.courseId}__${watch.date}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(watch);
  }

  for (const [key, batch] of grouped.entries()) {
    const [courseId, date] = key.split("__");

    let teeTimes;
    try {
      teeTimes = await fetchTeeTimes(courseId, date);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to fetch tee times for ${courseId} on ${date}: ${msg}`);
      continue;
    }

    for (const watch of batch) {
      // Filter tee times matching the desired window and player count
      const matching = teeTimes.filter((tt) => {
        if (tt.availableSlots < watch.players) return false;
        const teeDate = new Date(tt.startTime);
        const hhmm = teeDate
          .toLocaleTimeString("sv-SE", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Stockholm",
          });
        return hhmm >= watch.timeFrom && hhmm <= watch.timeTo;
      });

      for (const tt of matching) {
        // Check if we've already notified this user about this exact slot
        const alreadyNotified = await prisma.notification.findUnique({
          where: {
            watchId_teeTimeId_channel: {
              watchId: watch.id,
              teeTimeId: tt.id,
              channel: "email",
            },
          },
        });

        if (alreadyNotified) continue;

        // Send email notification if the user has email notifications enabled
        if (watch.user.notifyEmail && watch.user.email) {
          try {
            await sendTeeTimeAvailableEmail({
              to: watch.user.email,
              watch,
              teeTime: tt,
            });

            await prisma.notification.create({
              data: {
                watchId: watch.id,
                teeTimeId: tt.id,
                channel: "email",
              },
            });

            notificationsSent++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(
              `Failed to send notification for watch ${watch.id}: ${msg}`
            );
          }
        }
      }
    }
  }

  return { watchesChecked: watches.length, notificationsSent, errors };
}
