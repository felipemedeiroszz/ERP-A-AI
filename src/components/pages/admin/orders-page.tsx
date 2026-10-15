"use client";

import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import {
  Modal,
  Button,
  Input,
  Select,
  EmptyState,
  Icones,
  Badge,
  Checkbox,
  ConfirmDialog,
} from "@/components/ui";
import {
  openCashRegister,
  closeCashRegister,
  addCashMovement,
} from "@/lib/actions/cash-register";
import {
  cancelOrder,
  updateOrderStatus,
  assignDelivery,
} from "@/lib/actions/orders";
import { useToastAction } from "@/components/ui";
import {
  formatCurrency,
  formatDateTime,
  formatPhone,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Eye, Printer, Truck, RotateCcw, Filter } from "lucide-react";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  CashRegister,
  CashMovement,
  DeliveryDriver,
  Order,
  OrderItem,
  OrderItemAddon,
  Customer,
  CustomerAddress,
} from "@prisma/client";

type FullOrder = Order & {
  items: (OrderItem & { addons: OrderItemAddon[] })[];
  customer?: Customer | null;
  address?: CustomerAddress | null;
  delivery?: any;
  user?: any;
};

interface Props {
  orders: FullOrder[];
  user: { role: any; name: string | null };
  drivers: DeliveryDriver[];
  openCashRegisters: CashRegister[];
}

export default function OrdersPageClient({
  orders: init,
  user,
  drivers,
  openCashRegisters,
}: Props) {
  const [list, setList] = useState<FullOrder[]>(init);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<FullOrder | null>(null);
  const [assign, setAssign] = useState<FullOrder | null>(null);
  const [assignDriverId, setAssignDriverId] = useState("");
  const [canceling, setCanceling] = useState<FullOrder | null>(null);

  const toastCancel = useToastAction(cancelOrder as any, {
    success: "Pedido cancelado!",
    onSuccess: () => window.location.reload(),
  });
  const toastStatus = useToastAction(updateOrderStatus as any, {
    success: "Status atualizado!",
    onSuccess: () => window.location.reload(),
  });
  const toastAssign = useToastAction(assignDelivery as any, {
    success: "Entrega atribuída!",
    onSuccess: () => {
      setAssign(null);
      window.location.reload();
    },
  });

  const filtered = list.filter((o) => {
    const matchStatus = filter === "ALL" || o.status === filter;
    const matchSearch =
      !search ||
      String(o.orderNumber).includes(search) ||
      (o.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customerPhone || "").includes(search.replace(/\D/g, ""));
    return matchStatus && matchSearch;
  });

  const statusCounts: Record<string, number> = {};
  for (const o of init) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  }

  const statusFilters: { id: OrderStatus | "ALL"; label: string; color: any }[] = [
    { id: "ALL", label: "Todos", color: "default" },
    { id: "NEW", label: "Novos", color: "blue" },
    { id: "CONFIRMED", label: "Confirmados", color: "indigo" },
    { id: "IN_PREPARATION", label: "Preparo", color: "orange" },
    { id: "READY", label: "Prontos", color: "purple" },
    { id: "OUT_FOR_DELIVERY", label: "Entrega", color: "yellow" },
    { id: "DELIVERED", label: "Entregues", color: "green" },
    { id: "PICKED_UP", label: "Retirados", color: "green" },
    { id: "CANCELLED", label: "Cancelados", color: "red" },
  ];

  return (
    <AdminLayout userRole={user.role} userName={user.name || "Usuário"} active="orders">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-sm text-muted-foreground">{list.length} pedidos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Buscar (# / cliente / tel)"
            className="sm:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-3 mb-4 overflow-x-auto -mx-4 sm:mx-0 sm:rounded-xl sm:p-3">
        <div className="flex gap-2 min-w-max">
          {statusFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap border transition",
                filter === f.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {f.label}
              <span className="ml-1.5 text-xs opacity-80">
                ({f.id === "ALL" ? list.length : statusCounts[f.id] || 0})
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum pedido encontrado"
          description="Ajuste os filtros ou aguarde novos pedidos."
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Horário</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Tipo</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-border hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="font-bold">#{o.orderNumber}</div>
                    <div className="text-[10px] text-muted-foreground hidden sm:inline">
                      {o.origin === "PDV" ? "PDV" : "Online"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {o.customer?.name || o.customerName || "Balcão"}
                    </div>
                    {o.customerPhone && (
                      <div className="text-xs text-muted-foreground">
                        {formatPhone(o.customerPhone)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                    {formatDateTime(o.createdAt)}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge color={o.isDelivery ? "indigo" : "green"}>
                      {o.isDelivery ? "Entrega" : "Retirada"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {formatCurrency(o.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end flex-wrap">
                      <button
                        onClick={() => setDetail(o)}
                        className="p-1.5 rounded hover:bg-muted text-blue-600"
                        title="Detalhes"
                      >
                        <Eye size={15} />
                      </button>
                      <NextStatusButtons
                        order={o}
                        onNext={(s, note) =>
                          toastStatus.run(o.id, s, note)
                        }
                      />
                      {o.isDelivery &&
                        !o.delivery &&
                        o.status !== "CANCELLED" &&
                        ["READY", "CONFIRMED", "IN_PREPARATION"].includes(
                          o.status
                        ) && (
                          <button
                            onClick={() => {
                              setAssign(o);
                              setAssignDriverId(
                                drivers.find((d) => d.status === "AVAILABLE")
                                  ?.id || drivers[0]?.id || ""
                              );
                            }}
                            className="p-1.5 rounded hover:bg-muted text-indigo-600"
                            title="Atribuir Entregador"
                          >
                            <Truck size={15} />
                          </button>
                        )}
                      {o.status !== "CANCELLED" &&
                        o.status !== "DELIVERED" &&
                        o.status !== "PICKED_UP" && (
                          <button
                            onClick={() => setCanceling(o)}
                            className="p-1.5 rounded hover:bg-muted text-red-600"
                            title="Cancelar"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <Modal
          open={true}
          onClose={() => setDetail(null)}
          title={`Pedido #${detail.orderNumber}`}
          size="lg"
        >
          <OrderDetail order={detail} />
        </Modal>
      )}

      {assign && (
        <Modal
          open={true}
          onClose={() => setAssign(null)}
          title={`Atribuir Entregador - Pedido #${assign.orderNumber}`}
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/30 border border-border text-sm">
              <div>
                <strong>Entregar para:</strong>{" "}
                {assign.customer?.name || assign.customerName}
              </div>
              {assign.address && (
                <div className="text-xs text-muted-foreground mt-1">
                  {assign.address.street}, {assign.address.number}
                  {assign.address.neighborhood && ` - ${assign.address.neighborhood}`}
                  {assign.address.city && `, ${assign.address.city}/${assign.address.state}`}
                </div>
              )}
            </div>
            <Select
              label="Entregador"
              value={assignDriverId}
              onChange={(e) => setAssignDriverId(e.target.value)}
              options={[
                { value: "", label: "Selecione..." },
                ...drivers.map((d) => ({
                  value: d.id,
                  label: `${d.name} - ${d.status === "AVAILABLE" ? "✅ Disponível" : d.status === "BUSY" ? "⏳ Ocupado" : "⚫ Offline"}`,
                })),
              ]}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setAssign(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() =>
                  toastAssign.run(assign.id, assignDriverId)
                }
                disabled={!assignDriverId || toastAssign.loading}
              >
                <Truck size={16} /> Atribuir
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!canceling}
        title="Cancelar pedido?"
        description={`Tem certeza que deseja cancelar o pedido #${canceling?.orderNumber}?`}
        confirmLabel="Cancelar Pedido"
        destructive
        onCancel={() => setCanceling(null)}
        onConfirm={() => canceling && toastCancel.run(canceling.id)}
      />
    </AdminLayout>
  );
}

function NextStatusButtons({
  order,
  onNext,
}: {
  order: FullOrder;
  onNext: (s: OrderStatus, note?: string) => any;
}) {
  const nextMap: Partial<Record<OrderStatus, OrderStatus>> = {
    NEW: "CONFIRMED",
    CONFIRMED: "IN_PREPARATION",
    IN_PREPARATION: "READY",
    READY: order.isDelivery ? "OUT_FOR_DELIVERY" : "PICKED_UP",
    OUT_FOR_DELIVERY: "DELIVERED",
  };
  const next = nextMap[order.status];
  if (!next) return null;
  const labels: Record<OrderStatus, string> = {
    NEW: "Confirmar",
    CONFIRMED: "Iniciar Preparo",
    IN_PREPARATION: "Marcar Pronto",
    READY: order.isDelivery ? "Saiu Entrega" : "Marcar Retirado",
    OUT_FOR_DELIVERY: "Marcar Entregue",
    DELIVERED: "Entregue",
    PICKED_UP: "Retirado",
    CANCELLED: "Cancelado",
  };
  return (
    <button
      onClick={() => onNext(next)}
      className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition text-[11px] font-semibold px-2"
    >
      {labels[next]}
    </button>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, any> = {
    NEW: "blue",
    CONFIRMED: "indigo",
    IN_PREPARATION: "orange",
    READY: "purple",
    OUT_FOR_DELIVERY: "yellow",
    DELIVERED: "green",
    PICKED_UP: "green",
    CANCELLED: "red",
  };
  const labels: Record<OrderStatus, string> = {
    NEW: "Novo",
    CONFIRMED: "Confirmado",
    IN_PREPARATION: "Em Preparação",
    READY: "Pronto",
    OUT_FOR_DELIVERY: "Saiu p/ Entrega",
    DELIVERED: "Entregue",
    PICKED_UP: "Retirado",
    CANCELLED: "Cancelado",
  };
  return <Badge color={styles[status]}>{labels[status]}</Badge>;
}

function OrderDetail({ order }: { order: FullOrder }) {
  const pmLabels: Record<PaymentMethod, string> = {
    PIX: "PIX",
    CASH: "Dinheiro",
    CARD: "Cartão",
    DELIVERY_CASH: "Pagamento na Entrega (Dinheiro)",
    DELIVERY_CARD: "Pagamento na Entrega (Cartão)",
    PICKUP_PAYMENT: "Pagamento na Retirada",
  };
  return (
    <div className="space-y-4 text-sm">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-muted/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Status</div>
          <StatusBadge status={order.status} />
        </div>
        <div className="p-3 rounded-xl bg-muted/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Total</div>
          <div className="font-bold text-lg text-primary">
            {formatCurrency(order.totalAmount)}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-muted/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Pagamento</div>
          <div className="font-semibold">{pmLabels[order.paymentMethod]}</div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Itens do Pedido</h4>
        <div className="space-y-2">
          {order.items.map((it) => {
            const totalItem =
              it.subtotal +
              it.addons.reduce((s, a) => s + Number(a.totalPrice), 0);
            return (
              <div
                key={it.id}
                className="p-3 rounded-xl bg-card border border-border"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">
                      {Math.round(Number(it.quantity)) > 1 && (
                        <span className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5 mr-2 font-bold">
                          {Math.round(Number(it.quantity))}x
                        </span>
                      )}
                      {it.productName}
                    </div>
                    {it.addons.length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                        {it.addons.map((a) => (
                          <div key={a.id}>
                            + {a.quantity}× {a.addonName} -{" "}
                            {formatCurrency(a.totalPrice)}
                          </div>
                        ))}
                      </div>
                    )}
                    {it.observation && (
                      <div className="mt-1 text-[11px] bg-yellow-50 text-yellow-800 rounded px-2 py-0.5 border border-yellow-200 inline-block">
                        📝 {it.observation}
                      </div>
                    )}
                  </div>
                  <div className="font-bold">{formatCurrency(totalItem)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {order.address && (
        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
          <div className="text-xs text-indigo-700 font-semibold mb-1.5">
            🚚 Endereço de Entrega
          </div>
          <div className="text-xs space-y-0.5">
            <div>
              <strong>{order.address.street}</strong>, {order.address.number}
              {order.address.complement && ` - ${order.address.complement}`}
            </div>
            <div>
              {order.address.neighborhood} · {order.address.city}/
              {order.address.state}
            </div>
            {order.address.reference && (
              <div className="text-indigo-700">
                Ref: {order.address.reference}
              </div>
            )}
          </div>
        </div>
      )}

      {order.observation && (
        <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-xs">
          <strong className="text-yellow-800">Observação: </strong>
          <span className="text-yellow-900">{order.observation}</span>
        </div>
      )}

      {(order.cashReceived !== null || order.changeFor !== null) && (
        <div className="grid grid-cols-2 gap-3">
          {order.cashReceived !== null && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-sm">
              <div className="text-xs text-green-700 mb-1">Valor Recebido</div>
              <div className="font-bold">
                {formatCurrency(Number(order.cashReceived))}
              </div>
            </div>
          )}
          {(order.change !== null || order.changeFor !== null) && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm">
              <div className="text-xs text-blue-700 mb-1">
                {order.changeFor !== null && order.change === null
                  ? "Troco para"
                  : "Troco"}
              </div>
              <div className="font-bold">
                {formatCurrency(
                  Number(order.change ?? order.changeFor ?? 0)
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pt-3 border-t border-border flex flex-wrap gap-2 justify-end">
        <Button variant="secondary" size="sm">
          <Printer size={14} /> Imprimir
        </Button>
      </div>
    </div>
  );
}
