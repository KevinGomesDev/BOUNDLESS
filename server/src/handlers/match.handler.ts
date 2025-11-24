// src/handlers/match.handler.ts
import { Socket, Server } from "socket.io";
import { prisma } from "../lib/prisma";
import { StartMatchData, CrisisState, CrisisType } from "../types";
import { CRISIS_DEFINITIONS } from "../data/crises";

const MAP_SIZE = 25;

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
    intelIndices.add(Math.floor(Math.random() * MAP_SIZE));
  }

  // 4. Monta o Estado Inicial
  return {
    type: selectedType,
    isActive: false,
    revealedSpecials: [],

    // Clona os objetos para não modificar a definição original por referência
    stats: { ...definition.stats },
    extraData: { ...definition.initialExtraData },

    intelTerritoryIndices: Array.from(intelIndices),
  };
}

// --- O Handler Principal ---
export const registerMatchHandlers = (io: Server, socket: Socket) => {
  socket.on("match:start", async (data: StartMatchData) => {
    try {
      const { players } = data;

      if (!players || players.length < 1) {
        // Mude para < 2 se quiser forçar multiplayer
        return socket.emit("error", { message: "Jogadores insuficientes." });
      }

      console.log(
        "[MATCH] Iniciando partida para:",
        players.map((p) => p.userId)
      );

      // Gera a Crise (Memória RAM -> Vai virar JSON)
      const crisisStateObj = generateSecretCrisis();
      const crisisStateJson = JSON.stringify(crisisStateObj);

      // --- TRANSAÇÃO DO BANCO DE DADOS ---
      // O Prisma garante que tudo abaixo acontece ou nada acontece
      const newMatch = await prisma.$transaction(async (tx) => {
        // 1. Criar a Partida
        const match = await tx.match.create({
          data: {
            status: "ACTIVE",
            currentRound: 1,
            crisisState: crisisStateJson,
          },
        });

        // 2. Criar os Jogadores na Partida (MatchPlayer)
        // Aqui configuramos os recursos iniciais de cada um
        for (const player of players) {
          await tx.matchPlayer.create({
            data: {
              matchId: match.id,
              userId: player.userId,
              kingdomId: player.kingdomId,
              resources: JSON.stringify({ gold: 10, mana: 5, food: 10 }), // Exemplo de recursos iniciais
              unitCount: 0,
              buildingCount: 0,
            },
          });
        }

        // 3. Gerar o Mapa (100 Territórios)
        // Precisamos verificar quais territórios têm "Intel" da crise
        for (let i = 0; i < MAP_SIZE; i++) {
          const hasIntel = crisisStateObj.intelTerritoryIndices.includes(i);

          await tx.territory.create({
            data: {
              matchId: match.id,
              mapIndex: i,
              hasCrisisIntel: hasIntel, // Se true, quem conquistar ganha info
              ownerId: null, // Começa neutro (Territórios dos jogadores são setados depois ou eles começam sem nada e implantam)
              isDisabled: false,
            },
          });
        }

        return match;
      });

      console.log(
        `[MATCH] Partida criada ID: ${newMatch.id} | Crise: ${crisisStateObj.type}`
      );

      // Avisa a todos (Broadcasting) que o jogo começou
      // Nota: Não enviamos 'crisisState' completo para não dar spoiler!
      io.emit("match:started", {
        matchId: newMatch.id,
        round: newMatch.currentRound,
        message: "A guerra começou! Preparem seus exércitos.",
      });
    } catch (error) {
      console.error("[MATCH] Erro ao iniciar:", error);
      socket.emit("error", { message: "Falha fatal ao criar a partida." });
    }
  });
};
