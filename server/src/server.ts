// src/server.ts
import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { registerAuthHandlers } from "./handlers/auth.handler";
import { registerKingdomHandlers } from "./handlers/kingdom.handler";
import { registerMatchHandlers } from "./handlers/match.handler";
import { registerTroopHandlers } from "./handlers/troop.handler";
import { registerWorldMapHandlers } from "./worldmap/handlers/worldmap.handler";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.get("/", (req, res) => {
  res.send("Backend Battle Realm (Modular) Online!");
});

// --- Gerenciador de Conexões ---
// Contador para estatísticas (opcional, útil para debug)
let connectionCount = 0;

io.on("connection", (socket: Socket) => {
  connectionCount++;
  // Log mais discreto - só mostra contagem total
  console.log(
    `[SOCKET] Nova conexão (${connectionCount} ativos): ${socket.id}`
  );

  registerAuthHandlers(io, socket);
  registerKingdomHandlers(io, socket);
  registerMatchHandlers(io, socket);
  registerTroopHandlers(io, socket);
  registerWorldMapHandlers(io, socket);

  socket.on("disconnect", () => {
    connectionCount--;
    // Só loga desconexão se ainda houver interesse em debug
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
