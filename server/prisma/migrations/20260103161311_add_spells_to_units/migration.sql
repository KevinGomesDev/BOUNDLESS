-- AlterTable
ALTER TABLE "BattleUnit" ADD COLUMN     "spells" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "spells" TEXT NOT NULL DEFAULT '[]';
