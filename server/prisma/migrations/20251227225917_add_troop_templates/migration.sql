-- CreateTable
CREATE TABLE "TroopTemplate" (
    "id" TEXT NOT NULL,
    "kingdomId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "passiveId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "combat" INTEGER NOT NULL DEFAULT 2,
    "acuity" INTEGER NOT NULL DEFAULT 2,
    "focus" INTEGER NOT NULL DEFAULT 2,
    "armor" INTEGER NOT NULL DEFAULT 2,
    "vitality" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "TroopTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TroopTemplate_kingdomId_slotIndex_key" ON "TroopTemplate"("kingdomId", "slotIndex");

-- AddForeignKey
ALTER TABLE "TroopTemplate" ADD CONSTRAINT "TroopTemplate_kingdomId_fkey" FOREIGN KEY ("kingdomId") REFERENCES "Kingdom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
