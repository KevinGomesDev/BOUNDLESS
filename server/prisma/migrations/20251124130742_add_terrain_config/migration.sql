/*
  Warnings:

  - Added the required column `polygonData` to the `Territory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `terrainType` to the `Territory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Territory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Territory" ADD COLUMN     "centerX" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "centerY" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "polygonData" TEXT NOT NULL,
ADD COLUMN     "terrainType" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;
