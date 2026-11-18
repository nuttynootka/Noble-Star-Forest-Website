"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotionConfig, useSpring } from "framer-motion";
import { useCart } from "@/components/cart/CartContext";
import { formatSpecimenPrice } from "@/lib/trees-api";
import type { TreeSpecimen } from "@/lib/types";
import { SpecimenArtwork } from "./SpecimenArtwork";

const HISTORY_KEY = "nsfTreeExpansion";
const SPRING_PLATE = { stiffness: 108, damping: 14, mass: 1 } as const;
const SPRING_HERO = { stiffness: 185, damping: 22, mass: 1 } as const;

function FolioPlate({
  delay,
  reduced,
  className,
  children,
}: {
  delay: number;
  reduced: boolean;
  className: string;
  children: ReactNode;
}) {
  const tiltX = useSpring(0, { stiffness: 160, damping: 18 });
  const tiltY = useSpring(0, { stiffness: 160, damping: 18 });

  const nudge = (clientX: number, clientY: number, rect: DOMRect) => {
    if (reduced) return;
    const nx = ((clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((clientY - rect.top) / rect.height - 0.5) * 2;
    tiltY.set(nx * 3.5);
    tiltX.set(-ny * 2.5);
  };

  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, rotateX: -72, y: -12 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, rotateX: 0, y: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, rotateX: -48, y: -8 }}
        transition={reduced ? { duration: 0.2 } : { type: "spring", ...SPRING_PLATE, delay }}
        style={{
          transformOrigin: "50% 0%",
          rotateX: tiltX,
          rotateY: tiltY,
        }}
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

export function TreeExpansion({
  specimen,
  getOriginRect,
  onClose,
  onPrev,
  onNext,
  hasMultiple,
}: {
  specimen: TreeSpecimen | null;
  getOriginRect: () => DOMRect | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasMultiple: boolean;
}) {
  const { addTree, hasTree, setIsOpen } = useCart();
  const reduced = useReducedMotionConfig() ?? false;
  const [photoIdx, setPhotoIdx] = useState(0);
  const closingRef = useRef(false);

  useEffect(() => { setPhotoIdx(0); }, [specimen?.id]);

  const requestClose = useCallback((fromPop = false) => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (!fromPop && window.history.state?.[HISTORY_KEY]) {
      try { window.history.back(); } catch { /* ignore */ }
    }
    onClose();
    window.setTimeout(() => { closingRef.current = false; }, 120);
  }, [onClose]);

  useEffect(() => {
    if (!specimen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!window.history.state?.[HISTORY_KEY]) {
      try { window.history.pushState({ ...(window.history.state ?? {}), [HISTORY_KEY]: true }, ""); } catch { /* ignore */ }
    }
    const onPop = () => requestClose(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose(false);
      else if (e.key === "ArrowLeft" && hasMultiple) onPrev();
      else if (e.key === "ArrowRight" && hasMultiple) onNext();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
    };
  }, [specimen, hasMultiple, onPrev, onNext, requestClose]);

  const origin = specimen ? getOriginRect() : null;
  const fromClip = origin && typeof window !== "undefined"
    ? `inset(${Math.max(0, origin.top)}px ${Math.max(0, window.innerWidth - origin.right)}px ${Math.max(0, window.innerHeight - origin.bottom)}px ${Math.max(0, origin.left)}px round 16px)`
    : "inset(25% 12% 25% 12% round 20px)";

  const photos = specimen ? [specimen.imageUrl, ...specimen.galleryImageUrls].filter((x): x is string => Boolean(x)) : [];
  const activeImg = photos[photoIdx] ?? null;
  const inSleigh = specimen ? hasTree(specimen.id) : false;
  const unavailable = specimen ? specimen.status === "sold" || specimen.status === "reserved" : false;

  return (
    <AnimatePresence>
      {specimen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${specimen.name} unfolded specifications`}
          initial={reduced ? { opacity: 0 } : { opacity: 0.4, clipPath: fromClip }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, clipPath: "inset(0px 0px 0px 0px round 0px)" }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, clipPath: fromClip }}
          transition={reduced ? { duration: 0.2 } : { duration: 0.46, ease: [0.32, 0.72, 0, 1] }}
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[#060c0a]/88 backdrop-blur-md"
          onClick={() => requestClose(false)}
        >
          <div className="mx-auto max-w-4xl px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:py-10">
            <div className="mb-4 flex items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
              <span className="nsf-glass-ice rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-label)" }}>
                Specimen No. {String(specimen.specimenNumber).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => requestClose(false)}
                aria-label="Fold specimen details"
                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-black/50 text-[#FFFCF3] hover:bg-black/75"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_1.05fr] md:items-start" onClick={(e) => e.stopPropagation()}>
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.96 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                transition={reduced ? { duration: 0.2 } : { type: "spring", ...SPRING_HERO, delay: 0.04 }}
                className="space-y-3"
              >
                <SpecimenArtwork specimen={{ ...specimen, imageUrl: activeImg }} aspectClass="aspect-[3/4]" />
                {photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((url, idx) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setPhotoIdx(idx)}
                        className={`h-16 w-14 shrink-0 cursor-pointer overflow-hidden rounded-lg border transition ${idx === photoIdx ? "border-[#e9d7b0]" : "border-white/15 opacity-70 hover:opacity-100"}`}
                      >
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>

              <div className="space-y-3.5">
                <FolioPlate delay={0.08} reduced={reduced} className="nsf-glass-smoked rounded-2xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-3xl font-medium text-[#FFFCF3]" style={{ fontFamily: "var(--font-display)" }}>
                      {specimen.name}
                    </h2>
                    <span className="text-xl font-semibold tabular-nums text-[#e9d7b0]" style={{ fontFamily: "var(--font-label)" }}>
                      {formatSpecimenPrice(specimen.priceCents)}
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/12 pt-3 text-sm">
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.16em] text-[#CADFE9]/75" style={{ fontFamily: "var(--font-label)" }}>Dimensions</dt>
                      <dd className="mt-0.5 tabular-nums text-[#FFFCF3]">
                        {specimen.heightFt != null && specimen.widthFt != null ? `${specimen.heightFt} ft × ${specimen.widthFt} ft` : "Pending"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.16em] text-[#CADFE9]/75" style={{ fontFamily: "var(--font-label)" }}>Profile</dt>
                      <dd className="mt-0.5 text-[#FFFCF3]">{specimen.shape}</dd>
                    </div>
                  </dl>
                </FolioPlate>

                <FolioPlate delay={0.17} reduced={reduced} className="nsf-glass-ice rounded-2xl p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#77001E]" style={{ fontFamily: "var(--font-label)" }}>
                    Fullness &amp; Botanical Character
                  </p>
                  <p className="mt-1 text-sm font-semibold">{specimen.fullness}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#283036]/90">{specimen.description}</p>
                </FolioPlate>

                <FolioPlate delay={0.26} reduced={reduced} className="nsf-glass-vellum space-y-3 rounded-2xl p-5">
                  {inSleigh ? (
                    <button
                      type="button"
                      onClick={() => { requestClose(false); setIsOpen(true); }}
                      className="min-h-[46px] w-full cursor-pointer rounded-xl bg-[#12673D] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#FFFCF3]"
                      style={{ fontFamily: "var(--font-label)" }}
                    >
                      Resting on Sleigh · Open Sleigh Cart
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

                  {hasMultiple && (
                    <div className="flex gap-2.5">
                      <button type="button" onClick={onPrev} className="min-h-[44px] flex-1 cursor-pointer rounded-xl border border-[#283036]/25 bg-white/45 px-3 text-xs font-semibold uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-label)" }}>
                        ← Previous
                      </button>
                      <button type="button" onClick={onNext} className="min-h-[44px] flex-1 cursor-pointer rounded-xl border border-[#283036]/25 bg-white/45 px-3 text-xs font-semibold uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-label)" }}>
                        Next →
                      </button>
                    </div>
                  )}
                </FolioPlate>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
