import { PrismaClient } from "@prisma/client";
import { seedDemo } from "../src/demoSeed";

const prisma = new PrismaClient();

seedDemo(prisma)
  .then(async (result) => {
    console.log(`Demo seed complete for ${result.serverCount} servers.`);
    console.log(
      `Demo admin login: ${result.adminEmail} / ${result.adminPassword}`,
    );
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
