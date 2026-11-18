"use client";

import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { GarlandHeader, type NavPage } from "@/components/garland-header";
import { TransitionLink } from "@/components/tree-transition";
import { Snowfall } from "@/components/atmosphere/Snowfall";
import { AmbientLights } from "@/components/atmosphere/AmbientLights";
import { ForestFooter } from "@/components/footer/ForestFooter";

const NAV_PAGES: NavPage[] = [
  {
    label: "Shop",
    items: [
      { href: "/statement-trees", label: "Statement Trees" },
      { href: "https://wholesale.noblestarforest.com", label: "Wholesale Trees", external: true },
      { href: "/wreaths-and-greenery", label: "Wreaths & Greenery" },
      { href: "/make-payment", label: "Make Payment" },
    ],
  },
  { href: "/", label: "Home" },
  {
    label: "Us",
    items: [
      { href: "/meet-us", label: "Meet Us" },
      { href: "/contact-us", label: "Contact Us" },
      { href: "/request-quote", label: "Request Quote" },
    ],
  },
];

const HeaderNavLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>(
  function HeaderNavLink({ href, ...rest }, ref) {
    if (href.startsWith("http")) return <a ref={ref} href={href} {...rest} />;
    return <TransitionLink ref={ref} href={href} {...rest} />;
  },
);

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0"><Snowfall /></div>
      <AmbientLights />
      <GarlandHeader pages={NAV_PAGES} activeHref={pathname} LinkComponent={HeaderNavLink} />
      <main className="relative z-10 flex-1">{children}</main>
      <ForestFooter />
    </div>
  );
}
