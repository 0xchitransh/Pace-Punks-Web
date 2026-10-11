"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

interface EpochData {
  number: string;
  name: string;
  supply: number;
  minted: number;
  requirement: string;
  stepCount: number;
  status: "LIVE" | "UPCOMING" | "CONCLUDED";
  startDate: string;
  endDate: string;
  endTimestamp: number;
  archetype: string;
  previewPunk: string;
  traits: {
    bg: string;
    durability: number;
    efficiency: number;
    momentum: number;
  };
  tiers: { tier: string; steps: string; reward: string }[];
}

const epochsData: EpochData[] = [
  {
    number: "01",
    name: "EPOCH 01",
    supply: 1000,
    minted: 742,
    requirement: "1,000 STEPS",
    stepCount: 1000,
    status: "LIVE",
    startDate: "OCT 1, 2026",
    endDate: "OCT 31, 2026",
    endTimestamp: Date.now() + 19 * 86400000 + 4 * 3600000 + 12 * 60000,
    archetype: "",
    previewPunk: "/punks/0001.webp",
    traits: {
      bg: "NEON ALLEY 01",
      durability: 94,
      efficiency: 88,
      momentum: 92,
    },
    tiers: [
      { tier: "BRONZE", steps: "1,000", reward: "1x Genesis Pace Box + Mint Pass" },
      { tier: "SILVER", steps: "5,000", reward: "2x Battery Upgrade + 100 GP" },
      { tier: "GOLD", steps: "10,000", reward: "Exclusive Retro Visor Accessory" },
    ],
  },
  {
    number: "02",
    name: "EPOCH 02",
    supply: 2000,
    minted: 0,
    requirement: "5,000 STEPS",
    stepCount: 5000,
    status: "UPCOMING",
    startDate: "NOV 1, 2026",
    endDate: "NOV 30, 2026",
    endTimestamp: Date.now() + 50 * 86400000,
    archetype: "",
    previewPunk: "/punks/0008.webp",
    traits: {
      bg: "AURORA TOKYO",
      durability: 82,
      efficiency: 96,
      momentum: 98,
    },
    tiers: [
      { tier: "BRONZE", steps: "5,000", reward: "Neon Sprint Whitelist Slot" },
      { tier: "SILVER", steps: "15,000", reward: "Level 2 Durability Serum" },
      { tier: "GOLD", steps: "30,000", reward: "Hyper-Glow Cyber Sneakers" },
    ],
  },
  {
    number: "03",
    name: "EPOCH 03",
    supply: 500,
    minted: 0,
    requirement: "25,000 STEPS",
    stepCount: 25000,
    status: "UPCOMING",
    startDate: "DEC 1, 2026",
    endDate: "DEC 31, 2026",
    endTimestamp: Date.now() + 80 * 86400000,
    archetype: "",
    previewPunk: "/punks/0016.webp",
    traits: {
      bg: "MAGMA CRATER",
      durability: 99,
      efficiency: 91,
      momentum: 85,
    },
    tiers: [
      { tier: "BRONZE", steps: "25,000", reward: "Apex Marathon Badge + Mint" },
      { tier: "SILVER", steps: "50,000", reward: "500 GP + Ultra Pace Capsule" },
      { tier: "GOLD", steps: "100,000", reward: "1-of-1 Mythic Hologram Aura" },
    ],
  },
];

const mockRecentActivity = [
  { id: "tx_01", wallet: "0x7a2...f4e1", steps: 1420, punkId: "#0741", time: "1m ago" },
  { id: "tx_02", wallet: "0x3bc...98d2", steps: 2280, punkId: "#0742", time: "4m ago" },
  { id: "tx_03", wallet: "0x91e...11c4", steps: 1100, punkId: "#0740", time: "9m ago" },
  { id: "tx_04", wallet: "0x44d...bb90", steps: 3500, punkId: "#0739", time: "16m ago" },
];

export default function EpochsPage() {
  // Tab & Interactive state
  const [activeEpochIndex, setActiveEpochIndex] = React.useState(0);
  const [viewMode, setViewMode] = React.useState<"OVERVIEW" | "TELEMETRY">("OVERVIEW");

  const activeEpoch = epochsData[activeEpochIndex];

  // Countdown timer for live epoch
  const [timeLeft, setTimeLeft] = React.useState({ days: 19, hours: 4, mins: 12, secs: 30 });
  React.useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.max(0, activeEpoch.endTimestamp - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, mins, secs });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeEpoch]);

  const percentMinted = ((activeEpoch.minted / activeEpoch.supply) * 100).toFixed(1);

  return (
    <div className="w-full min-h-screen bg-background text-bbs p-2.5 sm:p-6 md:p-10 font-mono tracking-wider sm:tracking-widest relative z-10 flex flex-col items-center">
      <div className="w-full max-w-6xl flex flex-col gap-4 sm:gap-6">

        {/* Global Terminal Header */}
        <div className="flex flex-wrap items-center justify-between border-b-2 border-bbs pb-2.5 sm:pb-3 gap-2">
          <div>
            <div className="text-[10px] sm:text-xs text-bbs/60 flex flex-wrap items-center gap-1.5 mb-1">
              <Link href="/" className="hover:text-white transition-colors">ROOT</Link>
              <span>/</span>
              <span>GOVERNANCE</span>
              <span>/</span>
              <span className="text-bbs font-bold">EPOCHS.EXE</span>
            </div>
            <h1 className="text-base xs:text-lg sm:text-2xl md:text-3xl font-bold tracking-wider break-words">
              [ SYSTEM ARCHIVE: MINTING EPOCHS ]
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-bbs/70 hidden sm:inline">&gt; SUB-SYSTEMS:</span>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 bg-bbs text-background font-bold">
              NODE_SYNC
            </span>
          </div>
        </div>

        {/* System Directive Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border border-bbs/40 p-2.5 sm:p-3 bg-background/85">
          <div className="border-b sm:border-b-0 sm:border-r border-bbs/30 pb-1.5 sm:pb-0 sm:pr-3">
            <span className="text-bbs/60 block text-[10px] sm:text-xs mb-0.5">&gt; DIRECTIVE:</span>
            <span className="font-semibold text-bbs text-xs sm:text-sm">STEP-VERIFIED ON-CHAIN RELEASE</span>
          </div>
          <div>
            <span className="text-bbs/60 block text-[10px] sm:text-xs mb-0.5">&gt; PROTOCOL:</span>
            <span className="font-semibold text-bbs text-xs sm:text-sm">ZERO SPECULATION / UTILITY ONLY</span>
          </div>
        </div>

        {/* Epoch Selector Station Tabs - Compact 3-Column on mobile */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          {epochsData.map((ep, idx) => {
            const isCurrent = idx === activeEpochIndex;
            return (
              <button
                key={ep.number}
                onClick={() => {
                  setActiveEpochIndex(idx);
                }}
                className={`text-left p-2 sm:p-3.5 border-2 transition-all relative ${
                  isCurrent
                    ? "border-bbs bg-bbs/15 shadow-[0_0_15px_var(--color-bbs-dim)]"
                    : "border-bbs/40 bg-background/60 hover:border-bbs/70 hover:bg-bbs/5"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-xs xs:text-sm sm:text-lg font-bold text-bbs tracking-wider">
                    EPOCH {ep.number}
                  </span>
                  <span
                    className={`text-[9px] xs:text-[10px] px-1 py-0.2 sm:px-1.5 sm:py-0.5 font-bold self-start sm:self-auto ${
                      ep.status === "LIVE"
                        ? "bg-bbs text-background font-bold"
                        : "border border-bbs/40 text-bbs/60"
                    }`}
                  >
                    {ep.status}
                  </span>
                </div>
                {isCurrent && (
                  <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-2 h-2 sm:w-3 sm:h-3 bg-bbs border border-background"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Advanced Interactive Console for Active Epoch */}
        <div className="border-2 border-bbs bg-background/95 p-3 sm:p-6 md:p-8 shadow-[0_0_20px_var(--color-bbs-dim)] relative">
          
          {/* HUD Corner Accents */}
          <span className="absolute -top-2.5 -left-1.5 text-bbs text-base font-mono">┌</span>
          <span className="absolute -top-2.5 -right-1.5 text-bbs text-base font-mono">┐</span>
          <span className="absolute -bottom-2.5 -left-1.5 text-bbs text-base font-mono">└</span>
          <span className="absolute -bottom-2.5 -right-1.5 text-bbs text-base font-mono">┘</span>

          {/* Epoch Top Header with Countdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 mb-4 sm:mb-6 border-b-2 border-bbs/40 gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-bbs text-background font-bold">
                  {activeEpoch.status}
                </span>
                <span className="text-[10px] sm:text-xs text-bbs/70">
                  {activeEpoch.startDate} — {activeEpoch.endDate}
                </span>
              </div>
              <h2 className="text-xl sm:text-3xl font-bold tracking-wider text-bbs">
                EPOCH {activeEpoch.number}
              </h2>
            </div>

            {/* Live Synchronized Countdown Timer */}
            {activeEpoch.status === "LIVE" ? (
              <div className="border border-bbs/60 p-2 sm:p-2.5 bg-bbs/5 flex flex-col items-start sm:items-end w-full sm:w-auto">
                <span className="text-[9px] sm:text-[10px] text-bbs/70 block mb-1">&gt; CLOSURE COUNTDOWN:</span>
                <div className="flex items-center gap-1 sm:gap-2 font-mono text-xs sm:text-base font-bold text-bbs">
                  <div className="text-center px-1 sm:px-1.5 py-0.5 bg-background border border-bbs/40 min-w-[34px] sm:min-w-[42px]">
                    <span>{String(timeLeft.days).padStart(2, "0")}</span>
                    <span className="text-[8px] sm:text-[9px] block text-bbs/60">DAYS</span>
                  </div>
                  <span>:</span>
                  <div className="text-center px-1 sm:px-1.5 py-0.5 bg-background border border-bbs/40 min-w-[34px] sm:min-w-[42px]">
                    <span>{String(timeLeft.hours).padStart(2, "0")}</span>
                    <span className="text-[8px] sm:text-[9px] block text-bbs/60">HRS</span>
                  </div>
                  <span>:</span>
                  <div className="text-center px-1 sm:px-1.5 py-0.5 bg-background border border-bbs/40 min-w-[34px] sm:min-w-[42px]">
                    <span>{String(timeLeft.mins).padStart(2, "0")}</span>
                    <span className="text-[8px] sm:text-[9px] block text-bbs/60">MIN</span>
                  </div>
                  <span>:</span>
                  <div className="text-center px-1 sm:px-1.5 py-0.5 bg-background border border-bbs/40 min-w-[34px] sm:min-w-[42px]">
                    <span>{String(timeLeft.secs).padStart(2, "0")}</span>
                    <span className="text-[8px] sm:text-[9px] block text-bbs/60">SEC</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-bbs/40 p-2 text-xs text-bbs/60">
                [!] LOCKED ARCHIVE: OPENS {activeEpoch.startDate}
              </div>
            )}
          </div>

          {/* Mode Switcher Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-b border-bbs/30 pb-2.5 mb-4 sm:mb-6 text-xs overflow-x-auto">
            <button
              onClick={() => setViewMode("OVERVIEW")}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 font-bold transition-colors whitespace-nowrap ${
                viewMode === "OVERVIEW"
                  ? "bg-bbs text-background"
                  : "border border-bbs/50 hover:bg-bbs/10 text-bbs"
              }`}
            >
              [1] OVERVIEW &amp; SPEC
            </button>
            <button
              onClick={() => setViewMode("TELEMETRY")}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 font-bold transition-colors whitespace-nowrap ${
                viewMode === "TELEMETRY"
                  ? "bg-bbs text-background"
                  : "border border-bbs/50 hover:bg-bbs/10 text-bbs"
              }`}
            >
              [2] LIVE MINTER FEED
            </button>
          </div>

          {/* VIEW MODE 1: OVERVIEW & SPEC */}
          {viewMode === "OVERVIEW" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
              
              {/* Left Column: Holographic Punk Preview Card */}
              <div className="lg:col-span-5 flex flex-col items-center border border-bbs/40 p-3 sm:p-4 bg-background/90 relative">
                <div className="w-full flex items-center justify-between text-[10px] sm:text-[11px] text-bbs/70 mb-2 border-b border-bbs/30 pb-1">
                  <span>ARCHETYPE_PREVIEW.IMG</span>
                  <span className="text-bbs font-bold">EDITION #{activeEpoch.number}</span>
                </div>

                <div className="relative w-full aspect-square max-w-[220px] sm:max-w-[280px] border-2 border-bbs bg-black overflow-hidden group">
                  <Image
                    src={activeEpoch.previewPunk}
                    alt={activeEpoch.name}
                    width={280}
                    height={280}
                    className="w-full h-full object-cover pixelated transform group-hover:scale-105 transition-transform duration-300"
                    priority
                  />
                  {/* Subtle Scanline Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bbs/5 to-transparent pointer-events-none opacity-40"></div>
                </div>

                {/* Character Stat Attribute Bars */}
                <div className="w-full mt-3 sm:mt-4 space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[10px] sm:text-[11px] mb-0.5">
                      <span className="text-bbs/70">&gt; DURABILITY:</span>
                      <span className="font-bold">{activeEpoch.traits.durability}%</span>
                    </div>
                    <div className="w-full bg-bbs/20 h-2 border border-bbs/40">
                      <div
                        className="bg-bbs h-full transition-all duration-500"
                        style={{ width: `${activeEpoch.traits.durability}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] sm:text-[11px] mb-0.5">
                      <span className="text-bbs/70">&gt; EFFICIENCY:</span>
                      <span className="font-bold">{activeEpoch.traits.efficiency}%</span>
                    </div>
                    <div className="w-full bg-bbs/20 h-2 border border-bbs/40">
                      <div
                        className="bg-bbs h-full transition-all duration-500"
                        style={{ width: `${activeEpoch.traits.efficiency}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] sm:text-[11px] mb-0.5">
                      <span className="text-bbs/70">&gt; MOMENTUM:</span>
                      <span className="font-bold">{activeEpoch.traits.momentum}%</span>
                    </div>
                    <div className="w-full bg-bbs/20 h-2 border border-bbs/40">
                      <div
                        className="bg-bbs h-full transition-all duration-500"
                        style={{ width: `${activeEpoch.traits.momentum}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Telemetry Specs & Tier Matrix */}
              <div className="lg:col-span-7 flex flex-col justify-between gap-4 sm:gap-6">

                {/* Live ASCII Verification Stream Bar - Mobile & Desktop Responsive */}
                <div className="border border-bbs/40 p-2.5 sm:p-3 bg-bbs/[0.02]">
                  <div className="flex justify-between text-xs mb-1.5 font-bold">
                    <span className="text-bbs/80 text-[11px] sm:text-xs">&gt; VERIFICATION STREAM:</span>
                    <span className="text-xs">{percentMinted}%</span>
                  </div>

                  {/* Desktop / Tablet ASCII Bar (36 Chars) */}
                  <div className="hidden sm:block w-full font-mono text-xs tracking-tighter text-bbs overflow-hidden">
                    [{Array(Math.max(1, Math.floor((activeEpoch.minted / activeEpoch.supply) * 36))).fill('=').join('')}&gt;{Array(Math.max(0, 36 - Math.floor((activeEpoch.minted / activeEpoch.supply) * 36))).fill('.').join('')}]
                  </div>

                  {/* Mobile Compact ASCII Bar (18 Chars - Never Overflows 320px) */}
                  <div className="block sm:hidden w-full font-mono text-[11px] tracking-tight text-bbs overflow-hidden">
                    [{Array(Math.max(1, Math.floor((activeEpoch.minted / activeEpoch.supply) * 18))).fill('=').join('')}&gt;{Array(Math.max(0, 18 - Math.floor((activeEpoch.minted / activeEpoch.supply) * 18))).fill('.').join('')}]
                  </div>

                  <div className="flex justify-between text-[10px] text-bbs/60 mt-1">
                    <span>RESERVED: {activeEpoch.minted}</span>
                    <span>REMAINING: {activeEpoch.supply - activeEpoch.minted}</span>
                  </div>
                </div>

                {/* Tier Milestone Matrix */}
                <div className="border border-bbs/40 p-2.5 sm:p-3 bg-bbs/[0.03]">
                  <h3 className="text-xs font-bold text-bbs border-b border-bbs/30 pb-1 mb-2">
                    &gt;&gt; STEP MILESTONE REWARDS
                  </h3>
                  <div className="space-y-2 text-xs">
                    {activeEpoch.tiers.map((t, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-bbs/15 pb-1 gap-0.5 sm:gap-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 bg-bbs/20 border border-bbs/50 text-[9px] sm:text-[10px] font-bold">
                            {t.tier}
                          </span>
                          <span className="font-bold text-xs">{t.steps} STEPS</span>
                        </div>
                        <span className="text-[11px] text-bbs/80">{t.reward}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    href="/mint"
                    className="w-full sm:w-auto text-center border-2 border-bbs bg-bbs text-background px-6 py-2.5 font-bold text-sm hover:bg-transparent hover:text-bbs transition-all shadow-[3px_3px_0_var(--color-bbs)]"
                  >
                    [+] EXECUTE MINT NOW
                  </Link>
                </div>

              </div>
            </div>
          )}

          {/* VIEW MODE 2: LIVE COMMUNITY MINTER FEED */}
          {viewMode === "TELEMETRY" && (
            <div className="flex flex-col gap-3 max-w-4xl mx-auto py-1">
              <div className="flex justify-between items-center border-b border-bbs/30 pb-1.5 text-xs">
                <span className="font-bold text-bbs text-[11px] sm:text-xs">&gt;&gt; MINT DISPATCH QUEUE</span>
                <span className="text-[10px] text-bbs/70">BLOCKS: OK</span>
              </div>

              <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
                <table className="w-full text-left text-xs border-collapse min-w-[480px]">
                  <thead>
                    <tr className="border-b border-bbs/40 text-bbs/60 uppercase text-[10px] sm:text-xs">
                      <th className="py-1.5 px-2">ID</th>
                      <th className="py-1.5 px-2">WALLET</th>
                      <th className="py-1.5 px-2">STEPS</th>
                      <th className="py-1.5 px-2">PUNK</th>
                      <th className="py-1.5 px-2 text-right">TIME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRecentActivity.map((tx) => (
                      <tr key={tx.id} className="border-b border-bbs/20 hover:bg-bbs/10 transition-colors text-[11px] sm:text-xs">
                        <td className="py-2 px-2 font-mono text-bbs/70">{tx.id}</td>
                        <td className="py-2 px-2 font-mono font-bold">{tx.wallet}</td>
                        <td className="py-2 px-2 font-mono">{tx.steps.toLocaleString()}</td>
                        <td className="py-2 px-2 font-mono text-bbs font-bold">{tx.punkId}</td>
                        <td className="py-2 px-2 text-right text-bbs/60">{tx.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-[10px] sm:text-[11px] text-bbs/60 border border-bbs/30 p-2 bg-background/80 mt-1">
                &gt; All mint transactions require zero speculative value. GP and Punks are earned solely through verified steps.
              </div>
            </div>
          )}

        </div>

        {/* Tactical Footer Navigation Links */}
        <div className="border border-bbs/40 p-2.5 sm:p-3 bg-background/90 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-bbs/70">&gt; NAV:</span>
            <Link href="/" className="hover:underline text-bbs font-bold">[1] HOME</Link>
            <Link href="/collection" className="hover:underline text-bbs font-bold">[3] COLLECTION</Link>
            <Link href="/game" className="hover:underline text-bbs font-bold">[5] MINI GAME</Link>
          </div>
          <div className="text-[10px] sm:text-[11px] text-bbs/60">
            SECURE PROTOCOL // ERC-721
          </div>
        </div>

      </div>
    </div>
  );
}
