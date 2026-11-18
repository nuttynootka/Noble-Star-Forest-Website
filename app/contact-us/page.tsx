import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact Us — Noble Star Forest" };

export default function ContactUsPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <div className="nsf-glass-smoked rounded-3xl p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.22em] text-[#e9d7b0]" style={{ fontFamily: "var(--font-label)" }}>Concierge</p>
        <h1 className="mt-2 text-4xl font-medium text-[#FFFCF3]" style={{ fontFamily: "var(--font-display)" }}>Contact Noble Star Forest</h1>
        <p className="mt-4 text-base leading-relaxed text-[#CADFE9]/90">
          Direct phone, email, and conservatory inquiry controls will be finalized with your business contact details.
        </p>
      </div>
    </section>
  );
}
