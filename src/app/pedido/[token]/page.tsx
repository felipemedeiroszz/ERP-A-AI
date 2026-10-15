import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  formatCurrency,
  formatDateTime,
  formatPhone,
} from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  Phone,
  User,
  Receipt,
  Copy,
  QrCode,
  Banknote,
  CreditCard,
  Store,
  Truck,
} from "lucide-react";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { getCompanySettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const PICKUP_STEPS: {
  key: OrderStatus | "WAITING_PICKUP";
  label: string;
  description: string;
  minStatus?: OrderStatus;
}[] = [
  {
    key: "NEW",
    label: "Pedido recebido",
    description: "Recebemos seu pedido",
    minStatus: "NEW",
  },
  {
    key: "CONFIRMED",
    label: "Confirmado",
    description: "Pagamento/confirmação ok",
    minStatus: "CONFIRMED",
  },
  {
    key: "IN_PREPARATION",
    label: "Em preparação",
    description: "Estamos preparando",
    minStatus: "IN_PREPARATION",
  },
  {
    key: "READY",
    label: "Pronto",
    description: "Pedido finalizado",
    minStatus: "READY",
  },
  {
    key: "WAITING_PICKUP",
    label: "Aguardando retirada",
    description: "Retire na loja",
    minStatus: "READY",
  },
  {
    key: "PICKED_UP",
    label: "Retirado",
    description: "Pedido entregue",
    minStatus: "PICKED_UP",
  },
];

const DELIVERY_STEPS: {
  key: OrderStatus;
  label: string;
  description: string;
}[] = [
  { key: "NEW", label: "Pedido recebido", description: "Recebemos seu pedido" },
  {
    key: "CONFIRMED",
    label: "Pagamento confirmado",
    description: "Pagamento aprovado",
  },
  {
    key: "IN_PREPARATION",
    label: "Em preparação",
    description: "Estamos preparando",
  },
  { key: "READY", label: "Pedido pronto", description: "Saiu para entrega logo" },
  {
    key: "OUT_FOR_DELIVERY",
    label: "Saiu para entrega",
    description: "Entregador a caminho",
  },
  { key: "DELIVERED", label: "Entregue", description: "Pedido entregue!" },
];

function doneStatus(s: OrderStatus, target: OrderStatus): boolean {
  const order: OrderStatus[] = [
    "NEW",
    "CONFIRMED",
    "IN_PREPARATION",
    "READY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "PICKED_UP",
    "CANCELLED",
  ];
  return order.indexOf(s) >= order.indexOf(target);
}

export default async function OrderTrackingPage({
  params,
}: {
  params: { token: string };
}) {
  const order = await prisma.order.findUnique({
    where: { token: params.token },
    include: {
      items: { include: { addons: true } },
      customer: true,
      address: true,
    },
  });
  if (!order) notFound();

  const company = await getCompanySettings().catch(() => null);
  const isDelivery = order.isDelivery;
  const cancelled = order.status === "CANCELLED";
  const steps = isDelivery ? DELIVERY_STEPS : PICKUP_STEPS;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate">
              {company?.fantasyName || company?.name || "Minha Açaiteria"}
            </div>
            <a
              href="/"
              className="text-xs text-primary hover:underline font-medium"
            >
              ← Voltar para loja
            </a>
          </div>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-5 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Pedido
            </div>
            <div className="text-3xl font-black text-primary">
              #{order.orderNumber}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Criado em {formatDateTime(order.createdAt)}
            </div>
          </div>
          <div className="mt-3 sm:mt-0">
            <div className="text-xs text-muted-foreground mb-1 text-right sm:text-right">
              Total
            </div>
            <div className="text-3xl font-black text-green-600">
              {formatCurrency(order.totalAmount)}
            </div>
            <div className="text-xs text-center sm:text-right mt-1">
              {order.isDelivery ? (
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                  <Truck size={12} /> Delivery
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                  <Store size={12} /> Retirada
                </span>
              )}
            </div>
          </div>
        </div>

        {cancelled ? (
          <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-200 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600 text-white text-sm font-bold mb-2">
              ❌ Pedido Cancelado
            </div>
            <p className="text-sm text-red-800">
              Este pedido foi cancelado.
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Clock size={18} className="text-primary" /> Acompanhamento
            </h2>
            <ol className="relative">
              {steps.map((step, i) => {
                const isKey =
                  step.key === order.status ||
                  (step.key === "WAITING_PICKUP" &&
                    order.status === "READY");
                const completed =
                  isDelivery
                    ? doneStatus(order.status, step.key as OrderStatus)
                    : step.key === "WAITING_PICKUP"
                    ? doneStatus(order.status, "READY")
                    : doneStatus(order.status, step.key as OrderStatus);
                const nextActive =
                  !completed && i > 0
                    ? doneStatus(
                        order.status,
                        steps[i - 1].key as OrderStatus
                      ) ||
                      (steps[i - 1].key === "WAITING_PICKUP" &&
                        order.status === "READY")
                    : completed;

                const isActive = isKey || nextActive && !completed;
                return (
                  <li
                    key={String(step.key)}
                    className="relative flex gap-3 sm:gap-4 pb-5 last:pb-0"
                  >
                    {i < steps.length - 1 && (
                      <div
                        className={`absolute left-[15px] top-9 w-0.5 h-[calc(100%+1.25rem)] ${
                          completed
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                    )}
                    <div
                      className={`relative z-10 w-8 h-8 shrink-0 rounded-full flex items-center justify-center border-2 transition ${
                        completed
                          ? "bg-primary border-primary text-white shadow-md"
                          : isActive
                          ? "bg-white border-primary text-primary shadow-md"
                          : "bg-white border-muted text-muted"
                      }`}
                    >
                      {completed ? (
                        <CheckCircle2 size={16} />
                      ) : isActive ? (
                        <Circle size={10} className="fill-primary" />
                      ) : (
                        <Circle size={10} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`font-semibold text-sm sm:text-base ${
                          completed || isActive
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {step.description}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {order.paymentMethod === "PIX" &&
          order.pixQrCode &&
          order.paymentStatus === "PENDING" && (
            <div className="bg-card border-2 border-purple-200 rounded-2xl shadow-sm p-5 text-center">
              <h2 className="font-bold mb-3 flex items-center justify-center gap-2 text-purple-700">
                <QrCode size={20} /> Pagamento PIX
              </h2>
              <div className="bg-white p-3 rounded-xl border-4 border-purple-100 inline-block">
                <img
                  src={`data:image/png;base64,${order.pixQrCode}`}
                  alt="QR Code PIX"
                  className="w-44 h-44"
                />
              </div>
              <div className="mt-4 text-xs text-muted-foreground mb-1.5">
                PIX Copia e Cola
              </div>
              <div className="flex gap-2 justify-center">
                <div className="max-w-[70%] px-3 py-2 bg-muted rounded-lg text-xs font-mono truncate">
                  {order.pixCopyPaste}
                </div>
                <button
                  onClick={() => {
                    if (order.pixCopyPaste) {
                      navigator.clipboard?.writeText(order.pixCopyPaste);
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium inline-flex items-center gap-1"
                >
                  <Copy size={14} /> Copiar
                </button>
              </div>
              <p className="mt-3 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2 inline-block">
                ⚠️ Após o pagamento, seu pedido será confirmado
                automaticamente em até 1 minuto.
              </p>
            </div>
          )}

        <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <Receipt size={18} className="text-primary" /> Itens do Pedido
          </h2>
          <div className="space-y-3">
            {order.items.map((it) => {
              const totalItem =
                Number(it.subtotal) +
                it.addons.reduce((s, a) => s + Number(a.totalPrice), 0);
              return (
                <div
                  key={it.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm sm:text-base leading-tight">
                      {Math.round(Number(it.quantity)) > 1 && (
                        <span className="inline-block mr-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">
                          {Math.round(Number(it.quantity))}x
                        </span>
                      )}
                      {it.productName}
                    </div>
                    {it.addons.length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground space-y-0.5 ml-2">
                        {it.addons.map((a) => (
                          <div key={a.id}>
                            + {a.quantity}× {a.addonName}
                          </div>
                        ))}
                      </div>
                    )}
                    {it.observation && (
                      <div className="mt-1 text-[11px] bg-yellow-50 text-yellow-800 rounded px-2 py-0.5 border border-yellow-200 inline-block ml-2">
                        📝 {it.observation}
                      </div>
                    )}
                  </div>
                  <div className="font-bold shrink-0">{formatCurrency(totalItem)}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 border-t border-border pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {Number(order.deliveryFee) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Taxa de entrega</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
            )}
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Desconto</span>
                <span>- {formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-black text-primary pt-2 border-t border-border">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="font-bold">Pagamento</h2>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                {order.paymentMethod === "PIX" && <QrCode size={18} />}
                {(order.paymentMethod === "CASH" ||
                  order.paymentMethod === "DELIVERY_CASH" ||
                  order.paymentMethod === "PICKUP_PAYMENT") && <Banknote size={18} />}
                {(order.paymentMethod === "CARD" ||
                  order.paymentMethod === "DELIVERY_CARD") && <CreditCard size={18} />}
              </div>
              <div>
                <div className="font-semibold text-sm">
                  {order.paymentMethod === "PIX" && "PIX"}
                  {order.paymentMethod === "CASH" && "Dinheiro"}
                  {order.paymentMethod === "CARD" && "Cartão"}
                  {order.paymentMethod === "DELIVERY_CASH" &&
                    "Pagar na Entrega (Dinheiro)"}
                  {order.paymentMethod === "DELIVERY_CARD" &&
                    "Pagar na Entrega (Cartão)"}
                  {order.paymentMethod === "PICKUP_PAYMENT" &&
                    "Pagar na Retirada"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {order.paymentStatus === "CONFIRMED" ? (
                    <span className="text-green-600 font-medium">
                      ✓ Pagamento confirmado
                    </span>
                  ) : order.paymentStatus === "PENDING" ? (
                    <span className="text-yellow-600 font-medium">
                      ⏳ Pagamento pendente
                    </span>
                  ) : (
                    order.paymentStatus
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Valor</div>
              <div className="font-bold">{formatCurrency(order.totalAmount)}</div>
            </div>
          </div>

          {(order.cashReceived !== null || order.changeFor !== null) && (
            <div className="grid grid-cols-2 gap-3">
              {order.cashReceived !== null && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                  <div className="text-xs text-green-700 mb-0.5">
                    Valor recebido
                  </div>
                  <div className="font-bold">
                    {formatCurrency(Number(order.cashReceived))}
                  </div>
                </div>
              )}
              {(order.change !== null || order.changeFor !== null) && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-xs text-blue-700 mb-0.5">Troco</div>
                  <div className="font-bold">
                    {formatCurrency(
                      Number(order.change ?? order.changeFor ?? 0)
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {order.address && (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5 space-y-3">
            <h2 className="font-bold flex items-center gap-2">
              <MapPin size={18} className="text-primary" /> Endereço de Entrega
            </h2>
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-sm space-y-1">
              <div className="font-semibold text-indigo-900">
                {order.address.street}, {order.address.number}
                {order.address.complement && (
                  <span className="font-normal"> - {order.address.complement}</span>
                )}
              </div>
              <div className="text-indigo-700 text-xs">
                {order.address.neighborhood} · {order.address.city}/
                {order.address.state}
              </div>
              {order.address.reference && (
                <div className="text-indigo-700 bg-white/60 rounded px-2 py-1 border border-indigo-100 text-xs">
                  📌 Referência: {order.address.reference}
                </div>
              )}
            </div>
          </div>
        )}

        {(order.customerName || order.customerPhone) && (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5 space-y-3">
            <h2 className="font-bold flex items-center gap-2">
              <User size={18} className="text-primary" /> Cliente
            </h2>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {order.customerName && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="text-xs text-muted-foreground mb-0.5">
                    Nome
                  </div>
                  <div className="font-semibold">{order.customerName}</div>
                </div>
              )}
              {order.customerPhone && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="text-xs text-muted-foreground mb-0.5">
                    Telefone
                  </div>
                  <div className="font-semibold flex items-center gap-1.5">
                    <Phone size={14} />
                    {formatPhone(order.customerPhone)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-center py-4 text-xs text-muted-foreground">
          Dúvidas? Entre em contato conosco.
          <br />
          © {new Date().getFullYear()}{" "}
          {company?.name || "Minha Açaiteria"}.
        </div>
      </section>
    </main>
  );
}
