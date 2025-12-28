// src/handlers/match.handler.ts
import { Socket, Server } from "socket.io";
import { prisma } from "../lib/prisma";
import { CrisisState, CrisisType } from "../types";
import { CRISIS_DEFINITIONS } from "../data/crises";
import { TERRAIN_TYPES } from "../worldmap/data/terrains";
import { MapGenerator } from "../worldmap/generation/MapGenerator";
import {
  BUILDABLE_STRUCTURES,
  STRUCTURE_DEFINITIONS,
} from "../data/structures";

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

// Cores dos jogadores por índice
const PLAYER_COLORS = [
  "#e63946", // Vermelho (Player 1 - Host)
  "#457b9d", // Azul (Player 2)
  "#2a9d8f", // Verde (Player 3)
  "#f4a261", // Laranja (Player 4)
];

// Recursos iniciais para todos os jogadores (zerados, serão calculados ao iniciar)
const INITIAL_RESOURCES = {
  minerio: 0,
  suprimentos: 0,
  arcana: 0,
  experiencia: 0,
  devocao: 0,
};

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

        // B. Adiciona o Host (Player 1) com cor vermelha e recursos iniciais
        await tx.matchPlayer.create({
          data: {
            matchId: match.id,
            userId: userId,
            kingdomId: kingdomId,
            playerIndex: 0,
            playerColor: PLAYER_COLORS[0],
            isReady: false,
            resources: JSON.stringify(INITIAL_RESOURCES),
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
              size: t.size,
              areaSlots: t.areaSlots,
              usedSlots: 0,
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
  // Muda status para PREPARATION e atribui territórios iniciais
  socket.on("match:join", async ({ matchId, userId, kingdomId }) => {
    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: { players: true, territories: true },
      });

      if (!match)
        return socket.emit("error", { message: "Partida não encontrada." });
      if (match.status !== "WAITING")
        return socket.emit("error", {
          message: "Partida já começou ou terminou.",
        });
      if (match.players.length >= 2)
        return socket.emit("error", { message: "Sala cheia." });

      // Filtra territórios médios disponíveis para atribuir como capitais
      const mediumTerritories = match.territories.filter(
        (t) => t.type === "LAND" && t.size === "MEDIUM" && !t.ownerId
      );

      if (mediumTerritories.length < 2) {
        return socket.emit("error", {
          message: "Mapa não tem territórios suficientes.",
        });
      }

      // Embaralha e pega 2 territórios aleatórios para as capitais
      const shuffled = mediumTerritories.sort(() => Math.random() - 0.5);
      const hostCapital = shuffled[0];
      const guestCapital = shuffled[1];

      const hostPlayer = match.players[0];

      await prisma.$transaction([
        // Adiciona o Player 2 (Guest)
        prisma.matchPlayer.create({
          data: {
            matchId,
            userId,
            kingdomId,
            playerIndex: 1,
            playerColor: PLAYER_COLORS[1],
            isReady: false,
            capitalTerritoryId: guestCapital.id,
            resources: JSON.stringify(INITIAL_RESOURCES),
          },
        }),

        // Atualiza Host com sua capital
        prisma.matchPlayer.update({
          where: { id: hostPlayer.id },
          data: { capitalTerritoryId: hostCapital.id },
        }),

        // Marca território do Host como ocupado e capital
        prisma.territory.update({
          where: { id: hostCapital.id },
          data: {
            ownerId: hostPlayer.id,
            isCapital: true,
          },
        }),

        // Marca território do Guest como ocupado e capital
        prisma.territory.update({
          where: { id: guestCapital.id },
          data: {
            ownerId: null, // Será atualizado depois que criarmos o guest
            isCapital: true,
          },
        }),

        // Muda status para PREPARATION
        prisma.match.update({
          where: { id: matchId },
          data: { status: "PREPARATION" },
        }),
      ]);

      // Atualiza o ownerId do território do guest (precisamos do ID do guest criado)
      const guestPlayer = await prisma.matchPlayer.findFirst({
        where: { matchId, userId },
      });

      if (guestPlayer) {
        await prisma.territory.update({
          where: { id: guestCapital.id },
          data: { ownerId: guestPlayer.id },
        });
      }

      socket.join(matchId);

      // AVISA TODOS que a fase de preparação começou
      io.to(matchId).emit("match:preparation_started", {
        matchId,
        hostCapitalId: hostCapital.mapIndex,
        guestCapitalId: guestCapital.mapIndex,
      });

      console.log(`[MATCH] Fase de preparação iniciada: ${matchId}`);
    } catch (error) {
      console.error(error);
      socket.emit("error", { message: "Erro ao entrar na partida." });
    }
  });

  // --- 4. DADOS ESTÁTICOS ---
  socket.on("game:get_terrains", () => {
    if (Object.keys(TERRAIN_TYPES).length === 0) {
      console.error("[ERRO CRÍTICO] TERRAIN_TYPES está vazio no servidor!");
    }
    socket.emit("game:terrains_data", TERRAIN_TYPES);
  });

  // --- 5. CARREGAR MAPA ---
  // Atualizado para funcionar em PREPARATION ou ACTIVE
  socket.on("match:request_map", async ({ matchId } = {}) => {
    try {
      let match;

      if (matchId) {
        match = await prisma.match.findUnique({ where: { id: matchId } });
      } else {
        // Fallback: busca partida em preparação ou ativa
        match = await prisma.match.findFirst({
          where: { status: { in: ["PREPARATION", "ACTIVE"] } },
          orderBy: { createdAt: "desc" },
        });
      }

      if (!match) {
        return socket.emit("error", {
          message: "Nenhuma partida encontrada.",
        });
      }

      const territories = await prisma.territory.findMany({
        where: { matchId: match.id },
        orderBy: { mapIndex: "asc" },
      });

      // Inclui dados dos jogadores para cores e brasões
      const players = await prisma.matchPlayer.findMany({
        where: { matchId: match.id },
        include: { kingdom: true },
      });

      console.log(`[MATCH] Enviando mapa da partida ${match.id}`);
      socket.emit("match:map_data", {
        territories,
        players: players.map((p) => ({
          id: p.id,
          playerIndex: p.playerIndex,
          playerColor: p.playerColor,
          kingdomName: p.kingdom.name,
          capitalTerritoryId: p.capitalTerritoryId,
          isReady: p.isReady,
        })),
        status: match.status,
      });
    } catch (error) {
      console.error("[MATCH] Erro ao carregar mapa:", error);
      socket.emit("error", { message: "Erro interno ao carregar o mapa." });
    }
  });

  // --- 6. JOGADOR PRONTO (Fase de Preparação) ---
  socket.on("match:player_ready", async ({ matchId, userId }) => {
    try {
      // Atualiza o jogador como pronto
      await prisma.matchPlayer.updateMany({
        where: { matchId, userId },
        data: { isReady: true },
      });

      // Verifica se todos estão prontos
      const players = await prisma.matchPlayer.findMany({
        where: { matchId },
      });

      const allReady = players.every((p) => p.isReady);

      if (allReady) {
        // Muda para ACTIVE e inicia o jogo
        await prisma.match.update({
          where: { id: matchId },
          data: {
            status: "ACTIVE",
            currentRound: 1,
            currentTurn: "ADMINISTRACAO",
          },
        });

        // Importar e inicializar recursos de todos os jogadores
        const { restoreAllPlayersResources } = await import(
          "../utils/turn.utils"
        );
        await restoreAllPlayersResources(matchId);

        io.to(matchId).emit("match:started", {
          matchId,
          round: 1,
          turn: "ADMINISTRACAO",
        });

        // Emitir evento de início do turno de administração
        io.to(matchId).emit("turn:administration_started", {
          round: 1,
          turn: "ADMINISTRACAO",
          message: "Rodada 1 - Turno de Administração iniciado!",
        });

        console.log(`[MATCH] Jogo iniciado: ${matchId}`);
      } else {
        // Avisa que um jogador ficou pronto
        io.to(matchId).emit("match:player_ready_update", {
          userId,
          allReady: false,
        });
      }
    } catch (error) {
      console.error("[MATCH] Erro ao marcar pronto:", error);
      socket.emit("error", { message: "Erro ao marcar como pronto." });
    }
  });

  // --- 7. BUSCAR DADOS DA FASE DE PREPARAÇÃO ---
  socket.on("match:get_preparation_data", async ({ matchId, userId }) => {
    try {
      const player = await prisma.matchPlayer.findFirst({
        where: { matchId, userId },
        include: { kingdom: true },
      });

      if (!player) {
        return socket.emit("error", { message: "Jogador não encontrado." });
      }

      const capital = player.capitalTerritoryId
        ? await prisma.territory.findUnique({
            where: { id: player.capitalTerritoryId },
          })
        : null;

      socket.emit("match:preparation_data", {
        playerId: player.id,
        playerIndex: player.playerIndex,
        playerColor: player.playerColor,
        kingdomName: player.kingdom.name,
        capital: capital,
        isReady: player.isReady,
        freeBuildingsRemaining: 3, // TODO: calcular baseado nas construções já posicionadas
      });
    } catch (error) {
      console.error("[MATCH] Erro ao buscar dados de preparação:", error);
      socket.emit("error", { message: "Erro ao buscar dados." });
    }
  });

  // --- 8. BUSCAR LISTA DE ESTRUTURAS DISPONÍVEIS ---
  socket.on("game:get_structures", async (data: any, callback?: Function) => {
    try {
      // Envia apenas estruturas construíveis (sem CITADEL)
      const structures = BUILDABLE_STRUCTURES.map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        color: s.color,
        maxHp: s.maxHp,
        resourceGenerated: s.resourceGenerated,
        specialEffect: s.specialEffect,
      }));

      // Suporta callback e evento
      if (callback && typeof callback === "function") {
        callback({ success: true, structures });
      } else {
        socket.emit("game:structures_data", structures);
      }
    } catch (error) {
      console.error("[MATCH] Erro ao buscar estruturas:", error);
      if (callback && typeof callback === "function") {
        callback({ success: false, error: "Erro ao buscar estruturas." });
      } else {
        socket.emit("error", { message: "Erro ao buscar estruturas." });
      }
    }
  });

  // --- 9. BUSCAR DEFINIÇÃO DE UMA ESTRUTURA ---
  socket.on("game:get_structure", async ({ structureId }) => {
    try {
      const structure = STRUCTURE_DEFINITIONS[structureId];
      if (structure) {
        socket.emit("game:structure_data", structure);
      } else {
        socket.emit("error", { message: "Estrutura não encontrada." });
      }
    } catch (error) {
      socket.emit("error", { message: "Erro ao buscar estrutura." });
    }
  });
};
