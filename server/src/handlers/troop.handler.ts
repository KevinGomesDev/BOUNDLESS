// src/handlers/troop.handler.ts
import { Socket, Server } from "socket.io";
import { TroopService } from "../services/troop.service";
import { UnitStats } from "../types";

interface RecruitPayload {
  matchId: string;
  userId: string;
  troopType: string;
}

interface UpgradePayload {
  matchId: string;
  userId: string;
  troopType: string;
  points: Partial<UnitStats>; // Ex: { combat: 2 }
}

export const registerTroopHandlers = (io: Server, socket: Socket) => {
  // --- RECRUTAR ---
  socket.on("troop:recruit", async (data: RecruitPayload) => {
    try {
      const unit = await TroopService.recruitTroop(
        data.matchId,
        data.userId,
        data.troopType
      );

      // Avisa apenas o jogador que recrutou (privado)
      socket.emit("troop:recruited", { unit });

      // Avisa todos da sala que uma unidade apareceu no mapa
      io.emit("map:update_unit", { unit });
    } catch (error: any) {
      socket.emit("error", { message: error.message || "Erro ao recrutar." });
    }
  });

  // --- EVOLUIR ---
  socket.on("troop:upgrade", async (data: UpgradePayload) => {
    try {
      const result = await TroopService.upgradeTroop(
        data.matchId,
        data.userId,
        data.troopType,
        data.points
      );

      socket.emit("troop:upgraded", result);

      // Precisamos avisar o frontend para redesenhar as unidades desse tipo
      // pois os stats mudaram.
      io.emit("match:units_updated", {
        ownerId: data.userId,
        troopType: data.troopType,
        newStats: result.newStats,
      });
    } catch (error: any) {
      socket.emit("error", { message: error.message || "Erro ao evoluir." });
    }
  });
};
