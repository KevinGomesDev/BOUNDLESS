/*
  Warnings:

  - Added the required column `actionsLeft` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `acuity` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `armor` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `combat` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `focus` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `movesLeft` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vitality` to the `Unit` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UnitCategory" AS ENUM ('TROPA', 'HEROI', 'REGENTE', 'PRISIONEIRO', 'INVOCACAO');

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "actionsLeft" INTEGER NOT NULL,
ADD COLUMN     "acuity" INTEGER NOT NULL,
ADD COLUMN     "armor" INTEGER NOT NULL,
ADD COLUMN     "category" "UnitCategory" NOT NULL,
ADD COLUMN     "combat" INTEGER NOT NULL,
ADD COLUMN     "focus" INTEGER NOT NULL,
ADD COLUMN     "heroClass" TEXT,
ADD COLUMN     "movesLeft" INTEGER NOT NULL,
ADD COLUMN     "summonerId" TEXT,
ADD COLUMN     "vitality" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Structure" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "ownerId" TEXT,
    "type" TEXT NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "currentHp" INTEGER NOT NULL,
    "resourceType" TEXT,
    "productionRate" INTEGER NOT NULL,
    "locationIndex" INTEGER NOT NULL,

    CONSTRAINT "Structure_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_summonerId_fkey" FOREIGN KEY ("summonerId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "MatchPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
