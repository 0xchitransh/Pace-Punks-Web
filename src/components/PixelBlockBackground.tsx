"use client";

import { useEffect, useRef } from "react";

export function PixelBlockBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const SIZE = 6;
    const GAP = 1;
    const STEP = SIZE + GAP;

    const BASE_BG = "#17132c";
    const BLOCK_COLOR = "#231d3c";

    // Seeded random — determines WHICH cells have a block (never changes)
    const seededRandom = (x: number, y: number) => {
      const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
      return s - Math.floor(s);
    };

    // Per-block blink state: countdown timer until next toggle
    type BlockState = { visible: boolean; countdown: number };
    const blockStates = new Map<string, BlockState>();

    let animFrameId: number;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let frameCount = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    resize();

    const getOrCreate = (key: string, seed: number): BlockState => {
      if (!blockStates.has(key)) {
        // Randomize initial visibility and give each block a different countdown
        // so they don't all blink at the same time
        const startVisible = seed > 0.5;
        // countdown in frames: 60–400 frames (1s–6.5s at 60fps)
        const countdown = Math.floor(60 + seed * 340);
        blockStates.set(key, { visible: startVisible, countdown });
      }
      return blockStates.get(key)!;
    };

    const draw = () => {
      frameCount++;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 1. Solid background
      ctx.fillStyle = BASE_BG;
      ctx.fillRect(0, 0, w, h);

      const scrollY = window.scrollY || 0;
      const offsetY = -(scrollY % STEP);
      const cols = Math.ceil(w / STEP) + 1;
      const rows = Math.ceil(h / STEP) + 2;
      const startRow = Math.floor(scrollY / STEP);

      // 2. Draw pixel blocks — all same color, just toggling on/off
      ctx.fillStyle = BLOCK_COLOR;
      for (let r = -1; r <= rows; r++) {
        const globalRow = startRow + r;
        const screenY = r * STEP + offsetY;
        for (let c = 0; c < cols; c++) {
          const val = seededRandom(c, globalRow);
          if (val < 0.30) {
            const key = `${c},${globalRow}`;
            const state = getOrCreate(key, seededRandom(c + 500, globalRow + 500));

            // Tick countdown
            state.countdown--;
            if (state.countdown <= 0) {
              // Toggle visibility, reset with a new random duration
              state.visible = !state.visible;
              // visible blocks stay on longer (2s–8s), hidden blocks are off shorter (0.5s–3s)
              const seed2 = seededRandom(c + frameCount * 0.001, globalRow);
              state.countdown = state.visible
                ? Math.floor(120 + seed2 * 360) // 2s–8s on
                : Math.floor(30 + seed2 * 150);  // 0.5s–3s off
            }

            if (state.visible) {
              ctx.fillRect(c * STEP, screenY, SIZE, SIZE);
            }
          }
        }
      }

      // 3. Subtle grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
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

      animFrameId = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden w-full h-full"
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
