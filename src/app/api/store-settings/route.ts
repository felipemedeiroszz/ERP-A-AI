import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/settings";

export async function GET() {
  try {
    const store = await getStoreSettings();
    return NextResponse.json({
      isOpen: store.isOpen,
      deliveryEnabled: store.deliveryEnabled,
      pickupEnabled: store.pickupEnabled,
      deliveryFee: Number(store.deliveryFee || 0),
      minDeliveryValue: Number(store.minDeliveryValue || 0),
      weightPricePerKg: Number(store.weightPricePerKg || 0),
      averagePreparationTime: store.averagePreparationTime,
      openTime: store.openTime,
      closeTime: store.closeTime,
    });
  } catch (error) {
    console.error("[API STORE SETTINGS]", error);
    return NextResponse.json(
      {
        isOpen: true,
        deliveryEnabled: true,
        pickupEnabled: true,
        deliveryFee: 0,
        minDeliveryValue: 0,
      },
      { status: 200 }
    );
  }
}
