"use client";

import { useEffect, useRef } from "react";

export function PixelBlockBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const SIZE = 10; // Exact 10px size
    const GAP = 2;   // Exact 2px gap
    const STEP = SIZE + GAP; // 12px cell pitch

    const BASE_BG = "#17132c";
    const SLATE_BLOCKS = [
      "#261f3f",
      "#2e254c",
      "#382d5a",
      "#42366b",
      "#4c3e7b",
      "#58488d",
    ];

    // Seeded random pseudo generator so grid stays completely stable and sticky across scrolls/renders
    const seededRandom = (x: number, y: number) => {
      const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
      return s - Math.floor(s);
    };

    const drawGrid = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);

      // 1. Draw solid background
      ctx.fillStyle = BASE_BG;
      ctx.fillRect(0, 0, w, h);

      // 2. Soft top spotlight gradient
      const grad = ctx.createRadialGradient(
        w * 0.5, h * 0.38, 50,
        w * 0.5, h * 0.38, Math.max(w, h) * 0.85
      );
      grad.addColorStop(0, "rgba(42, 34, 70, 0.6)");
      grad.addColorStop(1, "rgba(23, 19, 44, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Calculate scroll offset to tie grid directly to page scroll
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const offsetY = -(scrollY % STEP);

      // 3. Subtle crisp grid lines (1px)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += STEP) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
      }
      for (let y = offsetY; y <= h + STEP; y += STEP) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
      }
      ctx.stroke();

      // 4. Rich volume of pixel blocks (seeded by global row to stick with scroll)
      const cols = Math.ceil(w / STEP);
      const rows = Math.ceil(h / STEP) + 2;
      const startRow = Math.floor(scrollY / STEP);

      for (let r = -1; r <= rows; r++) {
        const globalRow = startRow + r;
        const screenY = r * STEP + offsetY;
        for (let c = 0; c < cols; c++) {
          const val = seededRandom(c, globalRow);
          if (val < 0.32) {
            const colorIdx = Math.floor(seededRandom(c + 100, globalRow + 100) * SLATE_BLOCKS.length);
            ctx.fillStyle = SLATE_BLOCKS[colorIdx];
            ctx.fillRect(c * STEP, screenY, SIZE, SIZE);
          }
        }
      }
    };

    drawGrid();

    const onScroll = () => {
      requestAnimationFrame(drawGrid);
    };

    const onResize = () => drawGrid();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden w-full h-full"
      style={{
        backgroundColor: "#17132c",
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          imageRendering: "pixelated",
          opacity: 0.65, // Restored previous rich pixel volume
        }}
      />
    </div>
  );
}
