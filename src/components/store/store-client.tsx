"use client";

import React, { useState } from "react";
import { ProductModal } from "./product-modal";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

interface ProductAddon {
  id: string;
  name: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  isWeightBased: boolean;
  addons: ProductAddon[];
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface StoreClientProps {
  categories: Category[];
  weightPricePerKg: number;
}

export function StoreClient({ categories, weightPricePerKg }: StoreClientProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function openProductModal(product: Product) {
    setSelectedProduct(product);
    setModalOpen(true);
  }

  return (
    <>
      <div className="space-y-10">
        {categories.map((cat) => (
          <div key={cat.id}>
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full" />
              {cat.name}
              <span className="text-xs text-muted-foreground font-normal">
                ({cat.products.length})
              </span>
            </h4>
            {cat.products.length === 0 ? (
              <p className="text-sm text-muted-foreground pl-4">
                Sem produtos nesta categoria.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.products.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 pr-3">
                        <div className="font-semibold">{prod.name}</div>
                        {prod.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {prod.description}
                          </div>
                        )}
                        {prod.isWeightBased && (
                          <span className="inline-block mt-1.5 text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                            🏋️ Açaí por Peso
                          </span>
                        )}
                        {prod.addons.length > 0 && (
                          <div className="text-[10px] text-muted-foreground mt-1">
                            + {prod.addons.length} adicional
                            {prod.addons.length === 1 ? "" : "is"}
                          </div>
                        )}
                      </div>
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-16 h-16 rounded-lg object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted border border-border shrink-0 flex items-center justify-center text-2xl">
                          {prod.isWeightBased ? "🏋️" : "🥣"}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/60">
                      <div className="text-lg font-bold text-primary">
                        {prod.isWeightBased
                          ? `${prod.price.toFixed(2).replace(".", ",")}/kg`
                          : `R$ ${prod.price.toFixed(2).replace(".", ",")}`}
                      </div>
                      <button
                        onClick={() => openProductModal(prod)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition inline-flex items-center gap-1.5"
                      >
                        <ShoppingCart size={12} />
                        Adicionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          addons={selectedProduct.addons}
          weightPricePerKg={weightPricePerKg}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
