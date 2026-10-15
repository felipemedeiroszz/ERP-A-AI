import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  OrderOrigin,
} from "@prisma/client";
import { getStoreSettings } from "@/lib/settings";
import { generateToken } from "@/lib/utils";
import { createPixPaymentForOrder } from "@/lib/payments";
import { z } from "zod";

const CartItemAddonSchema = z.object({
  addonId: z.string().optional(),
  addonName: z.string().min(1),
  unitPrice: z.number().min(0),
  quantity: z.number().int().min(1),
});

const CartItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1),
  unitPrice: z.number().min(0),
  quantity: z.number().int().min(1),
  weightKg: z.number().min(0).optional().nullable(),
  isWeightBased: z.boolean().optional(),
  subtotal: z.number().min(0),
  observation: z.string().optional(),
  addons: z.array(CartItemAddonSchema).optional().default([]),
});

const AddressSchema = z.object({
  zipCode: z.string().min(1),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().optional(),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1).max(2),
  reference: z.string().optional(),
});

const CreateOnlineOrderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  customerEmail: z.string().email().optional().or(z.literal("")),
  isDelivery: z.boolean(),
  items: z.array(CartItemSchema).min(1),
  paymentMethod: z.enum([
    "PIX",
    "DELIVERY_CASH",
    "DELIVERY_CARD",
    "PICKUP_PAYMENT",
  ] as const),
  cashReceived: z.number().min(0).optional(),
  changeFor: z.number().min(0).optional(),
  addressData: AddressSchema.optional(),
  observation: z.string().optional(),
  deliveryFee: z.number().min(0).optional(),
});

export async function POST(request: Request) {
  try {
    const store = await getStoreSettings();

    if (!store.isOpen) {
      return NextResponse.json(
        { error: "A loja está fechada no momento." },
        { status: 400 }
      );
    }

    const raw = await request.json();
    const parsed = CreateOnlineOrderSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.isDelivery) {
      if (!store.deliveryEnabled) {
        return NextResponse.json(
          { error: "Delivery não está disponível no momento." },
          { status: 400 }
        );
      }
      if (!data.addressData) {
        return NextResponse.json(
          { error: "Endereço obrigatório para entrega." },
          { status: 400 }
        );
      }
    } else if (!store.pickupEnabled) {
      return NextResponse.json(
        { error: "Retirada não está disponível no momento." },
        { status: 400 }
      );
    }

    let subtotal = 0;
    for (const it of data.items) {
      let s = Number(it.subtotal);
      if (it.addons?.length) {
        for (const a of it.addons) {
          s += Number(a.unitPrice) * Number(a.quantity);
        }
      }
      subtotal += s;
    }

    const deliveryFee = data.isDelivery
      ? Number(data.deliveryFee ?? store.deliveryFee)
      : 0;
    const totalAmount = Math.max(0, subtotal + deliveryFee);

    if (subtotal <= 0)
      return NextResponse.json(
        { error: "Carrinho vazio." },
        { status: 400 }
      );
    if (totalAmount <= 0)
      return NextResponse.json(
        { error: "Total inválido." },
        { status: 400 }
      );

    if (
      data.isDelivery &&
      store.minDeliveryValue > 0 &&
      subtotal < store.minDeliveryValue
    ) {
      return NextResponse.json(
        {
          error: `Valor mínimo para delivery é R$ ${store.minDeliveryValue
            .toFixed(2)
            .replace(".", ",")}.`,
        },
        { status: 400 }
      );
    }

    if (
      data.paymentMethod === "DELIVERY_CASH" &&
      data.changeFor !== undefined &&
      data.changeFor > 0 &&
      data.changeFor < totalAmount
    ) {
      return NextResponse.json(
        { error: "Valor para troco é menor que o total do pedido." },
        { status: 400 }
      );
    }

    const maxNum = await prisma.order.aggregate({ _max: { orderNumber: true } });
    const orderNumber = (maxNum._max.orderNumber || 1000) + 1;
    const token = generateToken(40);

    let customer;
    const phoneDigits = data.customerPhone.replace(/\D/g, "");
    const existingCustomer = await prisma.customer.findFirst({
      where: { phone: phoneDigits },
    });

    if (existingCustomer) {
      customer = existingCustomer;
    } else {
      customer = await prisma.customer.create({
        data: {
          name: data.customerName,
          phone: phoneDigits,
          email: data.customerEmail || null,
        },
      });
    }

    let finalAddressId: string | undefined;
    if (data.isDelivery && data.addressData) {
      const addr = await prisma.customerAddress.create({
        data: {
          customerId: customer.id,
          zipCode: data.addressData.zipCode.replace(/\D/g, ""),
          street: data.addressData.street,
          number: data.addressData.number,
          complement: data.addressData.complement || null,
          neighborhood: data.addressData.neighborhood,
          city: data.addressData.city,
          state: data.addressData.state.toUpperCase(),
          reference: data.addressData.reference || null,
        },
      });
      finalAddressId = addr.id;
    }

    const change =
      data.paymentMethod === "DELIVERY_CASH" &&
      data.changeFor !== undefined &&
      data.changeFor > 0
        ? data.changeFor - totalAmount
        : undefined;

    let paymentStatus = PaymentStatus.PENDING;
    if (
      data.paymentMethod === "DELIVERY_CASH" ||
      data.paymentMethod === "DELIVERY_CARD" ||
      data.paymentMethod === "PICKUP_PAYMENT"
    ) {
      paymentStatus = PaymentStatus.PENDING;
    }

    let orderStatus = OrderStatus.NEW;

    const paymentMethodMap: Record<string, PaymentMethod> = {
      PIX: PaymentMethod.PIX,
      DELIVERY_CASH: PaymentMethod.DELIVERY_CASH,
      DELIVERY_CARD: PaymentMethod.DELIVERY_CARD,
      PICKUP_PAYMENT: PaymentMethod.PICKUP_PAYMENT,
    };

    const order = await prisma.order.create({
      data: {
        orderNumber,
        token,
        origin: OrderOrigin.ONLINE,
        customerId: customer.id,
        customerName: data.customerName,
        customerPhone: phoneDigits,
        totalAmount,
        subtotal,
        discount: 0,
        deliveryFee,
        isDelivery: data.isDelivery,
        status: orderStatus,
        paymentMethod: paymentMethodMap[data.paymentMethod],
        paymentStatus,
        cashReceived:
          data.paymentMethod === "DELIVERY_CASH"
            ? data.changeFor ?? undefined
            : undefined,
        change,
        changeFor:
          data.paymentMethod === "DELIVERY_CASH"
            ? data.changeFor ?? undefined
            : undefined,
        addressId: finalAddressId,
        observation: data.observation,
      },
    });

    await Promise.all(
      data.items.map((it) => {
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
        });
      })
    );

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: order.status,
        note: "Pedido criado online",
      },
    });

    if (
      data.paymentMethod === "PIX"
    ) {
      await createPixPaymentForOrder({
        orderId: order.id,
        orderNumber,
        value: totalAmount,
        customerName: data.customerName,
        customerEmail: data.customerEmail || undefined,
        customerPhone: data.customerPhone,
      });
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber,
      token,
    });
  } catch (error: any) {
    console.error("[API ORDERS] Erro ao criar pedido:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Não foi possível finalizar seu pedido. Tente novamente.",
      },
      { status: 500 }
    );
  }
}
