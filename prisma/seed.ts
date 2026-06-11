import "dotenv/config";
import { ensureDatabase } from "../lib/bootstrap";
import { prisma } from "../lib/db";

async function main() {
  await ensureDatabase();
  const user = await prisma.user.findFirst({ select: { email: true } });
  console.log(`Administrator ready: ${user?.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
