"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface StoreCartItemAddon {
  addonId?: string;
  addonName: string;
  unitPrice: number;
  quantity: number;
}

export interface StoreCartItem {
  id: string;
  productId?: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  weightKg?: number | null;
  isWeightBased?: boolean;
  subtotal: number;
  observation?: string;
  addons: StoreCartItemAddon[];
}

interface StoreCartContextValue {
  items: StoreCartItem[];
  addItem: (item: Omit<StoreCartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateItemObservation: (id: string, observation: string) => void;
  clear: () => void;
  subtotal: number;
  totalItems: number;
}

const StoreCartContext = createContext<StoreCartContextValue | undefined>(undefined);

const STORAGE_KEY = "erp-acai-store-cart";

function loadFromStorage(): StoreCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: StoreCartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // noop
  }
}

function randomId() {
  return `ci-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function StoreCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<StoreCartItem[]>([]);

  useEffect(() => {
    setItems(loadFromStorage());
  }, []);

  useEffect(() => {
    saveToStorage(items);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => {
      let s = Number(it.subtotal);
      if (it.addons?.length) {
        for (const a of it.addons) {
          s += Number(a.unitPrice) * Number(a.quantity);
        }
      }
      return acc + s;
    }, 0);
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce((acc, it) => acc + Number(it.quantity || 1), 0);
  }, [items]);

  function addItem(item: Omit<StoreCartItem, "id">) {
    setItems((prev) => [...prev, { ...item, id: randomId() }]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function updateItemQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const newSubtotal = Number(it.unitPrice) * quantity;
        return { ...it, quantity, subtotal: Number(newSubtotal.toFixed(2)) };
      })
    );
  }

  function updateItemObservation(id: string, observation: string) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, observation } : it))
    );
  }

  function clear() {
    setItems([]);
  }

  const value: StoreCartContextValue = {
    items,
    addItem,
    removeItem,
    updateItemQuantity,
    updateItemObservation,
    clear,
    subtotal,
    totalItems,
  };

  return (
    <StoreCartContext.Provider value={value}>
      {children}
    </StoreCartContext.Provider>
  );
}

export function useStoreCart() {
  const ctx = useContext(StoreCartContext);
  if (!ctx) throw new Error("useStoreCart must be used inside StoreCartProvider");
  return ctx;
}
