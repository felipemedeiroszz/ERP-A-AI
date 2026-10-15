"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  DollarSign,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  Copy,
  ArrowRight,
  Weight,
  Receipt,
  User,
  Store,
  Loader2,
} from "lucide-react";
import { cn, formatCurrency, formatWeight } from "@/lib/utils";
import { createOrder, type CartItem, type CartItemAddon } from "@/lib/actions/orders";
import { refreshPixStatus } from "@/lib/payments";
import type {
  Category,
  Product,
  Addon,
  ProductAddon,
  Customer,
  CashRegister,
} from "@prisma/client";
import {
  PaymentMethod,
  OrderOrigin,
} from "@prisma/client";
import { Modal, Button, Input, Select, EmptyState, Icones, Checkbox, Badge } from "@/components/ui";

type ProdWithAddons = Product & {
  category: Category;
  addons: (ProductAddon & { addon: Addon })[];
};

interface Props {
  categories: (Category & { _count: { products: number } })[];
  products: ProdWithAddons[];
  addons: Addon[];
  customers: Customer[];
  user: { role: any; name: string | null };
  cashRegisters: CashRegister[];
  weightPricePerKg: number;
}

interface LineItem extends CartItem {
  uid: string;
  addons: (CartItemAddon & { uid: string })[];
}

export default function PDVPageClient({
  categories,
  products,
  addons,
  customers,
  user,
  cashRegisters,
  weightPricePerKg,
}: Props) {
  const router = useRouter();
  const [catId, setCatId] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<LineItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [cashRegister] = useState<CashRegister | null>(
    cashRegisters.find((c) => c.status === "OPEN") || null
  );
  const [prodModal, setProdModal] = useState<ProdWithAddons | null>(null);
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [cashReceived, setCashReceived] = useState("");
  const [pixModal, setPixModal] = useState<{
    orderNumber: number;
    orderId: string;
    qrCode?: string;
    copyPaste?: string;
    value: number;
  } | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [obsGeral, setObsGeral] = useState("");

  const filtered = products.filter((p) => {
    if (!p.active) return false;
    const matchCat = catId === "ALL" || p.categoryId === catId;
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totals = useMemo(() => {
    let subtotal = 0;
    for (const it of cart) {
      subtotal += it.subtotal;
      for (const a of it.addons || []) subtotal += a.unitPrice * a.quantity;
    }
    const received = cashReceived ? Number(String(cashReceived).replace(",", ".")) : 0;
    return {
      subtotal,
      total: subtotal,
      change:
        paymentMethod === PaymentMethod.CASH && received >= subtotal
          ? received - subtotal
          : 0,
    };
  }, [cart, cashReceived, paymentMethod]);

  function handleAddProduct(p: ProdWithAddons) {
    if (p.isWeightBased) {
      setProdModal(p);
      setWeightModalOpen(true);
    } else if (p.addons.length > 0) {
      setProdModal(p);
    } else {
      const uid = `${p.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setCart([
        ...cart,
        {
          uid,
          productId: p.id,
          productName: p.name,
          unitPrice: Number(p.price),
          quantity: 1,
          subtotal: Number(p.price),
          addons: [],
          observation: "",
          isWeightBased: false,
        },
      ]);
    }
  }

  function addWeightProduct(p: ProdWithAddons, kg: number, obs: string) {
    const priceKg = Number(weightPricePerKg || p.price);
    const subtotal = Math.round(kg * priceKg * 100) / 100;
    const uid = `${p.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setCart([
      ...cart,
      {
        uid,
        productId: p.id,
        productName: `${p.name} (${kg.toFixed(3).replace(".", ",")} kg)`,
        unitPrice: priceKg,
        quantity: 1,
        weightKg: kg,
        isWeightBased: true,
        subtotal,
        addons: [],
        observation: obs,
      },
    ]);
    setWeightModalOpen(false);
    setProdModal(null);
  }

  function addStandardProduct(
    p: ProdWithAddons,
    qty: number,
    selectedAddons: Map<string, number>,
    obs: string
  ) {
    let sub = Number(p.price) * qty;
    const addonsLine: (CartItemAddon & { uid: string })[] = [];
    selectedAddons.forEach((qtyAddon, addonId) => {
      if (qtyAddon > 0) {
        const add = addons.find((a) => a.id === addonId);
        if (add) {
          addonsLine.push({
            uid: `${addonId}-${Math.random()}`,
            addonId,
            addonName: add.name,
            unitPrice: Number(add.price),
            quantity: qtyAddon,
          });
          sub += Number(add.price) * qtyAddon;
        }
      }
    });
    const uid = `${p.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setCart([
      ...cart,
      {
        uid,
        productId: p.id,
        productName: p.name,
        unitPrice: Number(p.price),
        quantity: qty,
        subtotal: Number(p.price) * qty,
        isWeightBased: false,
        addons: addonsLine,
        observation: obs,
      },
    ]);
    setProdModal(null);
  }

  function removeItem(uid: string) {
    setCart(cart.filter((i) => i.uid !== uid));
  }

  function changeQty(uid: string, delta: number) {
    setCart(
      cart.map((i) => {
        if (i.uid !== uid || i.isWeightBased) return i;
        const qty = Math.max(1, i.quantity + delta);
        return {
          ...i,
          quantity: qty,
          subtotal: Number(i.unitPrice) * qty,
        };
      })
    );
  }

  async function finishOrder() {
    if (cart.length === 0) return toast.error("Carrinho vazio");
    if (
      paymentMethod === PaymentMethod.CASH &&
      cashReceived &&
      Number(String(cashReceived).replace(",", ".")) < totals.total
    ) {
      return toast.error("Valor recebido é menor que o total");
    }
    setFinishing(true);
    try {
      const res = await createOrder({
        origin: OrderOrigin.PDV,
        customerId: customer?.id,
        customerName: customer?.name,
        customerPhone: customer?.phone,
        isDelivery: false,
        items: cart.map((i) => ({
          ...i,
          addons: i.addons?.map((a) => ({
            addonId: a.addonId,
            addonName: a.addonName,
            unitPrice: a.unitPrice,
            quantity: a.quantity,
          })),
        })),
        paymentMethod,
        cashReceived:
          paymentMethod === PaymentMethod.CASH && cashReceived
            ? Number(String(cashReceived).replace(",", "."))
            : undefined,
        observation: obsGeral || undefined,
        cashRegisterId: cashRegister?.id,
      });

      if (res.success) {
        toast.success(`Pedido #${res.orderNumber} finalizado!`);
        if (paymentMethod === PaymentMethod.PIX) {
          const wait = await refreshPixStatus(res.orderId);
          const order = await (async () => {
            const r = await fetch("/api/admin/orders/" + res.orderId);
            return r.ok ? r.json() : null;
          })().catch(() => null);
          setPixModal({
            orderNumber: res.orderNumber,
            orderId: res.orderId,
            value: totals.total,
            qrCode: order?.pixQrCode,
            copyPaste: order?.pixCopyPaste,
          });
          setTimeout(() => {
            refreshPixStatus(res.orderId).then((r) => {
              if (r.confirmed) toast.success("Pagamento PIX confirmado!");
            });
          }, 30000);
        } else {
          router.push(`/pedido/${res.token}`);
        }
        setCart([]);
        setCheckoutOpen(false);
        setCashReceived("");
        setObsGeral("");
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao finalizar");
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Professional Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white font-bold shadow-lg">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">PDV - Ponto de Venda</h1>
                  <p className="text-xs text-gray-500">Operador: {user.name}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {cashRegister ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-700">
                    Caixa Aberto: {cashRegister.identifier}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-sm font-medium text-red-700">Caixa Fechado</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-6">
        <section>
          {/* Search and Actions Bar */}
          <div className="mb-6 flex flex-wrap items-stretch gap-4">
            <div className="flex-1 min-w-[280px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                placeholder="Buscar produto por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={() => setWeightModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold inline-flex items-center gap-2 hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Weight size={20} /> Açaí por Peso
            </button>
            <Select
              className="min-w-[200px]"
              value={customer?.id || ""}
              onChange={(e) =>
                setCustomer(
                  customers.find((c) => c.id === e.target.value) || null
                )
              }
              options={[
                { value: "", label: "👤 Cliente Balcão" },
                ...customers.map((c) => ({
                  value: c.id,
                  label: `${c.name} ${c.phone ? `(${c.phone})` : ""}`,
                })),
              ]}
            />
          </div>

          {/* Category Tabs */}
          <div className="mb-6 overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setCatId("ALL")}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-2",
                  catId === "ALL"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:bg-muted"
                )}
              >
                Todos ({products.filter((p) => p.active).length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCatId(c.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition border",
                    catId === c.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {c.name} ({c._count.products})
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-600">Tente outra busca ou categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleAddProduct(p)}
                  className="text-left bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group"
                >
                  <div className="aspect-video bg-gradient-to-br from-purple-50 to-indigo-50 relative overflow-hidden">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl opacity-60">
                        🍓
                      </div>
                    )}
                    {p.isWeightBased && (
                      <div className="absolute top-2 left-2 text-[10px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 shadow-sm">
                        <Weight size={10} /> POR PESO
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-semibold text-sm leading-tight line-clamp-2 mb-2 group-hover:text-purple-600 transition">
                      {p.name}
                    </div>
                    {p.description && (
                      <div className="text-xs text-gray-500 line-clamp-1 mb-3">
                        {p.description}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-purple-600">
                        {p.isWeightBased
                          ? `${Number(weightPricePerKg || p.price).toFixed(2).replace(".", ",")}/kg`
                          : formatCurrency(p.price)}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-white group-hover:scale-110 transition">
                        <Plus size={14} />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-20 h-fit space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Cart Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <div className="font-bold text-lg">Carrinho</div>
                  <div className="text-xs text-white/90">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</div>
                </div>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium inline-flex items-center gap-2 transition"
                >
                  <Trash2 size={16} /> Limpar
                </button>
              )}
            </div>

            {/* General Observation */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <textarea
                placeholder="Observação geral do pedido..."
                value={obsGeral}
                onChange={(e) => setObsGeral(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none transition-all"
              />
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] bg-white">
              {cart.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-400 py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart size={32} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">Carrinho vazio</p>
                    <p className="text-xs text-gray-500 mt-1">Adicione produtos para começar</p>
                  </div>
                </div>
                    <p className="text-xs">Adicione produtos para começar</p>
                  </div>
                </div>
              ) : (
                cart.map((i) => {
                  const totalLine =
                    i.subtotal +
                    (i.addons?.reduce(
                      (s, a) => s + a.unitPrice * a.quantity,
                      0
                    ) || 0);
                  return (
                    <div
                      key={i.uid}
                      className="bg-muted/30 border border-border rounded-xl p-3 relative"
                    >
                      <button
                        onClick={() => removeItem(i.uid)}
                        className="absolute top-2 right-2 p-1 rounded hover:bg-red-100 text-red-500 transition"
                      >
                        <X size={14} />
                      </button>
                      <div className="flex items-start justify-between gap-2 pr-6">
                        <div className="font-semibold text-sm leading-tight">
                          {i.productName}
                          {i.weightKg && (
                            <Badge color="purple" className="ml-1">
                              {formatWeight(i.weightKg)}
                            </Badge>
                          )}
                        </div>
                        <div className="font-bold text-primary text-sm shrink-0">
                          {formatCurrency(totalLine)}
                        </div>
                      </div>
                      {i.addons && i.addons.length > 0 && (
                        <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                          {i.addons.map((a) => (
                            <div key={a.uid} className="flex justify-between">
                              <span>
                                + {a.quantity}× {a.addonName}
                              </span>
                              <span>{formatCurrency(a.unitPrice * a.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {i.observation && (
                        <div className="mt-1 text-[11px] bg-yellow-50 text-yellow-800 rounded px-2 py-1 border border-yellow-200">
                          📝 {i.observation}
                        </div>
                      )}
                      {!i.isWeightBased && (
                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex items-center bg-background border border-input rounded-lg overflow-hidden">
                            <button
                              onClick={() => changeQty(i.uid, -1)}
                              className="w-8 h-8 hover:bg-muted flex items-center justify-center text-muted-foreground"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">
                              {Math.round(i.quantity)}
                            </span>
                            <button
                              onClick={() => changeQty(i.uid, +1)}
                              className="w-8 h-8 hover:bg-muted flex items-center justify-center text-muted-foreground"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            un. × {formatCurrency(i.unitPrice)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-border p-4 space-y-2 bg-muted/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="font-bold text-lg">Total</span>
                <span className="font-extrabold text-2xl text-primary">
                  {formatCurrency(totals.total)}
                </span>
              </div>
              <button
                onClick={() => cart.length > 0 && setCheckoutOpen(true)}
                disabled={cart.length === 0}
                className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-base shadow disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 transition inline-flex items-center justify-center gap-2"
              >
                <Receipt size={18} /> Finalizar Venda
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </aside>
      </main>

      {prodModal && (
        <Modal
          open={true}
          onClose={() => {
            setProdModal(null);
            setWeightModalOpen(false);
          }}
          title={weightModalOpen ? "Açaí por Peso" : prodModal.name}
          size="md"
        >
          {weightModalOpen ? (
            <WeightForm
              product={prodModal}
              pricePerKg={Number(weightPricePerKg || prodModal.price)}
              onConfirm={(kg, obs) => addWeightProduct(prodModal, kg, obs)}
            />
          ) : (
            <AddonForm
              product={prodModal}
              allAddons={addons}
              onConfirm={(qty, sel, obs) =>
                addStandardProduct(prodModal, qty, sel, obs)
              }
            />
          )}
        </Modal>
      )}

      {!prodModal && weightModalOpen && (
        <Modal
          open={true}
          onClose={() => setWeightModalOpen(false)}
          title="Açaí por Peso"
          size="md"
        >
          <WeightForm
            product={
              {
                id: "weight",
                name: "Açaí por Peso",
                price: new Number(weightPricePerKg) as any,
              } as any
            }
            pricePerKg={Number(weightPricePerKg)}
            onConfirm={(kg, obs) => {
              const priceKg = Number(weightPricePerKg);
              const subtotal = Math.round(kg * priceKg * 100) / 100;
              const uid = `weight-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
              setCart([
                ...cart,
                {
                  uid,
                  productId: undefined,
                  productName: `Açaí por Peso (${kg.toFixed(3).replace(".", ",")} kg)`,
                  unitPrice: priceKg,
                  quantity: 1,
                  weightKg: kg,
                  isWeightBased: true,
                  subtotal,
                  addons: [],
                  observation: obs,
                },
              ]);
              setWeightModalOpen(false);
            }}
          />
        </Modal>
      )}

      <Modal
        open={checkoutOpen}
        onClose={() => !finishing && setCheckoutOpen(false)}
        title="Finalizar Venda"
        size="md"
      >
        <div className="space-y-5">
          <div className="text-center py-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Total a pagar
            </div>
            <div className="text-4xl font-extrabold text-primary">
              {formatCurrency(totals.total)}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Forma de Pagamento</p>
            <div className="grid grid-cols-3 gap-2">
              <PayOption
                active={paymentMethod === PaymentMethod.CASH}
                onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                icon={<Banknote size={22} />}
                label="Dinheiro"
              />
              <PayOption
                active={paymentMethod === PaymentMethod.CARD}
                onClick={() => setPaymentMethod(PaymentMethod.CARD)}
                icon={<CreditCard size={22} />}
                label="Cartão"
              />
              <PayOption
                active={paymentMethod === PaymentMethod.PIX}
                onClick={() => setPaymentMethod(PaymentMethod.PIX)}
                icon={<QrCode size={22} />}
                label="PIX"
              />
            </div>
          </div>

          {paymentMethod === PaymentMethod.CASH && (
            <div>
              <Input
                label="Valor recebido (R$)"
                type="number"
                step="0.01"
                min="0"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0,00"
              />
              {cashReceived &&
                Number(String(cashReceived).replace(",", ".")) >=
                  totals.total && (
                  <div className="mt-3 p-3 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between">
                    <span className="text-sm text-green-700 font-medium">
                      Troco
                    </span>
                    <span className="text-xl font-bold text-green-700">
                      {formatCurrency(totals.change)}
                    </span>
                  </div>
                )}
              {cashReceived &&
                Number(String(cashReceived).replace(",", ".")) <
                  totals.total && (
                  <p className="mt-2 text-xs text-red-600 font-medium">
                    ⚠️ Valor recebido é menor que o total
                  </p>
                )}
            </div>
          )}

          {paymentMethod === PaymentMethod.CARD && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
              💳 Utilize a maquininha POS para efetuar a cobrança de{" "}
              <strong>{formatCurrency(totals.total)}</strong> e confirme
              após aprovação.
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setCheckoutOpen(false)}
              disabled={finishing}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 h-12 text-base"
              onClick={finishOrder}
              disabled={finishing}
            >
              {finishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Confirmar Venda
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {pixModal && (
        <PixPaymentModal {...pixModal} onClose={() => setPixModal(null)} />
      )}
    </div>
  );
}

function PayOption({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border-2 text-center transition",
        active
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border bg-card hover:bg-muted"
      )}
    >
      <div
        className={cn(
          "mx-auto w-10 h-10 rounded-xl flex items-center justify-center mb-1.5",
          active ? "bg-primary text-white" : "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </div>
      <div className="text-xs font-semibold">{label}</div>
    </button>
  );
}

function WeightForm({
  product,
  pricePerKg,
  onConfirm,
}: {
  product: any;
  pricePerKg: number;
  onConfirm: (kg: number, obs: string) => void;
}) {
  const [grams, setGrams] = useState("750");
  const [obs, setObs] = useState("");
  const kg = Number(grams) / 1000;
  const total = kg * pricePerKg;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (kg <= 0) return;
        onConfirm(kg, obs);
      }}
      className="space-y-4"
    >
      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
        <div className="text-xs text-muted-foreground mb-1">
          Valor configurado
        </div>
        <div className="text-2xl font-bold text-primary">
          {formatCurrency(pricePerKg)}/kg
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">Peso (gramas)</label>
          <input
            type="number"
            min="1"
            step="1"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            required
            className="w-full px-3 py-3 border border-input rounded-xl bg-card text-foreground text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Quilos</label>
          <div className="w-full px-3 py-3 border border-border rounded-xl bg-muted/40 text-muted-foreground text-lg font-bold text-center">
            {kg.toFixed(3).replace(".", ",")} kg
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between p-4 rounded-2xl bg-green-50 border border-green-200">
        <span className="text-sm text-green-800 font-medium">Valor total</span>
        <span className="text-3xl font-extrabold text-green-700">
          {formatCurrency(total)}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {["300", "500", "750", "1000"].map((g) => (
          <button
            type="button"
            key={g}
            onClick={() => setGrams(g)}
            className={cn(
              "py-2 rounded-lg border text-sm font-medium transition",
              grams === g
                ? "bg-primary text-white border-primary"
                : "bg-card border-border hover:bg-muted"
            )}
          >
            {(Number(g) / 1000).toFixed(1).replace(".", ",")}kg
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        placeholder="Observações (ex.: sem banana, muito granulado, etc.)"
        value={obs}
        onChange={(e) => setObs(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button">
          Cancelar
        </Button>
        <Button type="submit">
          <Plus size={16} /> Adicionar ao Carrinho
        </Button>
      </div>
    </form>
  );
}

function AddonForm({
  product,
  allAddons,
  onConfirm,
}: {
  product: ProdWithAddons;
  allAddons: Addon[];
  onConfirm: (qty: number, addons: Map<string, number>, obs: string) => void;
}) {
  const [qty, setQty] = useState(1);
  const [obs, setObs] = useState("");
  const [sel, setSel] = useState<Map<string, number>>(new Map());
  const available =
    product.addons.length > 0
      ? product.addons.map((pa) => pa.addon)
      : allAddons.filter((a) => a.active);

  const sub = Number(product.price) * qty;
  let addSub = 0;
  sel.forEach((q, id) => {
    const a = allAddons.find((x) => x.id === id);
    if (a) addSub += Number(a.price) * q;
  });
  const total = sub + addSub;

  function changeAddon(id: string, delta: number) {
    const next = new Map(sel);
    const cur = next.get(id) || 0;
    const nv = Math.max(0, cur + delta);
    if (nv === 0) next.delete(id);
    else next.set(id, nv);
    setSel(next);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onConfirm(qty, sel, obs);
      }}
      className="space-y-4"
    >
      <div className="p-3 rounded-xl bg-muted/20 border border-border">
        <div className="font-bold">{product.name}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {formatCurrency(product.price)} un.
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-3">
        <div className="col-span-1 text-sm font-medium">Quantidade</div>
        <div className="col-span-3 inline-flex items-center bg-background border border-input rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-10 h-10 hover:bg-muted flex items-center justify-center text-muted-foreground"
          >
            <Minus size={16} />
          </button>
          <span className="flex-1 text-center font-bold text-lg">{qty}</span>
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            className="w-10 h-10 hover:bg-muted flex items-center justify-center text-muted-foreground"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {available.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Adicionais</p>
          <div className="grid sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {available.map((a) => {
              const q = sel.get(a.id) || 0;
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border bg-card"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {a.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(a.price)}
                    </div>
                  </div>
                  <div className="inline-flex items-center bg-background border border-input rounded-lg overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => changeAddon(a.id, -1)}
                      className="w-7 h-7 hover:bg-muted flex items-center justify-center text-xs"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">
                      {q}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeAddon(a.id, +1)}
                      className="w-7 h-7 hover:bg-muted flex items-center justify-center text-xs"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <textarea
        rows={2}
        placeholder="Observações para este item..."
        value={obs}
        onChange={(e) => setObs(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
      />

      <div className="flex items-center justify-between p-4 rounded-2xl bg-green-50 border border-green-200">
        <span className="text-sm text-green-700 font-medium">
          Total do item
        </span>
        <span className="text-2xl font-extrabold text-green-700">
          {formatCurrency(total)}
        </span>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button">
          Cancelar
        </Button>
        <Button type="submit">
          <Plus size={16} /> Adicionar
        </Button>
      </div>
    </form>
  );
}

function PixPaymentModal({
  orderNumber,
  orderId,
  qrCode,
  copyPaste,
  value,
  onClose,
}: {
  orderNumber: number;
  orderId: string;
  qrCode?: string;
  copyPaste?: string;
  value: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("PENDING");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await refreshPixStatus(orderId);
        setStatus(res.status);
        if (res.confirmed) {
          setConfirmed(true);
          toast.success("Pagamento PIX confirmado!");
          clearInterval(interval);
        }
      } catch (e) {}
    }, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  function copy() {
    if (copyPaste) {
      navigator.clipboard.writeText(copyPaste);
      toast.success("PIX Copia e Cola copiado!");
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Pagamento PIX - Pedido #${orderNumber}`}
      size="sm"
    >
      <div className="space-y-4 text-center">
        <div className="text-sm text-muted-foreground">Valor</div>
        <div className="text-3xl font-extrabold text-primary">
          {formatCurrency(value)}
        </div>

        {qrCode ? (
          <div className="bg-white p-4 rounded-2xl border-4 border-primary inline-block">
            <img
              src={`data:image/png;base64,${qrCode}`}
              alt="QR Code PIX"
              className="w-52 h-52"
            />
          </div>
        ) : (
          <div className="w-52 h-52 mx-auto rounded-2xl bg-muted flex items-center justify-center border-4 border-dashed border-border">
            <div>
              <QrCode size={50} className="mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">
                Aguardando QR Code...
              </p>
            </div>
          </div>
        )}

        {copyPaste && (
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">
              Copia e Cola PIX
            </div>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 bg-muted rounded-lg text-xs font-mono truncate text-left">
                {copyPaste}
              </div>
              <Button variant="secondary" size="sm" onClick={copy}>
                <Copy size={14} /> Copiar
              </Button>
            </div>
          </div>
        )}

        <div
          className={cn(
            "p-4 rounded-xl border-2 flex items-center gap-3",
            confirmed
              ? "bg-green-50 border-green-300"
              : "bg-yellow-50 border-yellow-300"
          )}
        >
          {confirmed ? (
            <CheckCircle2 size={28} className="text-green-600 shrink-0" />
          ) : (
            <Loader2 size={28} className="text-yellow-600 shrink-0 animate-spin" />
          )}
          <div className="text-left flex-1">
            <div className="font-bold">
              {confirmed ? "Pagamento confirmado!" : "Aguardando pagamento..."}
            </div>
            <div className="text-xs text-muted-foreground">
              {confirmed
                ? "O pedido já pode ser preparado"
                : "Mostre esta tela ao cliente e aguarde"}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Fechar
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              onClose();
              router.push("/admin/pedidos");
            }}
          >
            Ir para Pedidos
          </Button>
        </div>
      </div>
    </Modal>
  );
}
