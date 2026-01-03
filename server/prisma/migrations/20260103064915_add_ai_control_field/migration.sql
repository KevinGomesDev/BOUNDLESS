/*
  Warnings:

  - You are about to drop the column `weather` on the `Battle` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Battle" DROP COLUMN "weather";

-- AlterTable
ALTER TABLE "BattleUnit" ADD COLUMN     "isAIControlled" BOOLEAN NOT NULL DEFAULT false;
