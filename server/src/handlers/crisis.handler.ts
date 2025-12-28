// src/handlers/crisis.handler.ts
import { Socket, Server } from "socket.io";
import { prisma } from "../lib/prisma";
import { TurnType, TributeDecision, TributeSubmission } from "../types";
import {
  calculateTributePileResult,
  processTributePile,
  initiateTributePile,
  validateTributeSubmission,
} from "../utils/crisis.utils";
import { spendResources } from "../utils/turn.utils";

interface TributeDecisionPayload {
  matchId: string;
  playerId: string;
  decision: TributeDecision;
  amount: number;
}

export const registerCrisisHandlers = (io: Server, socket: Socket) => {
  // --- INICIAR PILHA DE TRIBUTO ---
  socket.on("crisis:initiate_tribute_pile", async ({ matchId }) => {
    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        socket.emit("error", { message: "Partida não encontrada" });
        return;
      }

      if (match.currentTurn !== TurnType.CRISE) {
        socket.emit("error", {
          message: "Pilha de Tributo só funciona no Turno de Crise",
        });
        return;
      }

      const tributeInfo = await initiateTributePile(matchId);

      // Notifica todos os jogadores que a pilha começou
      io.to(matchId).emit("crisis:tribute_pile_started", {
        resourceType: tributeInfo.resourceType,
        crisisMeter: tributeInfo.crisisMeter,
        playersCount: tributeInfo.playersCount,
        message: `Pilha de Tributo iniciada! Recurso: ${tributeInfo.resourceType}. MC: ${tributeInfo.crisisMeter}`,
      });
    } catch (error) {
      console.error("[CRISIS] Erro ao iniciar pilha:", error);
      socket.emit("error", { message: "Erro ao iniciar pilha de tributo" });
    }
  });

  // --- SUBMETER DECISÃO DE TRIBUTO (Secretamente) ---
  socket.on(
    "crisis:submit_tribute_decision",
    async ({ matchId, playerId, decision, amount }: TributeDecisionPayload) => {
      try {
        const match = await prisma.match.findUnique({
          where: { id: matchId },
          include: { players: true },
        });

        if (!match) {
          socket.emit("error", { message: "Partida não encontrada" });
          return;
        }

        if (match.currentTurn !== TurnType.CRISE) {
          socket.emit("error", {
            message: "Decisão de tributo só funciona no Turno de Crise",
          });
          return;
        }

        // Obtém o recurso do tributo (armazenado no match)
        // Por simplicidade, usamos o mesmo que foi definido na inição
        const crisisState = JSON.parse(match.crisisState || "{}");
        const tributeResource = crisisState.tributeResourceType || "MINERIO";

        // Valida a decisão
        const validation = await validateTributeSubmission(
          playerId,
          decision,
          amount,
          tributeResource as any
        );

        if (!validation.valid) {
          socket.emit("error", { message: validation.reason });
          return;
        }

        // Se não é "não intervir", gasta os recursos
        if (decision !== TributeDecision.NAOINTERVIER) {
          try {
            const spendData: any = {};
            spendData[tributeResource.toLowerCase()] = amount;
            await spendResources(playerId, spendData);
          } catch (error) {
            socket.emit("error", { message: "Erro ao gastar recursos" });
            return;
          }
        }

        // Armazena a submissão no banco (JSON no Match)
        const submissions = crisisState.tributeSubmissions || [];
        submissions.push({
          playerId,
          decision,
          amount,
          resourceType: tributeResource,
          timestamp: new Date().toISOString(),
        });

        await prisma.match.update({
          where: { id: matchId },
          data: {
            crisisState: JSON.stringify({
              ...crisisState,
              tributeSubmissions: submissions,
            }),
          },
        });

        // Notifica o jogador que sua decisão foi registrada (secretamente)
        socket.emit("crisis:decision_submitted", {
          message: "Sua decisão foi registrada secretamente",
          decision,
          amount: decision === TributeDecision.NAOINTERVIER ? 0 : amount,
        });

        // Verifica se todos os jogadores decidiram
        if (submissions.length === match.players.length) {
          io.to(matchId).emit("crisis:all_decisions_submitted", {
            message: "Todos os jogadores decidiram! Calculando resultado...",
          });
        }
      } catch (error) {
        console.error("[CRISIS] Erro ao submeter decisão:", error);
        socket.emit("error", { message: "Erro ao submeter decisão" });
      }
    }
  );

  // --- RESOLVER PILHA DE TRIBUTO ---
  socket.on("crisis:resolve_tribute_pile", async ({ matchId }) => {
    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        socket.emit("error", { message: "Partida não encontrada" });
        return;
      }

      if (match.currentTurn !== TurnType.CRISE) {
        socket.emit("error", {
          message: "Resolução só funciona no Turno de Crise",
        });
        return;
      }

      // Obtém as submissões
      const crisisState = JSON.parse(match.crisisState || "{}");
      const submissions: TributeSubmission[] =
        crisisState.tributeSubmissions || [];

      if (submissions.length === 0) {
        socket.emit("error", { message: "Nenhuma decisão registrada" });
        return;
      }

      // Calcula o resultado
      const pileResult = calculateTributePileResult(submissions);

      // Processa o resultado
      const resolution = await processTributePile(
        matchId,
        match.crisisMeter,
        pileResult
      );

      // Notifica o resultado para todos
      io.to(matchId).emit("crisis:tribute_pile_resolved", {
        pileValue: pileResult.totalValue,
        previousMeter: match.crisisMeter,
        newMeter: resolution.newCrisisMeter,
        meterIncreased: resolution.meterIncreased,
        topContributor: pileResult.topContributor,
        topSaboteur: pileResult.topSaboteur,
        winner: resolution.winnerPlayerId,
        winnerMessage: resolution.message,
        crisisTriggered: resolution.crisisTriggered,
        details: {
          totalContributions: pileResult.contributionAmount,
          totalSabotages: pileResult.sabotageAmount,
          topContributionAmount: pileResult.topContributionAmount,
          topSabotageAmount: pileResult.topSabotageAmount,
        },
      });

      // Se crise foi acionada, emite evento especial
      if (resolution.crisisTriggered) {
        io.to(matchId).emit("crisis:activated", {
          message: "O Medidor de Crise atingiu 15! Uma CRISE foi acionada!",
          crisisMeter: resolution.newCrisisMeter,
        });
      }

      // Limpa as submissões para próxima rodada
      await prisma.match.update({
        where: { id: matchId },
        data: {
          crisisState: JSON.stringify({
            ...crisisState,
            tributeSubmissions: [],
          }),
        },
      });
    } catch (error) {
      console.error("[CRISIS] Erro ao resolver pilha:", error);
      socket.emit("error", { message: "Erro ao resolver pilha de tributo" });
    }
  });

  // --- OBTER STATUS DA PILHA DE TRIBUTO ---
  socket.on("crisis:get_status", async ({ matchId }) => {
    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        socket.emit("error", { message: "Partida não encontrada" });
        return;
      }

      const crisisState = JSON.parse(match.crisisState || "{}");
      const submissions: TributeSubmission[] =
        crisisState.tributeSubmissions || [];

      socket.emit("crisis:status", {
        crisisMeter: match.crisisMeter,
        decisionsSubmitted: submissions.length,
        tributeResource: crisisState.tributeResourceType,
      });
    } catch (error) {
      console.error("[CRISIS] Erro ao obter status:", error);
      socket.emit("error", { message: "Erro ao obter status" });
    }
  });
};
