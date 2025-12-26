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
io.on("connection", (socket: Socket) => {
  console.log("Jogador conectado:", socket.id);

  registerAuthHandlers(io, socket);
  registerKingdomHandlers(io, socket);
  registerMatchHandlers(io, socket);
  registerTroopHandlers(io, socket);
  registerWorldMapHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log("Jogador desconectou:", socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor Modular rodando na porta ${PORT}`);
});
