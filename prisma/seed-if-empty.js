/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv/config");
const { spawnSync } = require("node:child_process");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const [userCount, siteCount, deviceCount, employeeCount] = await Promise.all([
    prisma.user.count(),
    prisma.site.count(),
    prisma.device.count(),
    prisma.employee.count(),
  ]);

  const isFreshDatabase =
    userCount === 0 &&
    siteCount === 0 &&
    deviceCount === 0 &&
    employeeCount === 0;

  if (!isFreshDatabase) {
    console.log(
      `🌱 Seed skipped (existing data found): users=${userCount}, sites=${siteCount}, devices=${deviceCount}, employees=${employeeCount}`,
    );
    return;
  }

  console.log("🌱 Fresh database detected. Running prisma/seed.js ...");
  const result = spawnSync(process.execPath, ["prisma/seed.js"], {
    stdio: "inherit",
    env: process.env,
  });

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }

  if (result.error) {
    throw result.error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
