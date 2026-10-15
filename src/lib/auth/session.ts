import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) redirect("/unauthorized");
  return user;
}

export async function requireAdmin() {
  return requireRole([UserRole.ADMIN]);
}

export async function requireAttendant() {
  return requireRole([UserRole.ADMIN, UserRole.ATTENDANT]);
}

export async function requireKitchen() {
  return requireRole([UserRole.ADMIN, UserRole.KITCHEN, UserRole.ATTENDANT]);
}

export async function requireDelivery() {
  return requireRole([UserRole.ADMIN, UserRole.DELIVERY_DRIVER, UserRole.ATTENDANT]);
}

export const roleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrador",
  [UserRole.ATTENDANT]: "Atendente",
  [UserRole.KITCHEN]: "Cozinha",
  [UserRole.DELIVERY_DRIVER]: "Entregador",
};

export const statusLabels = {
  NEW: "Novo",
  CONFIRMED: "Confirmado",
  IN_PREPARATION: "Em Preparação",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu para Entrega",
  DELIVERED: "Entregue",
  PICKED_UP: "Retirado",
  CANCELLED: "Cancelado",
} as const;

export const paymentMethodLabels = {
  PIX: "PIX",
  CASH: "Dinheiro",
  CARD: "Cartão",
  DELIVERY_CASH: "Pagar na Entrega (Dinheiro)",
  DELIVERY_CARD: "Pagar na Entrega (Cartão)",
  PICKUP_PAYMENT: "Pagar na Retirada",
} as const;

export const paymentStatusLabels = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  FAILED: "Falhou",
  REFUNDED: "Reembolsado",
} as const;
