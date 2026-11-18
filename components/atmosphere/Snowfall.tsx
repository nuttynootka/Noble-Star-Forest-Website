"use client";

import { useEffect, useRef } from "react";

interface Flake {
  x: number;
  y: number;
  r: number;
  vy: number;
  sway: number;
  freq: number;
  phase: number;
  alpha: number;
}

function makeSprite(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 16;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, "rgba(255, 255, 255, 1)");
  grad.addColorStop(0.45, "rgba(248, 252, 255, 0.85)");
  grad.addColorStop(1, "rgba(255, 255, 255, 0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 16);
  return c;
}

export function Snowfall({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const sprite = makeSprite();
    let w = 0;
    let h = 0;
    let flakes: Flake[] = [];
    let raf = 0;
    let last = 0;

    const makeFlake = (randomY: boolean): Flake => {
      const depth = Math.random();
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -8,
        r: 0.7 + depth * 1.35,
        vy: 14 + depth * 32,
        sway: 4 + (1 - depth) * 8 + Math.random() * 5,
        freq: 0.4 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.28 + depth * 0.56,
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const nw = Math.round(rect.width);
      const nh = Math.round(rect.height);
      if (!nw || !nh) return;
      if (Math.abs(nw - w) < 2 && Math.abs(nh - h) < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(nw * dpr);
      canvas.height = Math.round(nh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      w = nw;
      h = nh;
      const target = Math.round(Math.min(260, Math.max(110, (w * h) / 4800)));
      if (flakes.length === 0) {
        flakes = Array.from({ length: target }, () => makeFlake(true));
      } else {
        for (const f of flakes) {
          if (f.x > w + 12) f.x = Math.random() * w;
        }
        while (flakes.length < target) flakes.push(makeFlake(true));
        if (flakes.length > target) flakes.length = target;
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      ctx.clearRect(0, 0, w, h);

      for (const f of flakes) {
        f.phase += dt * f.freq;
        f.y += f.vy * dt;
        if (f.y > h + 8) Object.assign(f, makeFlake(false));
        const fx = f.x + Math.sin(f.phase) * f.sway;
        const size = f.r * 2.4;
        ctx.globalAlpha = f.alpha;
        ctx.drawImage(sprite, fx - size / 2, f.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    const play = () => { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); } };
    const pause = () => { cancelAnimationFrame(raf); raf = 0; };
    const onVis = () => (document.hidden ? pause() : play());

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    resize();
    play();
    return () => {
      pause();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ height: "100lvh" }}
      className={`pointer-events-none block w-full ${className}`}
    />
  );
}
