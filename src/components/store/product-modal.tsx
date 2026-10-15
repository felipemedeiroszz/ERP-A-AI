"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, Minus, Plus, ShoppingCart, Scale } from "lucide-react";
import { toast } from "sonner";
import { useStoreCart, type StoreCartItemAddon } from "@/lib/store/cart";
import { Button } from "@/components/ui";

interface ProductAddon {
  id: string;
  name: string;
  price: number;
}

interface ProductModalProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    image?: string | null;
    isWeightBased: boolean;
  };
  addons: ProductAddon[];
  weightPricePerKg: number;
  open: boolean;
  onClose: () => void;
}

interface SelectedAddon {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export function ProductModal({
  product,
  addons,
  weightPricePerKg,
  open,
  onClose,
}: ProductModalProps) {
  const { addItem } = useStoreCart();

  const [weightGrams, setWeightGrams] = useState<number>(500);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [observation, setObservation] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (open) {
      setSelectedAddons([]);
      setObservation("");
      setQuantity(1);
      if (product.isWeightBased) setWeightGrams(500);
    }
  }, [open, product]);

  const unitPrice = useMemo(() => {
    if (product.isWeightBased) {
      const kg = weightGrams / 1000;
      return Number((kg * weightPricePerKg).toFixed(2));
    }
    return Number(product.price);
  }, [product, weightGrams, weightPricePerKg]);

  const subtotal = useMemo(() => {
    let addonsTotal = 0;
    for (const a of selectedAddons) {
      addonsTotal += a.unitPrice * a.quantity;
    }
    return Number(((unitPrice + addonsTotal) * quantity).toFixed(2));
  }, [unitPrice, selectedAddons, quantity]);

  function toggleAddon(addon: ProductAddon) {
    setSelectedAddons((prev) => {
      const existing = prev.find((a) => a.id === addon.id);
      if (existing) {
        return prev.filter((a) => a.id !== addon.id);
      }
      return [
        ...prev,
        {
          id: addon.id,
          name: addon.name,
          unitPrice: Number(addon.price),
          quantity: 1,
        },
      ];
    });
  }

  function changeAddonQty(id: string, delta: number) {
    setSelectedAddons((prev) =>
      prev
        .map((a) => {
          if (a.id !== id) return a;
          const newQty = Math.max(0, a.quantity + delta);
          if (newQty === 0) return null as unknown as SelectedAddon;
          return { ...a, quantity: newQty };
        })
        .filter(Boolean)
    );
  }

  function handleAddToCart() {
    if (product.isWeightBased && weightGrams < 50) {
      toast.error("Peso mínimo é 50g");
      return;
    }

    const cartAddons: StoreCartItemAddon[] = selectedAddons.map((a) => ({
      addonId: a.id,
      addonName: a.name,
      unitPrice: a.unitPrice,
      quantity: a.quantity,
    }));

    addItem({
      productId: product.id,
      productName: product.isWeightBased
        ? `${product.name} (${(weightGrams / 1000).toFixed(3)}kg)`
        : product.name,
      unitPrice,
      quantity,
      weightKg: product.isWeightBased ? weightGrams / 1000 : null,
      isWeightBased: product.isWeightBased,
      subtotal: Number((unitPrice * quantity).toFixed(2)),
      observation: observation || undefined,
      addons: cartAddons,
    });

    toast.success("Produto adicionado ao carrinho!");
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95">
        <div className="relative h-40 sm:h-44 bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white">
          <div className="text-6xl sm:text-7xl">
            {product.isWeightBased ? "🏋️" : "🥣"}
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-foreground">{product.name}</h3>
            {product.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {product.description}
              </p>
            )}
          </div>

          {product.isWeightBased && (
            <div className="mb-5 p-4 rounded-xl bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2 mb-3">
                <Scale size={18} className="text-accent" />
                <span className="font-semibold text-foreground">
                  Açaí por Peso
                </span>
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Valor: R$ {weightPricePerKg.toFixed(2).replace(".", ",")}/kg
              </div>
              <div className="mb-3">
                <label className="text-xs font-medium text-muted-foreground">
                  Peso em gramas
                </label>
                <input
                  type="number"
                  min={50}
                  step={10}
                  value={weightGrams}
                  onChange={(e) =>
                    setWeightGrams(
                      Math.max(0, Number(e.target.value.replace(/\D/g, "")))
                    )
                  }
                  className="mt-1 w-full px-4 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-lg font-semibold"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[300, 500, 750, 1000].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWeightGrams(w)}
                    className={`py-1.5 rounded-lg text-sm font-medium transition ${
                      weightGrams === w
                        ? "bg-accent text-white"
                        : "bg-white border border-border hover:border-accent"
                    }`}
                  >
                    {w}g
                  </button>
                ))}
              </div>
              <div className="mt-3 text-sm font-semibold text-primary">
                {(weightGrams / 1000).toFixed(3)}kg = R${" "}
                {unitPrice.toFixed(2).replace(".", ",")}
              </div>
            </div>
          )}

          {addons.length > 0 && (
            <div className="mb-5">
              <h4 className="font-semibold text-foreground mb-3">Adicionais</h4>
              <div className="space-y-2">
                {addons.map((addon) => {
                  const selected = selectedAddons.find(
                    (a) => a.id === addon.id
                  );
                  const isSelected = !!selected;
                  return (
                    <div
                      key={addon.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <button
                        className="flex-1 text-left"
                        onClick={() => toggleAddon(addon)}
                      >
                        <div className="font-medium text-foreground">
                          {addon.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          + R$ {Number(addon.price).toFixed(2).replace(".", ",")}
                        </div>
                      </button>
                      {isSelected ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => changeAddonQty(addon.id, -1)}
                            className="w-8 h-8 rounded-lg bg-border hover:bg-muted-foreground/20 flex items-center justify-center"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center font-semibold">
                            {selected.quantity}
                          </span>
                          <button
                            onClick={() => changeAddonQty(addon.id, +1)}
                            className="w-8 h-8 rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleAddon(addon)}
                          className="w-8 h-8 rounded-lg border border-border hover:border-primary flex items-center justify-center"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground">
              Observações (opcional)
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={2}
              placeholder="Ex: Sem açúcar, mais granulado..."
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none text-sm"
            />
          </div>

          {!product.isWeightBased && (
            <div className="mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">
                Quantidade:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-lg border border-border hover:border-primary flex items-center justify-center"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center font-semibold">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-9 h-9 rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="text-xl font-bold text-primary">
              R$ {subtotal.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <Button
            onClick={handleAddToCart}
            className="w-full py-3 text-base font-semibold"
          >
            <ShoppingCart size={18} />
            Adicionar ao carrinho
          </Button>
        </div>
      </div>
    </div>
  );
}
