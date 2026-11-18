import type { Metadata } from "next";
import { TransitionLink } from "@/components/tree-transition";

export const metadata: Metadata = {
  title: "Wreaths & Greenery — Noble Star Forest",
};

export default function WreathsAndGreeneryPage() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <div className="nsf-glass-smoked rounded-3xl p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.22em] text-[#e9d7b0]" style={{ fontFamily: "var(--font-label)" }}>
          Botanical Conservatory
        </p>
        <h1 className="mt-2 text-4xl font-medium text-[#FFFCF3] sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
          Wreaths &amp; Greenery
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[#CADFE9]/90">
          Our dedicated Wreaths &amp; Greenery storefront—featuring the interactive winter door preview—is housed as its own companion collection.
        </p>
        <div className="mt-6">
          <TransitionLink
            href="/statement-trees"
            className="nsf-glass-vellum inline-flex min-h-[44px] items-center rounded-xl px-5 text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ fontFamily: "var(--font-label)" }}
          >
            Return to Statement Trees
          </TransitionLink>
        </div>
      </div>
    </section>
  );
}
