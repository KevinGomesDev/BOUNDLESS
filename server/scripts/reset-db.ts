// scripts/reset-db.ts
// Deletes all matches, kingdoms, and related data (keeps users).
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log("[RESET] Starting deletion of game data (keeping users)...");

  // Order matters because of foreign key constraints.
  await prisma.battleLog.deleteMany();
  await prisma.battleUnit.deleteMany();
  await prisma.battle.deleteMany();

  await prisma.unit.deleteMany();
  await prisma.structure.deleteMany();
  await prisma.territory.deleteMany();

  await prisma.matchPlayer.deleteMany();
  await prisma.match.deleteMany();

  await prisma.troopTemplate.deleteMany();
  await prisma.kingdom.deleteMany();

  console.log("[RESET] Done.");
}

resetDatabase()
  .catch((err) => {
    console.error("[RESET] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
