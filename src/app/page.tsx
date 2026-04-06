import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-green-700 to-green-900 text-white py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-green-300 text-sm font-semibold uppercase tracking-widest mb-4">
              Sweetspot · Golfstar Stockholm
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Missa aldrig en ledig starttid igen
            </h1>
            <p className="text-green-100 text-lg mb-10 max-w-xl mx-auto">
              Vi bevakar Golfstars banor i Stockholm åt dig och skickar ett
              meddelande direkt när en eftertraktad tid öppnar sig.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-green-800 font-semibold px-8 py-3 rounded-full hover:bg-green-50 transition-colors"
              >
                Kom igång gratis
              </Link>
              <Link
                href="/login"
                className="border border-white/60 text-white px-8 py-3 rounded-full hover:bg-white/10 transition-colors"
              >
                Logga in
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-12">
              Hur det fungerar
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: "🔍",
                  title: "Välj bana & tid",
                  desc: "Välj vilken Golfstar-bana i Stockholm du vill spela på och ange önskat datum och tidsfönster.",
                },
                {
                  icon: "👁️",
                  title: "Vi bevakar",
                  desc: "Vårt system kontrollerar Sweetspot regelbundet och håller koll på om din önskade tid blir tillgänglig.",
                },
                {
                  icon: "🔔",
                  title: "Få en avisering",
                  desc: "Så fort en ledig tid matchar din bevakning skickar vi ett e-postmeddelande så att du kan boka direkt.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center"
                >
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Courses */}
        <section className="bg-green-50 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Golfstar Stockholm</h2>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Vi bevakar alla banor som Golfstar erbjuder via Sweetspot i
              Stockholmsområdet.
            </p>
            <a
              href="https://book.sweetspot.io/clubs/golfstar-golf-club"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-700 font-medium hover:underline"
            >
              Öppna Sweetspot bokning
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        Golf Booker — inofficiellt bevakningsverktyg för Golfstar Stockholm via Sweetspot
      </footer>
    </>
  );
}
