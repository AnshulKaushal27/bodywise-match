"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  ArrowsLeftRight,
  List,
  X,
  Lifebuoy,
  ShoppingBag,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export function AppNavBar() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [compareCount, setCompareCount] = React.useState(0);
  const [searchVal, setSearchVal] = React.useState("");

  // Sync comparison items count from sessionStorage
  React.useEffect(() => {
    const updateCount = () => {
      if (typeof window !== "undefined") {
        try {
          const raw = sessionStorage.getItem("bodywise_compare_ids");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setCompareCount(parsed.length);
              return;
            }
          }
          setCompareCount(0);
        } catch {
          setCompareCount(0);
        }
      }
    };

    updateCount();
    window.addEventListener("storage", updateCount);
    // Periodic check for same-tab updates
    const interval = setInterval(updateCount, 1500);

    return () => {
      window.removeEventListener("storage", updateCount);
      clearInterval(interval);
    };
  }, []);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Guard: Absolutely NEVER render on the landing page per user rule.
  // Note: Placed after all hooks to strictly adhere to React's Rules of Hooks.
  if (pathname === "/") {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal("");
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    {
      label: "Catalogue",
      href: "/products",
      active: pathname.startsWith("/products"),
      icon: ShoppingBag,
    },
    {
      label: "Compare",
      href: "/compare",
      active: pathname.startsWith("/compare"),
      badge: compareCount > 0 ? compareCount : undefined,
      icon: ArrowsLeftRight,
    },
    {
      label: "Help & Issues",
      href: "/help",
      active: pathname.startsWith("/help"),
      icon: Lifebuoy,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/90 backdrop-blur-md shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 group rounded-button p-1 focus-ring"
              aria-label="Bodywise Match Home"
            >
              <div
                className="w-8 h-8 rounded-button bg-gradient-to-br from-brand-deep via-[#0E2A52] to-brand-primary text-white flex items-center justify-center font-display font-bold text-xs tracking-tight shadow-xs select-none group-hover:scale-105 border border-brand-primary/25 shrink-0 transition-transform duration-150"
                aria-hidden="true"
              >
                BM
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-brand-deep text-base sm:text-lg tracking-tight leading-none">
                  Bodywise Match
                </span>
                <span className="text-[10px] font-medium text-text-muted leading-tight mt-0.5 hidden sm:inline">
                  Verified Wellness Discovery
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav
            aria-label="Application navigation"
            className="hidden md:flex items-center gap-1 lg:gap-2"
          >
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3.5 py-2 rounded-button text-sm font-semibold transition-all duration-150 inline-flex items-center gap-2 min-h-[44px] focus-ring",
                    item.active
                      ? "bg-surface-sage text-brand-deep border border-brand-evergreen/30 shadow-2xs"
                      : "text-text-charcoal hover:text-brand-deep hover:bg-surface-sage/50"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      item.active ? "text-brand-evergreen" : "text-text-muted"
                    )}
                    weight={item.active ? "bold" : "regular"}
                  />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-accent-lime text-brand-deep min-w-[18px] text-center border border-brand-deep/15">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Search Box */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search catalogue..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-56 lg:w-72 pl-9 pr-3 py-1.5 rounded-button bg-paper border border-border text-xs text-charcoal placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-evergreen focus:bg-white transition-all h-9"
              />
              <MagnifyingGlass
                className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                weight="regular"
              />
            </form>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              className="p-2.5 rounded-button text-charcoal hover:bg-surface-sage/50 min-h-[44px] min-w-[44px] flex items-center justify-center focus-ring"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" weight="bold" />
              ) : (
                <List className="w-6 h-6" weight="bold" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-3 shadow-lg animate-fade-in">
          {/* Mobile Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search products or ingredients..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-button bg-paper border border-border text-sm text-charcoal placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-evergreen"
            />
            <MagnifyingGlass
              className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              weight="regular"
            />
          </form>

          {/* Mobile Nav Links */}
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1 pt-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-3 rounded-button text-sm font-semibold flex items-center justify-between min-h-[44px] transition-colors",
                    item.active
                      ? "bg-surface-sage text-brand-deep font-bold"
                      : "text-text-charcoal hover:bg-surface-sage/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        item.active ? "text-brand-evergreen" : "text-text-muted"
                      )}
                      weight={item.active ? "bold" : "regular"}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-accent-lime text-brand-deep border border-brand-deep/15">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
