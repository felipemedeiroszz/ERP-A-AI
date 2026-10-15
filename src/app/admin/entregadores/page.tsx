import AdminLayout from "@/components/layout/admin-layout";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import DriversPageClient from "@/components/pages/admin/drivers-page";

export const dynamic = "force-dynamic";

export default async function AdminDriversPage() {
  const user = await requireAdmin();
  const drivers = await prisma.deliveryDriver.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { deliveries: true } } },
  });
  const userProp = { role: user.role, name: user.name ?? null };
  return <DriversPageClient drivers={drivers as any} user={userProp} />;
}
