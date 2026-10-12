import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed demo users in production environment!");
  }

  console.log("Seeding development users with hashed passwords...");

  const demoUsers = [
    {
      email: "admin@minierp.local",
      name: "Admin Alice",
      password: "Admin123!",
      role: Role.ADMIN,
      isActive: true,
    },
    {
      email: "inventory@minierp.local",
      name: "Ian Inventory",
      password: "Inv123!",
      role: Role.INVENTORY_MANAGER,
      isActive: true,
    },
    {
      email: "sales@minierp.local",
      name: "Sally Sales",
      password: "Sales123!",
      role: Role.SALES_REP,
      isActive: true,
    },
    {
      email: "accountant@minierp.local",
      name: "Arthur Accountant",
      password: "Acct123!",
      role: Role.ACCOUNTANT,
      isActive: true,
    },
    {
      email: "disabled@minierp.local",
      name: "Dan Disabled",
      password: "Disabled123!",
      role: Role.SALES_REP,
      isActive: false,
    },
  ];

  for (const user of demoUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
        isActive: user.isActive,
      },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
        isActive: user.isActive,
      },
    });

    console.log(`- Seeded user: ${record.email} (${record.role}) [Active: ${record.isActive}]`);
  }

  console.log("Seeding development master data categories...");

  const defaultCategories = [
    {
      code: "RAW-MAT",
      name: "Raw Materials",
      description: "Basic materials and unfinished goods used in manufacturing and production",
      isActive: true,
    },
    {
      code: "FINISHED",
      name: "Finished Goods",
      description: "Manufactured products completed and packaged, ready for customer fulfillment",
      isActive: true,
    },
    {
      code: "PACKAGING",
      name: "Packaging Materials",
      description: "Shipping cartons, protective foam, adhesive tape, and label stock",
      isActive: true,
    },
    {
      code: "OFFICE",
      name: "Office Supplies",
      description: "Administrative supplies, equipment consumables, and stationery items",
      isActive: true,
    },
  ];

  for (const cat of defaultCategories) {
    const record = await prisma.category.upsert({
      where: { code: cat.code },
      update: {}, // Idempotent: preserve existing customized names, descriptions, or deactivations
      create: {
        code: cat.code,
        name: cat.name,
        description: cat.description,
        isActive: cat.isActive,
      },
    });
    console.log(`- Seeded category: [${record.code}] ${record.name}`);
  }

  console.log("Development seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
