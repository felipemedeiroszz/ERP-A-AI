import AdminLayout from "@/components/layout/admin-layout";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  TrendingUp,
  CreditCard,
  Banknote,
  QrCode,
  ChefHat,
  Store,
} from "lucide-react";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const whereDay = {
    createdAt: { gte: startOfDay, lte: endOfDay },
  };

  const [
    ordersToday,
    revenueToday,
    pixTotal,
    cashTotal,
    cardTotal,
    statusCounts,
    recentOrders,
    topProducts,
    allOpen,
  ] = await Promise.all([
    prisma.order.count({ where: whereDay }),
    prisma.order.aggregate({
      where: {
        ...whereDay,
        NOT: { status: OrderStatus.CANCELLED },
      },
      _sum: { totalAmount: true },
    }),
    prisma.payment.aggregate({
      where: {
        ...whereDay,
        method: PaymentMethod.PIX,
        status: PaymentStatus.CONFIRMED,
      },
      _sum: { amount: true },
    }),
    prisma.order.aggregate({
      where: {
        ...whereDay,
        paymentMethod: {
          in: [PaymentMethod.CASH, PaymentMethod.DELIVERY_CASH],
        },
        NOT: { status: OrderStatus.CANCELLED },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        ...whereDay,
        paymentMethod: {
          in: [PaymentMethod.CARD, PaymentMethod.DELIVERY_CARD],
        },
        NOT: { status: OrderStatus.CANCELLED },
      },
      _sum: { totalAmount: true },
    }),
    Promise.all([
      prisma.order.count({ where: { status: OrderStatus.NEW } }),
      prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
      prisma.order.count({
        where: { status: OrderStatus.IN_PREPARATION },
      }),
      prisma.order.count({ where: { status: OrderStatus.READY } }),
      prisma.order.count({
        where: { status: OrderStatus.OUT_FOR_DELIVERY },
      }),
      prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      prisma.order.count({ where: { status: OrderStatus.PICKED_UP } }),
      prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
    ]),
    prisma.order.findMany({
      where: whereDay,
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { items: true, customer: true },
    }),
    prisma.$queryRawUnsafe<any[]>(`
      SELECT p.name, SUM(oi.quantity) as qty, SUM(oi.subtotal) as total
      FROM "OrderItem" oi
      JOIN "Product" p ON oi."productId" = p.id
      WHERE oi."createdAt" >= $1 AND oi."createdAt" <= $2
      GROUP BY p.id, p.name
      ORDER BY total DESC NULLS LAST
      LIMIT 5
    `, startOfDay, endOfDay),
    prisma.cashRegister.findMany({
      where: { status: "OPEN" },
      include: { user: true },
    }),
  ]);

  const total = Number(revenueToday._sum.totalAmount || 0);
  const avgTicket = ordersToday > 0 ? total / ordersToday : 0;

  return {
    ordersToday,
    revenueToday: total,
    pixTotal: Number(pixTotal._sum.amount || 0),
    cashTotal: Number(cashTotal._sum.totalAmount || 0),
    cardTotal: Number(cardTotal._sum.totalAmount || 0),
    avgTicket,
    statusCounts: {
      new: statusCounts[0],
      confirmed: statusCounts[1],
      in_prep: statusCounts[2],
      ready: statusCounts[3],
      out: statusCounts[4],
      delivered: statusCounts[5],
      picked: statusCounts[6],
      cancelled: statusCounts[7],
    },
    recentOrders,
    topProducts,
    openCashRegisters: allOpen,
  };
}

export default async function AdminDashboardPage() {
  const user = await requireAuth();
  const data = await getDashboardData();

  const cards = [
    {
      label: "Faturamento Hoje",
      value: formatCurrency(data.revenueToday),
      icon: DollarSign,
      color: "from-green-500 to-emerald-600",
      sub: `${data.ordersToday} pedidos`,
    },
    {
      label: "Pedidos Hoje",
      value: String(data.ordersToday),
      icon: ShoppingBag,
      color: "from-blue-500 to-indigo-600",
      sub: `Ticket médio ${formatCurrency(data.avgTicket)}`,
    },
    {
      label: "PIX",
      value: formatCurrency(data.pixTotal),
      icon: QrCode,
      color: "from-purple-500 to-violet-600",
    },
    {
      label: "Dinheiro",
      value: formatCurrency(data.cashTotal),
      icon: Banknote,
      color: "from-yellow-500 to-amber-600",
    },
    {
      label: "Cartão",
      value: formatCurrency(data.cardTotal),
      icon: CreditCard,
      color: "from-pink-500 to-rose-600",
    },
    {
      label: "Ticket Médio",
      value: formatCurrency(data.avgTicket),
      icon: TrendingUp,
      color: "from-cyan-500 to-sky-600",
    },
  ];

  const statusBar = [
    {
      key: "new",
      label: "Novos",
      value: data.statusCounts.new,
      color: "bg-slate-500",
      icon: Clock,
    },
    {
      key: "confirmed",
      label: "Confirmados",
      value: data.statusCounts.confirmed,
      color: "bg-blue-500",
      icon: CheckCircle2,
    },
    {
      key: "in_prep",
      label: "Em Preparo",
      value: data.statusCounts.in_prep,
      color: "bg-orange-500",
      icon: ChefHat,
    },
    {
      key: "ready",
      label: "Prontos",
      value: data.statusCounts.ready,
      color: "bg-purple-500",
      icon: Package,
    },
    {
      key: "out",
      label: "Saiu Entrega",
      value: data.statusCounts.out,
      color: "bg-indigo-500",
      icon: Truck,
    },
    {
      key: "done",
      label: "Concluídos",
      value: data.statusCounts.delivered + data.statusCounts.picked,
      color: "bg-green-500",
      icon: CheckCircle2,
    },
    {
      key: "cancel",
      label: "Cancelados",
      value: data.statusCounts.cancelled,
      color: "bg-red-500",
      icon: Clock,
    },
  ];

  return (
    <AdminLayout
      userRole={user.role}
      userName={user.name || "Usuário"}
      active="dashboard"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do dia de hoje
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-lg bg-gradient-to-br ${c.color} text-white flex items-center justify-center shadow-sm`}
                >
                  <Icon size={18} />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {c.label}
              </div>
              {c.sub && (
                <div className="text-xs text-primary font-medium mt-1">
                  {c.sub}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="xl:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Status dos Pedidos</h3>
            <span className="text-xs text-muted-foreground">
              Atualizado em tempo real
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {statusBar.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.key}
                  className="bg-muted/40 border border-border rounded-lg p-3 text-center"
                >
                  <div
                    className={`w-8 h-8 rounded-full ${s.color} text-white mx-auto mb-1.5 flex items-center justify-center`}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>

          {data.openCashRegisters.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Store size={16} className="text-green-600" />
                Caixas Abertos
              </h4>
              <div className="grid sm:grid-cols-2 gap-2">
                {data.openCashRegisters.map((cr) => (
                  <div
                    key={cr.id}
                    className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {cr.identifier}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {cr.user.name} · Abertura:{" "}
                        {formatDateTime(cr.openedAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        Saldo inicial
                      </div>
                      <div className="text-sm font-bold text-green-700">
                        {formatCurrency(cr.openingBalance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-bold mb-4">Produtos Mais Vendidos</h3>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem vendas no dia
            </p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium line-clamp-1">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold">
                      {formatCurrency(Number(p.total))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{Number(p.qty).toFixed(1)} un</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Últimos Pedidos</h3>
          <a
            href="/admin/pedidos"
            className="text-sm text-primary font-medium hover:underline"
          >
            Ver todos →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground text-xs">
                <th className="py-2 px-3 font-medium">#</th>
                <th className="py-2 px-3 font-medium">Cliente</th>
                <th className="py-2 px-3 font-medium">Data</th>
                <th className="py-2 px-3 font-medium">Valor</th>
                <th className="py-2 px-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Nenhum pedido hoje.
                  </td>
                </tr>
              ) : (
                data.recentOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="py-2.5 px-3 font-semibold">
                      #{o.orderNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      {o.customer?.name ||
                        o.customerName ||
                        "Cliente Balcão"}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold">
                      {formatCurrency(o.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    NEW: "bg-slate-100 text-slate-700 border-slate-200",
    CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",
    IN_PREPARATION:
      "bg-orange-100 text-orange-700 border-orange-200",
    READY: "bg-purple-100 text-purple-700 border-purple-200",
    OUT_FOR_DELIVERY:
      "bg-indigo-100 text-indigo-700 border-indigo-200",
    DELIVERED: "bg-green-100 text-green-700 border-green-200",
    PICKED_UP: "bg-emerald-100 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
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
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
