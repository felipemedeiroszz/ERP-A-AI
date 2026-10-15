import { prisma } from "@/lib/prisma";
import { createPixCharge, getPixCharge, type AsaasPixCharge } from "./asaas";
import { PaymentMethod, PaymentStatus, OrderStatus } from "@prisma/client";

export async function createPixPaymentForOrder(params: {
  orderId: string;
  orderNumber: number;
  value: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}): Promise<{
  success: boolean;
  charge?: AsaasPixCharge;
  error?: string;
}> {
  try {
    const charge = await createPixCharge({
      customerName: params.customerName || "Cliente",
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      value: params.value,
      description: `Pedido #${params.orderNumber}`,
      externalReference: params.orderId,
    });

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    await prisma.order.update({
      where: { id: params.orderId },
      data: {
        asaasId: charge.id,
        pixQrCode: charge.encodedImage,
        pixCopyPaste: charge.pixQrCode,
        pixExpiresAt: expiresAt,
      },
    });

    await prisma.payment.create({
      data: {
        orderId: params.orderId,
        method: PaymentMethod.PIX,
        amount: params.value,
        status: PaymentStatus.PENDING,
        asaasId: charge.id,
        pixQrCode: charge.encodedImage,
        pixCopyPaste: charge.pixQrCode,
        pixExpiresAt: expiresAt,
      },
    });

    return { success: true, charge };
  } catch (error: any) {
    console.error("[PAYMENTS] Erro ao criar pagamento PIX:", error);
    return {
      success: false,
      error: error?.message || "Erro ao processar pagamento",
    };
  }
}

export async function confirmPixPayment(
  asaasPaymentId: string,
  confirmedDate?: Date
): Promise<{ orderId: string; orderNumber: number } | null> {
  const payment = await prisma.payment.findFirst({
    where: { asaasId: asaasPaymentId },
    include: { order: true },
  });

  if (!payment || !payment.order) return null;
  if (payment.status === PaymentStatus.CONFIRMED)
    return { orderId: payment.order.id, orderNumber: payment.order.orderNumber };

  const now = confirmedDate || new Date();

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.CONFIRMED,
      confirmedAt: now,
    },
  });

  const newOrderStatus =
    payment.order.status === OrderStatus.NEW
      ? OrderStatus.CONFIRMED
      : payment.order.status;

  await prisma.order.update({
    where: { id: payment.orderId },
    data: {
      paymentStatus: PaymentStatus.CONFIRMED,
      status: newOrderStatus,
    },
  });

  await prisma.orderStatusHistory.create({
    data: {
      orderId: payment.orderId,
      status: newOrderStatus,
      note: "Pagamento PIX confirmado",
    },
  });

  return { orderId: payment.order.id, orderNumber: payment.order.orderNumber };
}

export async function refreshPixStatus(orderId: string): Promise<{
  confirmed: boolean;
  status: string;
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || !order.asaasId)
    return { confirmed: false, status: "NO_CHARGE" };
  if (order.paymentStatus === PaymentStatus.CONFIRMED)
    return { confirmed: true, status: order.paymentStatus };

  try {
    const charge = await getPixCharge(order.asaasId);
    if (charge.status === "CONFIRMED" || charge.status === "RECEIVED") {
      await confirmPixPayment(charge.id);
      return { confirmed: true, status: "CONFIRMED" };
    }
    return { confirmed: false, status: charge.status };
  } catch (e) {
    console.error("[PAYMENTS] Erro ao consultar status:", e);
    return { confirmed: false, status: "ERROR" };
  }
}
