"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const myPunks = [
  {
    id: 421,
    name: "Pace Punk #0421",
    epoch: "Genesis Run",
    epochNum: "01",
    rarity: "Legendary",
    mintDate: "Oct 5, 2026",
  },
];

export default function MyPunksPage() {
  const connected = false; // Will be from wallet state

  if (!connected) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-10 md:p-14 text-center max-w-md w-full"
        >
          <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🔗</span>
          </div>
          <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
          <p className="text-secondary mb-8">
            Connect your wallet to view your Pace Punks collection.
          </p>
          <button className="w-full bg-foreground text-surface py-4 rounded-full font-semibold hover:opacity-90 transition-opacity cursor-pointer">
            Connect Wallet
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">My Punks</h1>
        <p className="text-secondary text-lg">
          Your earned Pace Punks collection.
        </p>
      </motion.div>

      {myPunks.length === 0 ? (
        <div className="card p-14 text-center">
          <p className="text-secondary text-lg mb-6">
            You haven&apos;t minted any Punks yet.
          </p>
          <Link
            href="/mint"
            className="inline-block bg-foreground text-surface px-8 py-4 rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Check Eligibility
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {myPunks.map((punk, i) => (
            <motion.div
              key={punk.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link href={`/punk/${punk.id}`} className="block group">
                <div className="card overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-mint/10 via-purple/5 to-orange/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-foreground to-secondary/30">
                      {String(punk.id).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold">{punk.name}</p>
                    <p className="text-secondary text-sm mt-1">{punk.epoch}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-secondary">
                        {punk.mintDate}
                      </span>
                      <span className="text-xs font-bold text-orange bg-orange/10 px-2 py-0.5 rounded-full">
                        {punk.rarity}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
