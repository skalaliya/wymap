/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Aussie-ish first names (multicultural mix)
const FIRST_NAMES = [
  "Liam", "Noah", "Oliver", "Jack", "William", "Leo", "Lucas", "Henry", "Charlie", "Mason",
  "Ethan", "James", "Alexander", "Benjamin", "Thomas", "Oscar", "Archie", "Hunter", "Harrison", "Elijah",
  "Charlotte", "Olivia", "Amelia", "Isla", "Mia", "Ava", "Grace", "Chloe", "Ella", "Sophie",
  "Harper", "Zoe", "Willow", "Ruby", "Sienna", "Ivy", "Matilda", "Evelyn", "Lily", "Emily",
  "Jayden", "Cooper", "Ryan", "Riley", "Hugo", "Lachlan", "Max", "Felix", "Kai", "Finn",
  "Aria", "Luna", "Layla", "Scarlett", "Aurora", "Violet", "Hazel", "Penelope", "Audrey", "Maya",
  "Aiden", "Logan", "Theo", "Sebastian", "Caleb", "Xavier", "Jasper", "Nathan", "Owen", "Dylan",
  "Stella", "Nora", "Ellie", "Hannah", "Zara", "Piper", "Savannah", "Bella", "Claire", "Natalie",
  "Angus", "Hamish", "Callum", "Declan", "Rowan", "Ryder", "Jesse", "Blake", "Jordan", "Cameron",
  "Maddison", "Brooklyn", "Mackenzie", "Peyton", "Quinn", "Addison", "Skylar", "Reagan", "Kendall", "Morgan",
  "Arjun", "Ravi", "Vikram", "Anil", "Sanjay", "Amit", "Raj", "Nikhil", "Wei", "Chen",
  "Ming", "Yuki", "Hiro", "Kenji", "Tao", "Jin", "Mei", "Lin", "Sakura", "Yuna",
  "Ahmed", "Mohammed", "Ali", "Hassan", "Omar", "Fatima", "Aisha", "Yasmin", "Leila", "Nadia",
  "Luca", "Marco", "Giuseppe", "Antonio", "Sofia", "Giulia", "Elena", "Rosa", "Maria", "Anna",
  "Dimitri", "Nikolai", "Alexei", "Ivan", "Tatiana", "Natasha", "Olga", "Svetlana", "Katya", "Irina"
];

// Aussie-ish last names (multicultural mix)
const LAST_NAMES = [
  "Smith", "Jones", "Williams", "Brown", "Wilson", "Taylor", "Johnson", "White", "Martin", "Anderson",
  "Thompson", "Walker", "Harris", "Clark", "Lewis", "Robinson", "Young", "King", "Wright", "Scott",
  "Green", "Baker", "Adams", "Nelson", "Hill", "Mitchell", "Campbell", "Roberts", "Carter", "Phillips",
  "Evans", "Turner", "Parker", "Collins", "Stewart", "Murphy", "Kelly", "O'Brien", "Sullivan", "Ryan",
  "Watson", "Brooks", "Bennett", "Gray", "Hughes", "Price", "Russell", "Wood", "Morgan", "Cooper",
  "Nguyen", "Tran", "Pham", "Le", "Vo", "Dang", "Bui", "Hoang", "Truong", "Ngo",
  "Singh", "Sharma", "Patel", "Gupta", "Kumar", "Rajan", "Chopra", "Malhotra", "Reddy", "Iyer",
  "Chen", "Wang", "Li", "Zhang", "Liu", "Yang", "Huang", "Zhao", "Wu", "Zhou",
  "Kim", "Park", "Lee", "Choi", "Kang", "Jang", "Yoon", "Lim", "Han", "Hwang",
  "Rossi", "Ferrari", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco", "Bruno", "Gallo",
  "Papadopoulos", "Konstantinidis", "Georgiou", "Stavros", "Christou", "Petrov", "Ivanov", "Kuznetsov", "Popov", "Sokolov",
  "Fernandez", "Garcia", "Martinez", "Lopez", "Rodriguez", "Gonzalez", "Hernandez", "Perez", "Sanchez", "Torres",
  "Muller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann",
  "O'Connor", "O'Neill", "Fitzgerald", "Doyle", "McCarthy", "Byrne", "Walsh", "Brennan", "Murray", "Quinn"
];

/**
 * Generates a deterministic employee name from an index.
 * Uses modular arithmetic to distribute across name pools.
 */
function generateName(index) {
  const firstIndex = index % FIRST_NAMES.length;
  const lastIndex = Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length;
  return `${FIRST_NAMES[firstIndex]} ${LAST_NAMES[lastIndex]}`;
}

/**
 * Generates a badge ID from an index: BADGE-1001 through BADGE-1500
 */
function generateBadgeId(index) {
  return `BADGE-${1001 + index}`;
}

/**
 * Determines status: every 20th employee is INACTIVE, rest ACTIVE
 */
function generateStatus(index) {
  return index % 20 === 19 ? "INACTIVE" : "ACTIVE";
}

async function main() {
  console.log("🌱 Starting seed...");

  // --- Admin user ---
  const adminEmail = process.env.AUTH_ADMIN_EMAIL ?? "admin@wymap.local";
  const adminPassword = process.env.AUTH_ADMIN_PASSWORD ?? "ChangeMe123!";
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
  console.log(`✓ Admin user: ${adminEmail}`);

  // --- Sites ---
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
  console.log(`✓ Sites: ${siteA.id}, ${siteB.id}`);

  // --- Devices ---
  await Promise.all([
    prisma.device.upsert({
      where: { id: "device_alpha" },
      update: { siteId: siteA.id },
      create: {
        id: "device_alpha",
        name: "Kiosk Alpha",
        siteId: siteA.id,
        active: true,
      },
    }),
    prisma.device.upsert({
      where: { id: "device_beta" },
      update: { siteId: siteB.id },
      create: {
        id: "device_beta",
        name: "Kiosk Beta",
        siteId: siteB.id,
        active: true,
      },
    }),
  ]);
  console.log("✓ Devices: device_alpha, device_beta");

  // --- Generate 500 employees ---
  const EMPLOYEE_COUNT = 500;
  console.log(`⏳ Generating ${EMPLOYEE_COUNT} employees...`);

  // Generate plaintext tokens and hash them in parallel (batched for speed)
  const employeeData = [];
  for (let i = 0; i < EMPLOYEE_COUNT; i++) {
    const badgeId = generateBadgeId(i);
    employeeData.push({
      name: generateName(i),
      badgeId,
      status: generateStatus(i),
      plaintextToken: `emp_demo_${badgeId.toLowerCase()}`,
    });
  }

  // Hash tokens in parallel batches of 50 to avoid overwhelming bcrypt
  const BATCH_SIZE = 50;
  const hashedEmployees = [];

  for (let batch = 0; batch < EMPLOYEE_COUNT; batch += BATCH_SIZE) {
    const batchData = employeeData.slice(batch, batch + BATCH_SIZE);
    const hashes = await Promise.all(
      batchData.map((emp) => bcrypt.hash(emp.plaintextToken, 10))
    );
    batchData.forEach((emp, idx) => {
      hashedEmployees.push({
        name: emp.name,
        badgeId: emp.badgeId,
        status: emp.status,
        tokenHash: hashes[idx],
      });
    });

    // Progress indicator
    const progress = Math.min(batch + BATCH_SIZE, EMPLOYEE_COUNT);
    process.stdout.write(`\r  Hashed ${progress}/${EMPLOYEE_COUNT} tokens...`);
  }
  console.log("\n✓ Tokens hashed");

  // Upsert employees in parallel batches
  console.log("⏳ Upserting employees to database...");
  for (let batch = 0; batch < EMPLOYEE_COUNT; batch += BATCH_SIZE) {
    const batchData = hashedEmployees.slice(batch, batch + BATCH_SIZE);
    await Promise.all(
      batchData.map((emp) =>
        prisma.employee.upsert({
          where: { badgeId: emp.badgeId },
          update: { name: emp.name, status: emp.status, tokenHash: emp.tokenHash },
          create: emp,
        })
      )
    );

    const progress = Math.min(batch + BATCH_SIZE, EMPLOYEE_COUNT);
    process.stdout.write(`\r  Upserted ${progress}/${EMPLOYEE_COUNT} employees...`);
  }
  console.log("\n✓ All employees created");

  // --- Audit log ---
  await prisma.auditLog.create({
    data: {
      actorUserId: adminUser.id,
      action: "seed",
      entity: "system",
      after: { seededBy: adminEmail, employeeCount: EMPLOYEE_COUNT },
    },
  });

  console.log("🌱 Seed complete!");
  console.log(`   Badge IDs: BADGE-1001 through BADGE-1500`);
  console.log(`   Active: ${EMPLOYEE_COUNT - Math.floor(EMPLOYEE_COUNT / 20)} | Inactive: ${Math.floor(EMPLOYEE_COUNT / 20)}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
