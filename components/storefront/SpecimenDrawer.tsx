"use client";

import { useEffect } from "react";
import type { TreeSpecimen } from "@/lib/types";
import { formatSpecimenPrice } from "@/lib/trees-api";
import { SpecimenArtwork } from "./SpecimenArtwork";

export function SpecimenDrawer({
  specimen,
  onClose,
  onPrev,
  onNext,
  hasMultiple,
}: {
  specimen: TreeSpecimen | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasMultiple: boolean;
}) {
  useEffect(() => {
    if (!specimen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && hasMultiple) onPrev();
      else if (e.key === "ArrowRight" && hasMultiple) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [specimen, onClose, onPrev, onNext, hasMultiple]);

  if (!specimen) return null;

  const num = String(specimen.specimenNumber).padStart(2, "0");
  const dims =
    specimen.heightFt != null && specimen.widthFt != null
      ? `${specimen.heightFt} ft tall × ${specimen.widthFt} ft wide`
      : "Dimensions pending";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${specimen.name} specifications`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#060c0a]/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="nsf-glass-smoked relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-t-3xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-3xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="nsf-glass-ice rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-label)" }}>
            Specimen No. {num}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close specimen details"
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/40 text-[#FFFCF3] hover:bg-black/65"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_1.05fr] md:items-start">
          <SpecimenArtwork specimen={specimen} aspectClass="aspect-[3/4]" />
          <div className="space-y-4">
            <h2 className="text-3xl font-medium text-[#FFFCF3]" style={{ fontFamily: "var(--font-display)" }}>
              {specimen.name}
            </h2>
            <p className="text-xl font-semibold tabular-nums text-[#e9d7b0]" style={{ fontFamily: "var(--font-label)" }}>
              {formatSpecimenPrice(specimen.priceCents)}
            </p>
            <dl className="grid grid-cols-2 gap-3 border-y border-white/15 py-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.16em] text-[#CADFE9]/75" style={{ fontFamily: "var(--font-label)" }}>Dimensions</dt>
                <dd className="mt-0.5 tabular-nums text-[#FFFCF3]">{dims}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.16em] text-[#CADFE9]/75" style={{ fontFamily: "var(--font-label)" }}>Profile</dt>
                <dd className="mt-0.5 text-[#FFFCF3]">{specimen.shape}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[11px] uppercase tracking-[0.16em] text-[#CADFE9]/75" style={{ fontFamily: "var(--font-label)" }}>Fullness</dt>
                <dd className="mt-0.5 text-[#FFFCF3]">{specimen.fullness}</dd>
              </div>
            </dl>
            <p className="text-sm leading-relaxed text-[#FFFCF3]/90">{specimen.description}</p>
            <div className="nsf-glass-vellum rounded-xl p-3.5 text-xs leading-relaxed">
              Sleigh cart placement &amp; physical unfolding expansion will connect here in <strong>Stage 4</strong>.
            </div>
            {hasMultiple && (
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onPrev} className="min-h-[44px] flex-1 cursor-pointer rounded-xl border border-white/20 bg-white/5 px-4 text-xs uppercase tracking-[0.14em] text-[#FFFCF3] hover:bg-white/10" style={{ fontFamily: "var(--font-label)" }}>
                  ← Previous
                </button>
                <button type="button" onClick={onNext} className="min-h-[44px] flex-1 cursor-pointer rounded-xl border border-white/20 bg-white/5 px-4 text-xs uppercase tracking-[0.14em] text-[#FFFCF3] hover:bg-white/10" style={{ fontFamily: "var(--font-label)" }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
