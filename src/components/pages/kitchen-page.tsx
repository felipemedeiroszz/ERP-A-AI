"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToastAction } from "@/components/ui";
import { updateOrderStatus } from "@/lib/actions/orders";
import { formatCurrency, formatDateTime, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Clock,
  ChefHat,
  CheckCircle2,
  Package,
  Truck,
  Bike,
  Store,
} from "lucide-react";
import type { OrderStatus, OrderItem, OrderItemAddon, Customer } from "@prisma/client";

type FullOrder = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  createdAt: string;
  isDelivery: boolean;
  observation: string | null;
  customer?: { name: string } | null;
  customerName: string | null;
  totalAmount: any;
  items: (OrderItem & { addons: OrderItemAddon[] })[];
};

interface Props {
  orders: FullOrder[];
  user: { role: any; name: string | null };
}

const COLUMNS: {
  id: OrderStatus;
  label: string;
  icon: any;
  color: string;
  gradient: string;
}[] = [
  {
    id: "NEW",
    label: "Novos",
    icon: Clock,
    color: "bg-slate-500",
    gradient: "from-slate-500 to-slate-600",
  },
  {
    id: "CONFIRMED",
    label: "Confirmados",
    icon: CheckCircle2,
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    id: "IN_PREPARATION",
    label: "Em Preparação",
    icon: ChefHat,
    color: "bg-orange-500",
    gradient: "from-orange-500 to-orange-600",
  },
  {
    id: "READY",
    label: "Prontos",
    icon: Package,
    color: "bg-purple-500",
    gradient: "from-purple-500 to-purple-600",
  },
];

export default function KitchenPageClient({ orders: init, user }: Props) {
  const [list, setList] = useState<FullOrder[]>(init);
  const toastStatus = useToastAction(updateOrderStatus as any, {
    success: "Status atualizado!",
    onSuccess: () => window.location.reload(),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50">
      {/* Professional Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center shadow-lg">
                <ChefHat size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Painel da Cozinha
                </h1>
                <p className="text-xs text-gray-500">
                  {user.name} · Atualizado em {formatTime(new Date())}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-orange-700">
                  {list.filter(o => o.status === 'NEW').length} novos
                </span>
              </div>
              <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition"
            >
              🔄 Atualizar
            </button>
            <a
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition"
            >
              ← Admin
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6">
          {COLUMNS.map((col) => {
            const Icon = col.icon;
            const items = list.filter((o) => o.status === col.id);
            return (
              <section
                key={col.id}
                className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden flex flex-col max-h-[85vh]"
              >
                <div
                  className={`bg-gradient-to-r ${col.gradient} text-white px-5 py-4 flex items-center justify-between shadow-md`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <Icon size={22} />
                    </div>
                    <div>
                      <div className="font-bold text-lg leading-tight">{col.label}</div>
                      <div className="text-xs opacity-90">
                        {items.length} pedido{items.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black">
                    {items.length}
                  </div>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {items.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground">
                      <Icon
                        size={36}
                        className="mx-auto mb-2 opacity-30"
                      />
                      <p className="text-sm">Nenhum pedido</p>
                    </div>
                  ) : (
                    items.map((o) => (
                      <OrderCard
                        key={o.id}
                        order={o}
                        onAdvance={(s, note) => toastStatus.run(o.id, s, note)}
                        loading={toastStatus.loading}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function OrderCard({
  order,
  onAdvance,
  loading,
}: {
  order: FullOrder;
  onAdvance: (s: OrderStatus, note?: string) => any;
  loading: boolean;
}) {
  const nextMap: Partial<Record<OrderStatus, OrderStatus>> = {
    NEW: "CONFIRMED",
    CONFIRMED: "IN_PREPARATION",
    IN_PREPARATION: "READY",
  };
  const next = nextMap[order.status];
  const nextLabel: Partial<Record<OrderStatus, string>> = {
    NEW: "✓ ACEITAR",
    CONFIRMED: "👨‍🍳 INICIAR PREPARO",
    IN_PREPARATION: "✅ MARCAR PRONTO",
  };

  return (
    <div
      className={cn(
        "bg-background border-2 rounded-xl overflow-hidden transition hover:shadow-md",
        order.isDelivery
          ? "border-indigo-100"
          : "border-emerald-100"
      )}
    >
      <div
        className={cn(
          "px-3 py-2 flex items-center justify-between gap-2",
          order.isDelivery
            ? "bg-indigo-50 border-b border-indigo-100"
            : "bg-emerald-50 border-b border-emerald-100"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "w-9 h-9 rounded-lg text-white flex items-center justify-center shrink-0 shadow",
              order.isDelivery ? "bg-indigo-500" : "bg-emerald-500"
            )}
          >
            {order.isDelivery ? <Truck size={16} /> : <Store size={16} />}
          </div>
          <div className="min-w-0">
            <div className="font-black text-lg leading-none">
              #{order.orderNumber}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {formatTime(order.createdAt)} ·{" "}
              {order.isDelivery ? "DELIVERY" : "RETIRADA"}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-primary">
            {formatCurrency(order.totalAmount)}
          </div>
        </div>
      </div>
      <div className="px-3 py-2 text-xs border-b border-border bg-muted/20">
        <div className="font-medium text-foreground truncate">
          👤 {order.customer?.name || order.customerName || "Cliente"}
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        {order.items.map((it) => (
          <div key={it.id} className="text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold leading-tight">
                {Math.round(Number(it.quantity)) > 1 && (
                  <span className="inline-block mr-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">
                    {Math.round(Number(it.quantity))}x
                  </span>
                )}
                {it.productName}
              </div>
            </div>
            {it.addons.length > 0 && (
              <div className="mt-0.5 ml-5 text-xs text-muted-foreground space-y-0.5">
                {it.addons.map((a) => (
                  <div key={a.id}>
                    + {a.quantity}× {a.addonName}
                  </div>
                ))}
              </div>
            )}
            {it.observation && (
              <div className="mt-0.5 ml-5 text-[11px] bg-yellow-50 text-yellow-800 rounded px-2 py-0.5 border border-yellow-200 inline-block">
                📝 {it.observation}
              </div>
            )}
          </div>
        ))}
        {order.observation && (
          <div className="mt-1 text-[11px] bg-amber-50 text-amber-800 rounded-lg p-2 border border-amber-200">
            📝 <strong>Obs geral:</strong> {order.observation}
          </div>
        )}
      </div>
      {next && (
        <div className="p-3 pt-0">
          <button
            onClick={() => onAdvance(next)}
            disabled={loading}
            className={cn(
              "w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:opacity-95 disabled:opacity-50 transition",
              next === "CONFIRMED" &&
                "bg-gradient-to-r from-blue-500 to-blue-600",
              next === "IN_PREPARATION" &&
                "bg-gradient-to-r from-orange-500 to-red-500",
              next === "READY" &&
                "bg-gradient-to-r from-purple-500 to-pink-500"
            )}
          >
            {nextLabel[next]}
          </button>
        </div>
      )}
    </div>
  );
}
