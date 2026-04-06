"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";

interface Course {
  id: string;
  name: string;
  holes?: number;
}

interface TeeTime {
  id: string;
  courseId: string;
  courseName: string;
  startTime: string;
  availableSlots: number;
  totalSlots: number;
  price?: number;
  currency?: string;
  bookingUrl?: string;
}

// Fallback demo courses when the API is not yet configured
const DEMO_COURSES: Course[] = [
  { id: "djursholms-golf", name: "Djursholms Golf", holes: 18 },
  { id: "lidingo-golf", name: "Lidingö Golf", holes: 18 },
  { id: "kevinge-gk", name: "Kevinge GK", holes: 18 },
  { id: "nacka-golf", name: "Nacka Golf", holes: 18 },
  { id: "sollentuna-gk", name: "Sollentuna GK", holes: 18 },
];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function TeeTimesPage() {
  const { status } = useSession();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [date, setDate] = useState(todayStr());
  const [timeFrom, setTimeFrom] = useState("07:00");
  const [timeTo, setTimeTo] = useState("14:00");
  const [players, setPlayers] = useState(1);

  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  // Track what key was last fully fetched to derive a loading state
  const [fetchedKey, setFetchedKey] = useState("");
  const [apiWarning, setApiWarning] = useState("");
  const [watchSuccess, setWatchSuccess] = useState("");
  const [watchError, setWatchError] = useState("");

  // Derived: the key representing the current query
  const teeTimesKey =
    selectedCourse && date ? `${selectedCourse.id}__${date}` : "";
  // Loading when we have a pending query that hasn't resolved yet
  const loadingTimes = teeTimesKey !== "" && teeTimesKey !== fetchedKey;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load courses
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/tee-times")
      .then((r) => r.json())
      .then((d) => {
        if (d.courses && d.courses.length > 0) {
          setCourses(d.courses);
          setSelectedCourse(d.courses[0]);
        } else {
          setCourses(DEMO_COURSES);
          setSelectedCourse(DEMO_COURSES[0]);
          setApiWarning(
            "Sweetspot API:et är inte konfigurerat ännu. Visar demo-kurser. " +
              "Konfigurera SWEETSPOT_API_BASE_URL och SWEETSPOT_CLUB_SLUG i .env."
          );
        }
      })
      .catch(() => {
        setCourses(DEMO_COURSES);
        setSelectedCourse(DEMO_COURSES[0]);
        setApiWarning(
          "Kan inte nå Sweetspot API. Visar demo-kurser. Sätt korrekt SWEETSPOT_API_BASE_URL i .env."
        );
      })
      .finally(() => setLoadingCourses(false));
  }, [status]);

  // Update key whenever course or date changes to trigger loading state
  useEffect(() => {
    if (!teeTimesKey) return;
    const [courseId, queryDate] = teeTimesKey.split("__");
    fetch(`/api/tee-times?courseId=${courseId}&date=${queryDate}`)
      .then((r) => r.json())
      .then((d) => {
        setTeeTimes(d.teeTimes ?? []);
        setFetchedKey(teeTimesKey);
      })
      .catch(() => {
        setTeeTimes([]);
        setFetchedKey(teeTimesKey);
      });
  }, [teeTimesKey]);

  async function addWatch() {
    if (!selectedCourse) return;
    setWatchSuccess("");
    setWatchError("");

    const res = await fetch("/api/watches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        date,
        timeFrom,
        timeTo,
        players,
      }),
    });

    if (res.ok) {
      setWatchSuccess(
        `Bevakning tillagd! Du får ett mejl när en tid öppnar sig på ${selectedCourse.name}.`
      );
    } else {
      const d = await res.json();
      setWatchError(d.error ?? "Kunde inte lägga till bevakning.");
    }
  }

  if (status === "loading" || loadingCourses) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Laddar…
        </div>
      </>
    );
  }

  const filteredTeeTimes = teeTimes.filter((tt) => {
    if (tt.availableSlots < players) return false;
    const t = new Date(tt.startTime)
      .toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Stockholm",
      });
    return t >= timeFrom && t <= timeTo;
  });

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full">
        <h1 className="text-2xl font-bold mb-2">Starttider</h1>
        <p className="text-gray-500 text-sm mb-8">
          Sök lediga tider och lägg till en bevakning för att bli meddelad
          automatiskt.
        </p>

        {apiWarning && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
            ⚠️ {apiWarning}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Course selector */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Bana
              </label>
              <select
                value={selectedCourse?.id ?? ""}
                onChange={(e) => {
                  const c = courses.find((c) => c.id === e.target.value);
                  setSelectedCourse(c ?? null);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Datum
              </label>
              <input
                type="date"
                value={date}
                min={todayStr()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Time window */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Tid från–till
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={timeFrom}
                  onChange={(e) => setTimeFrom(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="text-gray-400 text-sm">–</span>
                <input
                  type="time"
                  value={timeTo}
                  onChange={(e) => setTimeTo(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Players */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Antal spelare (min)
              </label>
              <select
                value={players}
                onChange={(e) => setPlayers(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} spelare
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Watch button */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center border-t border-gray-100 pt-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                <strong>Lägg till bevakning</strong> — du får ett mejl om en ledig tid dyker upp inom ditt valda tidsfönster.
              </p>
            </div>
            <button
              onClick={addWatch}
              disabled={!selectedCourse}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              + Bevaka
            </button>
          </div>

          {watchSuccess && (
            <p className="mt-3 text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              ✓ {watchSuccess}
            </p>
          )}
          {watchError && (
            <p className="mt-3 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {watchError}
            </p>
          )}
        </div>

        {/* Tee times list */}
        <h2 className="font-semibold text-lg mb-4">
          Tillgängliga tider{" "}
          <span className="text-gray-400 font-normal text-base">
            {selectedCourse?.name} · {date}
          </span>
        </h2>

        {loadingTimes ? (
          <p className="text-gray-500">Hämtar starttider…</p>
        ) : filteredTeeTimes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
            {teeTimes.length === 0
              ? "Inga starttider hittades för vald bana och datum."
              : "Inga lediga tider matchar ditt filterkriterie."}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeeTimes.map((tt) => (
              <TeeTimeCard key={tt.id} teeTime={tt} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function TeeTimeCard({ teeTime }: { teeTime: TeeTime }) {
  const startTime = new Date(teeTime.startTime);
  const timeStr = startTime.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  });

  const bookingUrl =
    teeTime.bookingUrl ??
    `https://book.sweetspot.io/clubs/golfstar-golf-club`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-xl text-green-700">{timeStr}</p>
          <p className="text-sm text-gray-500">{teeTime.courseName}</p>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            teeTime.availableSlots > 0
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {teeTime.availableSlots}/{teeTime.totalSlots} lediga
        </span>
      </div>

      {teeTime.price !== undefined && (
        <p className="text-sm text-gray-600">
          {teeTime.price} {teeTime.currency ?? "SEK"}
        </p>
      )}

      <a
        href={bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-1 text-sm font-medium text-green-700 border border-green-200 hover:bg-green-50 px-4 py-2 rounded-lg transition-colors"
      >
        Boka på Sweetspot ↗
      </a>
    </div>
  );
}
