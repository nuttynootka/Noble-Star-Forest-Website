export type TreeStatus = "available" | "reserved" | "sold" | "preview";

export interface TreeSpecimen {
  id: string;
  slug: string;
  specimenNumber: number;
  name: string;
  heightFt: number | null;
  widthFt: number | null;
  shape: string;
  fullness: string;
  description: string;
  priceCents: number | null;
  imageUrl: string | null;
  galleryImageUrls: string[];
  status: TreeStatus;
  weightClass: "standard" | "heavy" | "oversized";
}
