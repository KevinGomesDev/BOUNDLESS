-- CreateEnum
CREATE TYPE "TurnType" AS ENUM ('ADMINISTRACAO', 'EXERCITOS', 'MOVIMENTACAO', 'CRISE', 'ACAO', 'BATALHA');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "currentTurn" "TurnType" NOT NULL DEFAULT 'ADMINISTRACAO';

-- AlterTable
ALTER TABLE "MatchPlayer" ADD COLUMN     "hasFinishedAdminTurn" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "resources" SET DEFAULT '{"minerio":0,"suprimentos":0,"arcana":0,"experiencia":0,"devocao":0}';

-- AlterTable
ALTER TABLE "Territory" ADD COLUMN     "constructionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fortressCount" INTEGER NOT NULL DEFAULT 0;
