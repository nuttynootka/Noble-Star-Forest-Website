export type DoorPhase = "idle" | "opening" | "holding" | "closing" | "settling" | "settled";

export interface DoorSelection {
  product: WreathProduct;
  nonce: number;
}

export interface DoorEffects {
  firelight?: boolean;
  wreathShadow?: boolean;
  snow?: boolean;
  porchLight?: boolean;
}

export interface WreathImage {
  src: string;
  alt: string;
  hangPoint?: number;
}

export interface WreathProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  image: WreathImage;
  cardImage?: WreathImage;
}

export interface InteriorImage {
  src: string;
  position?: string;
}
