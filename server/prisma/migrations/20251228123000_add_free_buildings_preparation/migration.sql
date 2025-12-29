-- Add freeBuildingsUsed column to MatchPlayer for preparation phase free builds
ALTER TABLE "MatchPlayer" ADD COLUMN "freeBuildingsUsed" INTEGER NOT NULL DEFAULT 0;