-- AlterTable
ALTER TABLE "Kingdom" ADD COLUMN     "inventory" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "equipment" TEXT NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "gridWidth" INTEGER NOT NULL DEFAULT 20,
    "gridHeight" INTEGER NOT NULL DEFAULT 20,
    "round" INTEGER NOT NULL DEFAULT 1,
    "currentTurnIndex" INTEGER NOT NULL DEFAULT 0,
    "initiativeOrder" TEXT NOT NULL DEFAULT '[]',
    "actionOrder" TEXT NOT NULL DEFAULT '[]',
    "supplyBids" TEXT NOT NULL DEFAULT '{}',
    "ransomPrice" INTEGER,
    "ransomResource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleUnit" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "posX" INTEGER NOT NULL DEFAULT 0,
    "posY" INTEGER NOT NULL DEFAULT 0,
    "initiative" INTEGER NOT NULL DEFAULT 0,
    "movesLeft" INTEGER NOT NULL DEFAULT 3,
    "actionsLeft" INTEGER NOT NULL DEFAULT 1,
    "isAlive" BOOLEAN NOT NULL DEFAULT true,
    "actionMarks" INTEGER NOT NULL DEFAULT 0,
    "protection" INTEGER NOT NULL DEFAULT 0,
    "protectionBroken" BOOLEAN NOT NULL DEFAULT false,
    "conditions" TEXT NOT NULL DEFAULT '[]',
    "grabbedByBattleUnitId" TEXT,
    "corpseRemoved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BattleUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleLog" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "BattleLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleUnit" ADD CONSTRAINT "BattleUnit_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleUnit" ADD CONSTRAINT "BattleUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleUnit" ADD CONSTRAINT "BattleUnit_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "MatchPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleLog" ADD CONSTRAINT "BattleLog_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
