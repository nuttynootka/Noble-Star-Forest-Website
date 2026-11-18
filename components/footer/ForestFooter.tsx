"use client";

import { useRef, type CSSProperties } from "react";
import { GarlandBand, usePointerWarmth } from "@/components/garland-header";
import { TransitionLink } from "@/components/tree-transition";

export function ForestFooter() {
  const footerRef = useRef<HTMLElement>(null);
  usePointerWarmth(footerRef, true);

  return (
    <footer
      ref={footerRef}
      className="gh-root relative isolate z-20 mt-20 overflow-x-clip border-t border-white/10 bg-gradient-to-b from-[#08150f] via-[#060c0a] to-[#040706] text-[#FFFCF3]"
      style={{ "--g": "clamp(46px, 6vw, 72px)", "--gt": "0px" } as CSSProperties}
    >
      <GarlandBand seed={1226} className="pointer-events-none relative inset-x-0 z-10 h-[var(--g)] -translate-y-1/3" />

      <div className="mx-auto max-w-6xl px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-8">
        <div className="nsf-glass-smoked rounded-2xl p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 md:grid-cols-[1.3fr_1fr_1fr]">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[#CADFE9]" style={{ fontFamily: "var(--font-label)" }}>
                Noble Star Forest
              </p>
              <h2 className="text-2xl font-medium tracking-tight text-[#FFFCF3] sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                Statement Noble Firs, Curated One Specimen at a Time
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-[#CADFE9]/85">
                Every estate tree in our collection is individually photographed, measured, and prepared for white-glove delivery and installation.
              </p>
            </div>

            <nav aria-label="Footer navigation" className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#e9d7b0]" style={{ fontFamily: "var(--font-label)" }}>
                Storefront &amp; Inquiries
              </p>
              <ul className="space-y-2 text-sm text-[#FFFCF3]/90">
                <li><TransitionLink href="/" className="transition-colors hover:text-[#CADFE9]">Conservatory Home</TransitionLink></li>
                <li><TransitionLink href="/statement-trees" className="transition-colors hover:text-[#CADFE9]">Statement Trees Collection</TransitionLink></li>
                <li><TransitionLink href="/wreaths-and-greenery" className="transition-colors hover:text-[#CADFE9]">Wreaths &amp; Greenery</TransitionLink></li>
                <li><TransitionLink href="/make-payment" className="transition-colors hover:text-[#CADFE9]">Make Balance Payment</TransitionLink></li>
                <li><TransitionLink href="/request-quote" className="transition-colors hover:text-[#CADFE9]">Request Custom Quote</TransitionLink></li>
                <li><a href="https://wholesale.noblestarforest.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#CADFE9]">Wholesale Trees ↗</a></li>
              </ul>
            </nav>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#e9d7b0]" style={{ fontFamily: "var(--font-label)" }}>
                Policies &amp; Contact
              </p>
              <ul className="space-y-2 text-sm text-[#CADFE9]/85">
                <li><TransitionLink href="/meet-us" className="transition-colors hover:text-[#FFFCF3]">Meet Noble Star Forest</TransitionLink></li>
                <li><TransitionLink href="/contact-us" className="transition-colors hover:text-[#FFFCF3]">Contact &amp; Concierge</TransitionLink></li>
                <li className="pt-2 text-xs leading-relaxed text-[#CADFE9]/70">
                  Full-payment and deposit balances are settled securely via Stripe prior to scheduled delivery.
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 text-xs text-[#CADFE9]/70 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Noble Star Forest. All rights reserved.</span>
            <span style={{ fontFamily: "var(--font-label)" }} className="uppercase tracking-[0.14em]">noblestarforest.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
