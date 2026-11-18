import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Make Balance Payment — Noble Star Forest",
};

export default function MakePaymentPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <div className="nsf-glass-smoked rounded-3xl p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.22em] text-[#e9d7b0]" style={{ fontFamily: "var(--font-label)" }}>
          Order Settlement
        </p>
        <h1 className="mt-2 text-4xl font-medium text-[#FFFCF3]" style={{ fontFamily: "var(--font-display)" }}>
          Make a Balance Payment
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#CADFE9]/90">
          Customers who reserved a statement tree with a deposit will look up their order code here to settle the remaining balance securely via Stripe prior to delivery.
        </p>
        <div className="nsf-glass-vellum mt-6 rounded-2xl p-4 text-sm">
          Order lookup &amp; Stripe balance checkout will connect in <strong>Stage 7</strong>.
        </div>
      </div>
    </section>
  );
}
