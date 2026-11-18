import type { TreeSpecimen } from "./types";

/**
 * Preview frames shown only until live D1 inventory is populated in Stage 6.
 * No dimensions or retail prices are fabricated.
 */
export const PREVIEW_SPECIMENS: TreeSpecimen[] = [
  {
    id: "NSF-PREVIEW-01",
    slug: "specimen-01",
    specimenNumber: 1,
    name: "Specimen No. 01",
    heightFt: null,
    widthFt: null,
    shape: "Curated Estate Silhouette",
    fullness: "Awaiting specimen classification",
    description:
      "Placeholder layout frame for your first statement Noble Fir photograph, botanical notes, and authoritative retail pricing.",
    priceCents: null,
    imageUrl: null,
    galleryImageUrls: [],
    status: "preview",
    weightClass: "oversized",
  },
  {
    id: "NSF-PREVIEW-02",
    slug: "specimen-02",
    specimenNumber: 2,
    name: "Specimen No. 02",
    heightFt: null,
    widthFt: null,
    shape: "Tiered Designer Profile",
    fullness: "Awaiting specimen classification",
    description:
      "Placeholder layout frame demonstrating staggered asymmetric proportions and floating frosted-glass specification plates.",
    priceCents: null,
    imageUrl: null,
    galleryImageUrls: [],
    status: "preview",
    weightClass: "heavy",
  },
  {
    id: "NSF-PREVIEW-03",
    slug: "specimen-03",
    specimenNumber: 3,
    name: "Specimen No. 03",
    heightFt: null,
    widthFt: null,
    shape: "Open Conservatory Form",
    fullness: "Awaiting specimen classification",
    description:
      "Placeholder layout frame showing curated specimen navigation, favorite comparison, and wide editorial framing.",
    priceCents: null,
    imageUrl: null,
    galleryImageUrls: [],
    status: "preview",
    weightClass: "heavy",
  },
];

export async function fetchStorefrontTrees(): Promise<{
  trees: TreeSpecimen[];
  source: "live" | "preview";
}> {
  try {
    const res = await fetch("/api/trees", { cache: "no-store" });
    if (!res.ok) return { trees: PREVIEW_SPECIMENS, source: "preview" };
    const data = (await res.json()) as { trees?: TreeSpecimen[] };
    if (Array.isArray(data.trees) && data.trees.length > 0) {
      return { trees: data.trees, source: "live" };
    }
    return { trees: PREVIEW_SPECIMENS, source: "preview" };
  } catch {
    return { trees: PREVIEW_SPECIMENS, source: "preview" };
  }
}

export function formatSpecimenPrice(priceCents: number | null): string {
  if (priceCents == null) return "Price Pending";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}
