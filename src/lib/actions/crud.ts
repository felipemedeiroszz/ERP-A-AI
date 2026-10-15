"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAttendant } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0),
  categoryId: z.string(),
  image: z.string().optional().nullable(),
  isWeightBased: z.boolean().optional(),
  active: z.boolean().optional(),
  addonIds: z.array(z.string()).optional(),
});

export async function saveProduct(data: z.infer<typeof productSchema>) {
  await requireAdmin();
  const parsed = productSchema.parse(data);

  if (parsed.id) {
    const product = await prisma.product.update({
      where: { id: parsed.id },
      data: {
        name: parsed.name,
        description: parsed.description,
        price: parsed.price,
        categoryId: parsed.categoryId,
        image: parsed.image || null,
        isWeightBased: parsed.isWeightBased ?? false,
        active: parsed.active ?? true,
      },
    });
    if (parsed.addonIds) {
      await prisma.productAddon.deleteMany({
        where: { productId: product.id },
      });
      for (const addonId of parsed.addonIds) {
        await prisma.productAddon.create({
          data: { productId: product.id, addonId },
        });
      }
    }
    revalidatePath("/admin/produtos");
    return { success: true, product };
  } else {
    const product = await prisma.product.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        price: parsed.price,
        categoryId: parsed.categoryId,
        image: parsed.image || null,
        isWeightBased: parsed.isWeightBased ?? false,
        active: parsed.active ?? true,
      },
    });
    if (parsed.addonIds?.length) {
      for (const addonId of parsed.addonIds) {
        await prisma.productAddon.create({
          data: { productId: product.id, addonId },
        });
      }
    }
    revalidatePath("/admin/produtos");
    return { success: true, product };
  }
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/produtos");
  return { success: true };
}

export async function toggleProductActive(id: string, active: boolean) {
  await requireAdmin();
  await prisma.product.update({ where: { id }, data: { active } });
  revalidatePath("/admin/produtos");
  return { success: true };
}

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  order: z.coerce.number().int().default(0),
  active: z.boolean().optional(),
});

export async function saveCategory(data: z.infer<typeof categorySchema>) {
  await requireAdmin();
  const parsed = categorySchema.parse(data);
  if (parsed.id) {
    await prisma.category.update({
      where: { id: parsed.id },
      data: {
        name: parsed.name,
        slug: slugify(parsed.name),
        order: parsed.order,
        active: parsed.active ?? true,
      },
    });
  } else {
    await prisma.category.create({
      data: {
        name: parsed.name,
        slug: slugify(parsed.name),
        order: parsed.order,
        active: parsed.active ?? true,
      },
    });
  }
  revalidatePath("/admin/categorias");
  return { success: true };
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categorias");
  return { success: true };
}

const addonSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  price: z.coerce.number().min(0),
  active: z.boolean().optional(),
});

export async function saveAddon(data: z.infer<typeof addonSchema>) {
  await requireAdmin();
  const parsed = addonSchema.parse(data);
  if (parsed.id) {
    await prisma.addon.update({
      where: { id: parsed.id },
      data: {
        name: parsed.name,
        price: parsed.price,
        active: parsed.active ?? true,
      },
    });
  } else {
    await prisma.addon.create({
      data: {
        name: parsed.name,
        price: parsed.price,
        active: parsed.active ?? true,
      },
    });
  }
  revalidatePath("/admin/adicionais");
  return { success: true };
}

export async function deleteAddon(id: string) {
  await requireAdmin();
  await prisma.addon.delete({ where: { id } });
  revalidatePath("/admin/adicionais");
  return { success: true };
}

const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional().nullable(),
});

export async function saveCustomer(data: z.infer<typeof customerSchema>) {
  await requireAttendant();
  const parsed = customerSchema.parse(data);
  if (parsed.id) {
    await prisma.customer.update({
      where: { id: parsed.id },
      data: {
        name: parsed.name,
        phone: parsed.phone.replace(/\D/g, ""),
        email: parsed.email || null,
      },
    });
  } else {
    await prisma.customer.create({
      data: {
        name: parsed.name,
        phone: parsed.phone.replace(/\D/g, ""),
        email: parsed.email || null,
      },
    });
  }
  revalidatePath("/admin/clientes");
  return { success: true };
}

export async function deleteCustomer(id: string) {
  await requireAdmin();
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/admin/clientes");
  return { success: true };
}

const driverSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  phone: z.string().min(8),
  active: z.boolean().optional(),
});

export async function saveDriver(data: z.infer<typeof driverSchema>) {
  await requireAdmin();
  const parsed = driverSchema.parse(data);
  if (parsed.id) {
    await prisma.deliveryDriver.update({
      where: { id: parsed.id },
      data: {
        name: parsed.name,
        phone: parsed.phone.replace(/\D/g, ""),
        active: parsed.active ?? true,
      },
    });
  } else {
    await prisma.deliveryDriver.create({
      data: {
        name: parsed.name,
        phone: parsed.phone.replace(/\D/g, ""),
        active: parsed.active ?? true,
      },
    });
  }
  revalidatePath("/admin/entregadores");
  return { success: true };
}

export async function deleteDriver(id: string) {
  await requireAdmin();
  await prisma.deliveryDriver.delete({ where: { id } });
  revalidatePath("/admin/entregadores");
  return { success: true };
}

const invSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  unit: z.string().min(1),
  quantity: z.coerce.number(),
  minQuantity: z.coerce.number().default(0),
  active: z.boolean().optional(),
});

export async function saveInventoryItem(data: z.infer<typeof invSchema>) {
  await requireAdmin();
  const parsed = invSchema.parse(data);
  if (parsed.id) {
    await prisma.inventoryItem.update({
      where: { id: parsed.id },
      data: {
        name: parsed.name,
        unit: parsed.unit,
        quantity: parsed.quantity,
        minQuantity: parsed.minQuantity,
        active: parsed.active ?? true,
      },
    });
  } else {
    await prisma.inventoryItem.create({
      data: {
        name: parsed.name,
        unit: parsed.unit,
        quantity: parsed.quantity,
        minQuantity: parsed.minQuantity,
        active: parsed.active ?? true,
      },
    });
  }
  revalidatePath("/admin/estoque");
  return { success: true };
}

export async function deleteInventoryItem(id: string) {
  await requireAdmin();
  await prisma.inventoryItem.delete({ where: { id } });
  revalidatePath("/admin/estoque");
  return { success: true };
}

export async function addInventoryMovement(data: {
  itemId: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  description?: string;
}) {
  await requireAdmin();
  const item = await prisma.inventoryItem.findUniqueOrThrow({
    where: { id: data.itemId },
  });
  const qtyBefore = Number(item.quantity);
  let qtyAfter: number;
  if (data.type === "IN") qtyAfter = qtyBefore + data.quantity;
  else if (data.type === "OUT") qtyAfter = qtyBefore - data.quantity;
  else qtyAfter = data.quantity;

  await prisma.$transaction([
    prisma.inventoryItem.update({
      where: { id: data.itemId },
      data: { quantity: qtyAfter },
    }),
    prisma.inventoryMovement.create({
      data: {
        itemId: data.itemId,
        type: data.type,
        quantityBefore: qtyBefore,
        quantityAfter: qtyAfter,
        quantityChange: data.type === "ADJUSTMENT" ? qtyAfter - qtyBefore : data.quantity,
        description: data.description,
      },
    }),
  ]);
  revalidatePath("/admin/estoque");
  return { success: true };
}
