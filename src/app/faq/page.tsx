"use client";

import { motion } from "framer-motion";

const faqs = [
  {
    q: "What is an epoch?",
    a: "An epoch is a time-limited minting window. Each epoch has a set supply of Pace Punks and a step requirement. Once the epoch ends or supply is exhausted, that collection is closed forever.",
  },
  {
    q: "How do I become eligible?",
    a: "Download the Pace Punks app, create an account, and complete the required number of verified steps for the current epoch. Your eligibility is automatically verified by the backend.",
  },
  {
    q: "Where are steps tracked?",
    a: "Steps are tracked exclusively in the Pace Punks app using device motion sensors and verified activity sessions. The website only reads your eligibility status — it does not track steps.",
  },
  {
    q: "Can I mint without the app?",
    a: "No. Eligibility is earned through verified activity in the Pace Punks app. The website verifies your eligibility from the backend before allowing you to mint.",
  },
  {
    q: "Can one person mint multiple Punks?",
    a: "Each epoch has configurable mint limits. For Genesis Run (Epoch 01), the limit is 1 Punk per user. Future epochs may allow different limits.",
  },
  {
    q: "What happens if the epoch sells out?",
    a: "Once all Punks in an epoch are minted, it is marked SOLD OUT. Eligible users who didn't mint in time will need to wait for the next epoch.",
  },
  {
    q: "Does eligibility roll over?",
    a: "No. Eligibility is specific to each epoch. If you qualify for Epoch 01 but don't mint, you'll need to meet the requirements for the next epoch separately.",
  },
  {
    q: "How do I connect my wallet?",
    a: "Click the 'Connect Wallet' button on the website. You'll sign a verification message to link your wallet to your Pace Punks account. This ensures secure ownership.",
  },
  {
    q: "What if I change wallets?",
    a: "You can update your linked wallet in your profile settings. However, previously minted Punks remain in your original wallet unless transferred manually.",
  },
  {
    q: "Where is my NFT stored?",
    a: "Your Pace Punk lives on-chain. Artwork and metadata are stored permanently on IPFS via Pinata, ensuring your Punk exists independently of any platform.",
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-secondary text-lg max-w-xl mx-auto">
          Everything you need to know about Pace Punks, epochs, and minting.
        </p>
      </motion.div>

      <div className="flex flex-col gap-4">
        {faqs.map((faq, i) => (
          <motion.details
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="card group"
          >
            <summary className="flex items-center justify-between cursor-pointer p-6 text-base font-semibold list-none select-none">
              {faq.q}
              <span className="text-secondary ml-4 transition-transform duration-200 group-open:rotate-45 text-xl shrink-0">
                +
              </span>
            </summary>
            <div className="px-6 pb-6 text-secondary leading-relaxed text-sm">
              {faq.a}
            </div>
          </motion.details>
        ))}
      </div>
    </div>
  );
}
