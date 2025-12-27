-- AlterTable: Add size enum and area slots to Territory
-- CreateEnum
CREATE TYPE "TerritorySize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- AlterTable
ALTER TABLE "Territory" ADD COLUMN "size" "TerritorySize" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Territory" ADD COLUMN "areaSlots" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Territory" ADD COLUMN "usedSlots" INTEGER NOT NULL DEFAULT 0;
