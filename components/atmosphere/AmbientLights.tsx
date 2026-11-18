"use client";

import { useMemo, useRef, type CSSProperties } from "react";
import { FairyLight, usePointerWarmth } from "@/components/garland-header";
import { prng, round2 } from "@/components/garland-header/utils";

interface DepthLight {
  x: number;
  y: number;
  dur: number;
  delay: number;
  core: number;
  halo: number;
  blur: number;
}

export function AmbientLights({ seed = 2026, count = 18 }: { seed?: number; count?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  usePointerWarmth(wrapRef, true, 150);

  const lights = useMemo<DepthLight[]>(() => {
    const r = prng(seed);
    return Array.from({ length: count }, () => {
      const depth = r();
      const dur = 2.4 + r() * 3.2;
      return {
        x: round2(4 + r() * 92),
        y: round2(6 + r() * 88),
        dur: round2(dur),
        delay: round2(-r() * dur),
        core: round2(1.4 + depth * 1.8),
        halo: round2(8 + depth * 16),
        blur: round2((1 - depth) * 1.4),
      };
    });
  }, [seed, count]);

  return (
    <div ref={wrapRef} aria-hidden="true" className="gh-root pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      <div className="gh-glow-soft absolute inset-0">
        {lights.map((l, idx) => (
          <div
            key={idx}
            style={
              {
                position: "absolute",
                left: `${l.x}%`,
                top: `${l.y}%`,
                filter: l.blur > 0.3 ? `blur(${l.blur}px)` : undefined,
                "--gh-core": `${l.core}px`,
                "--gh-halo": `${l.halo}px`,
              } as CSSProperties
            }
          >
            <FairyLight light={{ x: 0, y: 0, dur: l.dur, delay: l.delay }} />
          </div>
        ))}
      </div>
    </div>
  );
}
