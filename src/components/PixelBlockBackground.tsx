"use client";

import { useEffect, useRef } from "react";

export function PixelBlockBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const size = 18;
    const gap = 2;
    const step = size + gap; // 20px

    // Palette extracted directly from pixel-block.framer.website tokens
    const blockShades = [
      "#494360", // Token --token-dd3cbe28-4964-42d1-96bc-59d71d203094
      "#504364", // Token --token-1b09d492-1150-4936-8ffb-6d3f1ab8c961
      "#231d3c", // Token --token-dfb5dc4e-10ba-49a8-b2b6-968568d0cba4
      "#2c2548", // Subtle transition tone
      "#383056", // Highlight slate tone
    ];

    interface Block {
      col: number;
      row: number;
      color: string;
      delay: number;
      duration: number;
      lastChange: number;
    }

    let blocks: Block[] = [];

    const init = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      width = w;
      height = h;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);

      blocks = [];
      const cols = Math.ceil(w / step);
      const rows = Math.ceil(h / step);

      // Low, elegant density (~6%) exactly matching pixel-block.framer.website
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() * 100 < 6) {
            blocks.push({
              col: c,
              row: r,
              color: blockShades[Math.floor(Math.random() * blockShades.length)],
              delay: Math.random() * 10000,
              duration: 4000 + Math.random() * 6000,
              lastChange: performance.now() + Math.random() * 5000,
            });
          }
        }
      }
    };

    let lastDraw = 0;
    const INTERVAL = 1000 / 18;

    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      if (now - lastDraw < INTERVAL) return;
      lastDraw = now;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (now - b.lastChange > b.duration + b.delay) {
          b.lastChange = now;
          b.delay = Math.random() * 8000;
          b.duration = 4000 + Math.random() * 6000;
          b.color = blockShades[Math.floor(Math.random() * blockShades.length)];
        }

        ctx.fillStyle = b.color;
        ctx.fillRect(b.col * step, b.row * step, size, size);
      }
    };

    init();
    animId = requestAnimationFrame(render);

    const onResize = () => init();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      style={{
        backgroundColor: "#17132c",
        backgroundImage: `
          radial-gradient(circle at 50% 38%, #221c38 0%, #17132c 70%, #120e23 100%),
          linear-gradient(to right, rgba(73, 67, 96, 0.22) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(73, 67, 96, 0.22) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 20px 20px, 20px 20px"
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
