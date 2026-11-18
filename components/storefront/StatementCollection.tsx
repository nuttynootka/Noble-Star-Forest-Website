"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { PREVIEW_SPECIMENS, fetchStorefrontTrees } from "@/lib/trees-api";
import type { TreeSpecimen } from "@/lib/types";
import { SpecimenCard, type SpecimenProportion } from "./SpecimenCard";
import { SpecimenDrawer } from "./SpecimenDrawer";

function proportionFor(index: number): SpecimenProportion {
  const mod = index % 4;
  if (mod === 0) return "focal";
  if (mod === 3) return "wide";
  return "tall";
}

function layoutSpanFor(index: number): string {
  const mod = index % 4;
  if (mod === 0) return "md:col-span-7";
  if (mod === 1) return "md:col-span-5 md:mt-16";
  if (mod === 2) return "md:col-span-5 md:col-start-2";
  return "md:col-span-6 md:mt-10";
}

export function StatementCollection() {
  const [trees, setTrees] = useState<TreeSpecimen[]>(PREVIEW_SPECIMENS);
  const [source, setSource] = useState<"live" | "preview">("preview");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchStorefrontTrees().then((res) => {
      if (!alive) return;
      setTrees(res.trees);
      setSource(res.source);
      const q = new URLSearchParams(window.location.search).get("tree");
      if (q && res.trees.some((t) => t.id === q || t.slug === q)) {
        const match = res.trees.find((t) => t.id === q || t.slug === q);
        if (match) setActiveId(match.id);
      }
    });
    return () => { alive = false; };
  }, []);

  const toggleFav = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const visibleTrees = useMemo(
    () => (favoritesOnly ? trees.filter((t) => favorites.includes(t.id)) : trees),
    [trees, favoritesOnly, favorites],
  );

  const activeIdx = visibleTrees.findIndex((t) => t.id === activeId);
  const activeSpecimen = activeIdx >= 0 ? visibleTrees[activeIdx] : null;
  const step = (delta: number) => {
    if (!visibleTrees.length || activeIdx < 0) return;
    setActiveId(visibleTrees[(activeIdx + delta + visibleTrees.length) % visibleTrees.length].id);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-8 sm:pt-10">
      {/* Asymmetric Editorial Prelude */}
      <section className="grid gap-8 md:grid-cols-12 md:items-end">
        <div className="space-y-4 md:col-span-7">
          <p className="text-xs uppercase tracking-[0.26em] text-[#e9d7b0]" style={{ fontFamily: "var(--font-label)" }}>
            The Winter Conservatory Collection
          </p>
          <h1 className="text-[clamp(2.4rem,7vw,4.35rem)] font-medium leading-[1.02] tracking-tight text-[#FFFCF3]" style={{ fontFamily: "var(--font-display)" }}>
            Singular Noble Firs, Selected as Living Architecture
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-[#CADFE9]/90">
            Twelve to fifteen extraordinary estate specimens—ranging from lush semi-full silhouettes to open, tiered designer forms—each individually photographed and priced.
          </p>
        </div>

        <aside className="md:col-span-5">
          <div className="nsf-glass-ice relative rounded-2xl p-5" style={{ "--gc": "255 206 120" } as CSSProperties}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#77001E]" style={{ fontFamily: "var(--font-label)" }}>
              {source === "live" ? "Live Conservatory Inventory" : "Stage 3 Visual Preview"}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[#283036]">
              {source === "live"
                ? "Select any specimen to unfold its full measurements, photography, and white-glove delivery estimate."
                : "Layout frames shown while awaiting your specimen photography, exact measurements, and retail pricing."}
            </p>
          </div>
        </aside>
      </section>

      {/* Curated Specimen Navigation Ribbon (No conventional filters) */}
      <nav aria-label="Curated specimen index" className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {trees.map((t) => {
            const label = `No. ${String(t.specimenNumber).padStart(2, "0")}`;
            const isSelected = activeId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveId(t.id)}
                className={`min-h-[44px] cursor-pointer rounded-full px-3.5 text-xs uppercase tracking-[0.14em] transition-colors ${
                  isSelected
                    ? "nsf-glass-ice font-semibold"
                    : "nsf-glass-smoked text-[#CADFE9] hover:border-[#e9d7b0]/45"
                }`}
                style={{ fontFamily: "var(--font-label)" }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setFavoritesOnly((v) => !v)}
          disabled={favorites.length === 0 && !favoritesOnly}
          className="nsf-glass-smoked min-h-[44px] cursor-pointer rounded-full px-4 text-xs uppercase tracking-[0.14em] text-[#e9d7b0] disabled:cursor-default disabled:opacity-50"
          style={{ fontFamily: "var(--font-label)" }}
        >
          {favoritesOnly ? "Show Full Collection" : `Compare Saved (${favorites.length})`}
        </button>
      </nav>

      {/* Asymmetric Staggered Specimen Showcase */}
      <section aria-label="Statement tree specimens" className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-12 md:items-start">
        {visibleTrees.map((specimen, idx) => (
          <SpecimenCard
            key={specimen.id}
            specimen={specimen}
            proportion={proportionFor(idx)}
            isFavorite={favorites.includes(specimen.id)}
            onToggleFavorite={toggleFav}
            onInspect={(s) => setActiveId(s.id)}
            className={layoutSpanFor(idx)}
          />
        ))}
      </section>

      <SpecimenDrawer
        specimen={activeSpecimen}
        onClose={() => setActiveId(null)}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        hasMultiple={visibleTrees.length > 1}
      />
    </div>
  );
}
