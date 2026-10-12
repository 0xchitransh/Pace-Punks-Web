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

  return (
    <div className="w-full min-h-screen bg-transparent text-bbs p-2.5 sm:p-6 md:p-10 font-mono tracking-wider sm:tracking-widest relative z-10 flex flex-col items-center">
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
            <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold font-display tracking-tight break-words text-[#f7ebc9]">
              SYSTEM ARCHIVE: MINTING EPOCHS
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-bbs/70 hidden sm:inline">&gt; SUB-SYSTEMS:</span>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 border border-bbs text-bbs bg-bbs/15 font-bold">
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
                className={`text-left p-3 sm:p-4 transition-all relative pb-panel ${
                  isCurrent
                    ? "border-[#ffd76f] bg-[#231d3c] shadow-[0_0_15px_rgba(255,215,111,0.15)]"
                    : "border-[#504364] bg-[#231d3c]/50 hover:border-[#ffd76f]/50 hover:bg-[#231d3c]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className={`text-xs xs:text-sm sm:text-base font-bold tracking-wider ${
                    isCurrent ? "text-[#ffd76f]" : "text-[#f7ebc9]"
                  }`}>
                    EPOCH {ep.number}
                  </span>
                  {ep.status !== "LIVE" && (
                    <span className="text-[9px] xs:text-[10px] px-2 py-0.5 font-bold self-start sm:self-auto border border-[#504364] text-[#b9b3c9]">
                      {ep.status}
                    </span>
                  )}
                </div>
                {isCurrent && (
                  <div className="absolute top-0 right-0 w-2 h-2 bg-[#ffd76f]"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Clean Embedded Console for Active Epoch */}
        <div className="pb-panel p-4 sm:p-6 md:p-8 relative">

          {/* Epoch Top Header with Glitched / Redacted Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 mb-4 sm:mb-6 border-b border-[#504364] gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                {activeEpoch.status !== "LIVE" && (
                  <span className="text-[10px] sm:text-xs px-1.5 py-0.5 border border-bbs text-bbs bg-bbs/20 font-bold">
                    {activeEpoch.status}
                  </span>
                )}
                <span className="text-[10px] sm:text-xs text-bbs/70 font-mono">
                  WINDOW: [CLASSIFIED // REDACTED]
                </span>
              </div>
              <h2 className="text-xl sm:text-3xl font-bold tracking-wider text-bbs">
                EPOCH {activeEpoch.number}
              </h2>
            </div>

            {/* Glitched Redacted Countdown / Time Window */}
            <div className="border border-bbs/50 p-2 sm:p-2.5 bg-bbs/[0.04] flex flex-col items-start sm:items-end w-full sm:w-auto font-mono">
              <span className="text-[9px] sm:text-[10px] text-bbs/70 block mb-1">&gt; CLOSURE_STATUS:</span>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold">
                <span className="px-1.5 py-0.5 border border-red-500/60 bg-red-950/40 text-red-400 text-[10px] sm:text-xs tracking-wider">
                  [REDACTED]
                </span>
                <span className="tracking-widest text-bbs/80 select-none">
                  ██:██:██:██
                </span>
              </div>
            </div>
          </div>

          {/* Mode Switcher Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-b border-bbs/30 pb-2.5 mb-4 sm:mb-6 text-xs overflow-x-auto">
            <button
              onClick={() => setViewMode("OVERVIEW")}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 font-bold transition-colors whitespace-nowrap border ${
                viewMode === "OVERVIEW"
                  ? "border-bbs bg-bbs/25 text-bbs shadow-[0_0_12px_var(--color-bbs-dim)]"
                  : "border-bbs/40 text-bbs/70 hover:bg-bbs/10 hover:text-bbs"
              }`}
            >
              [1] OVERVIEW &amp; SPEC
            </button>
            <button
              onClick={() => setViewMode("TELEMETRY")}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 font-bold transition-colors whitespace-nowrap border ${
                viewMode === "TELEMETRY"
                  ? "border-bbs bg-bbs/25 text-bbs shadow-[0_0_12px_var(--color-bbs-dim)]"
                  : "border-bbs/40 text-bbs/70 hover:bg-bbs/10 hover:text-bbs"
              }`}
            >
              [2] MINTER FEED
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

                {/* Live ASCII Verification Stream Bar - Glitched & Redacted */}
                <div className="border border-bbs/40 p-2.5 sm:p-3 bg-bbs/[0.02]">
                  <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                    <span className="text-bbs/80 text-[11px] sm:text-xs">&gt; VERIFICATION STREAM:</span>
                    <span className="text-bbs font-mono text-[11px] sm:text-xs px-1.5 py-0.5 border border-bbs/30 bg-bbs/10 tracking-widest">[REDACTED // ██.█%]</span>
                  </div>

                  {/* Desktop / Tablet Glitched ASCII Bar */}
                  <div className="hidden sm:block w-full font-mono text-xs tracking-widest text-bbs/80 overflow-hidden select-none">
                    [====████▒▒▓▓#?%&amp;*!====████▒▒▓▓====]
                  </div>

                  {/* Mobile Compact Glitched ASCII Bar */}
                  <div className="block sm:hidden w-full font-mono text-[11px] tracking-tight text-bbs/80 overflow-hidden select-none">
                    [==███▒▒▓▓?%*!==]
                  </div>

                  <div className="flex justify-between text-[10px] text-bbs/60 mt-1 font-mono">
                    <span>RESERVED: [CLASSIFIED]</span>
                    <span>SUPPLY: [REDACTED // ████]</span>
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
