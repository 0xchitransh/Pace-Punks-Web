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
    <div className="max-w-4xl mx-auto px-3 py-8 sm:px-6 sm:py-20 font-mono">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 sm:mb-16"
      >
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 tracking-wider">[ HOW IT WORKS ]</h1>
        <p className="text-bbs/70 text-sm sm:text-lg max-w-xl mx-auto">
          You don&apos;t buy access to Pace Punks. You earn eligibility by
          moving.
        </p>
      </motion.div>

      <div className="flex flex-col gap-4 sm:gap-8">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="border-2 border-bbs bg-background/85 p-4 sm:p-8 md:p-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 shadow-[0_0_15px_var(--color-bbs-dim)]"
          >
            <div
              className={`w-12 h-12 sm:w-16 sm:h-16 border-2 border-bbs bg-bbs/10 flex items-center justify-center shrink-0`}
            >
              <span className="text-lg sm:text-xl font-bold text-bbs">
                {step.num}
              </span>
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2 text-bbs">{step.title}</h3>
              <p className="text-bbs/80 text-xs sm:text-base leading-relaxed">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mt-12 sm:mt-20 text-center"
      >
        <div className="border-2 border-bbs bg-background/90 p-6 sm:p-10 md:p-14 shadow-[0_0_20px_var(--color-bbs-dim)]">
          <h2 className="text-2xl sm:text-4xl font-bold mb-3 tracking-wider text-bbs">
            [ READY TO EARN YOUR PUNK? ]
          </h2>
          <p className="text-bbs/70 mb-6 sm:mb-8 max-w-md mx-auto text-xs sm:text-base">
            Start walking in the Pace Punks app and qualify for the active epoch.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/mint"
              className="border-2 border-bbs bg-bbs text-background px-6 py-3 font-bold text-xs sm:text-sm hover:bg-transparent hover:text-bbs transition-colors"
            >
              [+] CHECK ELIGIBILITY / MINT
            </Link>
            <Link
              href="/epochs"
              className="border-2 border-bbs bg-background text-bbs px-6 py-3 font-bold text-xs sm:text-sm hover:bg-bbs hover:text-background transition-colors"
            >
              [&gt;] VIEW ACTIVE EPOCHS
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
