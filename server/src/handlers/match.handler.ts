// src/handlers/match.handler.ts
import { Socket, Server } from "socket.io";
import { prisma } from "../lib/prisma";
import { CrisisState, CrisisType } from "../types";
import { CRISIS_DEFINITIONS } from "../data/crises";
import { TERRAIN_TYPES } from "../worldmap/data/terrains";
import { MapGenerator } from "../worldmap/generation/MapGenerator";

const MAP_SIZE = 25; // Certifique-se que isso bate com o tamanho gerado pelo MapGenerator se usar indices fixos

// --- Função Auxiliar: Gerar a Crise Secreta ---
function generateSecretCrisis(): CrisisState {
  // 1. Sorteia o Tipo
  const types = Object.keys(CRISIS_DEFINITIONS) as CrisisType[];
  const selectedType = types[Math.floor(Math.random() * types.length)];

  // 2. Busca os dados base no arquivo de configuração
  const definition = CRISIS_DEFINITIONS[selectedType];

  // 3. Sorteia 3 territórios para conterem "Intel"
  const intelIndices = new Set<number>();
  while (intelIndices.size < 3) {
    // Nota: Como o mapa agora é procedural, o ideal é sortear baseado no tamanho real do array gerado
    // Mas para inicialização, usamos um range seguro ou ajustamos depois da geração do mapa.
    // Aqui usamos um número arbitrário seguro para o exemplo.
    intelIndices.add(Math.floor(Math.random() * MAP_SIZE));
  }

  // 4. Monta o Estado Inicial
  return {
    type: selectedType,
    isActive: false,
    revealedSpecials: [],
    stats: { ...definition.stats },
    extraData: { ...definition.initialExtraData },
    intelTerritoryIndices: Array.from(intelIndices),
  };
}

export const registerMatchHandlers = (io: Server, socket: Socket) => {
  // --- 1. LISTAR SALAS ABERTAS ---
  socket.on("match:list_open", async () => {
    try {
      const matches = await prisma.match.findMany({
        where: { status: "WAITING" },
        include: {
          players: { include: { user: true, kingdom: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const publicData = matches.map((m) => ({
        id: m.id,
        hostName: m.players[0]?.user.username || "Desconhecido",
        kingdomName: m.players[0]?.kingdom.name || "Reino Oculto",
        createdAt: m.createdAt,
      }));

      socket.emit("match:list_result", publicData);
    } catch (error) {
      socket.emit("error", { message: "Erro ao buscar partidas." });
    }
  });

  // --- 2. CRIAR SALA (HOST) ---
  // Gera Mapa, Crise e coloca em WAITING
  socket.on("match:create", async ({ userId, kingdomId }) => {
    try {
      console.log(
        `[MATCH] Criando sala para User ${userId} com Reino ${kingdomId}`
      );

      // Gera a Crise em memória
      const crisisStateObj = generateSecretCrisis();
      const crisisStateJson = JSON.stringify(crisisStateObj);

      // Transação: Cria Partida + Player 1 + Mapa
      const matchId = await prisma.$transaction(async (tx) => {
        // A. Cria a Partida WAITING
        const match = await tx.match.create({
          data: {
            status: "WAITING",
            currentRound: 1,
            crisisState: crisisStateJson,
          },
        });

        // B. Adiciona o Host (Player 1)
        await tx.matchPlayer.create({
          data: {
            matchId: match.id,
            userId: userId,
            kingdomId: kingdomId,
            resources: JSON.stringify({ gold: 10, mana: 5 }),
          },
        });

        // C. Gera o Mapa Procedural
        console.log("[MATCH] Gerando terreno procedural...");
        const mapGen = new MapGenerator(2000, 1600);
        const territories = mapGen.generate();

        // Ajuste técnico: Atualizar indices de intel da crise para garantir que caiam em terra
        // (Opcional: refinamento da lógica de crise poderia ser feito aqui)

        // D. Salva Territórios no Banco
        for (const t of territories) {
          const terrainKey =
            Object.keys(TERRAIN_TYPES).find(
              (key) => TERRAIN_TYPES[key].name === t.terrain.name
            ) || "PLAINS";

          await tx.territory.create({
            data: {
              matchId: match.id,
              mapIndex: t.id,
              centerX: t.center.x,
              centerY: t.center.y,
              type: t.type,
              terrainType: terrainKey,
              polygonData: JSON.stringify(t.polygonPoints),
              ownerId: null,
              isDisabled: false,
              // Verifica se este ID foi sorteado na crise
              hasCrisisIntel: crisisStateObj.intelTerritoryIndices.includes(
                t.id
              ),
            },
          });
        }

        return match.id;
      });

      // Entra na sala do socket e avisa sucesso
      socket.join(matchId);
      socket.emit("match:created_success", { matchId });
    } catch (error) {
      console.error(error);
      socket.emit("error", { message: "Falha ao criar partida." });
    }
  });

  // --- 3. ENTRAR NA SALA (GUEST) ---
  // Muda status para ACTIVE e Inicia o jogo
  socket.on("match:join", async ({ matchId, userId, kingdomId }) => {
    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: { players: true },
      });

      if (!match)
        return socket.emit("error", { message: "Partida não encontrada." });
      if (match.status !== "WAITING")
        return socket.emit("error", {
          message: "Partida já começou ou terminou.",
        });
      if (match.players.length >= 2)
        return socket.emit("error", { message: "Sala cheia." });

      // Adiciona o Player 2 e Ativa a partida
      await prisma.$transaction([
        prisma.matchPlayer.create({
          data: {
            matchId,
            userId,
            kingdomId,
            resources: JSON.stringify({ gold: 10, mana: 5 }),
          },
        }),
        prisma.match.update({
          where: { id: matchId },
          data: { status: "ACTIVE" },
        }),
      ]);

      socket.join(matchId);

      // AVISA TODOS (Host e Guest) que começou
      io.to(matchId).emit("match:started", { matchId });
      console.log(`[MATCH] Jogo iniciado: ${matchId}`);
    } catch (error) {
      console.error(error);
      socket.emit("error", { message: "Erro ao entrar na partida." });
    }
  });

  // --- 4. DADOS ESTÁTICOS ---
  socket.on("game:get_terrains", () => {
    console.log(
      "[DEBUG] Cliente pediu terrenos. Enviando:",
      Object.keys(TERRAIN_TYPES)
    );

    if (Object.keys(TERRAIN_TYPES).length === 0) {
      console.error("[ERRO CRÍTICO] TERRAIN_TYPES está vazio no servidor!");
    }

    socket.emit("game:terrains_data", TERRAIN_TYPES);
  });

  // --- 5. CARREGAR MAPA ---
  socket.on("match:request_map", async () => {
    try {
      // TODO: Em produção, o cliente deve enviar o { matchId } aqui.
      // Por enquanto, pegamos a última ativa para facilitar o teste.
      const activeMatch = await prisma.match.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      });

      if (!activeMatch) {
        return socket.emit("error", {
          message: "Nenhuma partida ativa encontrada.",
        });
      }

      const territories = await prisma.territory.findMany({
        where: { matchId: activeMatch.id },
        orderBy: { mapIndex: "asc" },
      });

      console.log(`[MATCH] Enviando mapa da partida ${activeMatch.id}`);
      socket.emit("match:map_data", territories);
    } catch (error) {
      console.error("[MATCH] Erro ao carregar mapa:", error);
      socket.emit("error", { message: "Erro interno ao carregar o mapa." });
    }
  });
};
