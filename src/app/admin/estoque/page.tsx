import AdminLayout from "@/components/layout/admin-layout";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import InventoryPageClient from "@/components/pages/admin/inventory-page";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const user = await requireAdmin();
  const items = await prisma.inventoryItem.findMany({
    orderBy: { name: "asc" },
    include: {
      movements: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
  const userProp = { role: user.role, name: user.name ?? null };
  return <InventoryPageClient items={items as any} user={userProp} />;
}
