-- AlterTable
ALTER TABLE "MatchPlayer" ADD COLUMN     "customChoices" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "troopLevels" TEXT NOT NULL DEFAULT '{}';
