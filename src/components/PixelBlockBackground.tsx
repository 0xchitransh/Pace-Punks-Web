"use client";

import { useEffect, useRef } from "react";

export function PixelBlockBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const CELL_SIZE = 24; // 24px grid squares matching pixel-block.framer.website

    // Authentic dark palette from pixel-block tokens
    const BASE_BG = "#17132c";
    const GRID_LINE = "rgba(255, 255, 255, 0.045)"; // Soft, crisp 1px grid line

    const BLOCK_SHADES = [
      "#494360", // Inspected slate-purple token
      "#504364", // Token --token-1b09d492
      "#231d3c", // Token --token-dfb5dc4e
      "#2c2446", // Dark indigo block
      "#382f55", // Highlight block
    ];

    interface PixelBlock {
      col: number;
      row: number;
      color: string;
      delay: number;
      duration: number;
      lastChange: number;
    }

    let blocks: PixelBlock[] = [];

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
      const cols = Math.ceil(w / CELL_SIZE);
      const rows = Math.ceil(h / CELL_SIZE);

      // Gentle ~5% density of scattered blocks across the uniform grid
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() * 100 < 5.5) {
            blocks.push({
              col: c,
              row: r,
              color: BLOCK_SHADES[Math.floor(Math.random() * BLOCK_SHADES.length)],
              delay: Math.random() * 12000,
              duration: 5000 + Math.random() * 7000,
              lastChange: performance.now() + Math.random() * 6000,
            });
          }
        }
      }
    };

    let lastDraw = 0;
    const INTERVAL = 1000 / 15; // 15 FPS calm, smooth ambient refresh

    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      if (now - lastDraw < INTERVAL) return;
      lastDraw = now;

      // 1. Draw base deep purple canvas
      ctx.fillStyle = BASE_BG;
      ctx.fillRect(0, 0, width, height);

      // 2. Soft radial center glow (spotlight effect behind the content)
      const grad = ctx.createRadialGradient(
        width * 0.5, height * 0.38, 50,
        width * 0.5, height * 0.38, Math.max(width, height) * 0.75
      );
      grad.addColorStop(0, "rgba(35, 29, 60, 0.45)");
      grad.addColorStop(0.7, "rgba(23, 19, 44, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 3. Draw visible grid lines across the entire canvas
      ctx.strokeStyle = GRID_LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x += CELL_SIZE) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
      }
      for (let y = 0; y <= height; y += CELL_SIZE) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
      }
      ctx.stroke();

      // 4. Draw the scattered dark slate pixel blocks inside grid cells
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];

        if (now - b.lastChange > b.duration + b.delay) {
          b.lastChange = now;
          b.delay = Math.random() * 10000;
          b.duration = 5000 + Math.random() * 7000;
          b.color = BLOCK_SHADES[Math.floor(Math.random() * BLOCK_SHADES.length)];
        }

        ctx.fillStyle = b.color;
        ctx.fillRect(
          b.col * CELL_SIZE + 1,
          b.row * CELL_SIZE + 1,
          CELL_SIZE - 1,
          CELL_SIZE - 1
        );
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
      style={{ backgroundColor: "#17132c" }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
