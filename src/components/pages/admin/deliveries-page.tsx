"use client";

import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import {
  formatCurrency,
  formatDateTime,
  formatPhone,
} from "@/lib/utils";
import { Badge } from "@/components/ui";
import { useToastAction } from "@/components/ui";
import { markDeliveryStatus, assignDelivery } from "@/lib/actions/orders";
import {
  Truck,
  User,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Package,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import type {
  Order,
  OrderItem,
  OrderItemAddon,
  CustomerAddress,
  DeliveryDriver,
} from "@prisma/client";

type FullOrder = Order & {
  items: (OrderItem & { addons: OrderItemAddon[] })[];
  address?: CustomerAddress | null;
  delivery?: {
    id: string;
    driver?: DeliveryDriver | null;
    status: string;
    problemNote?: string | null;
  } | null;
};

interface Props {
  user: { role: any; name: string | null };
  orders: FullOrder[];
  drivers: DeliveryDriver[];
  isDriverOnly: boolean;
}

export default function DeliveriesPageClient({
  user,
  orders: init,
  drivers,
  isDriverOnly,
}: Props) {
  const [list, setList] = useState<FullOrder[]>(init);
  const toastStatus = useToastAction(markDeliveryStatus as any, {
    success: "Status atualizado!",
    onSuccess: () => window.location.reload(),
  });
  const toastAssign = useToastAction(assignDelivery as any, {
    success: "Pedido atribuído!",
    onSuccess: () => window.location.reload(),
  });

  if (isDriverOnly) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <header className="bg-card border-b border-border sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md">
              <Truck size={22} />
            </div>
            <div className="flex-1">
              <h1 className="font-bold text-xl leading-tight">Minhas Entregas</h1>
              <p className="text-xs text-muted-foreground">{user.name}</p>
            </div>
            <a
              href="/login"
              className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-medium"
            >
              Sair
            </a>
          </div>
        </header>
        <main className="max-w-5xl mx-auto p-4 space-y-4">
          {list.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
              <Truck size={50} className="mx-auto mb-2 opacity-40" />
              <p className="font-semibold">Sem entregas atribuídas</p>
              <p className="text-sm">Aguarde novos pedidos serem atribuídos.</p>
            </div>
          ) : (
            list.map((o) => (
              <DeliveryCardDriver
                key={o.id}
                order={o}
                onStatus={(s, note) => toastStatus.run(o.id, s, note)}
                loading={toastStatus.loading}
              />
            ))
          )}
        </main>
      </div>
    );
  }

  return (
    <AdminLayout
      userRole={user.role}
      userName={user.name || "Usuário"}
      active="deliveries"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gestão de Entregas</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe e atribua entregas aos entregadores
        </p>
      </div>

      {list.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
          <Truck size={50} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold">Sem entregas</p>
          <p className="text-sm">Novos pedidos aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {list.map((o) => (
            <DeliveryCardAdmin
              key={o.id}
              order={o}
              drivers={drivers}
              onAssign={(dId) => toastAssign.run(o.id, dId)}
              assignLoading={toastAssign.loading}
              onStatus={(s, note) => toastStatus.run(o.id, s, note)}
              statusLoading={toastStatus.loading}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

function AddressBox({
  address,
  customerName,
  customerPhone,
}: {
  address: CustomerAddress;
  customerName?: string | null;
  customerPhone?: string | null;
}) {
  return (
    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1.5 text-xs">
      <div className="flex items-center gap-2 text-indigo-800 font-semibold">
        <MapPin size={14} /> Endereço de Entrega
      </div>
      <div className="font-medium text-indigo-950">
        {address.street}, {address.number}
        {address.complement && ` - ${address.complement}`}
      </div>
      <div className="text-indigo-800">
        {address.neighborhood} · {address.city}/{address.state} · CEP{" "}
        {address.zipCode}
      </div>
      {address.reference && (
        <div className="text-indigo-700 bg-white/60 rounded px-2 py-1 border border-indigo-100">
          📌 Ref: {address.reference}
        </div>
      )}
      {(customerName || customerPhone) && (
        <div className="flex flex-wrap gap-3 pt-1 border-t border-indigo-200 mt-1.5">
          {customerName && (
            <div className="inline-flex items-center gap-1">
              <User size={12} /> {customerName}
            </div>
          )}
          {customerPhone && (
            <div className="inline-flex items-center gap-1">
              <Phone size={12} /> {formatPhone(customerPhone)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DeliveryCardDriver({
  order,
  onStatus,
  loading,
}: {
  order: FullOrder;
  onStatus: (s: any, note?: string) => any;
  loading: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white flex items-center justify-between">
        <div>
          <div className="text-xs opacity-90">Pedido</div>
          <div className="text-2xl font-black leading-none">
            #{order.orderNumber}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-90">Criado em</div>
          <div className="font-semibold">
            {formatDateTime(order.createdAt)}
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {order.address && (
          <AddressBox
            address={order.address}
            customerName={order.customerName}
            customerPhone={order.customerPhone}
          />
        )}
        <div className="p-3 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Package size={14} className="text-primary" /> Itens do Pedido
          </div>
          <div className="space-y-1.5 text-sm">
            {order.items.map((it) => (
              <div key={it.id}>
                <div className="flex justify-between gap-2">
                  <div className="font-medium">
                    {Math.round(Number(it.quantity))}x {it.productName}
                  </div>
                  <div className="font-bold">
                    {formatCurrency(
                      Number(it.subtotal) +
                        it.addons.reduce(
                          (s, a) => s + Number(a.totalPrice),
                          0
                        )
                    )}
                  </div>
                </div>
                {it.addons.length > 0 && (
                  <div className="ml-5 text-xs text-muted-foreground space-y-0.5">
                    {it.addons.map((a) => (
                      <div key={a.id}>
                        + {a.quantity}× {a.addonName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="text-xs text-muted-foreground mb-0.5">
              Total Pedido
            </div>
            <div className="text-xl font-black text-primary">
              {formatCurrency(order.totalAmount)}
            </div>
          </div>
          {(order.paymentMethod === "DELIVERY_CASH" ||
            order.paymentMethod === "CASH") && (
            <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200">
              <div className="text-xs text-yellow-800 mb-0.5">
                {order.changeFor ? "Troco para" : "Forma pgto"}
              </div>
              <div className="text-lg font-bold text-yellow-800">
                {order.changeFor
                  ? formatCurrency(Number(order.changeFor))
                  : order.paymentMethod === "DELIVERY_CARD"
                  ? "💳 Cartão"
                  : "💵 Dinheiro"}
              </div>
            </div>
          )}
        </div>

        {order.status === "OUT_FOR_DELIVERY" && (
          <button
            onClick={() => onStatus("DELIVERED")}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-md hover:opacity-95 disabled:opacity-50"
          >
            <CheckCircle2 size={18} className="inline mr-2" />
            MARCAR COMO ENTREGUE
          </button>
        )}

        {order.status === "READY" && (
          <button
            onClick={() => onStatus("OUT_FOR_DELIVERY")}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold shadow-md hover:opacity-95 disabled:opacity-50"
          >
            <Truck size={18} className="inline mr-2" />
            SAIU PARA ENTREGA
          </button>
        )}
      </div>
    </div>
  );
}

function DeliveryCardAdmin({
  order,
  drivers,
  onAssign,
  assignLoading,
  onStatus,
  statusLoading,
}: {
  order: FullOrder;
  drivers: DeliveryDriver[];
  onAssign: (driverId: string) => any;
  assignLoading: boolean;
  onStatus: (s: any, note?: string) => any;
  statusLoading: boolean;
}) {
  const [selDrv, setSelDrv] = useState(
    order.delivery?.driver?.id ||
      drivers.find((d) => d.status === "AVAILABLE")?.id ||
      ""
  );

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center font-black">
            #{order.orderNumber}
          </div>
          <div>
            <div className="font-semibold">
              {order.customerName || "Cliente"}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock size={11} /> {formatDateTime(order.createdAt)}
            </div>
          </div>
        </div>
        <Badge
          color={
            order.status === "READY"
              ? "purple"
              : order.status === "OUT_FOR_DELIVERY"
              ? "yellow"
              : order.status === "DELIVERED"
              ? "green"
              : "default"
          }
        >
          {order.status === "READY"
            ? "Pronto p/ Entrega"
            : order.status === "OUT_FOR_DELIVERY"
            ? "Em Rota"
            : order.status === "DELIVERED"
            ? "Entregue"
            : order.status}
        </Badge>
      </div>
      <div className="p-4 space-y-3">
        {order.address && (
          <AddressBox
            address={order.address}
            customerName={order.customerName}
            customerPhone={order.customerPhone}
          />
        )}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-muted/40">
            <div className="text-muted-foreground">Itens</div>
            <div className="font-bold">{order.items.length}</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/40">
            <div className="text-muted-foreground">Total</div>
            <div className="font-bold text-primary">
              {formatCurrency(order.totalAmount)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-muted/40">
            <div className="text-muted-foreground">Pgto</div>
            <div className="font-bold capitalize truncate">
              {order.paymentMethod}
            </div>
          </div>
        </div>

        {!order.delivery?.driver ? (
          <div className="p-3 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 space-y-2">
            <div className="text-sm font-semibold text-indigo-900 flex items-center gap-1.5">
              <Truck size={14} /> Atribuir Entregador
            </div>
            <div className="flex gap-2">
              <select
                value={selDrv}
                onChange={(e) => setSelDrv(e.target.value)}
                className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.status})
                  </option>
                ))}
              </select>
              <button
                onClick={() => selDrv && onAssign(selDrv)}
                disabled={!selDrv || assignLoading}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                Atribuir
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 text-sm text-green-800 font-semibold">
              <Truck size={14} /> Entregador Atribuído
            </div>
            <div className="text-base font-bold mt-1">
              {order.delivery.driver?.name}
            </div>
            {order.status === "READY" && (
              <button
                onClick={() => onStatus("OUT_FOR_DELIVERY")}
                disabled={statusLoading}
                className="mt-3 w-full py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
              >
                🚚 Saiu para entrega
              </button>
            )}
            {order.status === "OUT_FOR_DELIVERY" && (
              <button
                onClick={() => onStatus("DELIVERED")}
                disabled={statusLoading}
                className="mt-3 w-full py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                ✅ Marcar como entregue
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
