"use client";

import * as React from "react";
import { useMotion } from "@/lib/motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

export function ScrollReveal({ children, className = "", delayMs = 0 }: ScrollRevealProps) {
  const { isMotionOn } = useMotion();
  const [hasEntered, setHasEntered] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isMotionOn) {
      setHasEntered(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasEntered(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isMotionOn]);

  const style: React.CSSProperties = isMotionOn
    ? {
        opacity: hasEntered ? 1 : 0,
        transform: hasEntered ? "translateY(0px)" : "translateY(16px)",
        transition: `opacity 400ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, transform 400ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
        willChange: hasEntered ? "auto" : "opacity, transform",
      }
    : {};

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

// Lime marker swipe underlay for highlighted phrases in headings
export function MarkerHighlight({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isMotionOn } = useMotion();
  const [hasEntered, setHasEntered] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (!isMotionOn) {
      setHasEntered(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasEntered(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isMotionOn]);

  return (
    <span ref={ref} className={`relative inline-block ${className}`}>
      {/* Lime marker underlay swipe */}
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 bottom-1 sm:bottom-1.5 h-2.5 sm:h-3 bg-accent-lime/75 rounded-xs -z-10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left ${
          hasEntered || !isMotionOn ? "scale-x-100" : "scale-x-0"
        }`}
      />
      <span className="relative z-10">{children}</span>
    </span>
  );
}
