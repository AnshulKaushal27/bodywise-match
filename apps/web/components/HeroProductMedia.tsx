"use client";

import * as React from "react";
import Image from "next/image";
import { useMotion } from "@/lib/motion";

/**
 * HeroProductMedia component:
 * Plays the Be Bodywise showcase video on an infinite, seamless loop with zero audio,
 * no video controls, and no user interaction (pointer-events-none, user-select-none).
 * Designed to look and feel completely indistinguishable from an ambient, high-end cinemagraph.
 */
export function HeroProductMedia() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const { isMotionOn } = useMotion();

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isMotionOn) {
      video.pause();
      return;
    }

    const startPlayback = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback to poster if autoplay policy blocks before interaction
        });
      }
    };

    startPlayback();

    // Re-verify playback on visibility change (e.g. user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isMotionOn) {
        startPlayback();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isMotionOn]);

  // Ensure loop is unbreakable even if interrupted
  const handleEnded = () => {
    const video = videoRef.current;
    if (video && isMotionOn) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  };

  return (
    <div
      style={{ position: "relative" }}
      className="relative aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/5] w-full rounded-card overflow-hidden shadow-card border border-brand-deep/12 bg-surface pointer-events-none select-none"
      onContextMenu={(e) => e.preventDefault()}
      tabIndex={-1}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        src="/hero-products.mp4"
        poster="/hero-products.webp"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        controls={false}
        onEnded={handleEnded}
        onContextMenu={(e) => e.preventDefault()}
        tabIndex={-1}
        aria-hidden="true"
        className="w-full h-full object-cover object-center pointer-events-none select-none block"
      >
        <track kind="captions" />
        {/* Fallback image when video playback is not supported */}
        <Image
          src="/hero-products.webp"
          alt="Be Bodywise verified skincare products and clean formulations"
          fill
          priority
          unoptimized
          sizes="(max-width: 1024px) 100vw, 42vw"
          className="object-cover object-center pointer-events-none select-none"
        />
      </video>
    </div>
  );
}
