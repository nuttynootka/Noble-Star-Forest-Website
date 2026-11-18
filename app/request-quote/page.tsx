import type { Metadata } from "next";

export const metadata: Metadata = { title: "Request Quote — Noble Star Forest" };

export default function RequestQuotePage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <div className="nsf-glass-smoked rounded-3xl p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.22em] text-[#e9d7b0]" style={{ fontFamily: "var(--font-label)" }}>Bespoke Delivery &amp; Installation</p>
        <h1 className="mt-2 text-4xl font-medium text-[#FFFCF3]" style={{ fontFamily: "var(--font-display)" }}>Request a Custom Quote</h1>
        <p className="mt-4 text-base leading-relaxed text-[#CADFE9]/90">
          Orders requiring custom rigging, non-standard heights, or special site access automatically route here with your selected trees and address preserved.
        </p>
        <div className="nsf-glass-vellum mt-6 rounded-2xl p-4 text-sm">
          Manual quote capture &amp; D1 storage will connect in <strong>Stage 5</strong>.
        </div>
      </div>
    </section>
  );
}
