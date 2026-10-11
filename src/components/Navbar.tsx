"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";

const brandColors = [
  { name: "CREAM", hex: "#FFF3DE" },
  { name: "CLASSIC GREEN", hex: "#33ff33" },
  { name: "AMBER", hex: "#FFB000" },
  { name: "BLUE", hex: "#8C7CFF" },
  { name: "CYAN", hex: "#00FFFF" },
  { name: "CRIMSON", hex: "#FF3333" },
  { name: "MAGENTA", hex: "#FF00FF" },
  { name: "ELECTRIC PURPLE", hex: "#B026FF" },
  { name: "ICE BLUE", hex: "#A0F0FF" },
  { name: "SUNSET", hex: "#FF7A3D" },
  { name: "NEON PINK", hex: "#FF4FA3" },
  { name: "AQUA PULSE", hex: "#3EE6D2" },
  { name: "GOLD", hex: "#FFC93D" },
];

export function Navbar() {
  const pathname = usePathname();
  const [themeColor, setThemeColor] = useState(brandColors[0].hex);

  useEffect(() => {
    document.documentElement.style.setProperty("--bbs-color", themeColor);
  }, [themeColor]);

  const links = [
    { href: "/", label: "HOME", key: "1" },
    { href: "/epochs", label: "EPOCHS", key: "2" },
    { href: "/collection", label: "COLLECTION", key: "3" },
    { href: "/how-it-works", label: "HOW TO PLAY", key: "4" },
    { href: "/game", label: "GAME", key: "5" },
  ];

  return (
    <nav className="w-full bg-background border-b-2 border-bbs text-bbs font-mono tracking-wider relative z-50">
      <div className="max-w-[1500px] mx-auto px-3 md:px-5 h-14 flex items-center justify-between gap-3 flex-nowrap overflow-x-auto scrollbar-none">
        
        {/* Logo / Header */}
        <Link href="/" className="flex items-center gap-2 hover:text-[#fff] transition-colors whitespace-nowrap shrink-0">
          <span className="text-lg md:text-xl font-bold hidden sm:block">{'<PACE_PUNKS.SYS>'}</span>
          <span className="text-lg font-bold sm:hidden">{'<PPS>'}</span>
        </Link>

        {/* Center Links - BBS Menu Style */}
        <div className="hidden md:flex items-center gap-2.5 lg:gap-4 xl:gap-6 justify-center whitespace-nowrap shrink-0">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs lg:text-sm transition-colors py-0.5 ${
                  isActive
                    ? "text-black bg-bbs px-1.5 font-bold"
                    : "text-bbs hover:text-[#fff]"
                }`}
              >
                [{link.key}] {link.label}
              </Link>
            );
          })}
        </div>

        {/* Action / Settings */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0 whitespace-nowrap">
          <div className="relative border border-bbs px-2 py-0.5 text-xs lg:text-sm flex items-center">
             <span className="mr-1.5 opacity-80">COLOR:</span>
             <select 
               value={themeColor} 
               onChange={(e) => setThemeColor(e.target.value)}
               className="bg-background text-bbs outline-none appearance-none cursor-pointer pr-3.5 uppercase font-mono"
             >
               {brandColors.map((color) => (
                 <option key={color.hex} value={color.hex} className="bg-background text-foreground">{color.name}</option>
               ))}
             </select>
             <span className="absolute right-1.5 pointer-events-none text-[10px]">▼</span>
          </div>

          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== "loading";
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === "authenticated");

              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                  className="flex items-center gap-1.5 lg:gap-2"
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="bg-bbs text-black font-mono px-2.5 py-0.5 text-xs lg:text-sm font-bold border border-bbs hover:bg-black hover:text-bbs transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          CONNECT WALLET
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="bg-red-600 text-white font-mono px-2 py-0.5 text-xs lg:text-sm font-bold border border-red-500 uppercase cursor-pointer"
                        >
                          WRONG NETWORK
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-1.5 lg:gap-2 font-mono text-xs lg:text-sm">
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="border border-bbs text-bbs bg-background px-2 py-0.5 flex items-center gap-1 hover:bg-bbs hover:text-black transition-colors cursor-pointer uppercase tracking-wider"
                        >
                          {chain.hasIcon && chain.iconUrl && (
                            <img
                              alt={chain.name ?? "Chain"}
                              src={chain.iconUrl}
                              className="w-3.5 h-3.5 mr-0.5 inline-block"
                            />
                          )}
                          <span>{chain.name}</span>
                          <span className="text-[10px] ml-0.5 opacity-80">▼</span>
                        </button>

                        <button
                          onClick={openAccountModal}
                          type="button"
                          className="border border-bbs text-bbs bg-background px-2 py-0.5 flex items-center gap-1.5 hover:bg-bbs hover:text-black transition-colors cursor-pointer"
                        >
                          {account.displayBalance ? (
                            <span className="opacity-90">{account.displayBalance} |</span>
                          ) : null}
                          <span>{account.displayName}</span>
                          <span className="text-[10px] opacity-80">▼</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>

      </div>
    </nav>
  );
}
