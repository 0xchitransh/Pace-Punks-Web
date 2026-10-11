"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { use } from "react";

const punkData: Record<
  number,
  {
    id: number;
    name: string;
    epoch: string;
    epochNum: string;
    rarity: string;
    owner: string;
    mintDate: string;
    traits: { type: string; value: string }[];
  }
> = {
  421: {
    id: 421,
    name: "Pace Punk #0421",
    epoch: "Genesis Run",
    epochNum: "01",
    rarity: "Legendary",
    owner: "7KxP...9rLm",
    mintDate: "Oct 5, 2026",
    traits: [
      { type: "Background", value: "Neon Valley" },
      { type: "Skin", value: "Holographic" },
      { type: "Eyes", value: "Laser Red" },
      { type: "Headwear", value: "Cyber Crown" },
      { type: "Outfit", value: "Carbon Suit" },
      { type: "Accessory", value: "Energy Ring" },
    ],
  },
};

export default function PunkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const punk = punkData[Number(id)];

  if (!punk) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
        <div className="card p-14 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-3">Punk Not Found</h2>
          <p className="text-secondary mb-6">
            This Punk hasn&apos;t been minted yet or doesn&apos;t exist.
          </p>
          <Link
            href="/collection"
            className="inline-block bg-foreground text-surface px-8 py-4 rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Browse Collection
          </Link>
        </div>
      </div>
    );
  }

  const rarityColor = (r: string) => {
    if (r === "Legendary") return "text-orange bg-orange/10";
    if (r === "Rare") return "text-purple bg-purple/10";
    return "text-secondary bg-secondary/10";
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
        {/* Artwork */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 flex justify-center"
        >
          <div className="relative w-full max-w-md aspect-square">
            <div className="absolute inset-0 bg-gradient-to-br from-mint/20 via-purple/10 to-orange/10 rounded-[3rem] blur-3xl" />
            <div className="relative w-full h-full card flex items-center justify-center overflow-hidden">
              <div className="text-center">
                <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-purple to-mint">
                  {String(punk.id).padStart(2, "0")}
                </div>
                <p className="text-secondary text-sm font-medium mt-2">
                  {punk.name}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex-1"
        >
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${rarityColor(
                punk.rarity
              )}`}
            >
              {punk.rarity}
            </span>
            <span className="text-secondary text-sm">Epoch {punk.epochNum}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-2">{punk.name}</h1>
          <p className="text-secondary mb-8">{punk.epoch}</p>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-background rounded-2xl p-4 border border-border">
              <p className="text-secondary text-xs uppercase tracking-wider font-medium mb-1">
                Owner
              </p>
              <p className="font-semibold text-sm font-mono">{punk.owner}</p>
            </div>
            <div className="bg-background rounded-2xl p-4 border border-border">
              <p className="text-secondary text-xs uppercase tracking-wider font-medium mb-1">
                Minted
              </p>
              <p className="font-semibold text-sm">{punk.mintDate}</p>
            </div>
          </div>

          {/* Traits */}
          <h3 className="font-bold text-lg mb-4">Traits</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {punk.traits.map((trait) => (
              <div
                key={trait.type}
                className="bg-background rounded-2xl p-4 border border-border text-center"
              >
                <p className="text-secondary text-xs uppercase tracking-wider font-medium mb-1">
                  {trait.type}
                </p>
                <p className="font-semibold text-sm">{trait.value}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button className="flex-1 border border-border text-foreground py-3 rounded-full font-semibold text-sm hover:bg-surface transition-colors cursor-pointer">
              Share on X
            </button>
            <button className="flex-1 border border-border text-foreground py-3 rounded-full font-semibold text-sm hover:bg-surface transition-colors cursor-pointer">
              View on Explorer
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
