-- CreateTable
CREATE TABLE "ArenaLobby" (
    "id" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "hostSocketId" TEXT NOT NULL DEFAULT '',
    "hostKingdomId" TEXT NOT NULL,
    "hostUsername" TEXT NOT NULL DEFAULT '',
    "hostKingdomName" TEXT NOT NULL DEFAULT '',
    "guestUserId" TEXT,
    "guestSocketId" TEXT,
    "guestKingdomId" TEXT,
    "guestUsername" TEXT,
    "guestKingdomName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "battleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArenaLobby_pkey" PRIMARY KEY ("id")
);
