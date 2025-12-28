/*
  Warnings:

  - Added the required column `kingdomId` to the `Structure` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kingdomId` to the `Unit` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Structure" DROP CONSTRAINT "Structure_matchId_fkey";

-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_matchId_fkey";

-- AlterTable
ALTER TABLE "Structure" ADD COLUMN     "kingdomId" TEXT NOT NULL,
ALTER COLUMN "matchId" DROP NOT NULL,
ALTER COLUMN "locationIndex" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "kingdomId" TEXT NOT NULL,
ALTER COLUMN "matchId" DROP NOT NULL,
ALTER COLUMN "locationIndex" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_kingdomId_fkey" FOREIGN KEY ("kingdomId") REFERENCES "Kingdom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_kingdomId_fkey" FOREIGN KEY ("kingdomId") REFERENCES "Kingdom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
