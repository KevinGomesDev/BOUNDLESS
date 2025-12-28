-- Migração: Vincular Units e Structures aos Kingdoms
-- Objetivo: Preencher kingdomId a partir das relações existentes

-- Para Units: vincular ao Kingdom através de MatchPlayer
UPDATE "Unit"
SET "kingdomId" = mp."kingdomId"
FROM "MatchPlayer" mp
WHERE "Unit"."ownerId" = mp."id" AND "Unit"."kingdomId" IS NULL;

-- Para Units sem ownerId (não devem existir no novo design, mas deixar seguro)
-- Será necessário decisão manual

-- Para Structures: vincular ao Kingdom através de MatchPlayer
UPDATE "Structure"
SET "kingdomId" = mp."kingdomId"
FROM "MatchPlayer" mp
WHERE "Structure"."ownerId" = mp."id" AND "Structure"."kingdomId" IS NULL;

-- Verificar se há Units ou Structures órfãs
SELECT 'Unit' as tipo, COUNT(*) as total_vazio
FROM "Unit"
WHERE "kingdomId" IS NULL
UNION ALL
SELECT 'Structure', COUNT(*)
FROM "Structure"
WHERE "kingdomId" IS NULL;
