import AdminLayout from "@/components/layout/admin-layout";
import { requireKitchen } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import OrdersPageClient from "@/components/pages/admin/orders-page";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const user = await requireKitchen();
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      items: { include: { addons: true } },
      customer: true,
      address: true,
      delivery: { include: { driver: true } },
      user: true,
    },
  });
  const drivers = await prisma.deliveryDriver.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  const openCr = await prisma.cashRegister.findMany({
    where: { status: "OPEN" },
  });
  const userProp = { role: user.role, name: user.name ?? null };
  return (
    <OrdersPageClient
      orders={orders as any}
      user={userProp}
      drivers={drivers}
      openCashRegisters={openCr as any}
    />
  );
}
