import { prisma } from "@/lib/prisma";

export async function getStoreSettings() {
  let settings = await prisma.storeSettings.findFirst();
  if (!settings) {
    settings = await prisma.storeSettings.create({
      data: {
        isOpen: true,
        openTime: "18:00",
        closeTime: "23:59",
        averagePreparationTime: 20,
        deliveryEnabled: true,
        pickupEnabled: true,
        deliveryFee: 0,
        minDeliveryValue: 0,
        weightPricePerKg: 59.9,
      },
    });
  }
  return settings;
}

export async function getCompanySettings() {
  let settings = await prisma.companySettings.findFirst();
  if (!settings) {
    settings = await prisma.companySettings.create({
      data: {
        name: "Minha Açaiteria",
        fantasyName: "Minha Açaiteria",
        phone: "",
        whatsapp: "",
        email: "",
      },
    });
  }
  return settings;
}

export async function getAppearanceSettings() {
  let settings = await prisma.appearanceSettings.findFirst();
  if (!settings) {
    settings = await prisma.appearanceSettings.create({
      data: {
        primaryColor: "#6B21A8",
        secondaryColor: "#8B5CF6",
        accentColor: "#A855F7",
        buttonColor: "#6B21A8",
      },
    });
  }
  return settings;
}

export async function getPrinterSettings() {
  let settings = await prisma.printerSettings.findFirst();
  if (!settings) {
    settings = await prisma.printerSettings.create({
      data: {
        name: "Impressora Térmica",
        connectionType: "usb",
        enabled: false,
        autoPrintOrders: true,
        autoPrintReceipt: true,
        paperWidth: 48,
      },
    });
  }
  return settings;
}

export async function getAllSettings() {
  const [store, company, appearance, printer] = await Promise.all([
    getStoreSettings(),
    getCompanySettings(),
    getAppearanceSettings(),
    getPrinterSettings(),
  ]);
  return { store, company, appearance, printer };
}
