"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

interface Watch {
  id: string;
  courseId: string;
  courseName: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  players: number;
  active: boolean;
  createdAt: string;
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/watches")
      .then((r) => r.json())
      .then((d) => setWatches(d.watches ?? []))
      .finally(() => setLoading(false));
  }, [status]);

  async function removeWatch(id: string) {
    await fetch(`/api/watches/${id}`, { method: "DELETE" });
    setWatches((prev) => prev.filter((w) => w.id !== id));
  }

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Laddar…
        </div>
      </>
    );
  }

  const activeWatches = watches.filter((w) => w.active);

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10 flex-1 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Mina bevakningar</h1>
            <p className="text-gray-500 text-sm mt-1">
              Du får ett e-postmeddelande när en bevakad tid blir ledig.
            </p>
          </div>
          <Link
            href="/tee-times"
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Ny bevakning
          </Link>
        </div>

        {activeWatches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">👁️</div>
            <h2 className="font-semibold text-lg mb-2">Inga aktiva bevakningar</h2>
            <p className="text-gray-500 text-sm mb-6">
              Gå till starttider, välj en bana och datum, och lägg till en bevakning.
            </p>
            <Link
              href="/tee-times"
              className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              Hitta starttider
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeWatches.map((watch) => (
              <WatchCard
                key={watch.id}
                watch={watch}
                onRemove={() => removeWatch(watch.id)}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function WatchCard({
  watch,
  onRemove,
}: {
  watch: Watch;
  onRemove: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const dateLabel = new Date(watch.date + "T12:00:00").toLocaleDateString(
    "sv-SE",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">
            Aktiv
          </span>
          <span className="font-semibold">{watch.courseName}</span>
        </div>
        <p className="text-gray-500 text-sm capitalize">{dateLabel}</p>
        <p className="text-gray-500 text-sm">
          Kl. {watch.timeFrom}–{watch.timeTo} · {watch.players} spelare
        </p>
      </div>

      <div className="flex items-center gap-2">
        {confirming ? (
          <>
            <span className="text-sm text-gray-500">Ta bort bevakning?</span>
            <button
              onClick={onRemove}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Ja
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Avbryt
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            title="Ta bort bevakning"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
