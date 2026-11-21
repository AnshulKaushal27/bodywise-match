"use client";

import * as React from "react";
import { MatchSessionProvider } from "@/lib/matchSessionContext";
import { MotionProvider } from "@/lib/motion";
import { ChatPanel } from "./ChatPanel";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <MatchSessionProvider>
        {children}
        <React.Suspense fallback={null}>
          <ChatPanel />
        </React.Suspense>
      </MatchSessionProvider>
    </MotionProvider>
  );
}
