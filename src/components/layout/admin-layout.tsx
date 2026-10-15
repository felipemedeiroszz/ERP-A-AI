"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LogOut,
  LayoutDashboard,
  Package,
  ShoppingCart,
  ChefHat,
  Truck,
  Users,
  Settings,
  Warehouse,
  Receipt,
  Store,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

interface AdminLayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  userName: string;
  active?: string;
}

const adminNav = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
    roles: ["ADMIN", "ATTENDANT", "KITCHEN", "DELIVERY_DRIVER"],
  },
  {
    id: "pdv",
    label: "PDV (Vendas)",
    icon: ShoppingCart,
    href: "/pdv",
    roles: ["ADMIN", "ATTENDANT"],
  },
  {
    id: "orders",
    label: "Pedidos",
    icon: Receipt,
    href: "/admin/pedidos",
    roles: ["ADMIN", "ATTENDANT", "KITCHEN"],
  },
  {
    id: "kitchen",
    label: "Cozinha",
    icon: ChefHat,
    href: "/cozinha",
    roles: ["ADMIN", "ATTENDANT", "KITCHEN"],
  },
  {
    id: "deliveries",
    label: "Entregas",
    icon: Truck,
    href: "/admin/entregas",
    roles: ["ADMIN", "ATTENDANT", "DELIVERY_DRIVER"],
  },
  {
    id: "products",
    label: "Produtos",
    icon: Package,
    href: "/admin/produtos",
    roles: ["ADMIN"],
  },
  {
    id: "categories",
    label: "Categorias",
    icon: Store,
    href: "/admin/categorias",
    roles: ["ADMIN"],
  },
  {
    id: "addons",
    label: "Adicionais",
    icon: Package,
    href: "/admin/adicionais",
    roles: ["ADMIN"],
  },
  {
    id: "customers",
    label: "Clientes",
    icon: Users,
    href: "/admin/clientes",
    roles: ["ADMIN", "ATTENDANT"],
  },
  {
    id: "drivers",
    label: "Entregadores",
    icon: Truck,
    href: "/admin/entregadores",
    roles: ["ADMIN"],
  },
  {
    id: "cash",
    label: "Caixa",
    icon: Receipt,
    href: "/admin/caixa",
    roles: ["ADMIN", "ATTENDANT"],
  },
  {
    id: "inventory",
    label: "Estoque",
    icon: Warehouse,
    href: "/admin/estoque",
    roles: ["ADMIN"],
  },
  {
    id: "settings",
    label: "Configurações",
    icon: Settings,
    href: "/admin/configuracoes",
    roles: ["ADMIN"],
  },
];

export default function AdminLayout({
  children,
  userRole,
  userName,
  active,
}: AdminLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = adminNav.filter((item) =>
    item.roles.includes(userRole)
  );

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-lg bg-card border border-border shadow flex items-center justify-center"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-card border-r border-border transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-16",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-16 border-b border-border flex items-center px-3 gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center shrink-0">
            A
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">Açaiteria</p>
              <p className="text-xs text-muted-foreground truncate">
                Painel
              </p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-muted transition"
          >
            <ChevronRight
              size={16}
              className={cn("transition", !sidebarOpen && "rotate-180")}
            />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              active === item.id ||
              (item.id === "dashboard" && active === undefined);
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition group",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon size={18} className="shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </a>
            );
          })}
        </nav>

        <div className="border-t border-border p-2 space-y-1">
          {sidebarOpen && (
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground">Usuário logado</p>
              <p className="text-sm font-semibold truncate">{userName}</p>
              <p className="text-xs text-primary font-medium capitalize">
                {userRole.toLowerCase().replace("_", " ")}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
            )}
          >
            <LogOut size={18} className="shrink-0" />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <div
        className={cn(
          "transition-all duration-300 min-h-screen",
          sidebarOpen ? "lg:ml-64" : "lg:ml-16"
        )}
      >
        <header className="h-16 bg-card border-b border-border sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold">{userName}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {userRole.toLowerCase().replace("_", " ")}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent text-white font-bold flex items-center justify-center">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
