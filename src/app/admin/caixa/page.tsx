import AdminLayout from "@/components/layout/admin-layout";
import { requireAttendant } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import CashRegisterPageClient from "@/components/pages/admin/cash-register-page";

export const dynamic = "force-dynamic";

export default async function AdminCashPage() {
  const user = await requireAttendant();
  const registers = await prisma.cashRegister.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      movements: { orderBy: { createdAt: "asc" } },
      user: true,
      orders: true,
    },
  });
  const userProp = { role: user.role, name: user.name ?? null };
  return (
    <CashRegisterPageClient
      user={userProp}
      registers={registers as any}
    />
  );
}
