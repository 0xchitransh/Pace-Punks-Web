"use client";

import * as React from "react";
import Link from "next/link";

export function CorridorRunGame({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [showBoard, setShowBoard] = React.useState(false);
  const [showWhy, setShowWhy] = React.useState(false);

  return (
    <div className="w-full flex flex-col gap-2.5 pb-panel p-2.5 sm:p-3">
      {/* Top Embedded Header & Telemetry */}
      <div className="flex items-center justify-between border-b border-[#504364] pb-2 text-xs gap-2">
        <div className="flex items-center gap-2 text-[#b9b3c9] text-[11px] sm:text-xs truncate max-w-[200px] sm:max-w-none">
          <Link href="/" className="hover:text-[#f7ebc9] transition-colors">ARCADE</Link>
          <span className="text-[#504364]">/</span>
          <span className="text-[#f7ebc9] font-bold">PUNKS_RUN</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#b9b3c9] shrink-0">
          <button
            onClick={() => {
              setShowWhy(!showWhy);
              if (!showWhy) setShowBoard(false);
            }}
            className={`px-2.5 py-0.5 text-[11px] font-bold cursor-pointer transition-colors border ${
              showWhy 
                ? "bg-[#ffd76f] text-[#17132c] border-[#ffd76f]" 
                : "pb-btn-secondary"
            }`}
          >
            {showWhy ? "[✕] CLOSE" : "WHY TO PLAY?"}
          </button>
          <button
            onClick={() => {
              setShowBoard(!showBoard);
              if (!showBoard) setShowWhy(false);
            }}
            className={`px-2.5 py-0.5 text-[11px] font-bold cursor-pointer transition-colors border ${
              showBoard 
                ? "bg-[#ffd76f] text-[#17132c] border-[#ffd76f]" 
                : "pb-btn-secondary"
            }`}
          >
            {showBoard ? "HIDE SCORES" : "LEADERBOARD"}
          </button>
        </div>
      </div>

      {/* Embedded Arcade Cabinet Screen */}
      <div className={`relative border border-[#504364] bg-black overflow-hidden w-full ${
        isEmbedded 
          ? "h-[280px] xs:h-[320px] sm:h-[380px] md:h-[440px] lg:h-[480px] xl:h-[510px]" 
          : "h-[340px] xs:h-[400px] sm:h-[480px] md:h-[520px] max-h-[calc(100dvh-135px)]"
      }`}>
        <iframe
          src="/game/index.html"
          title="Pace Punks Corridor Run"
          className="w-full h-full border-none bg-black block"
          allow="autoplay; gamepad"
        />
      </div>

      {/* Tactical Controls & Quick Guide */}
      <div className="border border-[#504364] px-3 py-1.5 bg-[#17132c]/80 text-[10px] sm:text-xs flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex items-center gap-2 flex-wrap text-[#b9b3c9]">
          <span className="text-[#ffd76f] font-bold">&gt;&gt; CONTROLS:</span>
          {/* Mobile Touch Hints */}
          <span className="sm:hidden flex items-center gap-1.5">
            <span><b className="text-[#f7ebc9]">[TAP]</b> JUMP</span>
            <span>·</span>
            <span><b className="text-[#f7ebc9]">[SWIPE ↓]</b> DIVE</span>
            <span>·</span>
            <span><b className="text-[#f7ebc9]">[HOLD]</b> HIGH</span>
          </span>
          {/* Desktop Keyboard Hints */}
          <span className="hidden sm:inline-flex items-center gap-2.5">
            <span><b className="text-[#f7ebc9]">[SPACE/↑]</b> JUMP</span>
            <span><b className="text-[#f7ebc9]">[↓]</b> DIVE</span>
            <span><b className="text-[#f7ebc9]">[P]</b> PAUSE</span>
            <span><b className="text-[#f7ebc9]">[TOUCH]</b> TAP</span>
          </span>
        </div>
        <div className="text-[#b9b3c9]/70 hidden md:block text-[11px]">
          BONUS GOLD CHIPS (+25) · AVOID DRONES
        </div>
      </div>

      {/* Why To Play Drawer */}
      {showWhy && <WhyToPlaySection onClose={() => setShowWhy(false)} />}

      {/* Global Leaderboard - Toggleable drawer */}
      {showBoard && <GameLeaderboardSection />}
    </div>
  );
}

function WhyToPlaySection({ onClose }: { onClose: () => void }) {
  return (
    <div className="border border-[#ffd76f] bg-[#17132c]/95 p-3.5 sm:p-5 shadow-[0_0_20px_rgba(255,215,111,0.2)] animate-fadeIn text-xs font-mono text-[#f7ebc9]">
      <div className="flex items-center justify-between border-b border-[#504364] pb-2 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#ffd76f] inline-block animate-pulse"></span>
          <span className="text-[#ffd76f] font-bold text-xs sm:text-sm tracking-wider uppercase">
            &gt;&gt; WHY TO PLAY?
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[11px] px-2 py-0.5 border border-[#ffd76f] text-[#ffd76f] hover:bg-[#ffd76f] hover:text-[#17132c] transition-colors cursor-pointer font-bold"
        >
          [✕ CLOSE]
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Daily Top 10 Reward Box */}
          <div className="border border-[#3EE6D2] bg-[#231d3c]/80 p-3 sm:p-4 flex flex-col justify-between gap-2 shadow-[2px_2px_0_#3EE6D2]">
            <div>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-[#3EE6D2] text-[#0b0820] mb-2 uppercase tracking-wider">
                DAILY TOP 10 RUNNERS
              </span>
              <h4 className="text-sm sm:text-base font-bold text-[#f7ebc9] mb-1 font-display">
                Guaranteed Early App Access Code
              </h4>
              <p className="text-[11px] text-[#b9b3c9] leading-relaxed">
                The top 10 highest scorers on the global leaderboard every single day automatically receive exclusive Pace Punks app access credentials.
              </p>
            </div>
            <div className="pt-2 border-t border-[#504364]/50 flex justify-between items-center text-[11px]">
              <span className="text-[#3EE6D2] font-bold">10 CODES / DAY</span>
              <span className="text-[#b9b3c9] font-mono">[RANK #1 - #10]</span>
            </div>
          </div>

          {/* Daily Random 25 Runners Box */}
          <div className="border border-[#FF4FA3] bg-[#231d3c]/80 p-3 sm:p-4 flex flex-col justify-between gap-2 shadow-[2px_2px_0_#FF4FA3]">
            <div>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-[#FF4FA3] text-[#0b0820] mb-2 uppercase tracking-wider">
                COMMUNITY LUCKY DRAW
              </span>
              <h4 className="text-sm sm:text-base font-bold text-[#f7ebc9] mb-1 font-display">
                Random 25 Players Get Access
              </h4>
              <p className="text-[11px] text-[#b9b3c9] leading-relaxed">
                Simply submit your score after a run! 25 random runners each day are selected by our protocol to win an official app access code.
              </p>
            </div>
            <div className="pt-2 border-t border-[#504364]/50 flex justify-between items-center text-[11px]">
              <span className="text-[#FF4FA3] font-bold">25 CODES / DAY</span>
              <span className="text-[#b9b3c9] font-mono">[ALL PARTICIPANTS]</span>
            </div>
          </div>
        </div>

        <div className="border border-[#504364] p-2.5 bg-[#0b0820] text-[11px] text-[#b9b3c9] flex items-center justify-between flex-wrap gap-2">
          <span>&gt; HOW TO ENTER: Play a round, hit space to retry or post your score to record your runner handle.</span>
          <span className="text-[#ffd76f] font-bold">RESET: EVERY 24 HOURS (00:00 UTC)</span>
        </div>
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
