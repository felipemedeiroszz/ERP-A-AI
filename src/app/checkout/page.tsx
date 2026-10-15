"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Money,
  Package,
  Pickaxe,
  QrCode,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useStoreCart } from "@/lib/store/cart";
import { Button } from "@/components/ui";

type DeliveryMode = "delivery" | "pickup";
type PaymentMode = "PIX" | "DELIVERY_CASH" | "DELIVERY_CARD" | "PICKUP_PAYMENT";

interface CheckoutForm {
  name: string;
  phone: string;
  email: string;
  mode: DeliveryMode;
  address: {
    zipCode: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    reference: string;
  };
  payment: PaymentMode;
  changeFor: string;
  observation: string;
}

const initialForm: CheckoutForm = {
  name: "",
  phone: "",
  email: "",
  mode: "delivery",
  address: {
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    reference: "",
  },
  payment: "PIX",
  changeFor: "",
  observation: "",
};

interface StoreSettingsCheckout {
  deliveryFee: number;
  minDeliveryValue: number;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  isOpen: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useStoreCart();
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<StoreSettingsCheckout | null>(null);

  useEffect(() => {
    fetch("/api/store-settings")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() =>
        setSettings({
          deliveryFee: 0,
          minDeliveryValue: 0,
          deliveryEnabled: true,
          pickupEnabled: true,
          isOpen: true,
        })
      );
  }, []);

  const deliveryFee = Number(settings?.deliveryFee || 0);
  const total = useMemo(
    () => Number((subtotal + (items.length > 0 && form.mode === "delivery" ? deliveryFee : 0)).toFixed(2)),
    [subtotal, items, deliveryFee, form.mode]
  );

  function updateField<K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateAddress<K extends keyof CheckoutForm["address"]>(
    key: K,
    value: CheckoutForm["address"][K]
  ) {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, [key]: value },
    }));
  }

  function applyCepMask(v: string) {
    return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d{3})/, "$1-$2");
  }

  function applyPhoneMask(v: string) {
    return v
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{4})$/, "$1-$2");
  }

  function applyMoneyMask(v: string) {
    return v
      .replace(/\D/g, "")
      .replace(/(\d+)(\d{2})$/, "$1,$2")
      .replace(/^(\d{1,3}(\.\d{3})*)(,\d{2})$/, "$1$3");
  }

  function unmaskMoney(v: string): number {
    const n = v.replace(/\D/g, "");
    if (!n) return 0;
    return Number(n) / 100;
  }

  async function handleCepBlur() {
    const cep = form.address.zipCode.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.erro) return;
      updateAddress("street", data.logradouro || "");
      updateAddress("neighborhood", data.bairro || "");
      updateAddress("city", data.localidade || "");
      updateAddress("state", data.uf || "");
    } catch {
      // noop
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings?.isOpen) {
      toast.error("A loja está fechada no momento.");
      return;
    }
    if (items.length === 0) {
      toast.error("Carrinho vazio.");
      return;
    }
    if (!form.name.trim() || form.name.split(" ").length < 2) {
      toast.error("Informe seu nome completo.");
      return;
    }
    if (form.phone.replace(/\D/g, "").length < 10) {
      toast.error("Informe um telefone válido.");
      return;
    }
    if (form.mode === "delivery") {
      if (!settings?.deliveryEnabled) {
        toast.error("Delivery indisponível no momento.");
        return;
      }
      const a = form.address;
      if (!a.zipCode || !a.street || !a.number || !a.neighborhood || !a.city || !a.state) {
        toast.error("Preencha o endereço completo para entrega.");
        return;
      }
      if (settings?.minDeliveryValue && subtotal < settings.minDeliveryValue) {
        toast.error(
          `Valor mínimo para delivery é R$ ${settings.minDeliveryValue
            .toFixed(2)
            .replace(".", ",")}.`
        );
        return;
      }
      if (!["DELIVERY_CASH", "DELIVERY_CARD", "PIX"].includes(form.payment)) {
        toast.error("Selecione uma forma de pagamento para entrega.");
        return;
      }
    } else {
      if (!settings?.pickupEnabled) {
        toast.error("Retirada indisponível no momento.");
        return;
      }
      if (!["PICKUP_PAYMENT", "PIX"].includes(form.payment)) {
        toast.error("Selecione uma forma de pagamento para retirada.");
        return;
      }
    }
    if (form.payment === "DELIVERY_CASH") {
      const changeFor = unmaskMoney(form.changeFor);
      if (changeFor > 0 && changeFor < total) {
        toast.error("Valor para troco é menor que o total do pedido.");
        return;
      }
    }

    setLoading(true);

    const body: any = {
      customerName: form.name.trim(),
      customerPhone: form.phone,
      customerEmail: form.email.trim() || undefined,
      isDelivery: form.mode === "delivery",
      items: items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        unitPrice: Number(it.unitPrice),
        quantity: Number(it.quantity),
        weightKg: it.weightKg ?? null,
        isWeightBased: !!it.isWeightBased,
        subtotal: Number(it.subtotal),
        observation: it.observation,
        addons: it.addons.map((a) => ({
          addonId: a.addonId,
          addonName: a.addonName,
          unitPrice: Number(a.unitPrice),
          quantity: Number(a.quantity),
        })),
      })),
      paymentMethod: form.payment,
      observation: form.observation.trim() || undefined,
      deliveryFee: form.mode === "delivery" ? deliveryFee : 0,
    };

    if (form.mode === "delivery") {
      body.addressData = {
        zipCode: form.address.zipCode,
        street: form.address.street,
        number: form.address.number,
        complement: form.address.complement.trim() || undefined,
        neighborhood: form.address.neighborhood,
        city: form.address.city,
        state: form.address.state,
        reference: form.address.reference.trim() || undefined,
      };
    }

    if (form.payment === "DELIVERY_CASH") {
      const changeFor = unmaskMoney(form.changeFor);
      body.changeFor = changeFor > 0 ? changeFor : undefined;
      body.cashReceived = changeFor > 0 ? changeFor : undefined;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Erro ao finalizar pedido. Tente novamente.");
        return;
      }
      clear();
      toast.success("Pedido criado com sucesso!");
      router.replace(`/pedido/${json.token}`);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao finalizar pedido.");
    } finally {
      setLoading(false);
    }
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            <ArrowLeft size={18} />
            Voltar ao cardápio
          </Link>
          <div className="text-lg font-bold text-foreground">Finalizar pedido</div>
          <div className="w-[110px]" />
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28">
        {items.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Package size={36} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Seu carrinho está vazio</h3>
            <p className="text-muted-foreground mb-6">
              Volte ao cardápio e selecione seus produtos favoritos.
            </p>
            <Link href="/">
              <Button type="button">Ver cardápio</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-5">
              <section className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  👤 Seus dados
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Nome completo *
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="Nome e sobrenome"
                      className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Telefone *
                    </label>
                    <input
                      value={form.phone}
                      onChange={(e) =>
                        updateField("phone", applyPhoneMask(e.target.value))
                      }
                      placeholder="(00) 00000-0000"
                      className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      E-mail (opcional)
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="seu@email.com"
                      className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  🛵 Entrega ou retirada
                </h2>
                <div className="grid sm:grid-cols-2 gap-3 mb-5">
                  <button
                    type="button"
                    onClick={() => updateField("mode", "delivery")}
                    disabled={!settings.deliveryEnabled}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      form.mode === "delivery"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/40"
                    } ${!settings.deliveryEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Truck size={18} className="text-primary" />
                      <span className="font-semibold">Delivery</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {deliveryFee > 0
                        ? `Taxa: R$ ${deliveryFee.toFixed(2).replace(".", ",")}`
                        : "Taxa grátis"}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("mode", "pickup")}
                    disabled={!settings.pickupEnabled}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      form.mode === "pickup"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/40"
                    } ${!settings.pickupEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Store size={18} className="text-primary" />
                      <span className="font-semibold">Retirar na loja</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Sem taxa de entrega
                    </div>
                  </button>
                </div>

                {form.mode === "delivery" && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        CEP *
                      </label>
                      <input
                        value={form.address.zipCode}
                        onChange={(e) =>
                          updateAddress("zipCode", applyCepMask(e.target.value))
                        }
                        onBlur={handleCepBlur}
                        placeholder="00000-000"
                        className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Número *
                      </label>
                      <input
                        value={form.address.number}
                        onChange={(e) => updateAddress("number", e.target.value)}
                        placeholder="123"
                        className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Logradouro *
                      </label>
                      <input
                        value={form.address.street}
                        onChange={(e) => updateAddress("street", e.target.value)}
                        placeholder="Rua, Avenida..."
                        className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Bairro *
                      </label>
                      <input
                        value={form.address.neighborhood}
                        onChange={(e) => updateAddress("neighborhood", e.target.value)}
                        placeholder="Seu bairro"
                        className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Complemento
                      </label>
                      <input
                        value={form.address.complement}
                        onChange={(e) => updateAddress("complement", e.target.value)}
                        placeholder="Apto 101, Fundos, etc."
                        className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Cidade *
                      </label>
                      <input
                        value={form.address.city}
                        onChange={(e) => updateAddress("city", e.target.value)}
                        placeholder="Sua cidade"
                        className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        UF *
                      </label>
                      <input
                        maxLength={2}
                        value={form.address.state}
                        onChange={(e) =>
                          updateAddress(
                            "state",
                            e.target.value.toUpperCase().slice(0, 2)
                          )
                        }
                        placeholder="SP"
                        className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none uppercase"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Referência
                      </label>
                      <input
                        value={form.address.reference}
                        onChange={(e) => updateAddress("reference", e.target.value)}
                        placeholder="Próximo ao mercado X, portão azul..."
                        className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  💳 Pagamento
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(form.mode === "delivery"
                    ? [
                        {
                          id: "PIX" as PaymentMode,
                          icon: <QrCode size={18} />,
                          title: "PIX",
                          subtitle: "Pagamento antecipado",
                        },
                        {
                          id: "DELIVERY_CASH" as PaymentMode,
                          icon: <Money size={18} />,
                          title: "Dinheiro na entrega",
                          subtitle: "Informe valor para troco",
                        },
                        {
                          id: "DELIVERY_CARD" as PaymentMode,
                          icon: <CreditCard size={18} />,
                          title: "Cartão na entrega",
                          subtitle: "Maquininha do entregador",
                        },
                      ]
                    : [
                        {
                          id: "PIX" as PaymentMode,
                          icon: <QrCode size={18} />,
                          title: "PIX",
                          subtitle: "Pagamento antecipado",
                        },
                        {
                          id: "PICKUP_PAYMENT" as PaymentMode,
                          icon: <Wallet size={18} />,
                          title: "Pagar na retirada",
                          subtitle: "PIX / Dinheiro / Cartão na loja",
                        },
                      ]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateField("payment", opt.id)}
                      className={`p-4 rounded-xl border-2 text-left transition ${
                        form.payment === opt.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-primary">
                        {opt.icon}
                        <span className="font-semibold text-foreground">
                          {opt.title}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {opt.subtitle}
                      </div>
                    </button>
                  ))}
                </div>

                {form.payment === "DELIVERY_CASH" && (
                  <div className="mt-4 p-4 rounded-xl bg-accent/10 border border-accent/20">
                    <label className="text-xs font-medium text-muted-foreground">
                      Troco para quanto? (deixe em branco se não precisar de troco)
                    </label>
                    <input
                      value={form.changeFor}
                      onChange={(e) =>
                        updateField("changeFor", applyMoneyMask(e.target.value))
                      }
                      placeholder="R$ 0,00"
                      className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-lg font-semibold"
                    />
                    {unmaskMoney(form.changeFor) >= total && total > 0 && (
                      <div className="mt-2 text-sm font-semibold text-green-600">
                        Troco: R${" "}
                        {(unmaskMoney(form.changeFor) - total)
                          .toFixed(2)
                          .replace(".", ",")}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Observação (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={form.observation}
                    onChange={(e) => updateField("observation", e.target.value)}
                    placeholder="Ex: Sem cebola, se não tiver tal..."
                    className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>
              </section>
            </div>

            <aside className="lg:col-span-2">
              <div className="sticky top-20 bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h3 className="font-bold text-lg">Resumo do pedido</h3>
                  <div className="text-xs text-muted-foreground mt-1">
                    {items.length} {items.length === 1 ? "item" : "itens"}
                  </div>
                </div>
                <div className="p-5 space-y-3 max-h-72 overflow-y-auto">
                  {items.map((it) => {
                    const addonSub = it.addons.reduce(
                      (s, a) => s + a.unitPrice * a.quantity,
                      0
                    );
                    const itTotal = Number(
                      (it.subtotal + addonSub * it.quantity).toFixed(2)
                    );
                    return (
                      <div
                        key={it.id}
                        className="flex gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
                      >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
                          {it.isWeightBased ? "🏋️" : "🥣"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold line-clamp-1">
                            {it.productName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Qtd: {it.quantity}
                            {it.addons.length > 0 &&
                              ` · ${it.addons.length} add.`}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-primary shrink-0">
                          R$ {itTotal.toFixed(2).replace(".", ",")}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-5 border-t border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      R$ {subtotal.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {form.mode === "delivery" ? "Taxa entrega" : "Retirada"}
                    </span>
                    <span className="font-medium">
                      {form.mode === "delivery"
                        ? deliveryFee > 0
                          ? `R$ ${deliveryFee.toFixed(2).replace(".", ",")}`
                          : "Grátis"
                        : "Sem taxa"}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary">
                      R$ {total.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 mt-3 text-base font-semibold"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Finalizando...
                      </>
                    ) : (
                      <>
                        <CheckoutIcon payment={form.payment} />
                        Finalizar pedido
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center pt-1">
                    Ao finalizar, você concorda com nossos termos de serviço.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </form>
    </div>
  );
}

function CheckoutIcon({ payment }: { payment: PaymentMode }) {
  switch (payment) {
    case "PIX":
      return <QrCode size={18} />;
    case "DELIVERY_CASH":
      return <Money size={18} />;
    case "DELIVERY_CARD":
      return <CreditCard size={18} />;
    case "PICKUP_PAYMENT":
      return <Store size={18} />;
    default:
      return <Wallet size={18} />;
  }
}
