"use client";

import { useEffect, useRef } from "react";

export function PixelBlockBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const SIZE = 6;   // block size
    const GAP = 1;    // gap between blocks
    const STEP = SIZE + GAP; // 7px cell pitch

    // Exact colors from pixel-block.framer.website CSS tokens:
    const BASE_BG = "#17132c";  // --token-e0c1c505 = #17132c

    // Single block color — same shade as reference site
    const BLOCK_COLOR = "#231d3c";

    // Seeded random – stays stable across scroll/renders
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

      // 1. Draw solid dark background
      ctx.fillStyle = BASE_BG;
      ctx.fillRect(0, 0, w, h);

      // Calculate scroll offset to lock grid to page scroll
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const offsetY = -(scrollY % STEP);

      // 2. Draw pixel blocks first (below grid lines)
      const cols = Math.ceil(w / STEP) + 1;
      const rows = Math.ceil(h / STEP) + 2;
      const startRow = Math.floor(scrollY / STEP);

      for (let r = -1; r <= rows; r++) {
        const globalRow = startRow + r;
        const screenY = r * STEP + offsetY;
        for (let c = 0; c < cols; c++) {
          const val = seededRandom(c, globalRow);
          // ~30% density – matches reference site
          if (val < 0.30) {
            ctx.fillStyle = BLOCK_COLOR;
            ctx.fillRect(c * STEP, screenY, SIZE, SIZE);
          }
        }
      }

      // 3. Very subtle grid lines (matching reference's faint grid)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w + STEP; x += STEP) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
      }
      for (let y = offsetY; y <= h + STEP; y += STEP) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
      }
      ctx.stroke();
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
          opacity: 1,
        }}
      />
    </div>
  );
}
