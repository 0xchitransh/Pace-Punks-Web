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
        // Only one building skyline layer plus sky
        backgroundImage: `
          url('/bg/Buildings%201.png'),
          url('/bg/Sky.png')
        `,
        backgroundPosition: `
          ${scrollY * -0.25}px bottom,
          center center
        `,
        backgroundRepeat: 'repeat-x, no-repeat',
        backgroundSize: 'auto 280px, cover',
        imageRendering: 'pixelated'
      }}
    />
  );
}
