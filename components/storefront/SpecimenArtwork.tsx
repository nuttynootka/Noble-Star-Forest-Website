"use client";

import type { TreeSpecimen } from "@/lib/types";

export function SpecimenArtwork({
  specimen,
  aspectClass,
}: {
  specimen: TreeSpecimen;
  aspectClass: string;
}) {
  if (specimen.imageUrl) {
    return (
      <div className={`relative w-full overflow-hidden rounded-2xl bg-[#07150f] ${aspectClass}`}>
        <img
          src={specimen.imageUrl}
          alt={`${specimen.name} — ${specimen.shape}`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover/card:scale-[1.02]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060c0a]/80 via-transparent to-[#060c0a]/20"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#CADFE9]/20 bg-[radial-gradient(85%_80%_at_50%_38%,rgba(18,103,61,0.34)_0%,rgba(0,67,35,0.22)_46%,rgba(6,12,10,0.94)_100%)] ${aspectClass}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 top-6 h-px bg-gradient-to-r from-transparent via-[#e9d7b0]/45 to-transparent"
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 220 300"
        className="h-[68%] w-auto opacity-85 drop-shadow-[0_18px_28px_rgba(0,0,0,0.6)]"
      >
        <defs>
          <linearGradient id={`fir-${specimen.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d7d4c" />
            <stop offset="55%" stopColor="#0e4f2f" />
            <stop offset="100%" stopColor="#072818" />
          </linearGradient>
        </defs>
        <path
          d="M110 22 L127 58 L116 55 L142 98 L124 94 L158 144 L134 139 L175 194 L145 189 L190 248 L30 248 L75 189 L45 194 L86 139 L62 144 L96 94 L78 98 L104 55 L93 58 Z"
          fill={`url(#fir-${specimen.id})`}
          stroke="rgba(202,223,233,0.28)"
          strokeWidth="1.2"
        />
        <rect x="103" y="248" width="14" height="24" rx="2" fill="#3a281c" />
        <ellipse cx="110" cy="274" rx="44" ry="7" fill="rgba(0,0,0,0.45)" />
      </svg>
      <p
        className="mt-2 px-4 text-center text-[11px] uppercase tracking-[0.22em] text-[#CADFE9]/75"
        style={{ fontFamily: "var(--font-label)" }}
      >
        Awaiting Specimen Photograph
      </p>
    </div>
  );
}
