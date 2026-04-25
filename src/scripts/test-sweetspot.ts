/**
 * Live integration test for the Sweetspot / Golfstar API.
 *
 * Hits the real Sweetspot endpoints and prints a human-readable summary
 * so you can verify connectivity and inspect the response shape before
 * relying on it in the app.
 *
 * Usage:
 *   npm run test:api
 *
 * Environment variables (optional — falls back to defaults in sweetspot.ts):
 *   SWEETSPOT_API_BASE_URL   Base URL, default https://api.sweetspot.io
 *   SWEETSPOT_CLUB_SLUG      Club slug, default golfstar-golf-club
 */

import { fetchCourses, fetchTeeTimes } from "../lib/sweetspot";

const BASE_URL =
  process.env.SWEETSPOT_API_BASE_URL ?? "https://api.sweetspot.io";
const CLUB_SLUG =
  process.env.SWEETSPOT_CLUB_SLUG ?? "golfstar-golf-club";

// Use tomorrow's date (UTC) so we always look slightly ahead
const tomorrow = new Date();
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
const DATE = tomorrow.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

function hr(char = "─", width = 60) {
  return char.repeat(width);
}

async function main() {
  console.log(hr("═"));
  console.log("  Sweetspot / Golfstar API — live integration test");
  console.log(hr("═"));
  console.log(`  Base URL : ${BASE_URL}`);
  console.log(`  Club     : ${CLUB_SLUG}`);
  console.log(`  Date     : ${DATE}`);
  console.log(hr("─"));

  // ── 1. Courses ──────────────────────────────────────────────────────────────
  console.log("\n📋  Fetching courses …");
  let courses;
  try {
    courses = await fetchCourses();
    console.log(`✅  ${courses.length} course(s) returned`);
    for (const c of courses) {
      console.log(`    • [${c.id}] ${c.name} — ${c.holes} holes`);
    }
  } catch (err) {
    console.error(
      "❌  fetchCourses() failed:",
      err instanceof Error ? err.message : err
    );
    process.exit(1);
  }

  if (courses.length === 0) {
    console.warn("\n⚠️  No courses returned — skipping tee-time check.");
    process.exit(0);
  }

  // ── 2. Tee times for the first course ──────────────────────────────────────
  const firstCourse = courses[0];
  console.log(
    `\n⏰  Fetching tee times for "${firstCourse.name}" on ${DATE} …`
  );

  let teeTimes;
  try {
    teeTimes = await fetchTeeTimes(firstCourse.id, DATE);
    console.log(`✅  ${teeTimes.length} tee time(s) returned`);
    for (const tt of teeTimes.slice(0, 5)) {
      const time = new Date(tt.startTime).toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Stockholm",
      });
      const price = tt.price ? `${tt.price} ${tt.currency ?? ""}`.trim() : "n/a";
      console.log(
        `    • ${time}  slots: ${tt.availableSlots}/${tt.totalSlots}  price: ${price}`
      );
    }
    if (teeTimes.length > 5) {
      console.log(`    … and ${teeTimes.length - 5} more`);
    }
  } catch (err) {
    console.error(
      "❌  fetchTeeTimes() failed:",
      err instanceof Error ? err.message : err
    );
    process.exit(1);
  }

  console.log("\n" + hr("═"));
  console.log("  All checks passed — the Golfstar API is reachable ✅");
  console.log(hr("═") + "\n");
}

main();
