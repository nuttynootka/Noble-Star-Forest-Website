"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { PREVIEW_SPECIMENS, fetchStorefrontTrees } from "@/lib/trees-api";
import type { TreeSpecimen } from "@/lib/types";
import { SpecimenCard, type SpecimenProportion } from "./SpecimenCard";

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchStorefrontTrees().then((res) => {
      if (!alive) return;
      setTrees(res.trees);
      setSource(res.source);
      const q = new URLSearchParams(window.location.search).get("tree");
      if (q) {
        const match = res.trees.find((t) => t.id === q || t.slug === q);
        if (match) setExpandedId(match.id);
      }
    });
    return () => { alive = false; };
  }, []);

  const toggleFav = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const selectAndScroll = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    window.setTimeout(() => {
      document.getElementById(`specimen-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 60);
  }, []);

  const visibleTrees = useMemo(
    () => (favoritesOnly ? trees.filter((t) => favorites.includes(t.id)) : trees),
    [trees, favoritesOnly, favorites],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-8 sm:pt-10">
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
              {source === "live" ? "Live Conservatory Inventory" : "Stage 4 Interactive Preview"}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[#283036]">
              {source === "live"
                ? "Tap any specimen to unfold its measurements inline and place it onto your sleigh."
                : "Layout frames shown while awaiting your specimen photography, exact measurements, and retail pricing."}
            </p>
          </div>
        </aside>
      </section>

      <nav aria-label="Curated specimen index" className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {trees.map((t) => {
            const label = `No. ${String(t.specimenNumber).padStart(2, "0")}`;
            const isSelected = expandedId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectAndScroll(t.id)}
                className={`min-h-[44px] cursor-pointer rounded-full px-3.5 text-xs uppercase tracking-[0.14em] transition-colors ${
                  isSelected ? "nsf-glass-ice font-semibold" : "nsf-glass-smoked text-[#CADFE9] hover:border-[#e9d7b0]/45"
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

      <section aria-label="Statement tree specimens" className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-12 md:items-start">
        {visibleTrees.map((specimen, idx) => (
          <SpecimenCard
            key={specimen.id}
            specimen={specimen}
            proportion={proportionFor(idx)}
            expanded={expandedId === specimen.id}
            isFavorite={favorites.includes(specimen.id)}
            onToggleFavorite={toggleFav}
            onToggleExpand={selectAndScroll}
            className={layoutSpanFor(idx)}
          />
        ))}
      </section>
    </div>
  );
}
