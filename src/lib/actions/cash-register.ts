"use server";

import { prisma } from "@/lib/prisma";
import { requireAttendant, requireAdmin } from "@/lib/auth/session";
import {
  CashRegisterStatus,
  CashMovementType,
  PaymentMethod,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function openCashRegister(params: {
  identifier: string;
  openingBalance: number;
}) {
  const user = await requireAttendant();
  const existingOpen = await prisma.cashRegister.findFirst({
    where: { userId: user.id, status: CashRegisterStatus.OPEN },
  });
  if (existingOpen) throw new Error("Você já tem um caixa aberto");

  const cr = await prisma.cashRegister.create({
    data: {
      identifier: params.identifier || `CAIXA-${user.id.slice(0, 6)}-${Date.now()}`,
      userId: user.id,
      openingBalance: Number(params.openingBalance),
      status: CashRegisterStatus.OPEN,
    },
  });

  await prisma.cashMovement.create({
    data: {
      cashRegisterId: cr.id,
      type: CashMovementType.OPENING,
      amount: Number(params.openingBalance),
      userId: user.id,
      description: "Abertura de caixa",
    },
  });

  revalidatePath("/admin/caixa");
  revalidatePath("/pdv");
  return { success: true, cashRegisterId: cr.id };
}

export async function closeCashRegister(params: {
  cashRegisterId: string;
  reportedBalance: number;
  closeNote?: string;
}) {
  const user = await requireAttendant();
  const cr = await prisma.cashRegister.findUnique({
    where: { id: params.cashRegisterId },
    include: { movements: true, orders: { where: { NOT: { status: "CANCELLED" } } } },
  });
  if (!cr) throw new Error("Caixa não encontrado");
  if (cr.userId !== user.id && user.role !== "ADMIN")
    throw new Error("Este caixa não é seu");
  if (cr.status !== CashRegisterStatus.OPEN)
    throw new Error("Caixa já está fechado");

  const movements = cr.movements.filter(
    (m) => m.type !== CashMovementType.CLOSING
  );
  const inTotal = movements
    .filter((m) =>
      [
        CashMovementType.OPENING,
        CashMovementType.SALE,
        CashMovementType.IN,
      ].includes(m.type)
    )
    .reduce((s, m) => s + Number(m.amount), 0);
  const outTotal = movements
    .filter((m) =>
      [CashMovementType.OUT, CashMovementType.WITHDRAWAL].includes(m.type)
    )
    .reduce((s, m) => s + Number(m.amount), 0);
  const expected = inTotal - outTotal;
  const reported = Number(params.reportedBalance);
  const difference = reported - expected;

  const closed = await prisma.cashRegister.update({
    where: { id: params.cashRegisterId },
    data: {
      status: CashRegisterStatus.CLOSED,
      closingBalance: expected,
      reportedBalance: reported,
      difference,
      closedAt: new Date(),
    },
  });

  await prisma.cashMovement.create({
    data: {
      cashRegisterId: params.cashRegisterId,
      type: CashMovementType.CLOSING,
      amount: reported,
      userId: user.id,
      description:
        `Fechamento de caixa. ${params.closeNote ? params.closeNote : ""}`.trim(),
    },
  });

  revalidatePath("/admin/caixa");
  revalidatePath("/pdv");
  return { success: true, expected, reported, difference };
}

export async function addCashMovement(params: {
  cashRegisterId: string;
  type: "IN" | "OUT" | "WITHDRAWAL";
  amount: number;
  paymentMethod?: PaymentMethod;
  description?: string;
}) {
  const user = await requireAttendant();
  const cr = await prisma.cashRegister.findUnique({
    where: { id: params.cashRegisterId },
  });
  if (!cr) throw new Error("Caixa não encontrado");
  if (cr.status !== CashRegisterStatus.OPEN)
    throw new Error("Caixa fechado");

  const movement = await prisma.cashMovement.create({
    data: {
      cashRegisterId: params.cashRegisterId,
      type: params.type as CashMovementType,
      amount: Number(params.amount),
      paymentMethod: params.paymentMethod,
      userId: user.id,
      description: params.description,
    },
  });

  revalidatePath("/admin/caixa");
  revalidatePath("/pdv");
  return { success: true, movement };
}
