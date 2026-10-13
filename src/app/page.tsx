"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { CorridorRunGame } from "@/components/game/CorridorRunGame";

export default function HomePage() {
  return (
    <div className="w-full min-h-screen bg-transparent text-bbs p-3 pt-4 sm:p-5 sm:pt-6 md:p-8 lg:p-10 relative z-10">
      <div className="max-w-[1520px] mx-auto">
        
        {/* Responsive Grid: Left Column BBS Terminal, Right Column Game */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-12 items-start mb-16 sm:mb-24">
          
          {/* Left Column: BBS Terminal Header, Typewriter & Interactive Prompt */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            <TypewriterText 
              text={[
                "Walk it.",
                "Level it.",
                "Evolve it."
              ]} 
              delay={50}
              className="text-4xl xs:text-5xl sm:text-6xl lg:text-7xl mb-3 sm:mb-4 whitespace-pre-wrap font-bold font-display tracking-[-0.02em] leading-[1.08] text-[#f7ebc9]"
            />

            {/* Terminal Prompt */}
            <div className="w-full mt-2 sm:mt-4">
              <TerminalPrompt />
            </div>
          </div>

          {/* Right Column: Whole Game Page */}
          <div className="lg:col-span-7 w-full">
            <CorridorRunGame isEmbedded={true} />
          </div>

        </div>

        {/* ========================================================
            SECTION 1: HOW IT WORKS
            "Your steps are the game controller."
            ======================================================== */}
        <section className="mb-16 sm:mb-24 pt-4 border-t border-[#504364]/60">
          <p className="text-[12px] sm:text-xs text-[#ffd76f] tracking-widest uppercase mb-2">
            HOW IT WORKS
          </p>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display tracking-tight text-[#f7ebc9] mb-8">
            Your steps are the game controller.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="pb-panel p-5 sm:p-6 flex flex-col justify-between relative group hover:border-[#ffd76f] transition-colors">
              <div>
                <span className="text-3xl sm:text-4xl font-bold font-display text-[#ffd76f] block mb-3">
                  1
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-display text-[#f7ebc9] mb-2">
                  Move
                </h3>
                <p className="text-xs sm:text-sm text-[#b9b3c9] leading-relaxed">
                  Go for a walk. The app verifies each step session directly on your phone.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="pb-panel p-5 sm:p-6 flex flex-col justify-between relative group hover:border-[#ffd76f] transition-colors">
              <div>
                <span className="text-3xl sm:text-4xl font-bold font-display text-[#ffd76f] block mb-3">
                  2
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-display text-[#f7ebc9] mb-2">
                  Score
                </h3>
                <p className="text-xs sm:text-sm text-[#b9b3c9] leading-relaxed">
                  Earn Movement Scores for your steps and unlock exclusive benefits and rewards.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="pb-panel p-5 sm:p-6 flex flex-col justify-between relative group hover:border-[#ffd76f] transition-colors">
              <div>
                <span className="text-3xl sm:text-4xl font-bold font-display text-[#ffd76f] block mb-3">
                  3
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-display text-[#f7ebc9] mb-2">
                  Earn GP
                </h3>
                <p className="text-xs sm:text-sm text-[#b9b3c9] leading-relaxed">
                  Verified Movement Scores earn rewards and in-game tokens, which can be used for repairs, upgrades, and level-ups.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="pb-panel p-5 sm:p-6 flex flex-col justify-between relative group hover:border-[#ffd76f] transition-colors">
              <div>
                <span className="text-3xl sm:text-4xl font-bold font-display text-[#ffd76f] block mb-3">
                  4
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-display text-[#f7ebc9] mb-2">
                  Level up
                </h3>
                <p className="text-xs sm:text-sm text-[#b9b3c9] leading-relaxed">
                  Climb up your level. Each level upgrade grants up to 3 attribute upgrades, helping you earn even greater rewards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            SECTION 2: YOUR PUNK
            "Five stats. Each one has a single job."
            ======================================================== */}
        <section className="mb-16 sm:mb-20 pt-4 border-t border-[#504364]/60">
          <p className="text-[12px] sm:text-xs text-[#ffd76f] tracking-widest uppercase mb-2">
            YOUR PUNK
          </p>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display tracking-tight text-[#f7ebc9] mb-2">
            Five stats. Each one has a single job.
          </h2>
          <p className="text-xs sm:text-sm text-[#b9b3c9] mb-8">
            Every Punk starts at 20 in each attribute and caps at 100. You decide where the points go.
          </p>

          <PunkStatsInteractive />

          {/* Three Mechanism Cards (Battery, Durability, Pace Boxes) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
            {/* Battery */}
            <div className="pb-panel p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold bg-[#3EE6D2] text-[#0b0820] mb-3 uppercase tracking-wider">
                  BATTERY
                </span>
                <p className="text-xs sm:text-sm text-[#b9b3c9] leading-relaxed mb-4">
                  Your daily walk capacity. It recharges for free every day, and you can&apos;t buy extra.
                </p>
              </div>
              <p className="text-xs sm:text-sm text-[#ffd76f] font-mono font-bold tracking-wider pt-3 border-t border-[#504364]/50">
                33 MIN/DAY AT STAMINA 20
              </p>
            </div>

            {/* Durability */}
            <div className="pb-panel p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold bg-[#FF7A3D] text-[#0b0820] mb-3 uppercase tracking-wider">
                  DURABILITY
                </span>
                <p className="text-xs sm:text-sm text-[#b9b3c9] leading-relaxed mb-4">
                  A 0–100 condition meter that drops as you walk. Repair it with MST or a repair patch from a Pace Box.
                </p>
              </div>
              <p className="text-xs sm:text-sm text-[#3EE6D2] font-mono font-bold tracking-wider pt-3 border-t border-[#504364]/50">
                RESILIENCE SLOWS WEAR BY UP TO 50%
              </p>
            </div>

            {/* Pace Boxes */}
            <div className="pb-panel p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold bg-[#FF4FA3] text-[#0b0820] mb-3 uppercase tracking-wider">
                  PACE BOXES
                </span>
                <p className="text-xs sm:text-sm text-[#b9b3c9] leading-relaxed mb-3">
                  Free to open. No keys, no paid rerolls, and the odds are published.
                </p>
                <table className="w-full text-xs text-[#b9b3c9]">
                  <tbody>
                    <tr className="border-b border-[#504364]/40">
                      <td className="py-1">Repair patch</td>
                      <td className="py-1 text-right text-[#FF4FA3] font-bold font-mono">40%</td>
                    </tr>
                    <tr className="border-b border-[#504364]/40">
                      <td className="py-1">Attribute upgrade card</td>
                      <td className="py-1 text-right text-[#FF4FA3] font-bold font-mono">25%</td>
                    </tr>
                    <tr className="border-b border-[#504364]/40">
                      <td className="py-1">Focus booster</td>
                      <td className="py-1 text-right text-[#FF4FA3] font-bold font-mono">20%</td>
                    </tr>
                    <tr className="border-b border-[#504364]/40">
                      <td className="py-1">Cosmetic</td>
                      <td className="py-1 text-right text-[#FF4FA3] font-bold font-mono">10%</td>
                    </tr>
                    <tr>
                      <td className="py-1">Invite code</td>
                      <td className="py-1 text-right text-[#FF4FA3] font-bold font-mono">5%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

function TypewriterText({ text, delay = 50, startDelay = 0, className = "" }: { text: string[], delay?: number, startDelay?: number, className?: string }) {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    let currentText = "";
    const fullText = text.join("\n");
    let currentIndex = 0;
    
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIndex < fullText.length) {
          currentText += fullText[currentIndex];
          setDisplayedText(currentText);
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, delay);
      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(timeout);
  }, [text, delay, startDelay]);

  return (
    <div className={className}>
      {displayedText}
    </div>
  );
}

function TerminalPrompt() {
  const router = useRouter();
  const { address, isConnected, chain } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([
    "Pace Punks operational kernel v1.0.4 — [ONLINE]",
    "A world of big ideas, curious characters, and pixel gameplay.",
    "Type 'JOIN' to register for early access, or 'HELP' for commands.",
  ]);
  const [mode, setMode] = useState<"COMMAND" | "AWAITING_EMAIL">("COMMAND");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const submitToDatabase = async (email: string) => {
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), walletAddress: address || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        return [
          `[!] DATABASE ERROR: ${data.error || "COULD NOT COMPLETE RECORD"}`,
          `[!] PLEASE TRY AGAIN OR VERIFY NETWORK.`,
        ];
      }

      const entry = data.entry;
      localStorage.setItem("pp_waitlist", JSON.stringify(entry));

      return [
        `[+] CONNECTING TO DATABASE RELAY...`,
        `[+] TRANSMITTING OPERATOR IDENTITY: ${entry.email}`,
        `[+] ASSIGNED QUEUE NUMBER: [REDACTED // REDACTED]`,
        `[+] WAITLIST STANDING: ${data.isNew ? "NEW REGISTRATION CONFIRMED" : "EXISTING ENTRY VERIFIED"}`,
        `[+] WELCOME TO PACE PUNKS, RUNNER.`,
      ];
    } catch {
      return [
        `[!] NETWORK HANDSHAKE TIMEOUT WITH DATABASE.`,
        `[!] FALLBACK RECORD SAVED TO LOCAL NODE BUFFER.`,
      ];
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = historyIndex + 1 < cmdHistory.length ? historyIndex + 1 : historyIndex;
      setHistoryIndex(nextIdx);
      setInput(cmdHistory[cmdHistory.length - 1 - nextIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInput(cmdHistory[cmdHistory.length - 1 - nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawTrimmed = input.trim();
    if (!rawTrimmed) return;

    if (mode === "AWAITING_EMAIL") {
      const promptLine = `EMAIL:\\> ${rawTrimmed}`;
      if (validateEmail(rawTrimmed)) {
        setHistory((prev) => [...prev, promptLine, `[+] TRANSMITTING REGISTRATION TO DATABASE...`]);
        setMode("COMMAND");
        setInput("");
        const resp = await submitToDatabase(rawTrimmed);
        setHistory((prev) => [...prev, ...resp]);
      } else {
        setHistory((prev) => [
          ...prev,
          promptLine,
          `[!] ERROR: INVALID EMAIL ADDRESS FORMAT.`,
          `[!] ENTER YOUR EMAIL ADDRESS TO JOIN WAITLIST (OR TYPE 'CANCEL'):`,
        ]);
        setInput("");
      }
      return;
    }

    // Normal Command Mode
    const promptLine = `C:\\> ${rawTrimmed}`;
    setCmdHistory((prev) => [...prev, rawTrimmed]);
    setHistoryIndex(-1);

    const tokens = rawTrimmed.split(/\s+/);
    const command = tokens[0].toUpperCase();
    const arg = tokens.slice(1).join(" ");

    let responses: string[] = [];

    switch (command) {
      case "CLEAR":
      case "CLS":
        setHistory([]);
        setInput("");
        return;

      case "HELP":
      case "?":
      case "COMMANDS":
        responses = [
          "==================== SYSTEM COMMAND DIRECTORY ====================",
          "  JOIN [email]     : REGISTER FOR EARLY ACCESS WAITLIST IN DATABASE",
          "  STATUS           : CHECK YOUR WAITLIST QUEUE STANDING (LIVE DB)",
          "  GAME / PLAY      : LAUNCH PUNKS RUN ARCADE MINI GAME",
          "  EPOCH / EPOCHS   : NAVIGATE TO EPOCHS TIMELINE",
          "  COLLECTION       : INSPECT 6,000 CYBER PUNK ARCHIVE",
          "  HOW / MANUAL     : READ THE WALKING & EVOLUTION MANUAL",
          "  WHOAMI           : DISPLAY CONNECTED WALLET / NODE CREDENTIALS",
          "  CONNECT          : TRIGGER SECURE WEB3 WALLET CONNECTION",
          "  COLOR <NAME>     : CHANGE PHOSPHOR PALETTE (GREEN, AMBER, CYAN...)",
          "  CLEAR / CLS      : WIPE THE TERMINAL SCREEN",
          "==================================================================",
        ];
        break;

      case "JOIN":
        if (arg && validateEmail(arg)) {
          setHistory((prev) => [...prev, promptLine, `[+] TRANSMITTING REGISTRATION TO DATABASE...`]);
          setInput("");
          const resp = await submitToDatabase(arg);
          setHistory((prev) => [...prev, ...resp]);
          return;
        } else {
          setMode("AWAITING_EMAIL");
          responses = [
            `[+] INITIATING EARLY ACCESS WAITLIST PROTOCOL...`,
            `[+] ENTER YOUR EMAIL ADDRESS TO JOIN WAITLIST:`,
          ];
        }
        break;

      case "STATUS":
      case "QUEUE": {
        const stored = localStorage.getItem("pp_waitlist");
        let localEmail = "";
        if (stored) {
          try {
            localEmail = JSON.parse(stored).email;
          } catch {}
        }

        if (localEmail) {
          setHistory((prev) => [...prev, promptLine, `[+] QUERYING DATABASE RECORD FOR ${localEmail}...`]);
          setInput("");
          try {
            const res = await fetch(`/api/waitlist?email=${encodeURIComponent(localEmail)}`);
            const data = await res.json();
            if (res.ok && data.entry) {
              setHistory((prev) => [
                ...prev,
                `================ WAITLIST DATABASE RECORD ================`,
                `OPERATOR EMAIL : ${data.entry.email}`,
                `QUEUE STANDING : [REDACTED // REDACTED]`,
                `REGISTERED AT  : ${new Date(data.entry.createdAt).toLocaleString()}`,
                `DATABASE STATUS: ACTIVE & CONFIRMED IN DATABASE`,
                `=========================================================`,
              ]);
              return;
            }
          } catch {}
        }

        responses = [
          `[i] NO REGISTERED RECORD FOUND FOR THIS NODE.`,
          `[i] TYPE 'JOIN' TO ENTER THE 6,000 PUNK EARLY ACCESS WAITLIST.`,
        ];
        break;
      }

      case "EPOCH":
      case "EPOCHS":
      case "GOTO EPOCHS":
      case "CD EPOCHS":
        responses = [
          `[>>>] ACCESSING EPOCH MATRIX...`,
          `[>>>] REDIRECTING OPERATOR TO [/epochs]...`,
        ];
        setTimeout(() => router.push("/epochs"), 600);
        break;

      case "COLLECTION":
      case "COLLECTIONS":
      case "PUNKS":
      case "GALLERY":
        responses = [
          `[>>>] RETRIEVING 6,000 CYBERNETIC PUNK CATALOG...`,
          `[>>>] REDIRECTING OPERATOR TO [/collection]...`,
        ];
        setTimeout(() => router.push("/collection"), 600);
        break;

      case "GAME":
      case "PLAY":
      case "RUN":
      case "CORRIDOR":
        responses = [
          `[>>>] INITIALIZING PUNKS RUN MINI GAME SIMULATION...`,
          `[>>>] REDIRECTING OPERATOR TO [/game]...`,
        ];
        setTimeout(() => router.push("/game"), 600);
        break;

      case "HOW":
      case "RULES":
      case "MANUAL":
        responses = [
          `[>>>] ACCESSING TACTICAL FIELD MANUAL...`,
          `[>>>] REDIRECTING OPERATOR TO [/how-it-works]...`,
        ];
        setTimeout(() => router.push("/how-it-works"), 600);
        break;

      case "HOME":
      case "CD /":
        responses = [`[>>>] RETURNING TO ROOT PROMPT [/]...`];
        setTimeout(() => router.push("/"), 400);
        break;

      case "WHOAMI":
        if (isConnected && address) {
          responses = [
            `================ CONNECTED IDENTITY ================`,
            `ACCOUNT ADDRESS : ${address}`,
            `CONNECTED CHAIN : ${chain?.name || "EVM CHAIN"} (ID: ${chain?.id || "N/A"})`,
            `OPERATOR STATUS : AUTHENTICATED WEB3 RUNNER`,
            `====================================================`,
          ];
        } else {
          responses = [
            `[i] NODE IDENTITY: UNLINKED ANONYMOUS CLIENT`,
            `[i] NO WEB3 WALLET CONNECTED.`,
            `[i] TYPE 'CONNECT' OR USE THE TOP BAR BUTTON TO ATTACH WALLET.`,
          ];
        }
        break;

      case "CONNECT":
        if (isConnected) {
          responses = [`[i] WALLET ALREADY CONNECTED: ${address}`];
        } else {
          responses = [`[+] OPENING SECURE WALLET HANDSHAKE INTERFACE...`];
          openConnectModal?.();
        }
        break;

      case "COLOR": {
        const colorArg = arg.toUpperCase().trim();
        const colorMap: Record<string, string> = {
          GREEN: "#33ff33",
          "CLASSIC GREEN": "#33ff33",
          AMBER: "#FFB000",
          BLUE: "#8C7CFF",
          CYAN: "#00FFFF",
          CRIMSON: "#FF3333",
          RED: "#FF3333",
          MAGENTA: "#FF00FF",
          PINK: "#FF4FA3",
          "NEON PINK": "#FF4FA3",
          PURPLE: "#B026FF",
          "ICE BLUE": "#A0F0FF",
          GOLD: "#FFC93D",
          AQUA: "#3EE6D2",
          CREAM: "#FFF3DE",
        };

        if (colorMap[colorArg]) {
          const hex = colorMap[colorArg];
          document.documentElement.style.setProperty("--bbs-color", hex);
          responses = [`[+] PHOSPHOR COLOR RECONFIGURED TO: ${colorArg} (${hex})`];
        } else if (colorArg.startsWith("#") && colorArg.length >= 4) {
          document.documentElement.style.setProperty("--bbs-color", colorArg);
          responses = [`[+] CUSTOM HEX PHOSPHOR APPLIED: ${colorArg}`];
        } else {
          responses = [
            `[!] UNKNOWN COLOR: '${arg}'. AVAILABLE PALETTES:`,
            `    GREEN, AMBER, BLUE, CYAN, CRIMSON, MAGENTA, PURPLE, GOLD, AQUA, PINK`,
          ];
        }
        break;
      }

      default:
        // Handle fuzzy terms: if user typed "epochs" or "epoch" inside sentence
        if (rawTrimmed.toUpperCase().includes("EPOCH")) {
          responses = [
            `[>>>] KEYWORD 'EPOCH' DETECTED.`,
            `[>>>] ROUTING TO EPOCH MATRIX [/epochs]...`,
          ];
          setTimeout(() => router.push("/epochs"), 600);
        } else if (rawTrimmed.toUpperCase().includes("JOIN")) {
          setMode("AWAITING_EMAIL");
          responses = [
            `[+] INITIATING EARLY ACCESS WAITLIST PROTOCOL...`,
            `[+] ENTER YOUR EMAIL ADDRESS TO JOIN WAITLIST:`,
          ];
        } else {
          responses = [
            `SYNTAX ERROR: '${rawTrimmed}' NOT RECOGNIZED.`,
            `TYPE 'JOIN' TO ENTER WAITLIST, 'EPOCHS' TO VIEW PROGRESS, OR 'HELP' FOR DIRECTORY.`,
          ];
        }
        break;
    }

    setHistory((prev) => [...prev, promptLine, ...responses]);
    setInput("");
  };

  return (
    <div 
      className="flex flex-col gap-3 text-sm md:text-base cursor-text pb-panel p-4 sm:p-5" 
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-col gap-1.5 overflow-y-auto min-h-[110px] sm:min-h-[160px] max-h-[380px] pr-2 scrollbar-none text-[#b9b3c9] font-sans">
        {history.map((line, i) => (
          <div key={i} className="leading-relaxed whitespace-pre-wrap select-text">
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2 pt-3 border-t border-[#504364] font-mono">
        <span className="select-none font-bold text-[#ffd76f] shrink-0 text-xs sm:text-sm">
          {mode === "AWAITING_EMAIL" ? "EMAIL:\\>" : "C:\\>"}
        </span>
        <input 
          ref={inputRef}
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === "AWAITING_EMAIL" ? "Enter your email..." : "Type 'JOIN' or 'EPOCHS'..."}
          className="flex-1 bg-transparent text-[#f7ebc9] border-none focus:outline-none focus:ring-0 p-0 m-0 uppercase w-full placeholder:text-[#827c98] text-xs sm:text-sm tracking-wider"
          autoFocus
          spellCheck={false}
        />
        <span className="bg-[#ffd76f] w-2 h-4 inline-block shrink-0"></span>
      </form>

      {/* Clean Embedded Quick Command Buttons */}
      <div className="flex flex-wrap items-center gap-2 mt-2 pt-2.5 border-t border-[#504364]/60 text-[11px] sm:text-xs font-mono">
        <span className="text-[#827c98]">&gt; QUICK:</span>
        <button
          type="button"
          onClick={() => { setInput("JOIN"); inputRef.current?.focus(); }}
          className="px-2.5 py-1 pb-btn-primary text-xs font-bold cursor-pointer font-sans"
        >
          Join waitlist ↓
        </button>
        <button
          type="button"
          onClick={() => router.push("/epochs")}
          className="px-2.5 py-1 pb-btn-secondary text-xs font-bold cursor-pointer font-sans"
        >
          Epochs →
        </button>
      </div>
    </div>
  );
}

const BUILDS: Record<string, { E: number; S: number; R: number; M: number; F: number; art: string }> = {
  "LV 1": { E: 20, S: 20, R: 20, M: 20, F: 20, art: "/assets/punks/0016.webp" },
  "WALKER": { E: 20, S: 36, R: 26, M: 26, F: 20, art: "/assets/punks/0008.webp" },
};

function PunkStatsInteractive() {
  const [activeBuild, setActiveBuild] = useState<string>("LV 1");
  const stats = BUILDS[activeBuild];

  const statItems = [
    {
      name: "EFFICIENCY",
      key: "E",
      val: stats.E,
      color: "#FF7A3D",
      desc: "Raises your chances to earn better rewards.",
    },
    {
      name: "STAMINA",
      key: "S",
      val: stats.S,
      color: "#3EE6D2",
      desc: "Bigger battery, more time to earn more rewards.",
    },
    {
      name: "RESILIENCE",
      key: "R",
      val: stats.R,
      color: "#8C7CFF",
      desc: "Your Punk wears out slower, so you repair less.",
    },
    {
      name: "MOMENTUM",
      key: "M",
      val: stats.M,
      color: "#FF4FA3",
      desc: "Build your walk streak to get bonuses.",
    },
    {
      name: "FOCUS",
      key: "F",
      val: stats.F,
      color: "#FFC93D",
      desc: "More XP for each walk, then mastery after level 50.",
    },
  ];

  return (
    <div className="pb-panel p-5 sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Punk Artwork & Build Switcher */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[420px] aspect-square border-2 border-[#504364] bg-[#0b0820] overflow-hidden shadow-[4px_4px_0_#FF4FA3]">
            <img
              src={stats.art}
              alt={`Pace Punk with ${activeBuild} build`}
              className="w-full h-full object-cover pixelated"
            />
          </div>

          {/* Build Selector Tabs */}
          <div className="flex items-center gap-2 mt-5 flex-wrap justify-center">
            <span className="text-[11px] sm:text-xs text-[#b9b3c9] font-bold uppercase tracking-wider mr-1">
              BUILD:
            </span>
            <div className="inline-flex border border-[#504364] bg-[#17132c]">
              {(["LV 1", "WALKER"] as const).map((tab) => {
                const isSelected = activeBuild === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveBuild(tab)}
                    className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#ffd76f] text-[#17132c]"
                        : "text-[#b9b3c9] hover:text-[#f7ebc9] hover:bg-[#231d3c]"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: 5 Stat Bars & Descriptions */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {statItems.map((item) => (
            <div key={item.key} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <span 
                  className="text-xs sm:text-sm font-bold tracking-wider"
                  style={{ color: item.color }}
                >
                  {item.name}
                </span>
                <span className="text-sm sm:text-base font-bold font-mono text-[#f7ebc9]">
                  {item.val}
                </span>
              </div>

              {/* Segmented / Stepped Progress Bar */}
              <div className="w-full h-3.5 bg-[#0b0820] border border-[#504364] relative overflow-hidden">
                <div 
                  className="h-full transition-all duration-300"
                  style={{ 
                    width: `${item.val}%`, 
                    backgroundColor: item.color 
                  }}
                />
                {/* 10-step divider marks */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-40"
                  style={{
                    backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent calc(10% - 1px), #0b0820 calc(10% - 1px), #0b0820 10%)"
                  }}
                />
              </div>

              <p className="text-[11px] sm:text-xs text-[#b9b3c9]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

