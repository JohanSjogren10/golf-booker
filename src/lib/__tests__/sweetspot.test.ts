import { describe, it, expect, vi } from "vitest";
import {
  fetchCourses,
  fetchTeeTimes,
  buildBookingUrl,
  type SweetspotCourse,
  type SweetspotTeeTime,
} from "../sweetspot";

// ─── helpers ────────────────────────────────────────────────────────────────

function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "Bad Request",
    json: () => Promise.resolve(body),
  });
}

const SAMPLE_COURSES: SweetspotCourse[] = [
  { id: "course-1", name: "Golfstar Nord", clubId: "golfstar-golf-club", holes: 18 },
  { id: "course-2", name: "Golfstar Syd", clubId: "golfstar-golf-club", holes: 9 },
];

const SAMPLE_TEE_TIMES: SweetspotTeeTime[] = [
  {
    id: "tt-1",
    courseId: "course-1",
    courseName: "Golfstar Nord",
    startTime: "2025-06-15T08:00:00+02:00",
    availableSlots: 3,
    totalSlots: 4,
    price: 450,
    currency: "SEK",
  },
  {
    id: "tt-2",
    courseId: "course-1",
    courseName: "Golfstar Nord",
    startTime: "2025-06-15T08:10:00+02:00",
    availableSlots: 1,
    totalSlots: 4,
  },
];

// ─── fetchCourses ────────────────────────────────────────────────────────────

describe("fetchCourses", () => {
  it("returns courses when the API responds with a bare array", async () => {
    vi.stubGlobal("fetch", mockFetch(SAMPLE_COURSES));
    const courses = await fetchCourses();
    expect(courses).toEqual(SAMPLE_COURSES);
  });

  it("returns courses when the API responds with { courses: [...] }", async () => {
    vi.stubGlobal("fetch", mockFetch({ courses: SAMPLE_COURSES }));
    const courses = await fetchCourses();
    expect(courses).toEqual(SAMPLE_COURSES);
  });

  it("returns courses when the API responds with { data: [...] }", async () => {
    vi.stubGlobal("fetch", mockFetch({ data: SAMPLE_COURSES }));
    const courses = await fetchCourses();
    expect(courses).toEqual(SAMPLE_COURSES);
  });

  it("returns an empty array when the API responds with an empty object", async () => {
    vi.stubGlobal("fetch", mockFetch({}));
    const courses = await fetchCourses();
    expect(courses).toEqual([]);
  });

  it("calls the correct URL", async () => {
    const spy = mockFetch(SAMPLE_COURSES);
    vi.stubGlobal("fetch", spy);
    await fetchCourses();

    const calledUrl: string = spy.mock.calls[0][0];
    expect(calledUrl).toMatch(/\/public\/v1\/clubs\/golfstar-golf-club\/courses$/);
  });

  it("throws when the API returns a non-ok response", async () => {
    vi.stubGlobal("fetch", mockFetch({ message: "Not found" }, false, 404));
    await expect(fetchCourses()).rejects.toThrow("Sweetspot API error fetching courses: 404");
  });
});

// ─── fetchTeeTimes ───────────────────────────────────────────────────────────

describe("fetchTeeTimes", () => {
  const COURSE_ID = "course-1";
  const DATE = "2025-06-15";

  it("returns tee times when the API responds with a bare array", async () => {
    vi.stubGlobal("fetch", mockFetch(SAMPLE_TEE_TIMES));
    const slots = await fetchTeeTimes(COURSE_ID, DATE);
    expect(slots).toEqual(SAMPLE_TEE_TIMES);
  });

  it("returns tee times when the API responds with { teeTimes: [...] }", async () => {
    vi.stubGlobal("fetch", mockFetch({ teeTimes: SAMPLE_TEE_TIMES }));
    const slots = await fetchTeeTimes(COURSE_ID, DATE);
    expect(slots).toEqual(SAMPLE_TEE_TIMES);
  });

  it("returns tee times when the API responds with { tee_times: [...] }", async () => {
    vi.stubGlobal("fetch", mockFetch({ tee_times: SAMPLE_TEE_TIMES }));
    const slots = await fetchTeeTimes(COURSE_ID, DATE);
    expect(slots).toEqual(SAMPLE_TEE_TIMES);
  });

  it("returns tee times when the API responds with { data: [...] }", async () => {
    vi.stubGlobal("fetch", mockFetch({ data: SAMPLE_TEE_TIMES }));
    const slots = await fetchTeeTimes(COURSE_ID, DATE);
    expect(slots).toEqual(SAMPLE_TEE_TIMES);
  });

  it("returns an empty array when the API responds with an empty object", async () => {
    vi.stubGlobal("fetch", mockFetch({}));
    const slots = await fetchTeeTimes(COURSE_ID, DATE);
    expect(slots).toEqual([]);
  });

  it("passes courseId and date as query params", async () => {
    const spy = mockFetch(SAMPLE_TEE_TIMES);
    vi.stubGlobal("fetch", spy);
    await fetchTeeTimes(COURSE_ID, DATE);

    const calledUrl: string = spy.mock.calls[0][0];
    expect(calledUrl).toContain(`courseId=${COURSE_ID}`);
    expect(calledUrl).toContain(`date=${DATE}`);
  });

  it("throws when the API returns a non-ok response", async () => {
    vi.stubGlobal("fetch", mockFetch({ message: "Server error" }, false, 500));
    await expect(fetchTeeTimes(COURSE_ID, DATE)).rejects.toThrow(
      "Sweetspot API error fetching tee times: 500"
    );
  });
});

// ─── buildBookingUrl ─────────────────────────────────────────────────────────

describe("buildBookingUrl", () => {
  it("builds a URL containing the teeTimeId", () => {
    const url = buildBookingUrl("tt-abc-123");
    expect(url).toContain("teeTimeId=tt-abc-123");
  });

  it("points to the book.sweetspot.io booking portal", () => {
    const url = buildBookingUrl("tt-abc-123");
    expect(url).toMatch(/^https:\/\/book\.sweetspot\.io/);
  });

  it("includes the club slug", () => {
    const url = buildBookingUrl("tt-abc-123");
    expect(url).toContain("golfstar-golf-club");
  });
});
