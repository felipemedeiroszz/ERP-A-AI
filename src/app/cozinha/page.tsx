import { requireKitchen } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import KitchenPageClient from "@/components/pages/kitchen-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function KitchenPage() {
  const user = await requireKitchen();
  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: ["NEW", "CONFIRMED", "IN_PREPARATION", "READY"],
      },
      NOT: { status: "CANCELLED" },
    },
    orderBy: { createdAt: "asc" },
    include: {
      items: { include: { addons: true } },
      customer: true,
    },
  });
  const userProp = { role: user.role, name: user.name ?? null };
  return (
    <KitchenPageClient orders={orders as any} user={userProp} />
  );
}
