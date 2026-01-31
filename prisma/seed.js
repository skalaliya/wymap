require("dotenv/config");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.employee.createMany({
    data: [
      {
        name: "Avery Stone",
        token: "emp_avery_stone",
        active: true,
      },
      {
        name: "Jordan Lee",
        token: "emp_jordan_lee",
        active: true,
      },
      {
        name: "Riley Chen",
        token: "emp_riley_chen",
        active: false,
      },
    ],
    skipDuplicates: true,
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
