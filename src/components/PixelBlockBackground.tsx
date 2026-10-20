"use client";

import { useEffect, useRef } from "react";

/**
 * Port of the "LED Matrix" background used on https://pixel-block.framer.website/
 *
 * Same settings as the reference page:
 *   shape: Square, size: 10px, gap: 2px, speed: 80, accent amount: 4%
 *   accent (4% of cells): #17132c, secondary (96% of cells): #ffd76f
 *   the canvas layer is fixed to the viewport at 5% opacity over a #17132c page
 */
const SIZE = 10;
const GAP = 2;
const ANIM_SPEED = 80;
const PROBABILITY = 4; // percent
const ACCENT = "#17132c";
const SECONDARY = "#ffd76f";
const LAYER_OPACITY = 0.05;
const PAGE_BG = "#17132c";

// Same timing range as the original component: 0 .. (10099.9 - 99.9 * speed) ms
const TIMING_RANGE = -99.9 * ANIM_SPEED + 10099.9;

type Cell = {
  x: number;
  y: number;
  delay: number;
  duration: number;
  startTime: number;
  color: string;
};

const pickColor = () => (Math.random() < PROBABILITY / 100 ? ACCENT : SECONDARY);

export function PixelBlockBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cells: Cell[] = [];
    let rafId = 0;

    const buildCells = (width: number, height: number) => {
      const next: Cell[] = [];
      const now = performance.now();
      for (let y = 0; y < height; y += SIZE + GAP) {
        for (let x = 0; x < width; x += SIZE + GAP) {
          next.push({
            x,
            y,
            delay: Math.random() * TIMING_RANGE,
            duration: Math.random() * TIMING_RANGE,
            startTime: now + Math.random() * 5000,
            color: pickColor(),
          });
        }
      }
      return next;
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cells = buildCells(canvas.width, canvas.height);
    };

    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = performance.now();
      for (const cell of cells) {
        if (now - cell.startTime > cell.delay + cell.duration) {
          cell.startTime = now + cell.delay;
          cell.color = pickColor();
        }
        ctx.fillStyle = cell.color;
        ctx.fillRect(cell.x, cell.y, SIZE, SIZE);
      }
      rafId = requestAnimationFrame(frame);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-0 pointer-events-none overflow-hidden"
      style={{ height: "100vh", backgroundColor: PAGE_BG }}
    >
      <div style={{ width: "100%", height: "100%", opacity: LAYER_OPACITY }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
    </div>
  );
}
