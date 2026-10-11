"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

export default function HomePage() {
  return (
    <div className="w-full min-h-screen bg-background text-bbs p-3 pt-4 sm:p-6 sm:pt-8 md:p-12 font-mono uppercase tracking-wider sm:tracking-widest relative z-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Responsive Grid: Character on the right for BOTH mobile and laptop */}
        <div className="grid grid-cols-12 gap-3 sm:gap-6 lg:gap-16 items-start">
          
          {/* Top Left Header Text on Mobile / Left Column Top on Laptop */}
          <div className="col-span-7 sm:col-span-7 lg:col-span-7 flex flex-col justify-start">
            <div className="mb-2 sm:mb-4 text-xs sm:text-base">
              <p className="mb-0.5 sm:mb-1">CONNECTING TO BBS...</p>
              <p className="mb-0.5 sm:mb-1">BAUD RATE: 9600</p>
              <p className="mb-2 sm:mb-3">STATUS: <span className="text-bbs font-bold">ESTABLISHED</span></p>
            </div>

            <TypewriterText 
              text={[
                "===================",
                " WALK IT.",
                " LEVEL IT.",
                " EVOLVE IT.",
                "==================="
              ]} 
              delay={50}
              className="text-sm xs:text-base sm:text-xl lg:text-3xl mb-2.5 sm:mb-5 leading-tight sm:leading-relaxed whitespace-pre-wrap font-bold"
            />

            <TypewriterText 
              text={[
                "> PACE PUNKS IS A MOBILE",
                "> WALKING SIMULATION.",
                "> EVERY MINUTE POWERS UP",
                "> A UNIQUE CYBER PUNK.",
              ]} 
              delay={30}
              startDelay={1500}
              className="text-xs sm:text-base mb-2.5 sm:mb-5 leading-normal sm:leading-loose text-bbs/80"
            />
          </div>

          {/* Character Artwork: Always on the RIGHT on mobile and laptop */}
          <div className="col-span-5 sm:col-span-5 lg:col-span-5 flex justify-end lg:row-span-2">
            <PunkShowcase />
          </div>

          {/* Terminal Prompt: Full width under top section on mobile, left column bottom on laptop */}
          <div className="col-span-12 lg:col-span-7 mt-3 sm:mt-5 lg:mt-0">
            <TerminalPrompt />
          </div>

        </div>

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
    "PACE PUNKS OPERATIONAL KERNEL V1.0.4 - [ONLINE]",
    "TYPE 'JOIN' TO REGISTER FOR EARLY ACCESS WAITLIST",
    "TYPE 'EPOCHS' OR 'HELP' FOR SYSTEM COMMAND MATRIX.",
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
        `[+] STATUS: 200 OK - RECORD SECURED IN DATABASE.`,
        `[+] ASSIGNED QUEUE NUMBER: #${Number(entry.queueNumber).toLocaleString()} / 6,000`,
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
          "  GAME / PLAY      : LAUNCH CORRIDOR RUN ARCADE MINI GAME",
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
                `QUEUE STANDING : #${Number(data.entry.queueNumber).toLocaleString()} / 6,000`,
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
          `[>>>] INITIALIZING CORRIDOR RUN MINI GAME SIMULATION...`,
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
      className="flex flex-col gap-2 text-sm md:text-base cursor-text font-mono" 
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-col gap-1.5 overflow-y-auto min-h-[110px] sm:min-h-[160px] max-h-[380px] pr-2 scrollbar-none">
        {history.map((line, i) => (
          <div key={i} className="leading-relaxed whitespace-pre-wrap select-text">
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-4 pt-2 border-t border-bbs/20">
        <span className="select-none font-bold text-bbs shrink-0">
          {mode === "AWAITING_EMAIL" ? "EMAIL:\\>" : "C:\\>"}
        </span>
        <input 
          ref={inputRef}
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === "AWAITING_EMAIL" ? "ENTER YOUR EMAIL ADDRESS TO JOIN WAITLIST" : "TYPE 'JOIN' OR 'EPOCHS'..."}
          className="flex-1 bg-transparent text-bbs border-none focus:outline-none focus:ring-0 p-0 m-0 uppercase w-full placeholder:text-bbs/30"
          autoFocus
          spellCheck={false}
        />
        <span className="bg-bbs w-2 h-5 inline-block shrink-0"></span>
      </form>

      {/* Mobile-Friendly Quick Command Chips */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-bbs/20 text-[10px] sm:text-xs">
        <span className="text-bbs/60">&gt; QUICK:</span>
        <button
          type="button"
          onClick={() => { setInput("JOIN"); inputRef.current?.focus(); }}
          className="px-2 py-0.5 border border-bbs/50 text-bbs hover:bg-bbs hover:text-black transition-colors cursor-pointer"
        >
          [JOIN]
        </button>
        <button
          type="button"
          onClick={() => router.push("/epochs")}
          className="px-2 py-0.5 border border-bbs/50 text-bbs hover:bg-bbs hover:text-black transition-colors cursor-pointer"
        >
          [EPOCHS]
        </button>
        <button
          type="button"
          onClick={() => router.push("/game")}
          className="px-2 py-0.5 border border-bbs/50 text-bbs hover:bg-bbs hover:text-black transition-colors cursor-pointer"
        >
          [GAME]
        </button>
        <button
          type="button"
          onClick={() => router.push("/collection")}
          className="px-2 py-0.5 border border-bbs/50 text-bbs hover:bg-bbs hover:text-black transition-colors cursor-pointer"
        >
          [COLLECTION]
        </button>
      </div>
    </div>
  );
}

function PunkShowcase() {
  const [punkIndex, setPunkIndex] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);
  const [telemetry, setTelemetry] = useState<string | null>(null);
  const punks = ["0008", "0014", "0016", "0042", "0096"];

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Trigger buffer desync / CRT scan wipe
      setIsGlitching(true);
      const hex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0");
      setTelemetry(`SYNC_0x${hex}...`);

      // 2. Switch character midway through scan wipe
      const switchTimer = setTimeout(() => {
        setPunkIndex((prev) => (prev + 1) % punks.length);
        setTelemetry(null);
      }, 220);

      // 3. Stabilize signal
      const endTimer = setTimeout(() => {
        setIsGlitching(false);
      }, 480);

      return () => {
        clearTimeout(switchTimer);
        clearTimeout(endTimer);
      };
    }, 4000);

    return () => clearInterval(interval);
  }, [punks.length]);

  return (
    <div className="relative w-full max-w-[170px] xs:max-w-[200px] sm:max-w-[280px] lg:max-w-[380px] aspect-square flex items-center justify-center">
      {/* Subtle dark grounding shadow under feet - NO white glow */}
      <div className="absolute -bottom-2 inset-x-10 h-8 bg-black/70 blur-xl pointer-events-none -z-10" />

      {/* Main Image Frame with deep circular radial mask fade to eliminate all box edges */}
      <div 
        className={`relative w-full h-full overflow-hidden transition-all duration-150 ${
          isGlitching ? 'brightness-125 contrast-125 filter hue-rotate-15' : 'brightness-100 contrast-100'
        }`}
        style={{
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 34%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.3) 66%, rgba(0,0,0,0) 78%)",
          maskImage: "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 34%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.3) 66%, rgba(0,0,0,0) 78%)"
        }}
      >
        {punks.map((punk, idx) => (
          <img 
            key={punk}
            src={`/punks/${punk}.webp`} 
            alt={`Punk #${punk}`} 
            style={{
              filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.6))"
            }}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-200 ${
              idx === punkIndex ? 'opacity-100' : 'opacity-0'
            } ${isGlitching ? 'scale-[1.01]' : 'scale-100'}`} 
          />
        ))}

        {/* CRT Scan Wipe Laser Beam during character switch */}
        {isGlitching && (
          <>
            <div className="absolute left-0 right-0 h-6 bg-bbs/30 shadow-[0_0_25px_var(--color-bbs)] border-b-2 border-bbs animate-scan-wipe z-40 pointer-events-none" />
            <div 
              className="absolute inset-0 pointer-events-none z-35 glitch-slice-1 mix-blend-screen bg-bbs/15" 
              style={{ clipPath: 'polygon(0 25%, 100% 25%, 100% 48%, 0 48%)' }} 
            />
            <div 
              className="absolute inset-0 pointer-events-none z-35 glitch-slice-2 mix-blend-screen bg-bbs/15" 
              style={{ clipPath: 'polygon(0 62%, 100% 62%, 100% 82%, 0 82%)' }} 
            />
          </>
        )}

        {/* Smooth circular vignette overlay perfectly merging into background color */}
        <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_32%,var(--background)_76%)]" />

        {/* Authentic subtle scanline overlay */}
        <div className="absolute inset-0 z-25 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.18)_50%)] bg-[length:100%_4px]" />
      </div>

      {/* Subtle Retro BBS HUD telemetry tag */}
      <div className={`absolute top-0 left-0 z-30 font-mono text-[9px] xs:text-[10px] sm:text-xs px-1 border transition-colors duration-150 backdrop-blur-xs ${
        isGlitching 
          ? 'bg-bbs text-background border-bbs font-bold shadow-[0_0_10px_var(--color-bbs)]' 
          : 'bg-background/80 text-bbs border-bbs/30'
      }`}>
        + {telemetry || `BUFFER_${punks[punkIndex]}`}
      </div>
    </div>
  );
}
