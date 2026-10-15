import { prisma } from "@/lib/prisma";
import { requireDelivery } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import DeliveriesPageClient from "@/components/pages/admin/deliveries-page";

export const dynamic = "force-dynamic";

export default async function AdminDeliveriesPage() {
  const user = await requireDelivery();
  const isDriverOnly = user.role === UserRole.DELIVERY_DRIVER;

  let driverId: string | null = null;
  if (isDriverOnly) {
    const matched = await prisma.deliveryDriver.findFirst({
      where: {
        active: true,
        OR: [
          { name: { contains: user.name, mode: "insensitive" } },
          { name: user.name },
        ],
      },
      take: 1,
    });
    driverId = matched?.id ?? null;
  }

  const where: any = {
    isDelivery: true,
    NOT: {
      status: { in: ["CANCELLED"] },
    },
  };

  if (!isDriverOnly) {
    where.NOT.status.in.push("NEW", "CONFIRMED", "IN_PREPARATION");
  } else {
    if (driverId) {
      where.delivery = { driverId };
    } else {
      where.NOT.status.in.push("NEW", "CONFIRMED", "IN_PREPARATION");
      where.id = "__never_match__";
    }
  }

  const [orders, drivers] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        items: { include: { addons: true } },
        address: true,
        delivery: { include: { driver: true } },
      },
    }),
    prisma.deliveryDriver.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const userProp = { role: user.role, name: user.name ?? null, id: user.id };
  return (
    <DeliveriesPageClient
      user={userProp}
      orders={orders as any}
      drivers={drivers}
      isDriverOnly={isDriverOnly}
    />
  );
}
