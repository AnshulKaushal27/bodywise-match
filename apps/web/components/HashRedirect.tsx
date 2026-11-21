"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const HASH_REDIRECTS: Record<string, string> = {
  "#how-it-works": "/how-it-works",
  "#honest-rules": "/safeguards",
};

/**
 * Client component that checks location.hash on mount and redirects
 * old anchor fragments to their new standalone pages.
 * #recommendation-preview clears the hash and stays on "/".
 */
export function HashRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined" || !router) return;
    const hash = window.location.hash;
    if (!hash) return;

    const target = HASH_REDIRECTS[hash];
    if (target) {
      router.replace(target);
      return;
    }

    if (hash === "#recommendation-preview") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [router]);

  return null;
}
