"use server";

import { prisma } from "@/lib/prisma";
import { requireAttendant, requireKitchen, requireDelivery, getCurrentUser } from "@/lib/auth/session";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  CashRegisterStatus,
  CashMovementType,
  OrderOrigin,
} from "@prisma/client";
import { generateToken } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { createPixPaymentForOrder, refreshPixStatus } from "@/lib/payments";

export interface CartItemAddon {
  addonId?: string;
  addonName: string;
  unitPrice: number;
  quantity: number;
}

export interface CartItem {
  productId?: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  weightKg?: number | null;
  isWeightBased?: boolean;
  subtotal: number;
  observation?: string;
  addons?: CartItemAddon[];
}

export interface CreateOrderInput {
  origin?: OrderOrigin;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  isDelivery: boolean;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeFor?: number;
  addressData?: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    reference?: string;
  };
  observation?: string;
  cashRegisterId?: string;
  discount?: number;
  deliveryFee?: number;
  customerEmail?: string;
}

export async function createOrder(input: CreateOrderInput) {
  const user = await getCurrentUser();
  if (input.origin === OrderOrigin.PDV && !user) {
    throw new Error("Login necessário para PDV");
  }

  let subtotal = 0;
  for (const it of input.items) {
    let s = Number(it.subtotal);
    if (it.addons?.length) {
      for (const a of it.addons) {
        s += Number(a.unitPrice) * Number(a.quantity);
      }
    }
    subtotal += s;
  }

  const discount = Number(input.discount || 0);
  const deliveryFee = Number(input.deliveryFee || 0);
  const totalAmount = Math.max(0, subtotal - discount + deliveryFee);

  if (subtotal <= 0) throw new Error("Carrinho vazio");
  if (totalAmount <= 0) throw new Error("Total inválido");

  if (
    input.paymentMethod === PaymentMethod.CASH &&
    input.cashReceived !== undefined &&
    input.cashReceived < totalAmount
  ) {
    throw new Error("Valor recebido é menor que o total");
  }

  const maxNum = await prisma.order.aggregate({ _max: { orderNumber: true } });
  const orderNumber = (maxNum._max.orderNumber || 1000) + 1;
  const token = generateToken(40);

  let finalAddressId: string | undefined = undefined;
  let customer = undefined;

  if (input.customerId) {
    customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
    });
  } else if (input.customerPhone) {
    const existing = await prisma.customer.findFirst({
      where: { phone: input.customerPhone.replace(/\D/g, "") },
    });
    if (existing) {
      customer = existing;
    } else if (input.customerName) {
      customer = await prisma.customer.create({
        data: {
          name: input.customerName,
          phone: input.customerPhone.replace(/\D/g, ""),
          email: input.customerEmail || null,
        },
      });
    }
  }

  if (input.isDelivery && input.addressData && customer) {
    const addr = await prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        zipCode: input.addressData.zipCode.replace(/\D/g, ""),
        street: input.addressData.street,
        number: input.addressData.number,
        complement: input.addressData.complement || null,
        neighborhood: input.addressData.neighborhood,
        city: input.addressData.city,
        state: input.addressData.state,
        reference: input.addressData.reference || null,
      },
    });
    finalAddressId = addr.id;
  }

  const change =
    input.paymentMethod === PaymentMethod.CASH &&
    input.cashReceived !== undefined
      ? input.cashReceived - totalAmount
      : undefined;

  let paymentStatus = PaymentStatus.PENDING;
  if (
    input.paymentMethod === PaymentMethod.CASH ||
    input.paymentMethod === PaymentMethod.CARD
  ) {
    paymentStatus = PaymentStatus.CONFIRMED;
  }

  let orderStatus = OrderStatus.NEW;
  if (input.origin === OrderOrigin.PDV) {
    orderStatus = OrderStatus.CONFIRMED;
    if (paymentStatus === PaymentStatus.CONFIRMED) {
      orderStatus = OrderStatus.IN_PREPARATION;
    }
  }

  const order = await prisma.order.create({
    data: {
      orderNumber,
      token,
      origin: input.origin || OrderOrigin.ONLINE,
      customerId: customer?.id,
      customerName: input.customerName || customer?.name,
      customerPhone: input.customerPhone
        ? input.customerPhone.replace(/\D/g, "")
        : customer?.phone,
      totalAmount,
      subtotal,
      discount,
      deliveryFee,
      isDelivery: input.isDelivery,
      status: orderStatus,
      paymentMethod: input.paymentMethod,
      paymentStatus,
      cashReceived: input.cashReceived,
      change,
      changeFor: input.changeFor,
      addressId: finalAddressId,
      observation: input.observation,
      userId: user?.id,
      cashRegisterId: input.cashRegisterId,
    },
  });

  await Promise.all(
    input.items.map((it, idx) => {
      let s = Number(it.subtotal);
      if (it.addons?.length) {
        for (const a of it.addons) {
          s += Number(a.unitPrice) * Number(a.quantity);
        }
      }
      return prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: it.productId,
          productName: it.productName,
          unitPrice: Number(it.unitPrice),
          quantity: Number(it.quantity),
          weightKg: it.weightKg ? Number(it.weightKg) : null,
          isWeightBased: !!it.isWeightBased,
          subtotal: s,
          observation: it.observation,
          addons:
            it.addons && it.addons.length > 0
              ? {
                  create: it.addons.map((a) => ({
                    addonId: a.addonId,
                    addonName: a.addonName,
                    unitPrice: Number(a.unitPrice),
                    quantity: Number(a.quantity),
                    totalPrice: Number(a.unitPrice) * Number(a.quantity),
                  })),
                }
              : undefined,
        },
        include: it.addons && it.addons.length > 0 ? { addons: true } : undefined,
      });
    })
  );

  await prisma.orderStatusHistory.create({
    data: {
      orderId: order.id,
      status: order.status,
      userId: user?.id,
      note: input.origin === OrderOrigin.PDV ? "Pedido criado no PDV" : "Pedido criado",
    },
  });

  if (paymentStatus === PaymentStatus.CONFIRMED) {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        customerId: customer?.id,
        method: input.paymentMethod,
        amount: totalAmount,
        status: PaymentStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    });
  }

  if (
    input.cashRegisterId &&
    paymentStatus === PaymentStatus.CONFIRMED
  ) {
    await prisma.cashMovement.create({
      data: {
        cashRegisterId: input.cashRegisterId,
        type: CashMovementType.SALE,
        amount: totalAmount,
        paymentMethod: input.paymentMethod,
        orderId: order.id,
        userId: user?.id,
        description: `Venda PDV - Pedido #${orderNumber}`,
      },
    });
  }

  if (
    input.paymentMethod === PaymentMethod.PIX &&
    input.origin === OrderOrigin.PDV
  ) {
    await createPixPaymentForOrder({
      orderId: order.id,
      orderNumber,
      value: totalAmount,
      customerName: input.customerName || customer?.name || "Cliente PDV",
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
    });
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  revalidatePath("/cozinha");
  revalidatePath("/pdv");

  return { success: true, orderId: order.id, orderNumber, token };
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string
) {
  const user = await requireKitchen();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Pedido não encontrado");
  if (order.status === OrderStatus.CANCELLED)
    throw new Error("Pedido cancelado");

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      readyAt:
        newStatus === OrderStatus.READY ? new Date() : order.readyAt,
      deliveredAt:
        newStatus === OrderStatus.DELIVERED ||
        newStatus === OrderStatus.PICKED_UP
          ? new Date()
          : order.deliveredAt,
    },
  });

  await prisma.orderStatusHistory.create({
    data: {
      orderId,
      status: newStatus,
      userId: user.id,
      note,
    },
  });

  if (newStatus === OrderStatus.OUT_FOR_DELIVERY && !order.deliveryId) {
    const existingAddr = order.addressId;
    if (existingAddr) {
      const delivery = await prisma.delivery.create({
        data: {
          orderId,
          addressId: existingAddr,
          status: newStatus,
        },
      });
      await prisma.order.update({
        where: { id: orderId },
        data: { deliveryId: delivery.id },
      });
    }
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  revalidatePath("/cozinha");
  return { success: true, order: updated };
}

export async function cancelOrder(orderId: string, reason?: string) {
  const user = await requireAttendant();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Pedido não encontrado");
  if (order.status === OrderStatus.CANCELLED) return { success: true };

  await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.CANCELLED },
  });

  await prisma.orderStatusHistory.create({
    data: {
      orderId,
      status: OrderStatus.CANCELLED,
      userId: user.id,
      note: reason || "Cancelado",
    },
  });

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  revalidatePath("/cozinha");
  return { success: true };
}

export async function assignDelivery(orderId: string, driverId: string) {
  const user = await requireAttendant();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { address: true },
  });
  if (!order || !order.addressId)
    throw new Error("Pedido sem endereço de entrega");

  const delivery = await prisma.delivery.upsert({
    where: { orderId },
    update: { driverId, status: OrderStatus.OUT_FOR_DELIVERY },
    create: {
      orderId,
      driverId,
      addressId: order.addressId,
      status: OrderStatus.OUT_FOR_DELIVERY,
      acceptedAt: new Date(),
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      deliveryId: delivery.id,
      status: OrderStatus.OUT_FOR_DELIVERY,
    },
  });

  await prisma.orderStatusHistory.create({
    data: {
      orderId,
      status: OrderStatus.OUT_FOR_DELIVERY,
      userId: user.id,
      note: "Entrega atribuída ao entregador",
    },
  });

  await prisma.deliveryDriver.update({
    where: { id: driverId },
    data: { status: "BUSY" },
  });

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/entregas");
  return { success: true };
}

export async function markDeliveryStatus(
  orderId: string,
  status:
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "PROBLEM",
  note?: string
) {
  const user = await requireDelivery();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { delivery: true },
  });
  if (!order || !order.delivery) throw new Error("Entrega não encontrada");

  if (status === "DELIVERED") {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED, deliveredAt: new Date() },
    });
    await prisma.delivery.update({
      where: { id: order.delivery.id },
      data: { status: OrderStatus.DELIVERED, deliveredAt: new Date() },
    });
    if (order.delivery.driverId) {
      await prisma.deliveryDriver.update({
        where: { id: order.delivery.driverId },
        data: { status: "AVAILABLE" },
      });
    }
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: OrderStatus.DELIVERED,
        userId: user.id,
        note: "Pedido entregue",
      },
    });
  } else if (status === "PROBLEM") {
    await prisma.delivery.update({
      where: { id: order.delivery.id },
      data: { problemNote: note },
    });
  } else {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.OUT_FOR_DELIVERY },
    });
    await prisma.delivery.update({
      where: { id: order.delivery.id },
      data: { status: OrderStatus.OUT_FOR_DELIVERY, pickedUpAt: new Date() },
    });
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: OrderStatus.OUT_FOR_DELIVERY,
        userId: user.id,
        note: "Saiu para entrega",
      },
    });
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/entregas");
  return { success: true };
}
