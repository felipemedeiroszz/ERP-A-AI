import { requireAttendant } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/settings";
import PDVPageClient from "@/components/pages/pdv/pdv-page";

export const dynamic = "force-dynamic";

export default async function PDVPage() {
  const user = await requireAttendant();
  const [categories, products, addons, customers, cashRegisters, store] =
    await Promise.all([
      prisma.category.findMany({
        where: { active: true },
        orderBy: { order: "asc" },
        include: { _count: { select: { products: true } } },
      }),
      prisma.product.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        include: {
          category: true,
          addons: { include: { addon: true } },
        },
      }),
      prisma.addon.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      prisma.customer.findMany({
        orderBy: { name: "asc" },
        take: 200,
      }),
      prisma.cashRegister.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      getStoreSettings(),
    ]);

  const userProp = { role: user.role, name: user.name ?? null, id: user.id };
  return (
    <PDVPageClient
      categories={categories as any}
      products={products as any}
      addons={addons}
      customers={customers}
      user={userProp}
      cashRegisters={cashRegisters as any}
      weightPricePerKg={Number(store.weightPricePerKg)}
    />
  );
}
