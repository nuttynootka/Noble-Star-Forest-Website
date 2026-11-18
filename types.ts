import type { AnchorHTMLAttributes, ComponentType, ReactNode } from "react";

export interface NavItem {
  href: string;
  label: string;
  external?: boolean;
}

export interface NavPage {
  label: string;
  href?: string;
  external?: boolean;
  items?: NavItem[];
}

export interface StarConfig {
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
}

export interface LightPoint {
  x: number;
  y: number;
  dur: number;
  delay: number;
  dense?: boolean;
}

export interface GlintPoint {
  x: number;
  y: number;
  kind: "star" | "fleck";
  size: number;
  dur: number;
  delay: number;
}

export interface TabPlacement {
  xNarrow: number;
  xWide: number;
  ribbonNarrow: string;
  ribbonWide: string;
  layer: number;
}

export type HeaderLinkComponent = ComponentType<
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
>;

export interface GarlandHeaderProps {
  pages: NavPage[];
  activeHref: string;
  garlandSrc?: string;
  garlandFit?: "cover" | "repeat";
  logoSrc?: string;
  logoRatio?: number;
  logoStar?: StarConfig;
  logoAlt?: string;
  logo?: ReactNode;
  homeHref?: string;
  LinkComponent?: HeaderLinkComponent;
  className?: string;
}