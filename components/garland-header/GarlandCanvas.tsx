"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useImageStatus } from "./physics";
import type { LightPoint } from "./types";
import { cx, makeGarlandLights, prng } from "./utils";

const LAYERS = [
  { kind: "fir", density: 6.5, light: 0.42, len: [0.75, 1.05] },
  { kind: "cedar", density: 3, light: 0.55, len: [0.9, 1.25] },
  { kind: "fir", density: 6, light: 0.68, len: [0.65, 0.95] },
  { kind: "cedar", density: 2.2, light: 0.82, len: [0.8, 1.15] },
  { kind: "fir", density: 5, light: 0.92, len: [0.55, 0.85] },
  { kind: "cedar", density: 1.8, light: 1, len: [0.7, 1] },
  { kind: "fir", density: 2.6, light: 1, len: [0.45, 0.7] },
] as const;

const hsla = (h: number, s: number, l: number, a = 1) =>
  `hsla(${h.toFixed(0)},${s.toFixed(0)}%,${l.toFixed(1)}%,${a})`;

function makeBranchCurve(x: number, y: number, angle: number, length: number, c1: number, c2: number) {
  return (t: number) => {
    const a = angle + c1 * t + c2 * t * t;
    const mid = angle + (c1 * t) / 2 + (c2 * t * t) / 3;
    return { x: x + Math.cos(mid) * length * t, y: y + Math.sin(mid) * length * t, a };
  };
}

function drawFirBranch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  light: number,
  rand: () => number,
  scaleBase: number,
) {
  const s = scaleBase / 80;
  const curve = makeBranchCurve(x, y, angle, length, (rand() - 0.5) * 0.5, 0);
  const paths = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
  const colors = [
    hsla(152, 34, 15 * light + 4),
    hsla(150, 28, 24 * light + 4),
    hsla(158, 22, 34 * light + 5),
    hsla(168, 16, 50 * light + 5),
  ];

  const addNeedles = (
    fn: ReturnType<typeof makeBranchCurve>,
    len: number,
    needleLen: number,
    startT: number,
  ) => {
    const steps = Math.max(6, Math.floor(len / (2.3 * s)));
    for (let i = 0; i < steps; i++) {
      const t = startT + (i / steps) * (1 - startT);
      const pt = fn(t);
      const nl = needleLen * (1 - 0.45 * t) * (0.8 + rand() * 0.4);
      for (const side of [-1, 1]) {
        const na = pt.a + side * (1.1 + (rand() - 0.5) * 0.35);
        const ca = Math.cos(na);
        const sa = Math.sin(na);
        const tx = pt.x + ca * nl;
        const ty = pt.y + sa * nl - nl * 0.28;
        const mx = pt.x + ca * nl * 0.6;
        const my = pt.y + sa * nl * 0.6 - nl * 0.05;
        const tier = rand() * 2.2 + t * 1.2 + (sa < 0 ? 0.5 : -0.3);
        const path = paths[Math.max(0, Math.min(3, Math.floor(tier)))];
        path.moveTo(pt.x, pt.y);
        path.quadraticCurveTo(mx, my, tx, ty);
      }
    }
  };

  ctx.strokeStyle = "rgba(0,10,6,0.32)";
  ctx.lineWidth = 16 * s;
  ctx.beginPath();
  for (let t = 0; t <= 1.0001; t += 0.2) {
    const pt = curve(t);
    if (t === 0) ctx.moveTo(pt.x, pt.y + 4 * s);
    else ctx.lineTo(pt.x, pt.y + 4 * s);
  }
  ctx.stroke();

  ctx.strokeStyle = hsla(30, 25, 18 * light + 6);
  ctx.lineWidth = 1.6 * s;
  ctx.beginPath();
  for (let t = 0; t <= 1.0001; t += 0.1) {
    const pt = curve(t);
    if (t === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();

  addNeedles(curve, length, 11 * s, 0.04);
  const forks = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < forks; i++) {
    const ft = 0.2 + rand() * 0.5;
    const fpt = curve(ft);
    const side = i % 2 ? 1 : -1;
    const flen = length * (0.35 + rand() * 0.2);
    const sub = makeBranchCurve(fpt.x, fpt.y, fpt.a + side * (0.55 + rand() * 0.3), flen, (rand() - 0.5) * 0.3, 0);
    addNeedles(sub, flen, 9 * s, 0.05);
  }

  ctx.lineWidth = 0.95 * s;
  paths.forEach((p, idx) => {
    ctx.strokeStyle = colors[idx];
    ctx.stroke(p);
  });
}

function strokeSeg(ctx: CanvasRenderingContext2D, fn: ReturnType<typeof makeBranchCurve>) {
  ctx.beginPath();
  for (let t = 0; t <= 1.0001; t += 0.25) {
    const pt = fn(t);
    if (t === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
}

function drawCedarBranch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  light: number,
  rand: () => number,
  scaleBase: number,
) {
  const s = scaleBase / 80;
  const dir = Math.cos(angle) > 0 ? 0.6 : -0.6;
  const curve = makeBranchCurve(x, y, angle, length, (rand() - 0.5) * 0.3, dir * 0.5);
  const dark = hsla(95, 52, 17 * light + 4);
  const mid = hsla(88, 60, 30 * light + 5);
  const tip = hsla(80, 66, 42 * light + 6);

  ctx.lineWidth = 1.4 * s;
  for (let t = 0; t < 1; t += 0.1) {
    const p1 = curve(t);
    const p2 = curve(t + 0.1);
    ctx.strokeStyle = t < 0.35 ? hsla(22, 45, 24 * light + 8) : dark;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  const branchOut = (fn: ReturnType<typeof makeBranchCurve>, len: number, depth: number) => {
    const count = Math.max(3, Math.floor(len / ((depth === 0 ? 5.5 : 4) * s)));
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      const pt = fn(t);
      const side = i % 2 ? 1 : -1;
      const blen = len * (depth === 0 ? 0.3 : depth === 1 ? 0.42 : 0.5) * (1 - 0.55 * t) * (0.85 + rand() * 0.3);
      const ba = pt.a + side * (0.85 + (rand() - 0.5) * 0.25);
      const sub = makeBranchCurve(pt.x, pt.y, ba, blen, -side * 0.25, dir * 0.3);
      const w = [2.2, 1.7, 1.3][depth];
      ctx.lineWidth = w * s;
      ctx.strokeStyle = dark;
      strokeSeg(ctx, sub);
      ctx.lineWidth = w * 0.55 * s;
      ctx.strokeStyle = rand() < 0.35 ? tip : mid;
      strokeSeg(ctx, sub);
      if (depth < 2 && blen > 7 * s) branchOut(sub, blen, depth + 1);
    }
  };
  branchOut(curve, length, 0);

  const end = curve(1);
  ctx.fillStyle = tip;
  ctx.beginPath();
  ctx.ellipse(end.x, end.y, 1.6 * s, 1.1 * s, end.a, 0, Math.PI * 2);
  ctx.fill();
}

export function drawProceduralGarland(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bandH: number,
  seed = 1225,
) {
  const rand = prng(seed);
  const midY = h / 2;
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let x = -bandH; x < w + bandH; x += bandH * 0.35) {
    const rad = bandH * (0.38 + rand() * 0.12);
    const y = midY + (rand() - 0.5) * bandH * 0.15;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, "rgba(10,28,20,0.95)");
    grad.addColorStop(1, "rgba(10,28,20,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  for (const layer of LAYERS) {
    const total = Math.ceil(((w + bandH * 2) / 100) * layer.density);
    for (let i = 0; i < total; i++) {
      const bx = -bandH + rand() * (w + bandH * 2);
      const blen = bandH * (layer.len[0] + rand() * (layer.len[1] - layer.len[0]));
      if (layer.kind === "fir") {
        const by = midY + (rand() - 0.5) * bandH * 0.6;
        const ba = Math.PI + (rand() - 0.5) + (rand() < 0.15 ? Math.PI * 0.85 : 0);
        drawFirBranch(ctx, bx, by, ba, blen, layer.light, rand, bandH);
      } else {
        const roll = rand();
        const topBias = roll < 0.3;
        const by = topBias ? midY - bandH * (0.15 + rand() * 0.2) : midY + (rand() - 0.6) * bandH * 0.5;
        const ba = topBias
          ? (rand() < 0.5 ? Math.PI : 0) + (rand() - 0.5) * 0.5
          : Math.PI * (roll < 0.65 ? 0.62 + rand() * 0.2 : 0.18 + rand() * 0.2);
        drawCedarBranch(ctx, bx, by, ba, blen, layer.light, rand, bandH);
      }
    }
  }

  const shade = ctx.createLinearGradient(0, midY - bandH * 0.7, 0, midY + bandH * 0.8);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(0.55, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,8,4,0.45)");
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
}

function sampleCanvasLights(ctx: CanvasRenderingContext2D, pxW: number, pxH: number, cssW: number): LightPoint[] {
  const data = ctx.getImageData(0, 0, pxW, pxH).data;
  const rand = prng(97);
  const cols = Math.max(16, Math.round(cssW / 8));
  const out: LightPoint[] = [];
  for (let c = 0; c < cols; c++) {
    for (let attempt = 0; attempt < 14; attempt++) {
      const u = (c + 0.15 + rand() * 0.7) / cols;
      const v = 0.1 + Math.pow(rand(), 0.9) * 0.8;
      const ix = Math.min(pxW - 1, Math.floor(u * pxW));
      const iy = Math.min(pxH - 1, Math.floor(v * pxH));
      if (data[(iy * pxW + ix) * 4 + 3] < 200) continue;
      const dur = 1.5 + rand() * 1.5;
      out.push({
        x: Math.round(u * 10000) / 100,
        y: Math.round((-0.4 + v * 1.8) * 10000) / 100,
        dur: Math.round(dur * 100) / 100,
        delay: Math.round(-rand() * dur * 100) / 100,
      });
      break;
    }
  }
  return out;
}

export function FairyLight({ light, className }: { light: LightPoint; className?: string }) {
  return (
    <span
      data-fairy-light=""
      className={cx("gh-light", className)}
      style={
        {
          left: `${light.x}%`,
          top: `${light.y}%`,
          "--dur": `${light.dur}s`,
          "--delay": `${light.delay}s`,
        } as CSSProperties
      }
    >
      <span className="gh-light-twinkle" />
      <span className="gh-light-warm" />
    </span>
  );
}

function ProceduralGarlandLayer({
  onLights,
  seed = 1225,
}: {
  onLights: (lights: LightPoint[]) => void;
  seed?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    let raf = 0;
    let lastKey = "";

    const paint = () => {
      raf = 0;
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      const outH = Math.round(h * 1.8);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const key = `${w}x${h}@${dpr}`;
      if (!w || !h || key === lastKey) return;
      lastKey = key;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(outH * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawProceduralGarland(ctx, w, outH, h, seed);
      onLights(sampleCanvasLights(ctx, canvas.width, canvas.height, w));
    };

    paint();
    const ro = new ResizeObserver(() => {
      if (!raf) raf = requestAnimationFrame(paint);
    });
    ro.observe(canvas.parentElement);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [onLights, seed]);

  return (
    <>
      <div className="absolute inset-x-0 top-[12%] h-[76%] rounded-full bg-[#0f2a1f] blur-md" />
      <canvas
        ref={canvasRef}
        className="absolute inset-x-0 -top-[40%] h-[180%] w-full drop-shadow-[0_10px_12px_rgba(0,0,0,0.6)]"
      />
    </>
  );
}

/**
 * Reusable Garland + Twinkling Lights band.
 * Used in both GarlandHeader and ForestFooter so foliage & light behavior match exactly.
 */
export function GarlandBand({
  src,
  fit = "cover",
  seed = 1225,
  className = "pointer-events-none absolute inset-x-0 top-[var(--gt)] z-10 h-[var(--g)]",
}: {
  src?: string;
  fit?: "cover" | "repeat";
  seed?: number;
  className?: string;
}) {
  const status = useImageStatus(src);
  const useImage = Boolean(src) && status !== "missing";
  const imageLights = useMemo(() => makeGarlandLights(seed), [seed]);
  const [canvasLights, setCanvasLights] = useState<LightPoint[] | null>(null);
  const lights = useImage ? imageLights : (canvasLights ?? []);

  return (
    <div aria-hidden="true" className={className}>
      {useImage && src ? (
        fit === "repeat" ? (
          <div
            className="absolute inset-0 bg-repeat-x drop-shadow-[0_12px_14px_rgba(0,0,0,0.65)]"
            style={{
              backgroundImage: `url("${src}")`,
              backgroundSize: "auto 100%",
              backgroundPosition: "center top",
            }}
          />
        ) : (
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center drop-shadow-[0_12px_14px_rgba(0,0,0,0.65)]"
          />
        )
      ) : (
        <ProceduralGarlandLayer onLights={setCanvasLights} seed={seed} />
      )}
      <div className="gh-glow-soft absolute inset-0 [--gh-core:2.2px] [--gh-halo:9px] md:[--gh-core:2.7px] md:[--gh-halo:11px]">
        {lights.map((light, i) => (
          <FairyLight key={i} light={light} className={light.dense ? "hidden sm:block" : undefined} />
        ))}
      </div>
    </div>
  );
}
