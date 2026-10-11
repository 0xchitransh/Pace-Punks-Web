"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function HowItWorksPage() {
  const steps = [
    {
      num: "01",
      title: "Walk",
      desc: "Open the Pace Punks app and complete your daily walks. Every step is verified and tracked securely.",
      accent: "from-mint/20 to-mint/5",
      badge: "bg-mint/10 text-mint",
    },
    {
      num: "02",
      title: "Qualify",
      desc: "Reach the step requirement for the current epoch. Once qualified, the app will notify you that you're eligible to mint.",
      accent: "from-purple/20 to-purple/5",
      badge: "bg-purple/10 text-purple",
    },
    {
      num: "03",
      title: "Connect",
      desc: "Visit pacepunks.xyz, connect your wallet, and link it to your Pace Punks account. Wallet verification is done via signature.",
      accent: "from-orange/20 to-orange/5",
      badge: "bg-orange/10 text-orange",
    },
    {
      num: "04",
      title: "Mint",
      desc: "Claim your unique Pace Punk NFT. It's stored on-chain with artwork and metadata permanently on IPFS.",
      accent: "from-foreground/10 to-foreground/5",
      badge: "bg-foreground/10 text-foreground",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-20"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h1>
        <p className="text-secondary text-lg max-w-xl mx-auto">
          You don&apos;t buy access to Pace Punks. You earn eligibility by
          moving.
        </p>
      </motion.div>

      <div className="flex flex-col gap-8">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="card p-8 md:p-10 flex flex-col md:flex-row items-start gap-6"
          >
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.accent} flex items-center justify-center shrink-0`}
            >
              <span className={`text-xl font-bold ${step.badge.split(" ")[1]}`}>
                {step.num}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
              <p className="text-secondary leading-relaxed">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mt-20 text-center"
      >
        <div className="card p-10 md:p-14 bg-gradient-to-br from-mint/5 via-surface to-purple/5">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to earn your Punk?
          </h2>
          <p className="text-secondary mb-8 max-w-md mx-auto">
            Start walking in the Pace Punks app and qualify for the current
            epoch.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/mint"
              className="bg-foreground text-surface px-8 py-4 rounded-full font-semibold hover:opacity-90 transition-opacity"
            >
              Check Eligibility
            </Link>
            <Link
              href="/epochs"
              className="border border-border text-foreground px-8 py-4 rounded-full font-semibold hover:bg-surface transition-colors"
            >
              View Epochs
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
