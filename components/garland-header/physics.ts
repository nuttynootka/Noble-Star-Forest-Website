"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

export function usePendulum(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ angle: 0, velocity: 0, raf: 0, last: 0 });
  const k = ((2 * Math.PI) / 1.7) ** 2;
  const c = 2 * 0.16 * Math.sqrt(k);
  const maxAngle = 0.15;

  const step = useCallback(
    (now: number) => {
      const s = state.current;
      const el = ref.current;
      const dt = Math.min(0.032, (now - s.last) / 1000);
      s.last = now;
      s.velocity += (-k * s.angle - c * s.velocity) * dt;
      s.angle = Math.max(-maxAngle, Math.min(maxAngle, s.angle + s.velocity * dt));
      if (Math.abs(s.angle) < 6e-4 && Math.abs(s.velocity) < 0.002) {
        s.angle = 0;
        s.velocity = 0;
        s.raf = 0;
        if (el) el.style.transform = "";
        return;
      }
      if (el) el.style.transform = `rotate(${s.angle.toFixed(4)}rad)`;
      s.raf = requestAnimationFrame(step);
    },
    [k, c],
  );

  const kick = useCallback(
    (deltaV: number) => {
      if (!enabled) return;
      const s = state.current;
      s.velocity = Math.max(-0.9, Math.min(0.9, s.velocity + deltaV));
      if (!s.raf) {
        s.last = performance.now();
        s.raf = requestAnimationFrame(step);
      }
    },
    [enabled, step],
  );

  useEffect(() => () => cancelAnimationFrame(state.current.raf), []);
  return { ref, kick };
}

export function usePointerWarmth(containerRef: RefObject<HTMLElement | null>, enabled: boolean, radius = 120) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !enabled) return;
    let lights: HTMLElement[] = [];
    const warmMap = new WeakMap<HTMLElement, number>();
    const scan = () => {
      lights = Array.from(root.querySelectorAll<HTMLElement>("[data-fairy-light]"));
    };
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(root, { childList: true, subtree: true });

    let px = 0;
    let py = 0;
    let active = false;
    let raf = 0;
    let touchTimer = 0;

    const update = () => {
      raf = 0;
      const rects = lights.map((el) => el.getBoundingClientRect());
      for (let i = 0; i < lights.length; i++) {
        let warm = 0;
        if (active) {
          const dist = Math.hypot(rects[i].left - px, rects[i].top - py);
          if (dist < radius) {
            const t = 1 - dist / radius;
            warm = t * t * (3 - 2 * t);
          }
        }
        const prev = warmMap.get(lights[i]) ?? 0;
        if (Math.abs(prev - warm) > 0.02 || (warm === 0 && prev !== 0)) {
          lights[i].style.setProperty("--warm", warm.toFixed(2));
          warmMap.set(lights[i], warm);
        }
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onMove = (e: PointerEvent) => {
      window.clearTimeout(touchTimer);
      px = e.clientX;
      py = e.clientY;
      active = true;
      schedule();
    };
    const onLeave = () => {
      active = false;
      schedule();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        window.clearTimeout(touchTimer);
        touchTimer = window.setTimeout(onLeave, 700);
      }
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerdown", onMove, { passive: true });
    root.addEventListener("pointerup", onUp, { passive: true });
    root.addEventListener("pointerleave", onLeave, { passive: true });
    root.addEventListener("pointercancel", onLeave, { passive: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(touchTimer);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerdown", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointercancel", onLeave);
    };
  }, [containerRef, enabled, radius]);
}

export function useImageStatus(src?: string): "loading" | "ok" | "missing" {
  const [status, setStatus] = useState<"loading" | "ok" | "missing">(src ? "loading" : "missing");
  useEffect(() => {
    if (!src) {
      setStatus("missing");
      return;
    }
    let mounted = true;
    setStatus("loading");
    const img = new Image();
    img.onload = () => mounted && setStatus("ok");
    img.onerror = () => mounted && setStatus("missing");
    img.src = src;
    return () => {
      mounted = false;
    };
  }, [src]);
  return status;
}

export const LADDER_SPRING = {
  gravity: 2200,
  drag: 0.9,
  substep: 1 / 180,
  iterations: 8,
  chainStiffness: 0.66,
  breeze: 55,
  twistStiffness: ((2 * Math.PI) / 2.4) ** 2,
  twistDamping: 0.28 * ((2 * Math.PI) / 2.4),
  twistFromSwing: 0.0045,
  maxTwist: 0.21,
  foldStiffness: ((2 * Math.PI) / 0.62) ** 2,
  foldDamping: 0.8 * ((2 * Math.PI) / 0.62),
  leadTime: 0.5,
  gapTime: 0.2,
  releaseGap: 0.11,
  releaseFold: -45,
  reelGap: 0.09,
  reelTime: 0.34,
  gap: 15,
  leadAttach: 0.2,
  innerAttach: 0.34,
  dropKick: 55,
  breezeTwist: 0.5,
} as const;

export const ladderCloseDurationSec = (count: number) =>
  (count - 1) * LADDER_SPRING.reelGap + LADDER_SPRING.reelTime;

interface Point2D {
  x: number;
  y: number;
}
interface VerletPoint extends Point2D {
  px: number;
  py: number;
}
interface PlateState {
  p: VerletPoint[];
  local: Point2D[];
  mode: "held" | "free" | "reel";
  modeAt: number;
  from: Point2D[];
  fold: number;
  foldV: number;
  prevFold: number;
  prevTwist: number;
  foldFrom: number;
  twist: number;
  twistV: number;
  wind: number[];
}

function smoothstep5(t: number) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * c * (c * (c * 6 - 15) + 10);
}

function hash01(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function pullChain(a: VerletPoint, b: VerletPoint, maxLen: number, wa: number, wb: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (d <= maxLen || d === 0) return;
  const corr = ((d - maxLen) / d / (wa + wb)) * LADDER_SPRING.chainStiffness;
  if (wa) {
    a.x += dx * corr * wa;
    a.y += dy * corr * wa;
  }
  b.x -= dx * corr * wb;
  b.y -= dy * corr * wb;
}

function solveDist(a: VerletPoint, b: VerletPoint, target: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1e-4;
  const k = (d - target) / d / 2;
  a.x += dx * k;
  a.y += dy * k;
  b.x -= dx * k;
  b.y -= dy * k;
}

export class LadderPhysics {
  private els: HTMLElement[];
  private chains: Array<[HTMLElement | null, HTMLElement | null]>;
  private reduced: boolean;
  private plates: PlateState[];
  private widths: number[] = [];
  private anchorHalf = 40;
  private H = 44;
  private lead = 160;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private time = 0;
  private openAt = 0;
  private opens = 0;
  private closeAt = 0;
  private state: "closed" | "opening" | "open" | "closing" = "closed";

  constructor(opts: {
    plates: HTMLElement[];
    chains: Array<[HTMLElement | null, HTMLElement | null]>;
    reducedMotion: boolean;
  }) {
    this.els = opts.plates;
    this.chains = opts.chains;
    this.reduced = opts.reducedMotion;
    this.plates = this.els.map((_, idx) => ({
      p: [0, 1, 2, 3].map(() => ({ x: 0, y: 0, px: 0, py: 0 })),
      local: [],
      mode: "held",
      modeAt: 0,
      from: [],
      fold: -90,
      foldV: 0,
      prevFold: -90,
      prevTwist: 0,
      foldFrom: -90,
      twist: 0,
      twistV: 0,
      wind: [0, 1, 2, 3, 4, 5].map((i) => {
        const s = Math.sin((idx + 1) * 12.9898 + i * 78.233) * 43758.5453;
        return s - Math.floor(s);
      }),
    }));
    this.setGeometry(this.els.map(() => 160), this.H, this.lead);
  }

  setReducedMotion(reduced: boolean) {
    this.reduced = reduced;
  }

  setGeometry(widths: number[], height: number, lead: number) {
    this.widths = widths;
    this.H = height;
    this.lead = Math.max(20, lead);
    this.anchorHalf = (0.5 - LADDER_SPRING.leadAttach) * (widths[0] ?? 160);
    this.plates.forEach((plate, i) => {
      const w = widths[i] ?? widths[0] ?? 160;
      const topHalf = i === 0 ? this.anchorHalf : (0.5 - LADDER_SPRING.innerAttach) * w;
      const botHalf = (0.5 - LADDER_SPRING.innerAttach) * w;
      plate.local = [
        { x: -topHalf, y: 0 },
        { x: topHalf, y: 0 },
        { x: -botHalf, y: height },
        { x: botHalf, y: height },
      ];
    });
    if (this.state === "closed") this.holdAll();
    if (this.reduced && this.state !== "closed") this.hangStill();
    this.render();
  }

  open() {
    if (this.state === "open" || this.state === "opening") return;
    if (this.reduced) {
      this.state = "open";
      this.hangStill();
      this.render();
      return;
    }
    if (this.state === "closed") this.holdAll();
    this.state = "opening";
    this.openAt = this.time;
    this.opens++;
    this.plates.forEach((p) => {
      if (p.mode === "reel") this.setMode(p, "held");
    });
    this.start();
  }

  close() {
    if (this.state === "closed" || this.state === "closing") return;
    if (this.reduced) {
      this.state = "closed";
      this.holdAll();
      return;
    }
    this.state = "closing";
    this.closeAt = this.time;
    this.start();
  }

  poke(idx: number, x: number, y: number, vx: number, vy: number) {
    const plate = this.plates[idx];
    if (!plate || plate.mode !== "free" || this.reduced) return;
    const dt = LADDER_SPRING.substep;
    const diag = Math.hypot(this.widths[idx] ?? 160, this.H);
    const c = this.centre(plate);
    for (const pt of plate.p) {
      const weight = Math.max(0.25, 1 - Math.hypot(pt.x - x, pt.y - y) / diag);
      pt.px -= vx * weight * dt;
      pt.py -= vy * weight * dt;
    }
    plate.twistV += (vx / 500) * (x < c.x ? 1 : -1) * 0.8;
    this.start();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private start() {
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  private frame = (now: number) => {
    const dt = Math.min(1 / 30, (now - this.last) / 1000);
    this.last = now;
    this.acc += dt;
    while (this.acc >= LADDER_SPRING.substep) {
      this.step(LADDER_SPRING.substep);
      this.acc -= LADDER_SPRING.substep;
    }
    this.render(this.acc / LADDER_SPRING.substep);
    if (this.state === "closed") {
      this.raf = 0;
      return;
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private setMode(p: PlateState, mode: PlateState["mode"]) {
    p.mode = mode;
    p.modeAt = this.time;
    if (mode === "reel") {
      p.from = p.p.map((pt) => ({ x: pt.x, y: pt.y }));
      p.foldFrom = p.fold;
    }
  }

  private holdTarget(idx: number, prev = false): Point2D[] {
    let anchor = { x: 0, y: 0, angle: 0 };
    if (idx > 0) {
      const above = this.plates[idx - 1].p;
      const a = prev ? { x: above[2].px, y: above[2].py } : above[2];
      const b = prev ? { x: above[3].px, y: above[3].py } : above[3];
      anchor = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, angle: Math.atan2(b.y - a.y, b.x - a.x) };
    }
    const cos = Math.cos(anchor.angle);
    const sin = Math.sin(anchor.angle);
    return this.plates[idx].local.map((pt) => ({
      x: anchor.x + pt.x * cos - pt.y * sin,
      y: anchor.y + pt.x * sin + pt.y * cos,
    }));
  }

  private holdAll() {
    this.plates.forEach((p, idx) => {
      p.mode = "held";
      const tgt = this.holdTarget(idx);
      p.p.forEach((pt, i) => {
        pt.x = pt.px = tgt[i].x;
        pt.y = pt.py = tgt[i].y;
      });
      p.fold = p.prevFold = -90;
      p.foldV = 0;
      p.twist = p.twistV = p.prevTwist = 0;
    });
  }

  private hangStill() {
    let y = this.lead;
    this.plates.forEach((p) => {
      p.mode = "free";
      p.p.forEach((pt, i) => {
        pt.x = pt.px = p.local[i].x;
        pt.y = pt.py = y + p.local[i].y;
      });
      p.fold = 0;
      p.twist = 0;
      y += this.H + LADDER_SPRING.gap;
    });
  }

  private centre(p: PlateState): Point2D {
    return {
      x: (p.p[0].x + p.p[1].x + p.p[2].x + p.p[3].x) / 4,
      y: (p.p[0].y + p.p[1].y + p.p[2].y + p.p[3].y) / 4,
    };
  }

  private step(dt: number) {
    this.time += dt;
    const t = this.time;
    const n = this.plates.length;

    if (this.state === "opening") {
      this.plates.forEach((plate, i) => {
        const prev = i > 0 ? this.plates[i - 1] : null;
        const canDrop = prev
          ? prev.mode === "free" && t - prev.modeAt >= LADDER_SPRING.releaseGap && prev.fold > LADDER_SPRING.releaseFold
          : t >= this.openAt;
        if (plate.mode === "held" && canDrop) {
          this.setMode(plate, "free");
          const r1 = hash01(i * 7.1 + this.opens * 3.7);
          const r2 = hash01(i * 2.3 + this.opens * 9.1);
          const kick = (r1 - 0.5) * 2 * LADDER_SPRING.dropKick * LADDER_SPRING.substep;
          plate.p[2].px -= kick * 1.3;
          plate.p[3].px -= kick * 1.3;
          plate.p[0].px -= kick * 0.6;
          plate.p[1].px -= kick * 0.6;
          plate.twistV += (r2 - 0.5) * 1.2;
        }
      });
      if (this.plates.every((p) => p.mode === "free")) this.state = "open";
    } else if (this.state === "closing") {
      this.plates.forEach((plate, i) => {
        const at = this.closeAt + (n - 1 - i) * LADDER_SPRING.reelGap;
        if (plate.mode === "free" && t >= at) this.setMode(plate, "reel");
        if (plate.mode === "reel" && t - plate.modeAt >= LADDER_SPRING.reelTime) plate.mode = "held";
      });
      if (this.plates.every((p) => p.mode === "held")) {
        this.state = "closed";
        this.holdAll();
        return;
      }
    }

    for (const p of this.plates) {
      p.prevFold = p.fold;
      p.prevTwist = p.twist;
    }

    const damping = Math.max(0, 1 - LADDER_SPRING.drag * dt);
    const gStep = LADDER_SPRING.gravity * dt * dt;
    for (const p of this.plates) {
      if (p.mode !== "free") continue;
      const w = p.wind;
      const gust =
        LADDER_SPRING.breeze *
        (Math.sin(t * (0.23 + w[0] * 0.2) + w[1] * 6.28) +
          0.6 * Math.sin(t * (0.61 + w[2] * 0.3) + w[3] * 6.28) +
          0.3 * Math.sin(t * (1.7 + w[4] * 0.6) + w[5] * 6.28));
      for (let i = 0; i < 4; i++) {
        const pt = p.p[i];
        const bFactor = i >= 2 ? 1.35 : 0.65;
        const vx = (pt.x - pt.px) * damping;
        const vy = (pt.y - pt.py) * damping;
        pt.px = pt.x;
        pt.py = pt.y;
        pt.x += vx + gust * bFactor * dt * dt;
        pt.y += vy + gStep;
      }
    }

    const leftAnchor: VerletPoint = { x: -this.anchorHalf, y: 0, px: -this.anchorHalf, py: 0 };
    const rightAnchor: VerletPoint = { x: this.anchorHalf, y: 0, px: this.anchorHalf, py: 0 };
    const dist = (a: Point2D, b: Point2D) => Math.hypot(a.x - b.x, a.y - b.y);

    for (let it = 0; it < LADDER_SPRING.iterations; it++) {
      for (let i = 0; i < n; i++) {
        const p = this.plates[i];
        if (p.mode !== "free") continue;
        const prev = i > 0 ? this.plates[i - 1] : null;
        const prevFree = prev?.mode === "free";
        const age = t - p.modeAt;
        const maxLen =
          i === 0 ? this.lead * smoothstep5(age / LADDER_SPRING.leadTime) : LADDER_SPRING.gap * smoothstep5(age / LADDER_SPRING.gapTime);
        const aL = prev ? prev.p[2] : leftAnchor;
        const aR = prev ? prev.p[3] : rightAnchor;
        pullChain(aL, p.p[0], maxLen, prevFree ? 1 : 0, 1);
        pullChain(aR, p.p[1], maxLen, prevFree ? 1 : 0, 1);

        const loc = p.local;
        solveDist(p.p[0], p.p[1], dist(loc[0], loc[1]));
        solveDist(p.p[2], p.p[3], dist(loc[2], loc[3]));
        solveDist(p.p[0], p.p[2], dist(loc[0], loc[2]));
        solveDist(p.p[1], p.p[3], dist(loc[1], loc[3]));
        solveDist(p.p[0], p.p[3], dist(loc[0], loc[3]));
        solveDist(p.p[1], p.p[2], dist(loc[1], loc[2]));
      }
    }

    for (let i = 0; i < n; i++) {
      const p = this.plates[i];
      if (p.mode === "free") continue;
      const tgt = this.holdTarget(i);
      if (p.mode === "held") {
        const prevTgt = i > 0 ? this.holdTarget(i, true) : tgt;
        p.p.forEach((pt, idx) => {
          pt.x = tgt[idx].x;
          pt.y = tgt[idx].y;
          pt.px = prevTgt[idx].x;
          pt.py = prevTgt[idx].y;
        });
      } else {
        const u = Math.min(1, (t - p.modeAt) / LADDER_SPRING.reelTime);
        const ease = u * u * (3 - 2 * u);
        p.p.forEach((pt, idx) => {
          pt.px = pt.x;
          pt.py = pt.y;
          pt.x = p.from[idx].x + (tgt[idx].x - p.from[idx].x) * ease;
          pt.y = p.from[idx].y + (tgt[idx].y - p.from[idx].y) * ease;
        });
      }
    }

    for (let i = 0; i < n; i++) {
      const p = this.plates[i];
      if (p.mode === "free") {
        const foldAcc = -LADDER_SPRING.foldStiffness * p.fold - LADDER_SPRING.foldDamping * p.foldV;
        p.foldV += foldAcc * dt;
        p.fold += p.foldV * dt;

        const prev = i > 0 ? this.plates[i - 1] : null;
        const vxTop = (p.p[0].x - p.p[0].px + p.p[1].x - p.p[1].px) / (2 * dt);
        const vxPrev =
          prev && prev.mode === "free" ? (prev.p[2].x - prev.p[2].px + prev.p[3].x - prev.p[3].px) / (2 * dt) : 0;
        const w = p.wind;
        const twistGust =
          LADDER_SPRING.breezeTwist *
          (Math.sin(t * (0.31 + w[1] * 0.25) + w[4] * 6.28) + 0.5 * Math.sin(t * (0.9 + w[3] * 0.4) + w[0] * 6.28));
        const twistAcc =
          -LADDER_SPRING.twistStiffness * p.twist -
          LADDER_SPRING.twistDamping * p.twistV +
          LADDER_SPRING.twistFromSwing * (vxTop - vxPrev) +
          twistGust;
        p.twistV += twistAcc * dt;
        p.twist = Math.max(-LADDER_SPRING.maxTwist, Math.min(LADDER_SPRING.maxTwist, p.twist + p.twistV * dt));
      } else if (p.mode === "reel") {
        const u = Math.min(1, (t - p.modeAt) / LADDER_SPRING.reelTime);
        p.fold = p.foldFrom + (-90 - p.foldFrom) * u * u;
        p.twist *= 0.9;
        p.twistV = 0;
      } else {
        p.fold = -90;
        p.foldV = 0;
        p.twist = p.twistV = 0;
      }
    }
  }

  private render(alpha = 1) {
    const lerp = (pt: VerletPoint) => ({ x: pt.px + (pt.x - pt.px) * alpha, y: pt.py + (pt.y - pt.py) * alpha });
    for (let i = 0; i < this.plates.length; i++) {
      const p = this.plates[i];
      const el = this.els[i];
      if (!el) continue;
      const fold = p.prevFold + (p.fold - p.prevFold) * alpha;
      const twist = p.prevTwist + (p.twist - p.prevTwist) * alpha;
      const [tl, tr] = [lerp(p.p[0]), lerp(p.p[1])];
      const mx = (tl.x + tr.x) / 2;
      const my = (tl.y + tr.y) / 2;
      const rot = Math.atan2(tr.y - tl.y, tr.x - tl.x);
      const hidden = p.mode === "held" || fold < -86;
      el.style.transform = `translate3d(${(mx - (this.widths[i] ?? 0) / 2).toFixed(2)}px, ${my.toFixed(
        2,
      )}px, 0) perspective(700px) rotate(${rot.toFixed(4)}rad) rotateY(${twist.toFixed(4)}rad) rotateX(${fold.toFixed(2)}deg)`;
      el.style.opacity = hidden ? "0" : "1";
      el.style.setProperty("--tw", twist.toFixed(3));

      const prev = i > 0 ? this.plates[i - 1] : null;
      const anchors = prev ? [lerp(prev.p[2]), lerp(prev.p[3])] : [{ x: -this.anchorHalf, y: 0 }, { x: this.anchorHalf, y: 0 }];
      const targets = [tl, tr];
      for (let side = 0; side < 2; side++) {
        const chain = this.chains[i]?.[side];
        if (!chain) continue;
        const dx = targets[side].x - anchors[side].x;
        const dy = targets[side].y - anchors[side].y;
        const len = Math.hypot(dx, dy);
        if (p.mode === "held" || len < 1) {
          chain.style.opacity = "0";
          continue;
        }
        chain.style.opacity = "1";
        chain.style.height = `${len.toFixed(1)}px`;
        chain.style.transform = `translate(${(anchors[side].x - 4).toFixed(2)}px, ${anchors[side].y.toFixed(
          2,
        )}px) rotate(${Math.atan2(-dx, dy).toFixed(4)}rad)`;
      }
    }
  }
}
