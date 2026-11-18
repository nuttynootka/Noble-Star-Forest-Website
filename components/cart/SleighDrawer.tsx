"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotionConfig } from "framer-motion";
import { formatSpecimenPrice } from "@/lib/trees-api";
import { useCart } from "./CartContext";

export function SleighDrawer() {
  const { items, isOpen, setIsOpen, removeTree, subtotalCents, hasPendingPrices } = useCart();
  const [paymentChoice, setPaymentChoice] = useState<"full" | "deposit">("full");
  const reduced = useReducedMotionConfig() ?? false;

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, setIsOpen]);

  const subtotalText =
    items.length === 0 ? "$0" : hasPendingPrices && subtotalCents === 0 ? "Pending Pricing" : formatSpecimenPrice(subtotalCents);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Santa Sleigh Shopping Cart"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex items-end justify-end bg-[#060c0a]/75 backdrop-blur-sm sm:p-5"
          onClick={() => setIsOpen(false)}
        >
          <motion.aside
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.97 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="nsf-glass-smoked flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl sm:max-w-lg sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#e9d7b0]" style={{ fontFamily: "var(--font-label)" }}>
                  Your Winter Cargo
                </p>
                <h2 className="text-2xl font-medium text-[#FFFCF3]" style={{ fontFamily: "var(--font-display)" }}>
                  Sleigh Manifest ({items.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close sleigh cart"
                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/40 text-[#FFFCF3] hover:bg-black/65"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
              {items.length === 0 ? (
                <div className="nsf-glass-vellum rounded-2xl p-5 text-sm leading-relaxed">
                  Your antique sleigh is currently empty. Unfold any Noble Fir specimen to inspect its dimensions and place it onto the sleigh.
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((t) => {
                    const num = String(t.specimenNumber).padStart(2, "0");
                    const dims = t.heightFt && t.widthFt ? `${t.heightFt} ft × ${t.widthFt} ft` : "Dimensions Pending";
                    return (
                      <li key={t.id} className="flex items-start justify-between gap-3 rounded-2xl border border-white/12 bg-black/25 p-3.5">
                        <div className="space-y-1">
                          <span className="text-[11px] uppercase tracking-[0.16em] text-[#CADFE9]" style={{ fontFamily: "var(--font-label)" }}>
                            Specimen No. {num} · Qty 1
                          </span>
                          <p className="text-lg font-medium text-[#FFFCF3]" style={{ fontFamily: "var(--font-display)" }}>
                            {t.name}
                          </p>
                          <p className="text-xs text-[#CADFE9]/80" style={{ fontFamily: "var(--font-label)" }}>
                            {dims} · {t.shape}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-sm font-semibold tabular-nums text-[#e9d7b0]" style={{ fontFamily: "var(--font-label)" }}>
                            {formatSpecimenPrice(t.priceCents)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeTree(t.id)}
                            className="min-h-[36px] cursor-pointer rounded-lg border border-white/15 px-2.5 text-[11px] uppercase tracking-[0.12em] text-[#CADFE9] hover:border-[#77001E] hover:bg-[#77001E]/40 hover:text-[#FFFCF3]"
                            style={{ fontFamily: "var(--font-label)" }}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Financial Ledger & Stage 5/7 Slots */}
              <div className="nsf-glass-vellum space-y-3 rounded-2xl p-4 text-sm">
                <div className="flex justify-between">
                  <span>Trees Subtotal</span>
                  <span className="font-semibold tabular-nums" style={{ fontFamily: "var(--font-label)" }}>{subtotalText}</span>
                </div>
                <div className="flex justify-between text-[#283036]/80">
                  <span>Delivery &amp; Installation</span>
                  <span className="text-xs uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-label)" }}>Stage 5 Engine</span>
                </div>
                <div className="flex justify-between text-[#283036]/80">
                  <span>Applicable Taxes</span>
                  <span className="text-xs uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-label)" }}>At Checkout</span>
                </div>
                <div className="flex justify-between border-t border-[#283036]/15 pt-2.5 text-base font-semibold">
                  <span>Estimated Total</span>
                  <span className="tabular-nums" style={{ fontFamily: "var(--font-label)" }}>{subtotalText}</span>
                </div>

                <div className="border-t border-[#283036]/15 pt-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: "var(--font-label)" }}>
                    Payment Preference
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["full", "deposit"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPaymentChoice(opt)}
                        className={`min-h-[40px] cursor-pointer rounded-xl border px-3 text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
                          paymentChoice === opt
                            ? "border-[#004323] bg-[#004323] text-[#FFFCF3]"
                            : "border-[#283036]/25 bg-white/40 text-[#283036]"
                        }`}
                        style={{ fontFamily: "var(--font-label)" }}
                      >
                        {opt === "full" ? "Pay in Full" : "Reserve w/ Deposit"}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2.5 flex justify-between text-xs text-[#283036]/85">
                    <span>{paymentChoice === "full" ? "Amount Due at Checkout" : "Deposit & Remaining Balance"}</span>
                    <span style={{ fontFamily: "var(--font-label)" }}>
                      {paymentChoice === "full" ? subtotalText : "Configurable in Stage 7"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
