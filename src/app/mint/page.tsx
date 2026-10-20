"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type MintState = "connect" | "checking" | "not-eligible" | "eligible" | "minting" | "success";

export default function MintPage() {
  const [state, setState] = useState<MintState>("connect");

  const handleConnect = () => {
    setState("checking");
    setTimeout(() => setState("eligible"), 1500);
  };

  const handleMint = () => {
    setState("minting");
    setTimeout(() => setState("success"), 2500);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-20">
      <div className="max-w-5xl w-full">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          {/* Left: Punk Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 flex justify-center"
          >
            <div className="relative w-72 h-72 md:w-96 md:h-96">
              <div className="absolute inset-0 bg-gradient-to-br from-mint/10 via-purple/10 to-orange/10 blur-3xl" />
              <div className="relative w-full h-full card flex items-center justify-center overflow-hidden">
                {state === "success" ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="text-center"
                  >
                    <div className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-purple to-mint">
                      PP
                    </div>
                    <p className="text-foreground font-bold mt-3">
                      Pace Punk #421
                    </p>
                    <p className="text-secondary text-sm mt-1">Genesis Run</p>
                  </motion.div>
                ) : (
                  <div className="text-center">
                    <div className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-foreground/20 to-foreground/5">
                      ?
                    </div>
                    <p className="text-secondary text-sm font-medium mt-2">
                      Your Punk awaits
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right: Mint Flow */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-1 w-full"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 bg-mint/10 text-mint border border-mint/40 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-mint" />
                Live
              </span>
              <span className="text-secondary text-sm">Epoch 01</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold font-display text-[#f7ebc9] mb-2">
              Genesis Run
            </h1>
            <p className="text-secondary mb-8">
              Mint your Pace Punk before the epoch closes.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { label: "Supply", value: "1,000" },
                { label: "Minted", value: "742" },
                { label: "Remaining", value: "258" },
                { label: "Mint Price", value: "FREE" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="pb-panel p-4"
                >
                  <p className="text-secondary text-xs uppercase tracking-wider font-medium mb-1">
                    {s.label}
                  </p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            {/* State Machine */}
            <AnimatePresence mode="wait">
              {state === "connect" && (
                <motion.div
                  key="connect"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="card p-6 mb-6 text-center">
                    <p className="text-secondary text-sm mb-1">Status</p>
                    <p className="font-semibold">
                      Connect your wallet to check eligibility.
                    </p>
                  </div>
                  <button
                    onClick={handleConnect}
                    className="w-full pb-btn-primary py-4 font-bold text-base cursor-pointer"
                  >
                    Connect Wallet
                  </button>
                </motion.div>
              )}

              {state === "checking" && (
                <motion.div
                  key="checking"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="card p-8 text-center"
                >
                  <div className="w-10 h-10 border-2 border-[#ffd76f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-semibold">Verifying eligibility…</p>
                  <p className="text-secondary text-sm mt-1">
                    Checking your Pace Punks activity
                  </p>
                </motion.div>
              )}

              {state === "not-eligible" && (
                <motion.div
                  key="not-eligible"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="card p-6 mb-6 border-orange/30">
                    <p className="font-semibold text-orange mb-2">
                      Not Eligible Yet
                    </p>
                    <p className="text-secondary text-sm mb-4">
                      742 / 1,000 steps completed — 258 steps remaining
                    </p>
                    <div className="w-full h-2 bg-background border border-border overflow-hidden">
                      <div
                        className="h-full bg-orange"
                        style={{ width: "74.2%" }}
                      />
                    </div>
                  </div>
                  <Link
                    href="/"
                    className="block w-full bg-orange text-[#17132c] py-4 font-bold text-base text-center hover:opacity-90 transition-opacity"
                  >
                    Open Pace Punks App
                  </Link>
                </motion.div>
              )}

              {state === "eligible" && (
                <motion.div
                  key="eligible"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="card p-6 mb-6 border-mint/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 bg-mint" />
                      <p className="font-semibold text-mint">
                        You&apos;re Eligible!
                      </p>
                    </div>
                    <p className="text-secondary text-sm">
                      You&apos;ve completed the Epoch 01 requirement. Mint your
                      Punk before the epoch closes.
                    </p>
                  </div>
                  <button
                    onClick={handleMint}
                    className="w-full pb-btn-primary py-4 font-bold text-base cursor-pointer"
                  >
                    Mint My Punk
                  </button>
                </motion.div>
              )}

              {state === "minting" && (
                <motion.div
                  key="minting"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="card p-8 text-center"
                >
                  <div className="w-10 h-10 border-2 border-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-semibold">Minting your Punk…</p>
                  <p className="text-secondary text-sm mt-1">
                    Waiting for transaction confirmation
                  </p>
                </motion.div>
              )}

              {state === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="card p-6 mb-6 border-mint/30 bg-mint/5">
                    <h3 className="text-2xl font-bold mb-1">
                      Welcome to Pace Punks!
                    </h3>
                    <p className="text-secondary text-sm">
                      Pace Punk #421 successfully minted.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/my-punks"
                      className="flex-1 pb-btn-primary py-4 font-bold text-base text-center"
                    >
                      View My Punk
                    </Link>
                    <button className="flex-1 pb-btn-secondary py-4 font-bold text-base cursor-pointer">
                      Share on X
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
