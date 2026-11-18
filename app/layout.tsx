import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Cuprum, Trirong } from "next/font/google";
import type { ReactNode } from "react";
import { TreeTransitionProvider } from "@/components/tree-transition";
import { SiteShell } from "@/components/layout/SiteShell";
import "./globals.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-cormorant", display: "swap" });
const trirong = Trirong({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-trirong", display: "swap" });
const cuprum = Cuprum({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-cuprum", display: "swap" });

export const metadata: Metadata = {
  title: "Noble Star Forest — Statement Noble Fir Christmas Trees",
  description: "Individually curated, extra-large Noble Fir statement Christmas trees with bespoke delivery and installation.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#060c0a" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${trirong.variable} ${cuprum.variable}`}>
      <body>
        <TreeTransitionProvider><SiteShell>{children}</SiteShell></TreeTransitionProvider>
      </body>
    </html>
  );
}
