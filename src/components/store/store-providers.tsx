"use client";

import React from "react";
import { StoreCartProvider } from "@/lib/store/cart";

export function StoreProviders({ children }: { children: React.ReactNode }) {
  return <StoreCartProvider>{children}</StoreCartProvider>;
}
