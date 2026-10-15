import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pedido não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, ...order });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message },
      { status: 500 }
    );
  }
}
