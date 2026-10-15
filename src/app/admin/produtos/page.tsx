import AdminLayout from "@/components/layout/admin-layout";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import ProductsPage from "@/components/pages/admin/products-page";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const user = await requireAdmin();
  const products = await prisma.product.findMany({
    include: {
      category: true,
      addons: { include: { addon: true } },
    },
    orderBy: [{ category: { order: "asc" } }, { name: "asc" }],
  });
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });
  const addons = await prisma.addon.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  const userProp = { role: user.role, name: user.name ?? null };
  return (
    <ProductsPage
      initialProducts={products as any}
      categories={categories}
      addons={addons}
      user={userProp}
    />
  );
}
