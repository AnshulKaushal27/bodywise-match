import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

import { FirstVisitNotice } from "@/components/FirstVisitNotice";
import { OfflineBanner } from "@/components/OfflineBanner";

export const metadata: Metadata = {
  title: "Bodywise Match — Warm Editorial Product Finder",
  description: "Find a product that fits your goal, understand what other customers report, and know what to do if the experience goes wrong.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${GeistSans.variable}`}>
      <body className="min-h-[100dvh] bg-paper text-charcoal font-body antialiased selection:bg-accent-lime selection:text-brand-deep flex flex-col justify-between">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-brand-evergreen focus:text-white focus:font-semibold focus:rounded-button focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-evergreen active:scale-[0.98] motion-safe:transition-transform"
        >
          Skip to main content
        </a>
        <OfflineBanner />
        <FirstVisitNotice />
        {children}
      </body>
    </html>
  );
}
