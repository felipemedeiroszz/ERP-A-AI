import AdminLayout from "@/components/layout/admin-layout";
import { requireAdmin } from "@/lib/auth/session";
import { getAllSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import SettingsPageClient from "@/components/pages/admin/settings-page";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  const [{ company, store, appearance, printer }, users] = await Promise.all([
    getAllSettings(),
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    }),
  ]);
  const userProp = { role: user.role, name: user.name ?? null, id: user.id };
  return (
    <SettingsPageClient
      user={userProp}
      company={company}
      store={store}
      appearance={appearance}
      printer={printer}
      users={users}
    />
  );
}
