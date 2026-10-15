"use client";

import React, { useState } from "react";
import { X, Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStoreCart } from "@/lib/store/cart";
import { Button } from "@/components/ui";

interface CartDrawerProps {
  deliveryFee: number;
}

export function CartDrawer({ deliveryFee }: CartDrawerProps) {
  const router = useRouter();
  const { items, removeItem, updateItemQuantity, updateItemObservation, subtotal, totalItems, clear } =
    useStoreCart();
  const [open, setOpen] = useState(false);

  const total = Number((subtotal + (items.length > 0 ? deliveryFee : 0)).toFixed(2));

  if (items.length === 0 && !open) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:opacity-90 transition active:scale-95"
        aria-label="Abrir carrinho"
      >
        <div className="relative">
          <ShoppingCart size={24} />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-primary" />
                <h2 className="text-lg font-bold">Seu pedido</h2>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                  {totalItems} {totalItems === 1 ? "item" : "itens"}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center transition"
              >
                <X size={20} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ShoppingCart size={36} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Carrinho vazio</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Adicione produtos para continuar.
                </p>
                <Button onClick={() => setOpen(false)}>Ver cardápio</Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {items.map((item) => {
                    const addonsSubtotal = item.addons.reduce(
                      (s, a) => s + a.unitPrice * a.quantity,
                      0
                    );
                    const itemTotal = Number(
                      (item.subtotal + addonsSubtotal * item.quantity).toFixed(2)
                    );
                    return (
                      <div
                        key={item.id}
                        className="bg-card border border-border rounded-xl p-3"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-sm">
                              {item.productName}
                            </div>
                            {item.addons.length > 0 && (
                              <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                                {item.addons.map((a, i) => (
                                  <div key={i}>
                                    + {a.addonName} × {a.quantity}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center transition shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="mt-2">
                          <textarea
                            rows={1}
                            placeholder="Observação..."
                            value={item.observation || ""}
                            onChange={(e) =>
                              updateItemObservation(item.id, e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-xs rounded-md border border-border resize-none outline-none focus:border-primary"
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                updateItemQuantity(item.id, item.quantity - 1)
                              }
                              className="w-8 h-8 rounded-md border border-border hover:border-primary flex items-center justify-center"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateItemQuantity(item.id, item.quantity + 1)
                              }
                              className="w-8 h-8 rounded-md bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <div className="font-bold text-primary">
                            R$ {itemTotal.toFixed(2).replace(".", ",")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 border-t border-border space-y-3 bg-card">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      R$ {subtotal.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa entrega</span>
                    <span className="font-medium">
                      {deliveryFee > 0
                        ? `R$ ${deliveryFee.toFixed(2).replace(".", ",")}`
                        : "Grátis"}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg pt-1 border-t border-border">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary">
                      R$ {total.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        if (confirm("Limpar carrinho?")) clear();
                      }}
                      className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition"
                    >
                      Limpar
                    </button>
                    <Button
                      onClick={() => {
                        setOpen(false);
                        router.push("/checkout");
                      }}
                      className="flex-1 py-3"
                    >
                      Finalizar pedido
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
