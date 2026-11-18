"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotionConfig, useSpring } from "framer-motion";
import { useCart } from "@/components/cart/CartContext";
import { formatSpecimenPrice } from "@/lib/trees-api";
import type { TreeSpecimen } from "@/lib/types";
import { SpecimenArtwork } from "./SpecimenArtwork";

export type SpecimenProportion = "focal" | "tall" | "wide";

const ASPECT_MAP: Record<SpecimenProportion, string> = {
  focal: "aspect-[3/4] md:aspect-[4/5]",
  tall: "aspect-[3/4]",
  wide: "aspect-[4/5] sm:aspect-[5/4]",
};

const HINGE_SPRING = { stiffness: 112, damping: 13, mass: 1 } as const;

function statusLabel(status: TreeSpecimen["status"]) {
  if (status === "available") return { text: "Available", cls: "bg-[#12673D] text-[#FFFCF3] border-[#CADFE9]/30" };
  if (status === "reserved") return { text: "Reserved", cls: "bg-[#77001E] text-[#FFFCF3] border-[#e9d7b0]/40" };
  if (status === "sold") return { text: "Placed", cls: "bg-[#77001E]/90 text-[#FFFCF3] border-white/20" };
  return { text: "Preview Frame", cls: "bg-[#004323]/90 text-[#CADFE9] border-[#CADFE9]/35" };
}

function HingedLeaf({
  openDelay,
  closeDelay,
  reduced,
  className,
  children,
}: {
  openDelay: number;
  closeDelay: number;
  reduced: boolean;
  className: string;
  children: ReactNode;
}) {
  const tiltX = useSpring(0, { stiffness: 165, damping: 17 });
  const tiltY = useSpring(0, { stiffness: 165, damping: 17 });

  const nudge = (cx: number, cy: number, r: DOMRect) => {
    if (reduced) return;
    tiltY.set(((cx - r.left) / r.width - 0.5) * 6);
    tiltX.set(-((cy - r.top) / r.height - 0.5) * 4);
  };

  return (
    <div style={{ perspective: 820 }}>
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, rotateX: -82, y: -6 }}
        animate={
          reduced
            ? { opacity: 1 }
            : { opacity: 1, rotateX: 0, y: 0, transition: { type: "spring", ...HINGE_SPRING, delay: openDelay } }
        }
        exit={
          reduced
            ? { opacity: 0 }
            : { opacity: 0, rotateX: -68, y: -6, transition: { duration: 0.24, delay: closeDelay, ease: "easeIn" } }
        }
        style={{ transformOrigin: "50% 0%", rotateX: tiltX, rotateY: tiltY }}
        onPointerMove={(e) => { if (e.pointerType !== "touch") nudge(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect()); }}
        onPointerDown={(e) => nudge(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => { tiltX.set(0); tiltY.set(0); }}
        onPointerUp={() => { tiltX.set(0); tiltY.set(0); }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function SpecimenCard({
  specimen,
  proportion,
  expanded,
  isFavorite,
  onToggleFavorite,
  onToggleExpand,
  className = "",
}: {
  specimen: TreeSpecimen;
  proportion: SpecimenProportion;
  expanded: boolean;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onToggleExpand: (id: string) => void;
  className?: string;
}) {
  const { addTree, hasTree, setIsOpen } = useCart();
  const reduced = useReducedMotionConfig() ?? false;
  const [photoIdx, setPhotoIdx] = useState(0);

  const badge = statusLabel(specimen.status);
  const num = String(specimen.specimenNumber).padStart(2, "0");
  const dims =
    specimen.heightFt != null && specimen.widthFt != null
      ? `${specimen.heightFt} ft × ${specimen.widthFt} ft`
      : "Dimensions Pending";

  const photos = [specimen.imageUrl, ...specimen.galleryImageUrls].filter((x): x is string => Boolean(x));
  const activeImg = photos[photoIdx] ?? null;
  const inSleigh = hasTree(specimen.id);
  const unavailable = specimen.status === "sold" || specimen.status === "reserved";

  return (
    <article id={`specimen-${specimen.id}`} className={`group/card relative scroll-mt-6 ${className}`}>
      <div className="relative">
        <button
          type="button"
          onClick={() => onToggleExpand(specimen.id)}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Fold" : "Unfold"} ${specimen.name}`}
          className="block w-full cursor-pointer rounded-2xl p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9d7b0]"
        >
          <SpecimenArtwork specimen={{ ...specimen, imageUrl: activeImg }} aspectClass={ASPECT_MAP[proportion]} />
        </button>

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-2 sm:inset-x-4 sm:top-4">
          <span className="nsf-glass-ice pointer-events-auto rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: "var(--font-label)" }}>
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

        {/* Overlapping Frosted-Glass Specimen Plate + Inline Unfolding Leaves */}
        <div className="relative z-10 mx-2 -mt-12 sm:mx-4 sm:-mt-14">
          <div className="nsf-glass-smoked relative overflow-hidden rounded-2xl p-4 sm:p-5" style={{ "--gc": "255 250 240" } as CSSProperties}>
            <span aria-hidden="true" className="gh-tiny gh-tiny-soft" style={{ left: "12%", top: "14%", "--ts": "6px", "--dur": "4.6s", "--delay": "-1.2s" } as CSSProperties} />
            <span aria-hidden="true" className="gh-tiny gh-tiny-soft" style={{ left: "88%", top: "78%", "--ts": "5px", "--dur": "5.2s", "--delay": "-2.7s" } as CSSProperties} />

            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.14em] ${badge.cls}`} style={{ fontFamily: "var(--font-label)" }}>
                  {badge.text}
                </span>
                <h3 className="mt-2 text-2xl font-medium leading-tight text-[#FFFCF3] sm:text-[1.7rem]" style={{ fontFamily: "var(--font-display)" }}>
                  {specimen.name}
                </h3>
              </div>
              <p className="text-lg font-semibold tabular-nums text-[#e9d7b0]" style={{ fontFamily: "var(--font-label)" }}>
                {formatSpecimenPrice(specimen.priceCents)}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-y border-white/10 py-2 text-xs uppercase tracking-[0.1em] text-[#CADFE9]" style={{ fontFamily: "var(--font-label)" }}>
              <span className="tabular-nums">{dims}</span>
              <span>•</span>
              <span>{specimen.shape}</span>
            </div>

            {!expanded && (
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#FFFCF3]/85">{specimen.description}</p>
            )}

            <div className="mt-4">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => onToggleExpand(specimen.id)}
                className="nsf-glass-vellum inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-xl px-4 text-xs font-semibold uppercase tracking-[0.14em] transition-transform active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9d7b0]"
                style={{ fontFamily: "var(--font-label)" }}
              >
                {expanded ? "Fold Specimen Details ▴" : "Unfold Specimen Details ▾"}
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, transition: { duration: 0.34, delay: 0.14, ease: "easeInOut" } }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-2.5 pt-2.5">
                  {photos.length > 1 && (
                    <HingedLeaf openDelay={0.02} closeDelay={0.14} reduced={reduced} className="nsf-glass-smoked rounded-2xl p-3">
                      <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#CADFE9]/80" style={{ fontFamily: "var(--font-label)" }}>
                        Additional Angles
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {photos.map((url, idx) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() => setPhotoIdx(idx)}
                            className={`h-14 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border transition ${idx === photoIdx ? "border-[#e9d7b0]" : "border-white/15 opacity-70 hover:opacity-100"}`}
                          >
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </HingedLeaf>
                  )}

                  <HingedLeaf openDelay={0.05} closeDelay={0.09} reduced={reduced} className="nsf-glass-ice rounded-2xl p-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#77001E]" style={{ fontFamily: "var(--font-label)" }}>
                          Fullness
                        </span>
                        <span className="mt-0.5 block font-semibold">{specimen.fullness}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#77001E]" style={{ fontFamily: "var(--font-label)" }}>
                          Handling Class
                        </span>
                        <span className="mt-0.5 block capitalize font-semibold">{specimen.weightClass}</span>
                      </div>
                    </div>
                    <p className="mt-3 border-t border-[#283036]/15 pt-2.5 text-sm leading-relaxed text-[#283036]/90">
                      {specimen.description}
                    </p>
                  </HingedLeaf>

                  <HingedLeaf openDelay={0.14} closeDelay={0} reduced={reduced} className="nsf-glass-vellum rounded-2xl p-3.5">
                    {inSleigh ? (
                      <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="min-h-[46px] w-full cursor-pointer rounded-xl bg-[#12673D] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#FFFCF3]"
                        style={{ fontFamily: "var(--font-label)" }}
                      >
                        Resting on Sleigh · Open Cart
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={unavailable}
                        onClick={() => addTree(specimen)}
                        className="min-h-[46px] w-full cursor-pointer rounded-xl bg-[#77001E] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#FFFCF3] transition-colors hover:bg-[#8d0829] disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ fontFamily: "var(--font-label)" }}
                      >
                        {unavailable ? "Currently Unavailable" : specimen.status === "preview" ? "Place Preview on Sleigh" : "Place Specimen on Sleigh"}
                      </button>
                    )}
                  </HingedLeaf>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </article>
  );
}
