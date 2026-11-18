"use client";

import type { CSSProperties } from "react";
import type { TreeSpecimen } from "@/lib/types";
import { formatSpecimenPrice } from "@/lib/trees-api";
import { SpecimenArtwork } from "./SpecimenArtwork";

export type SpecimenProportion = "focal" | "tall" | "wide";

const ASPECT_MAP: Record<SpecimenProportion, string> = {
  focal: "aspect-[3/4] md:aspect-[4/5]",
  tall: "aspect-[3/4]",
  wide: "aspect-[4/5] sm:aspect-[5/4]",
};

function statusLabel(status: TreeSpecimen["status"]) {
  if (status === "available") return { text: "Available", cls: "bg-[#12673D] text-[#FFFCF3] border-[#CADFE9]/30" };
  if (status === "reserved") return { text: "Reserved", cls: "bg-[#77001E] text-[#FFFCF3] border-[#e9d7b0]/40" };
  if (status === "sold") return { text: "Placed", cls: "bg-[#77001E]/90 text-[#FFFCF3] border-white/20" };
  return { text: "Preview Frame", cls: "bg-[#004323]/90 text-[#CADFE9] border-[#CADFE9]/35" };
}

export function SpecimenCard({
  specimen,
  proportion,
  isFavorite,
  onToggleFavorite,
  onInspect,
  className = "",
}: {
  specimen: TreeSpecimen;
  proportion: SpecimenProportion;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onInspect: (specimen: TreeSpecimen, el: HTMLElement) => void;
  className?: string;
}) {
  const badge = statusLabel(specimen.status);
  const num = String(specimen.specimenNumber).padStart(2, "0");
  const dims =
    specimen.heightFt != null && specimen.widthFt != null
      ? `${specimen.heightFt} ft × ${specimen.widthFt} ft`
      : "Dimensions Pending";

  return (
    <article className={`group/card relative ${className}`}>
      <div className="relative">
        <SpecimenArtwork specimen={specimen} aspectClass={ASPECT_MAP[proportion]} />

        {/* Top floating specimen number & favorite toggle */}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-2 sm:inset-x-4 sm:top-4">
          <span
            className="nsf-glass-ice pointer-events-auto rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ fontFamily: "var(--font-label)" }}
          >
            No. {num}
          </span>
          <button
            type="button"
            aria-pressed={isFavorite}
            aria-label={isFavorite ? `Remove ${specimen.name} from favorites` : `Save ${specimen.name} to favorites`}
            onClick={() => onToggleFavorite(specimen.id)}
            className="nsf-glass-smoked pointer-events-auto inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-base transition-colors hover:border-[#e9d7b0]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9d7b0]"
          >
            <span className={isFavorite ? "text-[#e9d7b0]" : "text-[#CADFE9]/80"}>{isFavorite ? "♥" : "♡"}</span>
          </button>
        </div>

        {/* Overlapping frosted-glass editorial specification plate */}
        <div className="relative z-10 mx-2 -mt-12 sm:mx-4 sm:-mt-14">
          <div
            className="nsf-glass-smoked relative overflow-hidden rounded-2xl p-4 sm:p-5"
            style={{ "--gc": "255 250 240" } as CSSProperties}
          >
            <span aria-hidden="true" className="gh-tiny gh-tiny-soft" style={{ left: "12%", top: "14%", "--ts": "6px", "--dur": "4.6s", "--delay": "-1.2s" } as CSSProperties} />
            <span aria-hidden="true" className="gh-tiny gh-tiny-soft" style={{ left: "88%", top: "78%", "--ts": "5px", "--dur": "5.2s", "--delay": "-2.7s" } as CSSProperties} />

            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span
                  className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.14em] ${badge.cls}`}
                  style={{ fontFamily: "var(--font-label)" }}
                >
                  {badge.text}
                </span>
                <h3
                  className="mt-2 text-2xl font-medium leading-tight text-[#FFFCF3] sm:text-[1.7rem]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {specimen.name}
                </h3>
              </div>
              <p
                className="text-lg font-semibold tabular-nums text-[#e9d7b0]"
                style={{ fontFamily: "var(--font-label)" }}
              >
                {formatSpecimenPrice(specimen.priceCents)}
              </p>
            </div>

            <div
              className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-y border-white/10 py-2 text-xs uppercase tracking-[0.1em] text-[#CADFE9]"
              style={{ fontFamily: "var(--font-label)" }}
            >
              <span className="tabular-nums">{dims}</span>
              <span>•</span>
              <span>{specimen.shape}</span>
            </div>

            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#FFFCF3]/85">
              {specimen.description}
            </p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={(e) => onInspect(specimen, e.currentTarget)}
                className="nsf-glass-vellum inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center rounded-xl px-4 text-xs font-semibold uppercase tracking-[0.14em] transition-transform active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9d7b0]"
                style={{ fontFamily: "var(--font-label)" }}
              >
                Unfold Specimen Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
