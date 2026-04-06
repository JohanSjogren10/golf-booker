import nodemailer from "nodemailer";
import type { SweetspotTeeTime } from "@/lib/sweetspot";
import type { Watch } from "@prisma/client";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASSWORD
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      : undefined,
});

const FROM = process.env.EMAIL_FROM ?? "noreply@golf-booker.se";
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

/**
 * Send an email notification when a watched tee time becomes available.
 */
export async function sendTeeTimeAvailableEmail({
  to,
  watch,
  teeTime,
}: {
  to: string;
  watch: Watch;
  teeTime: SweetspotTeeTime;
}): Promise<void> {
  const startTime = new Date(teeTime.startTime);
  const formattedDate = startTime.toLocaleDateString("sv-SE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Stockholm",
  });
  const formattedTime = startTime.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  });

  const bookingUrl =
    teeTime.bookingUrl ??
    `https://book.sweetspot.io/clubs/${process.env.SWEETSPOT_CLUB_SLUG ?? "golfstar-golf-club"}`;

  const slots = teeTime.availableSlots;

  await transporter.sendMail({
    from: `Golf Booker <${FROM}>`,
    to,
    subject: `⛳ Ledig tid på ${watch.courseName} — ${formattedDate} ${formattedTime}`,
    text: [
      `En tid du bevakar har blivit tillgänglig!`,
      ``,
      `Bana:  ${watch.courseName}`,
      `Datum: ${formattedDate}`,
      `Tid:   ${formattedTime}`,
      `Platser: ${slots} lediga`,
      ``,
      `Boka direkt: ${bookingUrl}`,
      ``,
      `Hantera dina bevakningar: ${APP_URL}/dashboard`,
      ``,
      `// Golf Booker`,
    ].join("\n"),
    html: `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: sans-serif; color: #111; background: #f9f9f9; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 32px auto; background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    h1 { color: #16a34a; font-size: 22px; margin-top: 0; }
    .detail { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px 20px; border-radius: 4px; margin: 24px 0; }
    .detail p { margin: 6px 0; }
    .cta { display: inline-block; background: #16a34a; color: #fff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 15px; margin-top: 8px; }
    .footer { font-size: 12px; color: #888; margin-top: 32px; }
    a { color: #16a34a; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⛳ Ledig tid hittad!</h1>
    <p>En tid du bevakar på <strong>${watch.courseName}</strong> har blivit tillgänglig.</p>

    <div class="detail">
      <p><strong>Bana:</strong> ${watch.courseName}</p>
      <p><strong>Datum:</strong> ${formattedDate}</p>
      <p><strong>Starttid:</strong> ${formattedTime}</p>
      <p><strong>Lediga platser:</strong> ${slots}</p>
    </div>

    <a href="${bookingUrl}" class="cta">Boka nu</a>

    <p class="footer">
      <a href="${APP_URL}/dashboard">Hantera bevakningar</a> ·
      Skickat av Golf Booker
    </p>
  </div>
</body>
</html>
    `.trim(),
  });
}
