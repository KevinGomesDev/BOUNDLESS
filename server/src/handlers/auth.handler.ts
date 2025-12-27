// src/handlers/auth.handler.ts
import { Socket, Server } from "socket.io";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma"; // Importamos nossa conexão
import { LoginData, RegisterData } from "../types";

async function findActiveMatchId(userId: string): Promise<string | null> {
  const activePlayerEntry = await prisma.matchPlayer.findFirst({
    where: {
      userId: userId,
      match: { status: "ACTIVE" }, // Apenas partidas em andamento
    },
    select: { matchId: true },
  });
  return activePlayerEntry ? activePlayerEntry.matchId : null;
}

export const registerAuthHandlers = (io: Server, socket: Socket) => {
  socket.on("auth:register", async (data: RegisterData) => {
    try {
      const { username, email, password } = data;

      if (!username || !email || !password) {
        return socket.emit("error", { message: "Preencha todos os campos." });
      }

      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });

      if (existingUser) {
        return socket.emit("error", {
          message: "Usuário ou Email já existem.",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: { username, email, password: hashedPassword },
      });

      console.log(`[AUTH] Novo usuário: ${newUser.username}`);
      socket.emit("auth:success", {
        id: newUser.id,
        username: newUser.username,
      });
    } catch (error) {
      console.error("[AUTH] Erro:", error);
      socket.emit("error", { message: "Erro interno no servidor." });
    }
  });

  socket.on("auth:login", async (data: LoginData) => {
    try {
      const { username, password } = data;

      if (!username || !password) {
        return socket.emit("error", { message: "Informe usuário e senha." });
      }

      // 1. Busca o usuário
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        // Por segurança, mensagem genérica
        return socket.emit("error", { message: "Credenciais inválidas." });
      }

      // 2. Compara a senha hash
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return socket.emit("error", { message: "Credenciais inválidas." });
      }

      console.log(`[AUTH] Login bem-sucedido: ${user.username}`);

      // 3. Retorna sucesso
      socket.emit("auth:success", { id: user.id, username: user.username });
    } catch (error) {
      console.error("[AUTH] Erro Login:", error);
      socket.emit("error", { message: "Erro interno ao logar." });
    }
  });

  socket.on("auth:check_session", async ({ userId }) => {
    try {
      // Primeiro, verifica se o usuário existe no banco
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        // Usuário não existe mais no banco - sessão inválida
        console.log(`[AUTH] Sessão inválida: usuário ${userId} não encontrado`);
        return socket.emit("auth:session_invalid");
      }

      // Usuário existe, procura por partida ativa
      const activeMatchId = await findActiveMatchId(userId);
      socket.emit("auth:session_checked", { activeMatchId });
    } catch (error) {
      console.error("[AUTH] Erro ao verificar sessão:", error);
      // Se der erro, invalida a sessão por segurança
      socket.emit("auth:session_invalid");
    }
  });
};
