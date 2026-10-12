"use client";

import * as React from "react";
import Link from "next/link";

export function CorridorRunGame({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [showBoard, setShowBoard] = React.useState(false);

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Top Terminal Header & Telemetry */}
      <div className="flex items-center justify-between border-b border-bbs/50 pb-1 text-xs gap-2">
        <div className="flex items-center gap-1.5 text-bbs/70 text-[10px] sm:text-xs truncate max-w-[180px] xs:max-w-[260px] sm:max-w-none">
          <Link href="/" className="hover:text-white transition-colors">ROOT</Link>
          <span>/</span>
          <span className="hidden xs:inline">SIMULATION</span>
          <span className="hidden xs:inline">/</span>
          <span className="text-bbs font-bold">CORRIDOR_RUN.EXE</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-bbs/80 shrink-0">
          <span className="hidden sm:inline">&gt; CANV: 2D</span>
          <span className="text-bbs font-bold hidden xs:inline">&gt; ONLINE</span>
          <button
            onClick={() => setShowBoard(!showBoard)}
            className="px-2 py-0.5 border border-bbs text-bbs hover:bg-bbs hover:text-background transition-colors font-bold cursor-pointer"
          >
            {showBoard ? "[HIDE]" : "[LEADERBOARD]"}
          </button>
        </div>
      </div>

      {/* Embedded Arcade Cabinet Screen */}
      <div className={`relative border-2 border-bbs shadow-[0_0_20px_var(--color-bbs-dim)] bg-black overflow-hidden w-full ${
        isEmbedded 
          ? "h-[280px] xs:h-[320px] sm:h-[380px] md:h-[440px] lg:h-[480px] xl:h-[510px]" 
          : "h-[320px] xs:h-[380px] sm:h-[450px] md:h-[500px] max-h-[calc(100dvh-135px)]"
      }`}>
        <iframe
          src="/game/index.html"
          title="Pace Punks Corridor Run"
          className="w-full h-full border-none bg-black block"
          allow="autoplay; gamepad"
        />
      </div>

      {/* Tactical Controls & Quick Guide */}
      <div className="border border-bbs/40 px-2.5 py-1 bg-background/90 text-[10px] sm:text-xs flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-bbs font-bold">&gt;&gt; CONTROLS:</span>
          {/* Mobile Touch Hints */}
          <span className="sm:hidden flex items-center gap-1.5">
            <span><b className="text-bbs">[TAP]</b> JUMP</span>
            <span>·</span>
            <span><b className="text-bbs">[SWIPE ↓]</b> DIVE</span>
            <span>·</span>
            <span><b className="text-bbs">[HOLD]</b> HIGH</span>
          </span>
          {/* Desktop Keyboard Hints */}
          <span className="hidden sm:inline-flex items-center gap-2.5">
            <span><b className="text-bbs">[SPACE/↑]</b> JUMP</span>
            <span><b className="text-bbs">[↓]</b> DIVE</span>
            <span><b className="text-bbs">[P]</b> PAUSE</span>
            <span><b className="text-bbs">[TOUCH]</b> TAP</span>
          </span>
        </div>
        <div className="text-bbs/70 hidden md:block text-[11px]">
          BONUS GOLD CHIPS (+25) · AVOID DRONES
        </div>
      </div>

      {/* Global Leaderboard - Toggleable drawer */}
      {showBoard && <GameLeaderboardSection />}
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
    <div className="border-2 border-bbs bg-background/95 p-3 md:p-5 shadow-[0_0_20px_var(--color-bbs-dim)]">
      <div className="flex items-center justify-between border-b-2 border-bbs pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-bbs font-bold text-xs md:text-sm tracking-wider">&gt;&gt; GLOBAL_LEADERBOARD // TOP RUNNERS</span>
        </div>
        <button
          onClick={() => { setLoading(true); loadBoard(); }}
          className="text-xs px-2 py-0.5 border border-bbs text-bbs hover:bg-bbs hover:text-background transition-colors"
        >
          [REFRESH]
        </button>
      </div>

      {loading && board.length === 0 ? (
        <div className="text-center py-4 text-bbs/70 text-xs">
          INTERCEPTING LEADERBOARD TELEMETRY...
        </div>
      ) : board.length === 0 ? (
        <div className="text-center py-4 text-bbs/70 text-xs">
          NO RUNNERS LOGGED YET. PLAY A ROUND AND POST YOUR SCORE!
        </div>
      ) : (
        <div className="overflow-x-auto max-h-60 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-bbs/40 text-bbs/60 uppercase">
                <th className="py-1.5 px-2.5 w-14">RANK</th>
                <th className="py-1.5 px-2.5">RUNNER</th>
                <th className="py-1.5 px-2.5 text-right">SCORE</th>
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
                  <td className="py-1.5 px-2.5 font-mono">
                    {idx === 0 ? "★ #1" : `#${row.rank}`}
                  </td>
                  <td className="py-1.5 px-2.5 font-mono font-semibold tracking-wider">
                    {row.username}
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-bbs font-bold">
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
