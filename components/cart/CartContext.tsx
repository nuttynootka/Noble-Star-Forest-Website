"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { TreeSpecimen } from "@/lib/types";

export interface SleighMotionEvent {
  type: "add" | "remove";
  weight: number;
  nonce: number;
}

interface CartContextValue {
  items: TreeSpecimen[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addTree: (tree: TreeSpecimen) => void;
  removeTree: (treeId: string) => void;
  clearCart: () => void;
  hasTree: (treeId: string) => boolean;
  subtotalCents: number;
  hasPendingPrices: boolean;
  motionEvent: SleighMotionEvent | null;
}

const STORAGE_KEY = "nsf_sleigh_cart_v1";
const CartContext = createContext<CartContextValue | null>(null);

function weightFactor(tree: TreeSpecimen): number {
  if (tree.weightClass === "oversized") return 1.35;
  if (tree.weightClass === "heavy") return 1.1;
  return 0.85;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<TreeSpecimen[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [motionEvent, setMotionEvent] = useState<SleighMotionEvent | null>(null);
  const nonceRef = useRef(0);
  const hydratedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // ignore storage issues
    }
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage issues
    }
  }, [items]);

  const addTree = useCallback((tree: TreeSpecimen) => {
    if (tree.status === "sold" || tree.status === "reserved") return;
    setItems((prev) => {
      if (prev.some((t) => t.id === tree.id)) return prev;
      return [...prev, tree];
    });
    setMotionEvent({ type: "add", weight: weightFactor(tree), nonce: ++nonceRef.current });
  }, []);

  const removeTree = useCallback((treeId: string) => {
    setItems((prev) => {
      const target = prev.find((t) => t.id === treeId);
      if (!target) return prev;
      setMotionEvent({ type: "remove", weight: weightFactor(target), nonce: ++nonceRef.current });
      return prev.filter((t) => t.id !== treeId);
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const hasTree = useCallback((treeId: string) => items.some((t) => t.id === treeId), [items]);

  const subtotalCents = useMemo(
    () => items.reduce((sum, t) => sum + (t.priceCents ?? 0), 0),
    [items],
  );

  const hasPendingPrices = useMemo(
    () => items.some((t) => t.priceCents == null),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isOpen,
      setIsOpen,
      addTree,
      removeTree,
      clearCart,
      hasTree,
      subtotalCents,
      hasPendingPrices,
      motionEvent,
    }),
    [items, isOpen, addTree, removeTree, clearCart, hasTree, subtotalCents, hasPendingPrices, motionEvent],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>.");
  return ctx;
}
