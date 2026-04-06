/**
 * Sweetspot Golf Booking API Client
 *
 * Integrates with the Sweetspot booking system used by Golfstar Golf Club
 * in Stockholm, Sweden. The base URL and club slug are configured via
 * environment variables.
 *
 * API documentation: https://api.sweetspot.io (login required)
 * Booking portal:    https://book.sweetspot.io/clubs/golfstar-golf-club
 */

export interface SweetspotCourse {
  id: string;
  name: string;
  clubId: string;
  holes: number;
  color?: string;
}

export interface SweetspotTeeTime {
  id: string;
  courseId: string;
  courseName: string;
  startTime: string; // ISO-8601 datetime e.g. "2024-06-15T08:00:00+02:00"
  availableSlots: number;
  totalSlots: number;
  price?: number;
  currency?: string;
  bookingUrl?: string;
}

const BASE_URL =
  process.env.SWEETSPOT_API_BASE_URL ?? "https://api.sweetspot.io";
const CLUB_SLUG =
  process.env.SWEETSPOT_CLUB_SLUG ?? "golfstar-golf-club";

/**
 * Fetch all courses for the configured Golfstar club.
 */
export async function fetchCourses(): Promise<SweetspotCourse[]> {
  const url = `${BASE_URL}/public/v1/clubs/${CLUB_SLUG}/courses`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 }, // cache for 1 hour
  });

  if (!res.ok) {
    throw new Error(
      `Sweetspot API error fetching courses: ${res.status} ${res.statusText}`
    );
  }

  const data = await res.json();
  // Normalise response — the actual shape depends on the API version
  const courses: SweetspotCourse[] = Array.isArray(data)
    ? data
    : (data.courses ?? data.data ?? []);

  return courses;
}

/**
 * Fetch available tee times for a given course and date.
 *
 * @param courseId - Sweetspot course identifier
 * @param date     - ISO date string YYYY-MM-DD
 */
export async function fetchTeeTimes(
  courseId: string,
  date: string
): Promise<SweetspotTeeTime[]> {
  const url = new URL(
    `${BASE_URL}/public/v1/clubs/${CLUB_SLUG}/tee-times`
  );
  url.searchParams.set("courseId", courseId);
  url.searchParams.set("date", date);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    // No cache — we need fresh availability data
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `Sweetspot API error fetching tee times: ${res.status} ${res.statusText}`
    );
  }

  const data = await res.json();
  const slots: SweetspotTeeTime[] = Array.isArray(data)
    ? data
    : (data.teeTimes ?? data.tee_times ?? data.data ?? []);

  return slots;
}

/**
 * Build a direct booking URL for a specific tee time.
 */
export function buildBookingUrl(teeTimeId: string): string {
  return `https://book.sweetspot.io/clubs/${CLUB_SLUG}?teeTimeId=${teeTimeId}`;
}
