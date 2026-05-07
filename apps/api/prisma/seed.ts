import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { migratedCategories, migratedProducts } from "./catalog";

const prisma = new PrismaClient();

async function main() {
  const categoryBySlug = new Map<string, { id: number; slug: string }>();

  for (const category of migratedCategories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
    categoryBySlug.set(category.slug, saved);
  }

  const migratedSlugs = migratedProducts.map((product) => product.slug);
  await prisma.product.updateMany({
    where: { slug: { notIn: migratedSlugs } },
    data: { isActive: false },
  });

  for (const product of migratedProducts) {
    const category = categoryBySlug.get(product.categorySlug);
    if (!category) {
      throw new Error(`Missing category for ${product.title}`);
    }

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        title: product.title,
        description: product.description,
        price: product.price,
        stock: product.stock,
        isActive: true,
        categoryId: category.id,
        images: {
          deleteMany: {},
          create: [{ url: product.imageUrl, alt: product.title, sortOrder: 0 }],
        },
      },
      create: {
        slug: product.slug,
        title: product.title,
        description: product.description,
        price: product.price,
        stock: product.stock,
        isActive: true,
        categoryId: category.id,
        images: {
          create: [{ url: product.imageUrl, alt: product.title, sortOrder: 0 }],
        },
      },
    });
  }

  const adminHash = await argon2.hash("Admin1234!", { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email: "admin@guzellikmerkezi.com.tr" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@guzellikmerkezi.com.tr",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  console.log(
    `Seed complete: ${migratedCategories.length} categories, ${migratedProducts.length} migrated products, 1 admin user`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
