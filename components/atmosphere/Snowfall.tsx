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

function makeSprite(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 24;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(12, 12, 0, 12, 12, 12);
  grad.addColorStop(0, "rgba(255, 252, 243, 1)");
  grad.addColorStop(0.45, "rgba(202, 223, 233, 0.78)");
  grad.addColorStop(1, "rgba(202, 223, 233, 0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 24, 24);
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
    let w = window.innerWidth;
    let h = window.innerHeight;
    let flakes: Flake[] = [];
    let raf = 0;
    let last = 0;

    const input = { x: 0, y: 0, dx: 0, dy: 0, puff: 0, prevX: 0, prevY: 0, hasPrev: false };

    const makeFlake = (randomY: boolean): Flake => {
      const depth = Math.random();
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -10,
        vx: 0,
        vyExtra: 0,
        r: 1.4 + depth * 3.2,
        vy: 14 + depth * 34,
        sway: 6 + (1 - depth) * 10 + Math.random() * 6,
        freq: 0.45 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.22 + depth * 0.46,
        depth,
      };
    };

    const resize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(nw * dpr);
      canvas.height = Math.round(nh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      w = nw;
      h = nh;
      const target = Math.round(Math.min(125, Math.max(40, (w * h) / 13000)));
      if (flakes.length === 0) {
        flakes = Array.from({ length: target }, () => makeFlake(true));
      } else {
        for (const f of flakes) {
          if (f.x > w + 16) f.x = Math.random() * w;
        }
        while (flakes.length < target) flakes.push(makeFlake(true));
        if (flakes.length > target) flakes.length = target;
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;

      const hasAir = input.puff > 0.01 || Math.abs(input.dx) > 0.2 || Math.abs(input.dy) > 0.2;
      const radius = 165;
      const drag = Math.exp(-2.1 * dt);

      ctx.clearRect(0, 0, w, h);

      for (const f of flakes) {
        f.phase += dt * f.freq;
        const drawX = f.x + Math.sin(f.phase) * f.sway;

        if (hasAir) {
          const rx = drawX - input.x;
          const ry = f.y - input.y;
          const dist = Math.hypot(rx, ry);
          if (dist < radius) {
            const k = 1 - dist / radius;
            const falloff = k * k * (0.45 + f.depth * 0.85);
            const nx = dist > 1 ? rx / dist : 0;
            const ny = dist > 1 ? ry / dist : -1;
            f.vx += (input.dx * 7.5 + nx * input.puff * 130) * falloff;
            f.vyExtra += (input.dy * 5.0 + ny * input.puff * 90) * falloff;
            f.vx = Math.max(-260, Math.min(260, f.vx));
            f.vyExtra = Math.max(-180, Math.min(180, f.vyExtra));
          }
        }

        f.vx *= drag;
        f.vyExtra *= drag;
        f.x += f.vx * dt;
        f.y += (f.vy + f.vyExtra) * dt;

        if (f.x < -20) f.x = w + 18;
        else if (f.x > w + 20) f.x = -18;
        if (f.y > h + 14) Object.assign(f, makeFlake(false));
        else if (f.y < -30) f.y = -10;

        const fx = f.x + Math.sin(f.phase) * f.sway;
        const size = f.r * 2.4;
        ctx.globalAlpha = f.alpha;
        ctx.drawImage(sprite, fx - size / 2, f.y - size / 2, size, size);
      }

      input.dx = 0;
      input.dy = 0;
      input.puff = 0;
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    const feedMove = (x: number, y: number) => {
      if (input.hasPrev) {
        input.dx += Math.max(-45, Math.min(45, x - input.prevX));
        input.dy += Math.max(-45, Math.min(45, y - input.prevY));
        input.puff = Math.min(1, input.puff + 0.14);
      }
      input.x = x;
      input.y = y;
      input.prevX = x;
      input.prevY = y;
      input.hasPrev = true;
    };

    const feedStart = (x: number, y: number) => {
      input.x = input.prevX = x;
      input.y = input.prevY = y;
      input.hasPrev = true;
      input.puff = 0.75;
    };

    const onPM = (e: PointerEvent) => { if (e.pointerType !== "touch") feedMove(e.clientX, e.clientY); };
    const onPD = (e: PointerEvent) => { if (e.pointerType !== "touch") feedStart(e.clientX, e.clientY); };
    const onTS = (e: TouchEvent) => { if (e.touches[0]) feedStart(e.touches[0].clientX, e.touches[0].clientY); };
    const onTM = (e: TouchEvent) => { if (e.touches[0]) feedMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onEnd = () => { input.hasPrev = false; };

    const play = () => { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); } };
    const pause = () => { cancelAnimationFrame(raf); raf = 0; };
    const onVis = () => (document.hidden ? pause() : play());

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pointermove", onPM, { passive: true });
    window.addEventListener("pointerdown", onPD, { passive: true });
    window.addEventListener("touchstart", onTS, { passive: true });
    window.addEventListener("touchmove", onTM, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });

    resize();
    play();
    return () => {
      pause();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onPM);
      window.removeEventListener("pointerdown", onPD);
      window.removeEventListener("touchstart", onTS);
      window.removeEventListener("touchmove", onTM);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none block h-full w-full ${className}`} />;
}
