import AdminLayout from "@/components/layout/admin-layout";
import { requireAttendant } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import CustomersPageClient from "@/components/pages/admin/customers-page";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const user = await requireAttendant();
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { orders: true, addresses: true } },
      orders: { where: { NOT: { status: "CANCELLED" } } },
    },
  });
  const enriched = customers.map((c) => ({
    ...c,
    totalSpent: c.orders.reduce(
      (sum: number, o: any) => sum + Number(o.totalAmount),
      0
    ),
  }));
  const userProp = { role: user.role, name: user.name ?? null };
  return (
    <CustomersPageClient customers={enriched as any} user={userProp} />
  );
}
