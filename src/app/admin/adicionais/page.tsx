import AdminLayout from "@/components/layout/admin-layout";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import AddonsPageClient from "@/components/pages/admin/addons-page";

export const dynamic = "force-dynamic";

export default async function AdminAddonsPage() {
  const user = await requireAdmin();
  const addons = await prisma.addon.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  const userProp = { role: user.role, name: user.name ?? null };
  return <AddonsPageClient addons={addons as any} user={userProp} />;
}
