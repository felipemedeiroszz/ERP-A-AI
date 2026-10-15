import AdminLayout from "@/components/layout/admin-layout";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import CategoriesPageClient from "@/components/pages/admin/categories-page";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const user = await requireAdmin();
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });
  const userProp = { role: user.role, name: user.name ?? null };
  return (
    <CategoriesPageClient categories={categories as any} user={userProp} />
  );
}
