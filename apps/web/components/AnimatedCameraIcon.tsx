"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AnimatedCameraIconProps {
  className?: string;
  isScanning?: boolean;
}

export function AnimatedCameraIcon({
  className = "w-5 h-5",
  isScanning = false,
}: AnimatedCameraIconProps) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center shrink-0",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
        aria-hidden="true"
      >
        {/* Optical Sensor flash ring - subtle pulse on hover */}
        <circle
          cx="12"
          cy="13"
          r="6.5"
          className="stroke-brand-primary/20 fill-surface-sage/30 motion-safe:group-hover:scale-115 motion-safe:group-hover:stroke-brand-primary/50 transition-all duration-300 origin-center"
          strokeWidth="1.2"
        />

        {/* Camera Chassis Body */}
        <path
          d="M4 8.5C4 7.39543 4.89543 6.5 6 6.5H8.2C8.75 6.5 9.25 6.15 9.45 5.65L9.85 4.75C10.15 4.05 10.85 3.5 11.65 3.5H12.35C13.15 3.5 13.85 4.05 14.15 4.75L14.55 5.65C14.75 6.15 15.25 6.5 15.8 6.5H18C19.1046 6.5 20 7.39543 20 8.5V17.5C20 18.6046 19.1046 19.5 18 19.5H6C4.89543 19.5 4 18.6046 4 17.5V8.5Z"
          className="stroke-current transition-colors duration-200"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Top Shutter Button */}
        <line
          x1="6"
          y1="4.5"
          x2="8"
          y2="4.5"
          className="stroke-current transition-colors duration-200"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* Outer Lens Ring */}
        <circle
          cx="12"
          cy="13"
          r="4.2"
          className="stroke-current transition-all duration-300 motion-safe:group-hover:stroke-brand-primary"
          strokeWidth="1.6"
        />

        {/* Inner Lens Pupil / Shutter that contracts/focuses */}
        <circle
          cx="12"
          cy="13"
          r="2.2"
          className={cn(
            "fill-brand-primary stroke-brand-primary transition-all duration-200 origin-center",
            isScanning
              ? "motion-safe:animate-ping"
              : "motion-safe:group-hover:scale-90 motion-safe:group-hover:fill-brand-deep"
          )}
        />

        {/* Optical Glass Reflection Glint */}
        <path
          d="M10.8 11.8C11.1 11.4 11.6 11.2 12.1 11.2"
          className="stroke-white/90"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Live Camera Ready / Flash LED Indicator */}
        <circle
          cx="17"
          cy="9.2"
          r="1"
          className="fill-accent-lime group-hover:fill-decorative-blue transition-colors duration-200 motion-safe:animate-pulse"
        />
      </svg>

      {/* Subtle Corner Focus Reticle that crisply frames the icon on hover */}
      <span
        aria-hidden="true"
        className="absolute -inset-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none"
      >
        <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-brand-primary" />
        <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-brand-primary" />
        <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-brand-primary" />
        <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-brand-primary" />
      </span>
    </span>
  );
}
