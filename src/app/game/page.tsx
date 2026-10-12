"use client";

import * as React from "react";
import { CorridorRunGame } from "@/components/game/CorridorRunGame";

export default function GamePage() {
  return (
    <div className="w-full min-h-[calc(100dvh-3.5rem)] bg-transparent text-bbs px-2 py-1.5 sm:px-4 sm:py-2.5 font-mono tracking-wider sm:tracking-widest relative z-10 flex flex-col items-center justify-start">
      <div className="w-full max-w-5xl">
        <CorridorRunGame isEmbedded={false} />
      </div>
    </div>
  );
}


