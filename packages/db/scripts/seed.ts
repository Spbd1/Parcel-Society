import {
  InequalityCondition,
  PrismaClient,
  ServerStatus,
  UncertaintyCondition,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";

const demoServers = [
  {
    name: "Demo: Low Inequality + Stable",
    description:
      "Demo server for low initial spatial inequality and stable institutions.",
    inequalityCondition: InequalityCondition.LOW,
    uncertaintyCondition: UncertaintyCondition.STABLE,
    randomSeed: "demo-low-stable-v1",
  },
  {
    name: "Demo: Low Inequality + Uncertain",
    description:
      "Demo server for low initial spatial inequality and uncertain institutions.",
    inequalityCondition: InequalityCondition.LOW,
    uncertaintyCondition: UncertaintyCondition.UNCERTAIN,
    randomSeed: "demo-low-uncertain-v1",
  },
  {
    name: "Demo: High Inequality + Stable",
    description:
      "Demo server for high initial spatial inequality and stable institutions.",
    inequalityCondition: InequalityCondition.HIGH,
    uncertaintyCondition: UncertaintyCondition.STABLE,
    randomSeed: "demo-high-stable-v1",
  },
  {
    name: "Demo: High Inequality + Uncertain",
    description:
      "Demo server for high initial spatial inequality and uncertain institutions.",
    inequalityCondition: InequalityCondition.HIGH,
    uncertaintyCondition: UncertaintyCondition.UNCERTAIN,
    randomSeed: "demo-high-uncertain-v1",
  },
] as const;

async function main() {
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: UserRole.SUPER_ADMIN },
    create: {
      anonymousId: "admin-demo",
      email: adminEmail,
      role: UserRole.SUPER_ADMIN,
    },
  });

  await prisma.adminUser.upsert({
    where: { userId: user.id },
    update: { email: adminEmail },
    create: {
      userId: user.id,
      email: adminEmail,
      name: "Demo Admin",
    },
  });

  for (const server of demoServers) {
    await prisma.server.upsert({
      where: { name: server.name },
      update: {
        description: server.description,
        inequalityCondition: server.inequalityCondition,
        uncertaintyCondition: server.uncertaintyCondition,
        randomSeed: server.randomSeed,
        config: {
          treatment: {
            inequality: server.inequalityCondition,
            uncertainty: server.uncertaintyCondition,
          },
          demo: true,
        },
      },
      create: {
        ...server,
        status: ServerStatus.DRAFT,
        maxPlayers: 20,
        seasonLength: 7,
        treasury: 0,
        config: {
          treatment: {
            inequality: server.inequalityCondition,
            uncertainty: server.uncertaintyCondition,
          },
          demo: true,
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
