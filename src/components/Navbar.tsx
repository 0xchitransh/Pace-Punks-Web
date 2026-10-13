"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";

const brandColors = [
  { name: "CREAM", hex: "#f7ebc9" },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--bbs-color", themeColor);
  }, [themeColor]);

  // Close mobile menu when navigating to another route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const links = [
    { href: "/", label: "HOME", key: "1" },
    { href: "/epochs", label: "EPOCHS", key: "2" },
  ];

  return (
    <nav className="w-full bg-transparent text-bbs relative z-50">
      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 flex-nowrap">
        
        {/* Logo / Header */}
        <Link href="/" className="flex items-center gap-2.5 hover:text-[#fff] transition-colors whitespace-nowrap shrink-0">
          <img
            src="/logo.jpg"
            alt="Pace Punks"
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain pixelated rounded-sm"
          />
          <span className="text-base sm:text-lg font-bold font-display tracking-normal text-[#f7ebc9] hidden xs:inline sm:inline">PACE PUNKS</span>
        </Link>

        {/* Desktop / Tablet Center Links - Embedded Pixel Block Style */}
        <div className="hidden md:flex items-center gap-3 lg:gap-6 justify-center whitespace-nowrap shrink-0">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-mono tracking-wider transition-all px-2.5 py-1 ${
                  isActive
                    ? "text-[#17132c] bg-[#ffd76f] font-bold"
                    : "text-[#b9b3c9] hover:text-[#f7ebc9] hover:bg-[#231d3c]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Action / Settings */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0 whitespace-nowrap">
          {/* Color Switcher */}
          <div className="relative border border-[#504364] bg-[#231d3c] px-2 py-1 text-[11px] sm:text-xs flex items-center">
             <span className="mr-1 text-[#b9b3c9] hidden sm:inline">CLR:</span>
             <select 
               value={themeColor} 
               onChange={(e) => setThemeColor(e.target.value)}
               className="bg-transparent text-[#f7ebc9] outline-none appearance-none cursor-pointer pr-3.5 uppercase font-mono max-w-[70px] sm:max-w-none text-xs"
             >
               {brandColors.map((color) => (
                 <option key={color.hex} value={color.hex} className="bg-[#17132c] text-[#f7ebc9]">{color.name}</option>
               ))}
             </select>
             <span className="absolute right-1.5 pointer-events-none text-[8px] text-[#b9b3c9]">▼</span>
          </div>

          {/* Web3 Wallet Connect Button */}
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
                  className="flex items-center gap-1.5"
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="pb-btn-primary px-3 sm:px-4 py-1 text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          <span className="hidden xs:inline">CONNECT WALLET</span>
                          <span className="xs:hidden">CONNECT</span>
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="bg-red-600 text-white font-mono px-2 py-1 text-xs font-bold border border-red-500 uppercase cursor-pointer"
                        >
                          WRONG NET
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 font-mono text-[11px] sm:text-xs lg:text-sm">
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="border border-bbs text-bbs bg-background px-1.5 sm:px-2 py-0.5 flex items-center gap-0.5 sm:gap-1 hover:bg-bbs hover:text-black transition-colors cursor-pointer uppercase tracking-wider hidden sm:flex"
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
                          className="border border-bbs text-bbs bg-background px-1.5 sm:px-2 py-0.5 flex items-center gap-1 hover:bg-bbs hover:text-black transition-colors cursor-pointer text-xs"
                        >
                          <span>{account.displayName}</span>
                          <span className="text-[9px] opacity-80">▼</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            aria-label="Toggle Navigation Menu"
            className="md:hidden border border-bbs bg-background text-bbs px-2 py-0.5 text-xs font-bold hover:bg-bbs hover:text-black transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
          >
            {mobileMenuOpen ? "[✕ CLOSE]" : "[☰ MENU]"}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-bbs bg-background/98 backdrop-blur-md px-3 py-3 shadow-[0_10px_25px_var(--color-bbs-dim)] animate-fadeIn">
          <div className="text-[10px] text-bbs/60 mb-2 border-b border-bbs/30 pb-1 flex justify-between">
            <span>&gt;&gt; SYSTEM DIRECTORY</span>
            <span>VER: 1.0.4</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 border text-xs tracking-wider transition-colors ${
                    isActive
                      ? "bg-bbs text-black font-bold border-bbs shadow-[0_0_12px_var(--color-bbs-dim)]"
                      : "bg-background/80 text-bbs border-bbs/30 hover:border-bbs hover:bg-bbs/10"
                  }`}
                >
                  <span className="font-bold">[{link.key}] {link.label}</span>
                  <span className="text-[10px] opacity-75">{isActive ? "[ACTIVE]" : "→"}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-3 pt-2 border-t border-bbs/20 flex justify-between items-center text-[10px] text-bbs/70">
            <span>NODE: ONLINE</span>
            <span>TAP TO SWITCH ROUTE</span>
          </div>
        </div>
      )}
    </nav>
  );
}
