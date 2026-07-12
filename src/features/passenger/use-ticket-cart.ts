"use client";

import { useCallback, useEffect, useState } from "react";

export type CartItem = {
  id: string;
  tripId: string;
  seatId: string;
  seatNumber: string;
  fare: number;
  tripDate: string;
  routeLabel: string;
  departureTime: string;
  busNumber: string;
  companyName: string;
};

const STORAGE_KEY = "sbm-ticket-cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useTicketCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCart(items);
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    setItems((prev) => {
      if (prev.some((i) => i.tripId === item.tripId && i.seatId === item.seatId)) return prev;
      return [...prev, { ...item, id: crypto.randomUUID() }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.fare, 0);

  return { items, addItem, removeItem, clearCart, total, count: items.length, hydrated };
}
