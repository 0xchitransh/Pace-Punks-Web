"use client";

import { useEffect, useState } from "react";

export function CityBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      className="fixed inset-0 z-0 pointer-events-none opacity-25 mix-blend-screen"
      style={{
        backgroundImage: `url('/bg/Buildings%201.png')`,
        backgroundPosition: `${scrollY * -0.25}px bottom`,
        backgroundRepeat: 'repeat-x',
        backgroundSize: 'auto clamp(380px, 58vh, 520px)',
        imageRendering: 'pixelated'
      }}
    />
  );
}
