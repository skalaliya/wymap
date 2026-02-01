/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminEmail =
    process.env.AUTH_ADMIN_EMAIL ?? "admin@wymap.local";
  const adminPassword =
    process.env.AUTH_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Wymap Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  const [siteA, siteB] = await Promise.all([
    prisma.site.upsert({
      where: { id: "site_hq" },
      update: {},
      create: { id: "site_hq", name: "HQ - Space Dock", timeZone: "UTC" },
    }),
    prisma.site.upsert({
      where: { id: "site_west" },
      update: {},
      create: { id: "site_west", name: "Launch Pad West", timeZone: "UTC" },
    }),
  ]);

  await prisma.device.upsert({
    where: { id: "device_alpha" },
    update: { siteId: siteA.id },
    create: {
      id: "device_alpha",
      name: "Kiosk Alpha",
      siteId: siteA.id,
      active: true,
    },
  });

  await prisma.device.upsert({
    where: { id: "device_beta" },
    update: { siteId: siteB.id },
    create: {
      id: "device_beta",
      name: "Kiosk Beta",
      siteId: siteB.id,
      active: true,
    },
  });

  const employeeTokens = await Promise.all([
    bcrypt.hash("emp_avery_stone", 10),
    bcrypt.hash("emp_jordan_lee", 10),
    bcrypt.hash("emp_riley_chen", 10),
  ]);

  await prisma.employee.createMany({
    data: [
      {
        name: "Avery Stone",
        status: "ACTIVE",
        badgeId: "BADGE-1001",
        tokenHash: employeeTokens[0],
      },
      {
        name: "Jordan Lee",
        status: "ACTIVE",
        badgeId: "BADGE-1002",
        tokenHash: employeeTokens[1],
      },
      {
        name: "Riley Chen",
        status: "INACTIVE",
        badgeId: "BADGE-1003",
        tokenHash: employeeTokens[2],
      },
    ],
    skipDuplicates: true,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: adminUser.id,
      action: "seed",
      entity: "system",
      after: { seededBy: adminEmail },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
