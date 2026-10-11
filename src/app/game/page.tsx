"use client";

import * as React from "react";
import Link from "next/link";
export default function GamePage() {
  const [showBoard, setShowBoard] = React.useState(false);

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-background text-bbs px-3 py-2 md:px-6 md:py-2.5 font-mono tracking-widest relative z-10 flex flex-col items-center justify-start">
      <div className="w-full max-w-5xl flex flex-col gap-2">
        
        {/* Top Terminal Header & Telemetry - Compact single row */}
        <div className="flex flex-wrap items-center justify-between border-b border-bbs/50 pb-1 text-xs">
          <div className="flex items-center gap-2 text-bbs/70">
            <Link href="/" className="hover:text-white transition-colors">ROOT</Link>
            <span>/</span>
            <span>SIMULATION</span>
            <span>/</span>
            <span className="text-bbs font-bold">CORRIDOR_RUN.EXE</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-bbs/80">
            <span className="hidden sm:inline">&gt; CANV: 2D</span>
            <span className="hidden md:inline">&gt; BAYS: 12</span>
            <span className="text-bbs font-bold">&gt; ONLINE</span>
            <button
              onClick={() => setShowBoard(!showBoard)}
              className="px-2 py-0.5 border border-bbs text-bbs hover:bg-bbs hover:text-background transition-colors font-bold"
            >
              {showBoard ? "[HIDE BOARD]" : "[LEADERBOARD]"}
            </button>
          </div>
        </div>

        {/* Embedded Arcade Cabinet Screen - Compacted so everything fits without scrolling */}
        <div className="relative border-2 border-bbs shadow-[0_0_20px_var(--color-bbs-dim)] bg-black overflow-hidden w-full h-[380px] sm:h-[440px] md:h-[480px] max-h-[calc(100vh-160px)]">
          <iframe
            src="/game/index.html"
            title="Pace Punks Corridor Run"
            className="w-full h-full border-none bg-black block"
            allow="autoplay; gamepad"
          />
        </div>

        {/* Tactical Controls & Quick Guide - Clean compact bar */}
        <div className="border border-bbs/40 px-3 py-1 bg-background/90 text-[11px] md:text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-bbs font-bold">&gt;&gt; CONTROLS:</span>
            <span><b className="text-bbs">[SPACE/↑]</b> JUMP</span>
            <span><b className="text-bbs">[↓]</b> DIVE</span>
            <span><b className="text-bbs">[P]</b> PAUSE</span>
            <span className="hidden sm:inline"><b className="text-bbs">[TOUCH]</b> TAP</span>
          </div>
          <div className="text-bbs/70 hidden lg:block">
            BONUS GOLD CHIPS (+25) · AVOID DRONES
          </div>
        </div>

        {/* Global Leaderboard - Toggleable drawer */}
        {showBoard && <GameLeaderboardSection />}

      </div>
    </div>
  );
}

function GameLeaderboardSection() {
  const [board, setBoard] = React.useState<Array<{ rank: number; username: string; score: number; createdAt: string }>>([]);
  const [loading, setLoading] = React.useState(true);

  const loadBoard = React.useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (data && data.success && Array.isArray(data.leaderboard)) {
        setBoard(data.leaderboard);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        if (active && data && data.success && Array.isArray(data.leaderboard)) {
          setBoard(data.leaderboard);
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    })();

    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === "PACE_PUNKS_SCORE_SUBMITTED") {
        loadBoard();
      }
    };
    window.addEventListener("message", handleMsg);
    const interval = setInterval(loadBoard, 15000);
    return () => {
      active = false;
      window.removeEventListener("message", handleMsg);
      clearInterval(interval);
    };
  }, [loadBoard]);

  return (
    <div className="border-2 border-bbs bg-background/95 p-4 md:p-6 shadow-[0_0_20px_var(--color-bbs-dim)]">
      <div className="flex items-center justify-between border-b-2 border-bbs pb-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-bbs font-bold text-sm md:text-base tracking-wider">&gt;&gt; GLOBAL_LEADERBOARD // TOP RUNNERS</span>
        </div>
        <button
          onClick={() => { setLoading(true); loadBoard(); }}
          className="text-xs px-2 py-1 border border-bbs text-bbs hover:bg-bbs hover:text-background transition-colors"
        >
          [REFRESH]
        </button>
      </div>

      {loading && board.length === 0 ? (
        <div className="text-center py-6 text-bbs/70 text-xs md:text-sm">
          INTERCEPTING LEADERBOARD TELEMETRY...
        </div>
      ) : board.length === 0 ? (
        <div className="text-center py-6 text-bbs/70 text-xs md:text-sm">
          NO RUNNERS LOGGED YET. PLAY A ROUND AND POST YOUR SCORE!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead>
              <tr className="border-b border-bbs/40 text-bbs/60 uppercase">
                <th className="py-2 px-3 w-16">RANK</th>
                <th className="py-2 px-3">RUNNER USERNAME</th>
                <th className="py-2 px-3 text-right">SCORE</th>
              </tr>
            </thead>
            <tbody>
              {board.map((row, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-bbs/20 hover:bg-bbs/10 transition-colors ${
                    idx === 0 ? "text-bbs font-bold" : "text-bbs/90"
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono">
                    {idx === 0 ? "★ #1" : `#${row.rank}`}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold tracking-wider">
                    {row.username}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-bbs font-bold">
                    {String(row.score).padStart(5, "0")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
