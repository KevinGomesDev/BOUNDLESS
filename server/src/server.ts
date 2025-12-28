// src/server.ts
import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { registerAuthHandlers } from "./handlers/auth.handler";
import { registerKingdomHandlers } from "./handlers/kingdom.handler";
import { registerMatchHandlers } from "./handlers/match.handler";
import { registerWorldMapHandlers } from "./worldmap/handlers/worldmap.handler";
import { registerTurnHandlers } from "./handlers/turn.handler";
import { registerRegentHandlers } from "./handlers/regent.handler";
import { registerHeroHandlers } from "./handlers/hero.handler";
import { registerTroopHandlers } from "./handlers/troop.handler";
import { registerBattleHandlers } from "./handlers/battle.handler";
import { registerItemsHandlers } from "./handlers/items.handler";
import { registerSummonHandlers } from "./handlers/summon.handler";
import { registerMovementHandlers } from "./handlers/movement.handler";
import { registerCrisisHandlers } from "./handlers/crisis.handler";
import { registerSkillsHandlers } from "./handlers/skills.handler";
import { registerActionHandlers } from "./handlers/action.handler";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.get("/", (req, res) => {
  res.send("Backend Battle Realm (Modular) Online!");
});

let connectionCount = 0;

io.on("connection", (socket: Socket) => {
  connectionCount++;
  console.log(
    `[SOCKET] Nova conexão (${connectionCount} ativos): ${socket.id}`
  );

  registerAuthHandlers(io, socket);
  registerKingdomHandlers(io, socket);
  registerMatchHandlers(io, socket);
  registerWorldMapHandlers(io, socket);
  registerTurnHandlers(io, socket);
  registerRegentHandlers(io, socket);
  registerHeroHandlers(io, socket);
  registerTroopHandlers(io, socket);
  registerBattleHandlers(io, socket);
  registerItemsHandlers(io, socket);
  registerSummonHandlers(io, socket);
  registerMovementHandlers(io, socket);
  registerCrisisHandlers(io, socket);
  registerSkillsHandlers(io, socket);
  registerActionHandlers(io, socket);

  socket.on("disconnect", () => {
    connectionCount--;
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[SOCKET] Desconectou (${connectionCount} ativos): ${socket.id}`
      );
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor Modular rodando na porta ${PORT}`);
});
