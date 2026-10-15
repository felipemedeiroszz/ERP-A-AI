"use server";

import { requireAdmin, requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const companySchema = z.object({
  name: z.string().min(2),
  fantasyName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  document: z.string().optional().nullable(),
});

export async function saveCompanySettings(data: z.infer<typeof companySchema>) {
  await requireAdmin();
  const parsed = companySchema.parse(data);
  const existing = await prisma.companySettings.findFirst();
  if (existing) {
    await prisma.companySettings.update({
      where: { id: existing.id },
      data: {
        ...parsed,
        phone: parsed.phone?.replace(/\D/g, "") || null,
        whatsapp: parsed.whatsapp?.replace(/\D/g, "") || null,
        zipCode: parsed.zipCode?.replace(/\D/g, "") || null,
      },
    });
  } else {
    await prisma.companySettings.create({
      data: {
        ...parsed,
        phone: parsed.phone?.replace(/\D/g, "") || null,
        whatsapp: parsed.whatsapp?.replace(/\D/g, "") || null,
        zipCode: parsed.zipCode?.replace(/\D/g, "") || null,
      },
    });
  }
  revalidatePath("/admin/configuracoes");
  return { success: true };
}

const storeSchema = z.object({
  isOpen: z.boolean(),
  openTime: z.string().optional().nullable(),
  closeTime: z.string().optional().nullable(),
  averagePreparationTime: z.coerce.number().int(),
  deliveryEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
  deliveryFee: z.coerce.number(),
  minDeliveryValue: z.coerce.number(),
  deliveryRadiusKm: z.coerce.number().optional().nullable(),
  weightPricePerKg: z.coerce.number(),
});

export async function saveStoreSettings(data: z.infer<typeof storeSchema>) {
  await requireAdmin();
  const parsed = storeSchema.parse(data);
  const existing = await prisma.storeSettings.findFirst();
  if (existing) {
    await prisma.storeSettings.update({
      where: { id: existing.id },
      data: parsed,
    });
  } else {
    await prisma.storeSettings.create({ data: parsed });
  }
  revalidatePath("/admin/configuracoes");
  return { success: true };
}

const appearanceSchema = z.object({
  logo: z.string().optional().nullable(),
  favicon: z.string().optional().nullable(),
  primaryColor: z.string().min(4),
  secondaryColor: z.string().min(4),
  accentColor: z.string().min(4),
  buttonColor: z.string().min(4),
});

export async function saveAppearanceSettings(data: z.infer<typeof appearanceSchema>) {
  await requireAdmin();
  const parsed = appearanceSchema.parse(data);
  const existing = await prisma.appearanceSettings.findFirst();
  if (existing) {
    await prisma.appearanceSettings.update({
      where: { id: existing.id },
      data: parsed,
    });
  } else {
    await prisma.appearanceSettings.create({ data: parsed });
  }
  revalidatePath("/admin/configuracoes");
  return { success: true };
}

const printerSchema = z.object({
  name: z.string().optional().nullable(),
  connectionType: z.string(),
  vendorId: z.coerce.number().int().optional().nullable(),
  productId: z.coerce.number().int().optional().nullable(),
  enabled: z.boolean(),
  autoPrintOrders: z.boolean(),
  autoPrintReceipt: z.boolean(),
  paperWidth: z.coerce.number().int(),
  charset: z.string(),
});

export async function savePrinterSettings(data: z.infer<typeof printerSchema>) {
  await requireAdmin();
  const parsed = printerSchema.parse(data);
  const existing = await prisma.printerSettings.findFirst();
  if (existing) {
    await prisma.printerSettings.update({
      where: { id: existing.id },
      data: parsed,
    });
  } else {
    await prisma.printerSettings.create({ data: parsed });
  }
  revalidatePath("/admin/configuracoes");
  return { success: true };
}

const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().optional(),
  role: z.enum(["ADMIN", "ATTENDANT", "KITCHEN", "DELIVERY_DRIVER"]),
  active: z.boolean().optional(),
});

export async function saveUser(data: z.infer<typeof userSchema>) {
  await requireAdmin();
  const parsed = userSchema.parse(data);
  if (parsed.id) {
    const updateData: any = {
      name: parsed.name,
      email: parsed.email.toLowerCase(),
      role: parsed.role,
      active: parsed.active ?? true,
    };
    if (parsed.password && parsed.password.length > 0) {
      const { hashPassword } = await import("@/lib/auth/password");
      updateData.password = await hashPassword(parsed.password);
    }
    await prisma.user.update({ where: { id: parsed.id }, data: updateData });
  } else {
    if (!parsed.password) throw new Error("Senha é obrigatória");
    const { hashPassword } = await import("@/lib/auth/password");
    await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email.toLowerCase(),
        password: await hashPassword(parsed.password),
        role: parsed.role,
        active: parsed.active ?? true,
      },
    });
  }
  return { success: true };
}
