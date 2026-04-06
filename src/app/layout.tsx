import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "Golf Booker — Golfstar Stockholm",
  description:
    "Bevaka lediga starttider på Golfstar Stockholm via Sweetspot. Få ett meddelande direkt när din önskade tid blir tillgänglig.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 antialiased font-sans">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
