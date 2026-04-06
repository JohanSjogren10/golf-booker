"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold text-green-700">
          <span className="text-xl">⛳</span>
          <span>Golf Booker</span>
        </Link>

        {session ? (
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-green-700 transition-colors"
            >
              Mina bevakningar
            </Link>
            <Link
              href="/tee-times"
              className="text-gray-600 hover:text-green-700 transition-colors"
            >
              Starttider
            </Link>
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 text-gray-600 hover:text-green-700 transition-colors"
              >
                {session.user?.name ?? session.user?.email}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open && (
                <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-44">
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Logga ut
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-gray-600 hover:text-green-700 transition-colors">
              Logga in
            </Link>
            <Link
              href="/register"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-full transition-colors"
            >
              Registrera
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
