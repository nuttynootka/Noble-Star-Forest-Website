"use client";

import { useEffect, useRef } from "react";

interface Flake {
  x: number;
  y: number;
  vx: number;
  vyExtra: number;
  r: number;
  vy: number;
  sway: number;
  freq: number;
  phase: number;
  alpha: number;
  depth: number;
}

export function Snowfall({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mq?.matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0, h = 0, flakes: Flake[] = [], raf = 0, last = 0, visible = true;
    const air = { x: 0, y: 0, vx: 0, vy: 0, strength: 0, prevX: 0, prevY: 0, hasPrev: false };

    const makeFlake = (randomY: boolean): Flake => {
      const depth = Math.random();
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -6,
        vx: 0,
        vyExtra: 0,
        r: 0.65 + depth * 1.9,
        vy: 12 + depth * 32,
        sway: 6 + (1 - depth) * 10 + Math.random() * 6,
        freq: 0.45 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.18 + depth * 0.44,
        depth,
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(130, Math.max(36, (w * h) / 14000)));
      flakes = Array.from({ length: count }, () => makeFlake(true));
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      if (air.strength > 0.01) {
        air.strength *= Math.exp(-3.2 * dt);
        air.vx *= Math.exp(-3.5 * dt);
        air.vy *= Math.exp(-3.5 * dt);
      } else {
        air.strength = 0;
      }

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#CADFE9";
      const radius = 135;
      const drag = Math.exp(-2.4 * dt);

      for (const f of flakes) {
        f.phase += dt * f.freq;
        const baseX = f.x + Math.sin(f.phase) * f.sway;
        if (air.strength > 0.01) {
          const dx = baseX - air.x;
          const dy = f.y - air.y;
          const dist = Math.hypot(dx, dy);
          if (dist < radius && dist > 1) {
            const falloff = 1 - dist / radius;
            const force = falloff * falloff * air.strength * (0.45 + f.depth * 0.75);
            f.vx += (air.vx * 0.22 + (dx / dist) * 28) * force * dt;
            f.vyExtra += (air.vy * 0.16 + (dy / dist) * 18) * force * dt;
          }
        }
        f.vx *= drag;
        f.vyExtra *= drag;
        f.x += f.vx * dt;
        f.y += (f.vy + f.vyExtra) * dt;
        if (f.x < -20) f.x = w + 18;
        else if (f.x > w + 20) f.x = -18;
        if (f.y > h + 8) Object.assign(f, makeFlake(false));

        const drawX = f.x + Math.sin(f.phase) * f.sway;
        ctx.globalAlpha = f.alpha;
        ctx.beginPath();
        ctx.arc(drawX, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    const play = () => {
      if (raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const pause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const feed = (x: number, y: number) => {
      if (air.hasPrev) {
        const dx = Math.max(-45, Math.min(45, x - air.prevX));
        const dy = Math.max(-45, Math.min(45, y - air.prevY));
        air.vx = air.vx * 0.5 + dx * 12;
        air.vy = air.vy * 0.5 + dy * 10;
        air.strength = Math.min(1, air.strength + Math.hypot(dx, dy) * 0.025);
      }
      air.x = x; air.y = y; air.prevX = x; air.prevY = y; air.hasPrev = true;
    };

    const onPM = (e: PointerEvent) => feed(e.clientX, e.clientY);
    const onTM = (e: TouchEvent) => { if (e.touches[0]) feed(e.touches[0].clientX, e.touches[0].clientY); };
    const onPE = () => { air.hasPrev = false; };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) play(); else pause();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pointermove", onPM, { passive: true });
    window.addEventListener("touchmove", onTM, { passive: true });
    window.addEventListener("pointerup", onPE, { passive: true });
    window.addEventListener("touchend", onPE, { passive: true });

    resize();
    play();
    return () => {
      pause();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onPM);
      window.removeEventListener("touchmove", onTM);
      window.removeEventListener("pointerup", onPE);
      window.removeEventListener("touchend", onPE);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none block h-full w-full ${className}`} />;
}
