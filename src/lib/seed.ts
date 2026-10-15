"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { UserRole, OrderStatus } from "@prisma/client";
import { getStoreSettings } from "@/lib/settings";
import { generateToken, slugify } from "@/lib/utils";

export async function seedDatabase() {
  try {
    const existing = await prisma.user.count();
    if (existing > 0) {
      return { success: true, message: "Banco já populado" };
    }

    const adminPass = await hashPassword("admin123");
    const atendPass = await hashPassword("atend123");
    const cozinhaPass = await hashPassword("cozinha123");
    const entregadorPass = await hashPassword("entregador123");

    await prisma.user.createMany({
      data: [
        {
          name: "Administrador",
          email: "admin@acai.com",
          password: adminPass,
          role: UserRole.ADMIN,
          active: true,
        },
        {
          name: "Atendente",
          email: "atendente@acai.com",
          password: atendPass,
          role: UserRole.ATTENDANT,
          active: true,
        },
        {
          name: "Cozinha",
          email: "cozinha@acai.com",
          password: cozinhaPass,
          role: UserRole.KITCHEN,
          active: true,
        },
        {
          name: "Entregador",
          email: "entregador@acai.com",
          password: entregadorPass,
          role: UserRole.DELIVERY_DRIVER,
          active: true,
        },
      ],
    });

    const categorias = await Promise.all([
      prisma.category.create({
      data: { name: "Açaí", slug: slugify("Açaí"), order: 1, active: true },
    }),
    prisma.category.create({
      data: { name: "Bebidas", slug: slugify("Bebidas"), order: 2, active: true },
    }),
    prisma.category.create({
      data: { name: "Sobremesas", slug: slugify("Sobremesas"), order: 3, active: true },
    }),
    ]);

    const acaiCat = categorias[0];
    const bebCat = categorias[1];
    const sobCat = categorias[2];

    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: "Açaí Tradicional 300ml",
          description: "Açaí cremoso tradicional",
          price: 15.9,
          categoryId: acaiCat.id,
          active: true,
        },
      }),
      prisma.product.create({
        data: {
          name: "Açaí Tradicional 500ml",
          description: "Açaí cremoso tradicional",
          price: 22.9,
          categoryId: acaiCat.id,
          active: true,
        },
      }),
      prisma.product.create({
        data: {
          name: "Açaí por Peso",
          description: "Monte seu açaí na tigela por peso",
          price: 59.9,
          categoryId: acaiCat.id,
          isWeightBased: true,
          active: true,
        },
      }),
      prisma.product.create({
        data: {
          name: "Água Mineral",
          description: "Água mineral 500ml",
          price: 4.0,
          categoryId: bebCat.id,
          active: true,
        },
      }),
      prisma.product.create({
        data: {
          name: "Refrigerante Lata",
          description: "Lata 350ml",
          price: 6.0,
          categoryId: bebCat.id,
          active: true,
        },
      }),
      prisma.product.create({
        data: {
          name: "Sorvete",
          description: "Sorvete de creme 1 bola",
          price: 5.0,
          categoryId: sobCat.id,
          active: true,
        },
      }),
    ]);

    const addons = await Promise.all([
      prisma.addon.create({
        data: { name: "Morango", price: 3.0, active: true },
      }),
      prisma.addon.create({
        data: { name: "Banana", price: 2.5, active: true },
      }),
      prisma.addon.create({
        data: { name: "Granola", price: 3.0, active: true },
      }),
      prisma.addon.create({
        data: { name: "Paçoca", price: 2.5, active: true },
      }),
      prisma.addon.create({
        data: { name: "Leite Condensado", price: 2.0, active: true },
      }),
    ]);

    for (const p of products.slice(0, 3)) {
      for (const a of addons) {
        await prisma.productAddon.create({
          data: { productId: p.id, addonId: a.id },
        }).catch(() => {});
      }
    }

    await prisma.deliveryDriver.create({
      data: {
        name: "João Entregador",
        phone: "11999998888",
      },
    });

    await getStoreSettings();

    return { success: true, message: "Seed executado com sucesso" };
  } catch (e: any) {
    return { success: false, error: e?.message || "Erro" };
  }
}
