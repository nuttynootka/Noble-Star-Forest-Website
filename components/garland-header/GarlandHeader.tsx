"use client";

import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState, type AnchorHTMLAttributes, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { GarlandBand } from "./GarlandCanvas";
import { LadderPhysics, ladderCloseDurationSec, usePendulum, usePointerWarmth, useReducedMotion } from "./physics";
import type { GarlandHeaderProps, GlintPoint, HeaderLinkComponent, NavItem, StarConfig, TabPlacement } from "./types";
import { DEFAULT_BRAND, GLINT_COLORS, computePlacement, cx, fnv1a, makeGlints } from "./utils";

const FADE_MS = 150;
const FADE_GAP_MS = FADE_MS + 10;
const SWITCH_MENU_MS = 750;

function swapCenter(order: number[], targetIdx: number): number[] {
  const next = [...order];
  const pos = next.indexOf(targetIdx);
  if (pos >= 0 && pos !== 1) {
    [next[1], next[pos]] = [next[pos], next[1]];
  }
  return next;
}

function useTabSwapper({
  count,
  viewed,
  hasMenu,
  activate,
  enabled,
}: {
  count: number;
  viewed: number | null;
  hasMenu: boolean[];
  activate: (pageIdx: number) => void;
  enabled: boolean;
}) {
  const base = Array.from({ length: count }, (_, i) => i);
  const [initial] = useState(() => (viewed != null ? swapCenter(base, viewed) : base));
  const [display, setDisplay] = useState(initial);
  const [fading, setFading] = useState(() => base.map(() => false));
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const viewedRef = useRef(initial);
  const displayRef = useRef(initial);
  const fadingRef = useRef(base.map(() => false));
  const openRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const activateRef = useRef(activate);
  activateRef.current = activate;
  const menuFlagsRef = useRef(hasMenu);
  menuFlagsRef.current = hasMenu;

  const setDisp = (v: number[]) => {
    displayRef.current = v;
    setDisplay(v);
  };
  const setFade = (v: boolean[]) => {
    fadingRef.current = v;
    setFading(v);
  };
  const setOpen = (v: number | null) => {
    openRef.current = v;
    setOpenIdx(v);
  };
  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const transition = useCallback(
    (nextOrder: number[], nextOpen: number | null, closeFirst: boolean, afterSwap?: () => void) => {
      clearTimers();
      const prevOpen = openRef.current;
      if (closeFirst) setOpen(null);
      const menuWait = closeFirst && prevOpen !== null && prevOpen !== nextOpen ? SWITCH_MENU_MS : 0;
      const changed = displayRef.current.map((val, idx) => val !== nextOrder[idx] || fadingRef.current[idx]);
      if (!changed.some(Boolean)) {
        if (nextOpen !== null) {
          if (menuWait) later(() => setOpen(nextOpen), menuWait);
          else setOpen(nextOpen);
        }
        afterSwap?.();
        return;
      }
      setFade(changed);
      later(() => {
        setDisp(nextOrder);
        setFade(nextOrder.map(() => false));
      }, FADE_GAP_MS);
      const swapDone = FADE_GAP_MS + FADE_MS;
      if (nextOpen !== null) later(() => setOpen(nextOpen), Math.max(swapDone, menuWait));
      if (afterSwap) later(afterSwap, swapDone);
    },
    [],
  );

  const closeAll = useCallback(() => {
    transition(viewedRef.current, null, true);
  }, [transition]);

  const tap = useCallback(
    (slotPos: number) => {
      const pageIdx = displayRef.current[slotPos];
      const currentOrder = viewedRef.current;
      if (slotPos === 1 && openRef.current === pageIdx) {
        closeAll();
        return;
      }
      if (currentOrder.indexOf(pageIdx) === 1) {
        transition(currentOrder, menuFlagsRef.current[pageIdx] ? pageIdx : null, true);
        return;
      }
      const nextOrder = swapCenter(currentOrder, pageIdx);
      if (menuFlagsRef.current[pageIdx]) {
        transition(nextOrder, pageIdx, true);
      } else {
        transition(nextOrder, null, true, () => {
          viewedRef.current = nextOrder;
          activateRef.current(pageIdx);
        });
      }
    },
    [closeAll, transition],
  );

  const select = useCallback(() => {
    clearTimers();
    viewedRef.current = [...displayRef.current];
    setOpen(null);
  }, []);

  useEffect(() => {
    if (!enabled || viewed == null || viewedRef.current[1] === viewed) return;
    const nextOrder = swapCenter(viewedRef.current, viewed);
    viewedRef.current = nextOrder;
    transition(nextOrder, null, true);
  }, [viewed, enabled, transition]);

  useEffect(() => () => clearTimers(), []);

  return { display, fading, openIdx, tap, closeAll, select };
}

function HeaderPlate({
  label,
  current,
  glints,
  sizerLabels,
  fading = false,
}: {
  label: string;
  current: boolean;
  glints: GlintPoint[];
  sizerLabels?: string[];
  fading?: boolean;
}) {
  return (
    <>
      <span className="relative flex h-full items-center justify-center overflow-hidden rounded-[6.5px] border border-white/20 bg-white/10 shadow-lg backdrop-blur-md">
        <span aria-hidden="true" className={cx("gh-frost-glass absolute inset-0", current && "is-active")} />
        <span
          className={cx(
            "gh-etched relative grid px-[7px] text-center font-semibold uppercase leading-none tracking-[0.06em] whitespace-nowrap",
            "font-[family-name:var(--gh-font)] text-[length:var(--menu-font)]",
          )}
        >
          {sizerLabels?.map((txt) => (
            <span key={txt} aria-hidden="true" className="invisible col-start-1 row-start-1">
              {txt}
            </span>
          ))}
          <span className={cx("col-start-1 row-start-1 transition-opacity duration-150 ease-linear", fading && "opacity-0")}>
            {label}
          </span>
        </span>
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0">
        {glints.slice(0, 4).map((g, i) => (
          <span
            key={i}
            className="gh-tiny gh-tiny-soft"
            style={
              {
                left: `${g.x}%`,
                top: `${g.y}%`,
                "--ts": g.kind === "star" ? "7px" : "4.5px",
                "--dur": `${(g.dur * 1.6).toFixed(2)}s`,
                "--delay": `${g.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </span>
    </>
  );
}

function HeaderLadder({
  id,
  label,
  items,
  open,
  activeHref,
  Link,
  onSelect,
}: {
  id: string;
  label: string;
  items: NavItem[];
  open: boolean;
  activeHref: string;
  Link: HeaderLinkComponent;
  onSelect: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const plateRefs = useRef<Array<HTMLDivElement | null>>([]);
  const chainRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const physRef = useRef<LadderPhysics | null>(null);
  const reduced = useReducedMotion();
  const glintsList = useMemo(() => items.map((it) => makeGlints(fnv1a(it.href))), [items]);

  const measure = useCallback(() => {
    const phys = physRef.current;
    const first = plateRefs.current[0];
    if (!phys || !first) return;
    const widths = plateRefs.current.slice(0, items.length).map((el) => el?.offsetWidth ?? 160);
    phys.setGeometry(widths, first.offsetHeight, 22);
  }, [items.length]);

  useEffect(() => {
    const plates = plateRefs.current.slice(0, items.length).filter(Boolean) as HTMLElement[];
    if (plates.length !== items.length) return;
    const chains: Array<[HTMLElement | null, HTMLElement | null]> = items.map((_, i) => [
      chainRefs.current[i * 2] ?? null,
      chainRefs.current[i * 2 + 1] ?? null,
    ]);
    const phys = new LadderPhysics({ plates, chains, reducedMotion: false });
    physRef.current = phys;
    measure();
    const ro = new ResizeObserver(measure);
    plates.forEach((el) => ro.observe(el));
    return () => {
      ro.disconnect();
      phys.destroy();
      physRef.current = null;
    };
  }, [items, measure]);

  useEffect(() => {
    physRef.current?.setReducedMotion(reduced);
  }, [reduced]);

  useEffect(() => {
    if (wrapRef.current) wrapRef.current.inert = !open;
    const phys = physRef.current;
    if (!phys) return;
    if (open) {
      measure();
      phys.open();
    } else {
      phys.close();
    }
  }, [open, measure]);

  const onMovePlate = (idx: number) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" || (!e.movementX && !e.movementY) || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const clamp = (v: number) => Math.max(-260, Math.min(260, v));
    physRef.current?.poke(idx, e.clientX - rect.left, e.clientY - rect.top, clamp(e.movementX * 14), clamp(e.movementY * 7));
  };

  const onDownPlate = (idx: number) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const box = e.currentTarget.getBoundingClientRect();
    const side = e.clientX < box.left + box.width / 2 ? 1 : -1;
    physRef.current?.poke(idx, e.clientX - rect.left, e.clientY - rect.top, side * 220, -30);
  };

  return (
    <div
      ref={wrapRef}
      id={id}
      role="group"
      aria-label={`${label} menu`}
      data-open={open ? "true" : "false"}
      className="gh-ladder absolute top-0 z-0"
      style={
        {
          "--n": items.length,
          "--close-ms": `${Math.round(ladderCloseDurationSec(items.length) * 1000)}ms`,
        } as CSSProperties
      }
    >
      {items.map((item, i) => (
        <span key={`c-${item.href}`} aria-hidden="true">
          <span
            ref={(el) => {
              chainRefs.current[i * 2] = el;
            }}
            className="gh-chain"
          />
          <span
            ref={(el) => {
              chainRefs.current[i * 2 + 1] = el;
            }}
            className="gh-chain"
          />
        </span>
      ))}

      {items.map((item, i) => {
        const current = activeHref === item.href;
        const isExt = item.external || item.href.startsWith("http");
        const plateClass = cx(
          "gh-menu-plate group/plate relative block h-[var(--menu-h)] rounded-[8px] p-[1.5px] outline-none",
          "[-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-[#FFF5EB]/80",
          current && "is-current",
        );

        return (
          <div
            key={item.href}
            ref={(el) => {
              plateRefs.current[i] = el;
            }}
            className="gh-plate-body absolute left-0 top-0 w-max origin-top"
            style={{ "--gc": GLINT_COLORS[i % GLINT_COLORS.length] } as CSSProperties}
            onPointerMove={onMovePlate(i)}
            onPointerDown={onDownPlate(i)}
          >
            {isExt ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onSelect}
                className={plateClass}
              >
                <HeaderPlate label={item.label} current={false} glints={glintsList[i]} />
              </a>
            ) : (
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                onClick={onSelect}
                className={plateClass}
              >
                <HeaderPlate label={item.label} current={current} glints={glintsList[i]} />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HeaderTab({
  pos,
  label,
  sizerLabels,
  fading,
  current,
  expanded,
  controls,
  onPress,
  placement,
  motion,
  children,
}: {
  pos: number;
  label: string;
  sizerLabels: string[];
  fading: boolean;
  current: boolean;
  expanded?: boolean;
  controls?: string;
  onPress: () => void;
  placement: TabPlacement;
  motion: boolean;
  children?: ReactNode;
}) {
  const glints = useMemo(() => makeGlints(fnv1a(`tab-${pos}`)), [pos]);
  const { ref, kick } = usePendulum(motion);

  const onEnter = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "touch") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dir = e.movementX !== 0 ? Math.sign(e.movementX) : e.clientX < rect.left + rect.width / 2 ? 1 : -1;
    kick(-dir * (0.32 + Math.min(Math.abs(e.movementX), 30) * 0.008));
  };

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    kick(e.clientX < rect.left + rect.width / 2 ? -0.38 : 0.38);
  };

  return (
    <li
      data-tab={pos}
      className="absolute top-[calc(var(--gt)+var(--g)*0.6)] w-max -translate-x-1/2 left-[var(--xn)] lg:left-[var(--xw)]"
      style={
        {
          "--xn": `${placement.xNarrow}%`,
          "--xw": `${placement.xWide}%`,
          "--rn": placement.ribbonNarrow,
          "--rw": placement.ribbonWide,
          "--xfn": placement.xNarrow / 100,
          "--xfw": placement.xWide / 100,
          "--gc": GLINT_COLORS[pos % GLINT_COLORS.length],
          zIndex: placement.layer,
        } as CSSProperties
      }
    >
      <div ref={ref} data-active={current ? "true" : "false"} className="gh-tab group relative z-[1] origin-top">
        <span aria-hidden="true" className="relative block h-[calc(var(--g)*0.4+var(--rn))] w-full lg:h-[calc(var(--g)*0.4+var(--rw))]">
          <span className="gh-tab-chain left-[20%]" />
          <span className="gh-tab-chain right-[20%]" />
        </span>
        <span className="relative block">
          <span aria-hidden="true" className="gh-aura pointer-events-none absolute -inset-x-[40%] -inset-y-[120%] rounded-full" />
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={controls}
            aria-current={current ? "page" : undefined}
            onClick={onPress}
            onPointerEnter={motion ? onEnter : undefined}
            onPointerDown={motion ? onDown : undefined}
            className={cx(
              "gh-menu-plate gh-tab-plate group/plate relative block h-[var(--menu-h)] min-w-[56px] cursor-pointer rounded-[8px] border-0 p-[1.5px] outline-none",
              "[-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-[#FFF5EB]/80",
              (current || expanded) && "is-current",
            )}
          >
            <HeaderPlate label={label} current={current} glints={glints} sizerLabels={sizerLabels} fading={fading} />
          </button>
        </span>
      </div>
      {children}
    </li>
  );
}

function BrandStar({ star }: { star: StarConfig }) {
  return (
    <span
      aria-hidden="true"
      className="gh-star pointer-events-none absolute"
      style={{ left: `${star.left}%`, top: `${star.top}%`, width: `${star.width}%`, height: `${star.height}%` }}
    >
      <span className="gh-star-centre absolute" style={{ left: `${star.cx}%`, top: `${star.cy}%` }}>
        <span className="gh-star-halo gh-star-halo-warm" />
        <span className="gh-star-halo gh-star-halo-ice" />
      </span>
      <img src={star.src} alt="" draggable={false} className="gh-star-img absolute inset-0 h-full w-full" />
      <span className="gh-star-centre absolute" style={{ left: `${star.cx}%`, top: `${star.cy}%` }}>
        <span className="gh-star-ray gh-star-ray-v" />
        <span className="gh-star-ray gh-star-ray-h" />
        <span className="gh-star-ray gh-star-ray-d1" />
        <span className="gh-star-ray gh-star-ray-d2" />
        <span className="gh-star-core" />
      </span>
    </span>
  );
}

function BrandSign({
  href,
  logo,
  logoSrc,
  logoAlt,
  ratio,
  star,
  Link,
}: {
  href: string;
  logo?: ReactNode;
  logoSrc: string;
  logoAlt: string;
  ratio: number;
  star?: StarConfig;
  Link: HeaderLinkComponent;
}) {
  return (
    <Link
      href={href}
      aria-label={`${logoAlt}, home`}
      className="absolute left-1/2 top-[var(--sign-top)] z-20 block h-[var(--sign-h)] -translate-x-1/2 outline-none focus-visible:ring-2 focus-visible:ring-[#FFF5EB]/80 focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b1a14]"
    >
      <span className="relative block h-full" style={{ aspectRatio: String(ratio) }}>
        {logo ?? (
          <img
            src={logoSrc}
            alt={logoAlt}
            draggable={false}
            className="block h-full w-full object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,0.65)]"
          />
        )}
        {star && <BrandStar star={star} />}
      </span>
    </Link>
  );
}

function AmbientGlows() {
  const spots = [
    { x: 6, y: 62, s: 46, o: 0.1 },
    { x: 18, y: 30, s: 22, o: 0.12 },
    { x: 29, y: 78, s: 34, o: 0.07 },
    { x: 43, y: 55, s: 18, o: 0.1 },
    { x: 57, y: 82, s: 40, o: 0.06 },
    { x: 68, y: 40, s: 26, o: 0.1 },
    { x: 80, y: 70, s: 52, o: 0.08 },
    { x: 93, y: 35, s: 24, o: 0.11 },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      {spots.map((sp, i) => (
        <span
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFE7CC] blur-md"
          style={{ left: `${sp.x}%`, top: `${sp.y}%`, width: sp.s, height: sp.s, opacity: sp.o }}
        />
      ))}
    </div>
  );
}

const DefaultLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>(
  function DefaultLink(props, ref) {
    return <a ref={ref} {...props} />;
  },
);

function matchPath(current: string, target: string) {
  const norm = (s: string) => (s.length > 1 && s.endsWith("/") ? s.slice(0, -1) : s);
  const c = norm(current);
  const t = norm(target);
  return t === "/" ? c === "/" : c === t || c.startsWith(`${t}/`);
}

export function GarlandHeader({
  pages,
  activeHref,
  garlandSrc,
  garlandFit = "cover",
  logoSrc = DEFAULT_BRAND.src,
  logoRatio = DEFAULT_BRAND.ratio,
  logoStar = logoSrc === DEFAULT_BRAND.src ? DEFAULT_BRAND.star : undefined,
  logoAlt = "Noble Star Forest",
  logo,
  homeHref = "/",
  LinkComponent = DefaultLink,
  className,
}: GarlandHeaderProps) {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const placement = useMemo(() => computePlacement(), []);
  const menuIdBase = useId();

  const viewedIdx = pages.findIndex((p) =>
    p.items ? p.items.some((it) => !it.external && matchPath(activeHref, it.href)) : p.href ? matchPath(activeHref, p.href) : false,
  );

  const nav = useTabSwapper({
    count: pages.length,
    viewed: viewedIdx >= 0 ? viewedIdx : null,
    hasMenu: pages.map((p) => Boolean(p.items)),
    activate: (pageIdx) => {
      rootRef.current?.querySelector<HTMLAnchorElement>(`[data-go="${pageIdx}"] a`)?.click();
    },
    enabled: true,
  });

  usePointerWarmth(rootRef, true);

  useEffect(() => {
    if (nav.openIdx === null) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest?.("[data-tab]")) nav.closeAll();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") nav.closeAll();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [nav.openIdx, nav]);

  return (
    <header
      ref={rootRef}
      className={cx(
        "gh-root @container relative isolate z-30 w-full select-none overflow-x-clip text-[#FFF8F0]",
        "[--sign-h:116px] sm:[--sign-h:132px] md:[--sign-h:152px] lg:[--sign-h:168px] xl:[--sign-h:184px]",
        "[--g:calc(var(--sign-h)*0.375)] [--sign-top:4px] [--gt:calc(var(--sign-top)+var(--sign-h)/2-var(--g)/2)]",
        "[--label-size:12px] md:[--label-size:13px] lg:[--label-size:14px]",
        "[--menu-h:26px] [--menu-font:var(--label-size)] md:[--menu-h:28px]",
        "[--tab-h:calc(var(--menu-h)-18px)]",
        "h-[calc(var(--gt)+var(--g)+var(--rib-n)+var(--tab-h)+30px)] lg:h-[calc(var(--gt)+var(--g)+var(--rib-w)+var(--tab-h)+36px)]",
        className,
      )}
      style={
        {
          "--rib-n": placement.maxNarrow,
          "--rib-w": placement.maxWide,
        } as CSSProperties
      }
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[radial-gradient(130%_90%_at_50%_-10%,#173a2b_0%,#0b1a14_45%,#060c0a_100%)]"
      />
      <AmbientGlows />
      <BrandSign href={homeHref} logo={logo} logoSrc={logoSrc} logoAlt={logoAlt} ratio={logoRatio} star={logoStar} Link={LinkComponent} />

      {pages.map((p, idx) =>
        !p.items ? (
          <span key={p.label} data-go={idx} inert className="sr-only">
            <LinkComponent href={p.href ?? "/"}>{p.label}</LinkComponent>
          </span>
        ) : null,
      )}

      <nav aria-label="Main">
        <ul className="m-0 list-none p-0">
          {[0, 1, 2].map((slot) => {
            const pageIdx = nav.display[slot];
            const page = pages[pageIdx];
            if (!page) return null;
            return (
              <HeaderTab
                key={slot}
                pos={slot}
                label={page.label}
                sizerLabels={pages.map((p) => p.label)}
                fading={nav.fading[slot]}
                current={slot === 1}
                expanded={page.items ? nav.openIdx === pageIdx : undefined}
                controls={page.items ? `${menuIdBase}-menu-${pageIdx}` : undefined}
                onPress={() => nav.tap(slot)}
                placement={placement.tabs[slot]}
                motion={!reduced}
              >
                {slot === 1 &&
                  pages.map((p, idx) =>
                    p.items ? (
                      <HeaderLadder
                        key={p.label}
                        id={`${menuIdBase}-menu-${idx}`}
                        label={p.label}
                        items={p.items}
                        open={nav.openIdx === idx}
                        activeHref={activeHref}
                        Link={LinkComponent}
                        onSelect={nav.select}
                      />
                    ) : null,
                  )}
              </HeaderTab>
            );
          })}
        </ul>
      </nav>

      <GarlandBand src={garlandSrc} fit={garlandFit} />
    </header>
  );
}
