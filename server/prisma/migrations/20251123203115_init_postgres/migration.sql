-- CreateEnum
CREATE TYPE "Alignment" AS ENUM ('BOM', 'MAL', 'NEUTRO');

-- CreateEnum
CREATE TYPE "Race" AS ENUM ('ABERRACAO', 'BESTA', 'CELESTIAL', 'CONSTRUTO', 'DRAGAO', 'ELEMENTAL', 'FADA', 'DIABO', 'GIGANTE', 'HUMANOIDE', 'MONSTRUOSIDADE', 'GOSMA', 'PLANTA', 'MORTO_VIVO', 'INSETO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kingdom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capitalName" TEXT NOT NULL,
    "crestUrl" TEXT,
    "capitalImageUrl" TEXT,
    "alignment" "Alignment" NOT NULL,
    "race" "Race" NOT NULL,
    "raceMetadata" TEXT,
    "locationIndex" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kingdom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Kingdom" ADD CONSTRAINT "Kingdom_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
