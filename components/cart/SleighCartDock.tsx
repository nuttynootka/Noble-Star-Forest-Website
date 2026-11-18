"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useReducedMotionConfig } from "framer-motion";
import { formatSpecimenPrice } from "@/lib/trees-api";
import { AntiqueSleighSvg } from "./AntiqueSleighSvg";
import { useCart } from "./CartContext";

export function SleighCartDock() {
  const { items, isOpen, setIsOpen, subtotalCents, hasPendingPrices, motionEvent } = useCart();
  const reduced = useReducedMotionConfig() ?? false;

  const dropY = useMotionValue(0);
  const rock = useMotionValue(0);
  const shiftX = useMotionValue(0);
  const wheelAngle = useMotionValue(0);
  const glint = useMotionValue(0);
  const lastNonce = useRef(0);

  useEffect(() => {
    if (!motionEvent || motionEvent.nonce === lastNonce.current) return;
    lastNonce.current = motionEvent.nonce;
    if (reduced) return;

    const w = motionEvent.weight;
    if (motionEvent.type === "add") {
      dropY.set(6.5 * w);
      animate(dropY, 0, { type: "spring", stiffness: 320, damping: 12, mass: 1 });
      rock.set(-7 * w);
      animate(rock, 0, { type: "spring", stiffness: 160, damping: 8, mass: 1.1 });
      shiftX.set(-6 * w);
      animate(shiftX, 0, { type: "spring", stiffness: 200, damping: 14 });
      animate(wheelAngle, wheelAngle.get() + 145 * w, { type: "spring", stiffness: 130, damping: 15 });
      glint.set(1);
      animate(glint, 0, { duration: 0.75, ease: "easeOut" });
    } else {
      dropY.set(-5 * w);
      animate(dropY, 0, { type: "spring", stiffness: 300, damping: 13 });
      rock.set(5 * w);
      animate(rock, 0, { type: "spring", stiffness: 170, damping: 10 });
      animate(wheelAngle, wheelAngle.get() - 95 * w, { type: "spring", stiffness: 130, damping: 15 });
    }
  }, [motionEvent, reduced, dropY, rock, shiftX, wheelAngle, glint]);

  const totalLabel =
    items.length === 0
      ? "Empty"
      : hasPendingPrices && subtotalCents === 0
        ? "Preview"
        : formatSpecimenPrice(subtotalCents);

  return (
    <div className="pointer-events-none fixed bottom-[max(14px,env(safe-area-inset-bottom))] right-3 z-40 sm:bottom-6 sm:right-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`Open sleigh cart: ${items.length} ${items.length === 1 ? "tree" : "trees"}, ${totalLabel}`}
        className="nsf-glass-smoked pointer-events-auto group relative flex min-h-[56px] cursor-pointer items-center gap-2.5 rounded-2xl px-3.5 py-2 pr-4 transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9d7b0]"
      >
        {/* Golden arrival shimmer */}
        <motion.span
          aria-hidden="true"
          style={{ opacity: glint }}
          className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_35%_45%,rgba(233,215,176,0.45),transparent_70%)]"
        />

        {/* Physical Sleigh Carriage */}
        <motion.div
          animate={!reduced && items.length > 0 ? { rotate: [-0.8, 0.8, -0.8] } : { rotate: 0 }}
          transition={!reduced && items.length > 0 ? { duration: 4.2, repeat: Infinity, ease: "easeInOut" } : undefined}
          className="relative w-[78px] shrink-0 sm:w-[88px]"
        >
          <motion.div style={{ y: dropY, x: shiftX, rotate: rock, transformOrigin: "50% 85%" }}>
            <AntiqueSleighSvg treeCount={items.length} wheelAngle={wheelAngle} className="h-auto w-full" />
          </motion.div>
          <span
            className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[#e9d7b0]/70 bg-[#77001E] px-1 text-[11px] font-semibold tabular-nums text-[#FFFCF3] shadow"
            style={{ fontFamily: "var(--font-label)" }}
          >
            {items.length}
          </span>
        </motion.div>

        <div className="flex flex-col items-start text-left">
          <span
            className="text-[10px] uppercase tracking-[0.2em] text-[#CADFE9]/80"
            style={{ fontFamily: "var(--font-label)" }}
          >
            Sleigh Cart
          </span>
          <span
            className="text-sm font-semibold tabular-nums text-[#e9d7b0]"
            style={{ fontFamily: "var(--font-label)" }}
          >
            {totalLabel}
          </span>
        </div>
      </button>
    </div>
  );
}
