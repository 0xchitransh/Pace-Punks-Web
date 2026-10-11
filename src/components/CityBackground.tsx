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
      className="fixed inset-0 z-0 pointer-events-none opacity-30 mix-blend-screen"
      style={{
        // One building skyline layer plus sky, scaled responsively for both mobile and laptop
        backgroundImage: `
          url('/bg/Buildings%201.png'),
          url('/bg/Sky.png')
        `,
        backgroundPosition: `
          ${scrollY * -0.25}px bottom,
          center center
        `,
        backgroundRepeat: 'repeat-x, no-repeat',
        backgroundSize: 'auto clamp(380px, 58vh, 520px), cover',
        imageRendering: 'pixelated'
      }}
    />
  );
}
