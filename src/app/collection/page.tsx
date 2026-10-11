"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const punks = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  name: `Pace Punk #${String(i + 1).padStart(4, "0")}`,
  epoch: "Genesis Run",
  epochNum: "01",
  rarity: i < 3 ? "Legendary" : i < 8 ? "Rare" : "Common",
  minted: true,
}));

const filters = ["All", "Epoch 01", "Legendary", "Rare", "Common"];

export default function CollectionPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = punks.filter((punk) => {
    const matchesSearch =
      search === "" ||
      punk.name.toLowerCase().includes(search.toLowerCase()) ||
      punk.id.toString().includes(search);

    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Epoch 01" && punk.epochNum === "01") ||
      activeFilter === punk.rarity;

    return matchesSearch && matchesFilter;
  });

  const rarityColor = (r: string) => {
    if (r === "Legendary") return "text-orange bg-orange/10";
    if (r === "Rare") return "text-purple bg-purple/10";
    return "text-secondary bg-secondary/10";
  };

  return (
    <div className="max-w-7xl mx-auto px-3 py-8 sm:px-6 sm:py-20 font-mono">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 sm:mb-12"
      >
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 tracking-wider">[ COLLECTION ARCHIVE ]</h1>
        <p className="text-bbs/70 text-sm sm:text-lg max-w-2xl">
          Browse the Pace Punks archive. Every Punk was earned through verified movement.
        </p>
      </motion.div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-6 sm:mb-10">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or #ID…"
            className="w-full bg-background/80 border border-bbs/50 px-3.5 py-2.5 sm:px-5 sm:py-3.5 text-xs sm:text-sm focus:outline-none focus:border-bbs placeholder:text-bbs/40 text-bbs font-mono"
          />
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                activeFilter === f
                  ? "bg-bbs text-background border-bbs"
                  : "bg-background border-bbs/40 text-bbs hover:border-bbs"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map((punk, i) => (
          <motion.div
            key={punk.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.02 }}
          >
            <Link href={`/punk/${punk.id}`} className="block group">
              <div className="card overflow-hidden hover:shadow-lg transition-shadow">
                {/* Artwork placeholder */}
                <div className="aspect-square bg-gradient-to-br from-background to-border/50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <span className="text-3xl font-black text-foreground/10">
                    {String(punk.id).padStart(2, "0")}
                  </span>
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{punk.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-secondary text-xs">{punk.epoch}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rarityColor(
                        punk.rarity
                      )}`}
                    >
                      {punk.rarity}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-secondary text-lg">No Punks found.</p>
        </div>
      )}
    </div>
  );
}
