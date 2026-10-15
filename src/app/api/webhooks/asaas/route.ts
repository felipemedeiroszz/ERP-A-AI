import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/payments/asaas";
import { confirmPixPayment } from "@/lib/payments";
import { PaymentStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("asaas-access-token") || "";
    const isValid = await verifyWebhookSignature(token, null);

    let body: any;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const eventId = body?.id || `${Date.now()}_${Math.random()}`;
    const eventType = body?.event || body?.type || "UNKNOWN";
    const paymentId = body?.payment?.id || body?.data?.id || null;
    const externalReference =
      body?.payment?.externalReference ||
      body?.data?.externalReference ||
      null;

    await prisma.webhookEvent.create({
      data: {
        provider: "ASAAS",
        eventType,
        externalId: eventId,
        payload: body,
        processed: false,
      },
    });

    const isPaymentConfirmed =
      eventType === "PAYMENT_CONFIRMED" ||
      eventType === "PAYMENT_RECEIVED" ||
      body?.payment?.status === "CONFIRMED" ||
      body?.payment?.status === "RECEIVED" ||
      body?.data?.status === "CONFIRMED" ||
      body?.data?.status === "RECEIVED";

    if (isPaymentConfirmed && paymentId) {
      const res = await confirmPixPayment(paymentId);
      if (res) {
        await prisma.webhookEvent.updateMany({
          where: { externalId: eventId },
          data: {
            processed: true,
            orderId: res.orderId,
          },
        });
      }
    }

    return NextResponse.json(
      { success: true, received: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[WEBHOOK ASAAS] Erro:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal" },
      { status: 500 }
    );
  }
}
