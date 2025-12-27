-- AlterEnum
ALTER TYPE "UnitCategory" ADD VALUE 'MONSTRO';

-- AlterTable
ALTER TABLE "MatchPlayer" ADD COLUMN     "capitalTerritoryId" TEXT,
ADD COLUMN     "isReady" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "playerColor" TEXT NOT NULL DEFAULT '#ff0000',
ADD COLUMN     "playerIndex" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "resources" SET DEFAULT '{"gold":20,"food":20,"wood":20,"stone":20,"mana":20}';

-- AlterTable
ALTER TABLE "Territory" ADD COLUMN     "isCapital" BOOLEAN NOT NULL DEFAULT false;
