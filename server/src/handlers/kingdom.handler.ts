// src/handlers/kingdom.handler.ts
import { Socket, Server } from "socket.io";
import { prisma } from "../lib/prisma";
import { CreateKingdomData } from "../types";
import { RACE_DEFINITIONS } from "../data/races";
import { ALIGNMENT_DEFINITIONS } from "../data/alignments";

const MAP_SIZE = 100;

export const registerKingdomHandlers = (io: Server, socket: Socket) => {
  socket.on("kingdom:create", async (data: CreateKingdomData) => {
    try {
      const {
        userId,
        name,
        capitalName,
        alignment,
        race,
        raceMetadata,
        crestUrl,
        capitalImageUrl,
      } = data;

      if (!userId) {
        console.error("[KINGDOM] Tentativa de criação sem User ID.");
        return socket.emit("error", {
          message: "Sessão inválida. Por favor, faça login novamente.",
        });
      }

      // Validações de Regra de Negócio
      if (race === "ELEMENTAL") {
        const elements = JSON.parse(raceMetadata || "[]");
        if (!Array.isArray(elements) || elements.length !== 2) {
          return socket.emit("error", {
            message: "Elementais precisam de 2 elementos.",
          });
        }
      }

      if (race === "INSETO" && !raceMetadata) {
        return socket.emit("error", {
          message: "Insetos precisam de um recurso bônus.",
        });
      }

      const randomLocation = Math.floor(Math.random() * MAP_SIZE) + 1;

      const newKingdom = await prisma.kingdom.create({
        data: {
          name,
          capitalName,
          alignment,
          race,
          raceMetadata,
          crestUrl,
          capitalImageUrl,
          locationIndex: randomLocation,
          ownerId: userId,
        },
      });

      console.log(
        `[KINGDOM] Reino criado: ${newKingdom.name} (${newKingdom.race})`
      );
      socket.emit("kingdom:created", newKingdom);
    } catch (error) {
      console.error("[KINGDOM] Erro:", error);
      socket.emit("error", {
        message: "Erro ao criar reino. Verifique os dados.",
      });
    }
  });

  socket.on("kingdom:list", async ({ userId }) => {
    try {
      const kingdoms = await prisma.kingdom.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          name: true,
          race: true,
          alignment: true,
          capitalName: true,
        },
      });

      socket.emit("kingdom:list_success", kingdoms);
    } catch (error) {
      console.error("Erro ao listar reinos:", error);
      socket.emit("error", { message: "Erro ao buscar seus reinos." });
    }
  });

  socket.on("kingdom:get_races", () => {
    socket.emit("kingdom:races_data", RACE_DEFINITIONS);
  });

  socket.on("kingdom:get_alignments", () => {
    socket.emit("kingdom:alignments_data", ALIGNMENT_DEFINITIONS);
  });
};
