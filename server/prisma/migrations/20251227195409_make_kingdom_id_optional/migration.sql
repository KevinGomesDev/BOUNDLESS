-- DropForeignKey
ALTER TABLE "Structure" DROP CONSTRAINT "Structure_kingdomId_fkey";

-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_kingdomId_fkey";

-- AlterTable
ALTER TABLE "Structure" ALTER COLUMN "kingdomId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Unit" ALTER COLUMN "kingdomId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_kingdomId_fkey" FOREIGN KEY ("kingdomId") REFERENCES "Kingdom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_kingdomId_fkey" FOREIGN KEY ("kingdomId") REFERENCES "Kingdom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
