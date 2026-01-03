/*
  Warnings:

  - You are about to drop the column `acuity` on the `BattleUnit` table. All the data in the column will be lost.
  - You are about to drop the column `acuity` on the `TroopTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `acuity` on the `Unit` table. All the data in the column will be lost.
  - Added the required column `speed` to the `Unit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BattleUnit" DROP COLUMN "acuity",
ADD COLUMN     "speed" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "TroopTemplate" DROP COLUMN "acuity",
ADD COLUMN     "speed" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "Unit" DROP COLUMN "acuity",
ADD COLUMN     "speed" INTEGER NOT NULL;
