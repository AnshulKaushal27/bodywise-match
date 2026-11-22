import type { Metadata, Viewport } from "next";
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
import { ClientProviders } from "@/components/ClientProviders";
import { AppNavBar } from "@/components/AppNavBar";

export const viewport: Viewport = {
  themeColor: "#1D4ED8",
};

export const metadata: Metadata = {
  title: "Bodywise Match — White & Blue Editorial Product Finder",
  description: "Find a product that fits your goal, understand what other customers report, and know what to do if the experience goes wrong.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Bodywise Match",
    description: "Find a product that fits your goal, understand what other customers report, and know what to do if the experience goes wrong.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Bodywise Match" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Bodywise Match",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "All",
  description: "Find a product that fits your goal, understand what other customers report, and know what to do if the experience goes wrong.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${GeistSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-[100dvh] bg-paper text-charcoal font-body antialiased selection:bg-accent-lime selection:text-brand-deep flex flex-col justify-between">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-brand-evergreen focus:text-white focus:font-semibold focus:rounded-button focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-evergreen active:scale-[0.98] motion-safe:transition-transform"
        >
          Skip to main content
        </a>
        <OfflineBanner />
        <FirstVisitNotice />
        <AppNavBar />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
