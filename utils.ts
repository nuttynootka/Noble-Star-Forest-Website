import type { GlintPoint, LightPoint, StarConfig, TabPlacement } from "./types";

export const DEFAULT_BRAND = {
  src: "/brand/noble-star-forest.webp",
  ratio: 1.8349,
  star: {
    src: "/brand/noble-star.webp",
    left: 70.3,
    top: 25.32,
    width: 8.5,
    height: 26.79,
    cx: 50.6,
    cy: 40.4,
  } satisfies StarConfig,
};

export const GLINT_COLORS = ["255 250 240", "255 206 120"] as const;

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

export function prng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 1831565813) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function fnv1a(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function makeGarlandLights(seed = 7): LightPoint[] {
  const r = prng(seed);
  const out: LightPoint[] = [];
  const addBand = (count: number, freq: number, phase: number, amp: number, dense: boolean) => {
    for (let i = 0; i < count; i++) {
      const u = (i + 0.5 + (r() - 0.5) * 0.6) / count;
      const y = 50 + amp * Math.sin(u * Math.PI * 2 * freq + phase) + (r() - 0.5) * 12;
      const dur = 1.5 + r() * 1.5;
      out.push({
        x: round2(u * 100),
        y: round2(Math.min(84, Math.max(16, y))),
        dense,
        dur: round2(dur),
        delay: round2(-r() * dur),
      });
    }
  };
  addBand(34, 6.5, 0.4, 24, false);
  addBand(26, 4.5, 2.1, 20, true);
  return out;
}

export function makeGlints(seed: number): GlintPoint[] {
  const r = prng(seed);
  const out: GlintPoint[] = [];
  const pickPos = () => {
    const roll = r();
    if (roll < 0.3) return { x: 6 + r() * 88, y: 1 + r() * 3 };
    if (roll < 0.85) return { x: 6 + r() * 88, y: 100 + r() * 7 };
    return { x: roll < 0.92 ? 0.5 + r() * 1.5 : 98 + r() * 1.5, y: 25 + r() * 50 };
  };
  for (let i = 0; i < 6; i++) {
    const kind: "star" | "fleck" = i < 2 ? "star" : "fleck";
    const { x, y } = pickPos();
    const dur = kind === "star" ? 2.8 + r() * 2.2 : 1.6 + r() * 1.4;
    out.push({
      x: round2(x),
      y: round2(y),
      kind,
      size: round2(kind === "star" ? 14 + r() * 8 : 4 + r() * 3),
      dur: round2(dur),
      delay: round2(-r() * dur),
    });
  }
  return out;
}

export function computePlacement(): {
  tabs: [TabPlacement, TabPlacement, TabPlacement];
  maxNarrow: string;
  maxWide: string;
} {
  const center = "calc(var(--sign-h) / 2 - var(--g) / 2 + 5px)";
  const side = "calc(var(--g) * 0.4 + 9px)";
  const tab = (xNarrow: number, xWide: number, ribbon: string): TabPlacement => ({
    xNarrow,
    xWide,
    ribbonNarrow: ribbon,
    ribbonWide: ribbon,
    layer: 1,
  });
  return {
    tabs: [tab(16.67, 20, side), tab(50, 50, center), tab(83.33, 80, side)],
    maxNarrow: center,
    maxWide: center,
  };
}