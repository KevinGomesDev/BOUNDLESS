// src/lib/auth/middleware.ts
import { Socket } from "socket.io";

/**
 * Tipo para handlers autenticados
 */
type AuthenticatedHandler<T = any> = (
  userId: string,
  data: T
) => Promise<any> | any;

/**
 * Helper para obter identificador do socket (IP ou socket.id)
 */
export function getSocketIdentifier(socket: Socket): string {
  return socket.handshake.address || socket.id;
}

/**
 * Middleware que protege handlers exigindo autenticação
 *
 * @example
 * socket.on("kingdom:create", requireAuth(socket, async (userId, data) => {
 *   // userId já está validado e disponível
 *   const kingdom = await createKingdom(userId, data);
 * }));
 */
export function requireAuth<T = any>(
  socket: Socket,
  handler: AuthenticatedHandler<T>
): (data?: T) => Promise<void> {
  return async (data?: T): Promise<void> => {
    const userId = socket.data.userId as string | undefined;

    if (!userId) {
      console.warn(
        `[AUTH] Acesso negado - Socket ${socket.id} não autenticado`
      );
      socket.emit("error", {
        message: "Sessão inválida. Por favor, faça login novamente.",
        code: "UNAUTHORIZED",
      });
      return;
    }

    try {
      await handler(userId, data as T);
    } catch (error: any) {
      console.error(`[AUTH] Erro no handler protegido:`, error);
      socket.emit("error", {
        message: error.message || "Erro interno no servidor",
        code: "INTERNAL_ERROR",
      });
    }
  };
}

/**
 * Verifica se o socket está autenticado (sem emitir erro)
 */
export function isAuthenticated(socket: Socket): boolean {
  return !!socket.data.userId;
}

/**
 * Obtém o userId do socket (pode ser undefined)
 */
export function getUserId(socket: Socket): string | undefined {
  return socket.data.userId;
}

/**
 * Obtém o userId do socket ou lança erro
 */
export function requireUserId(socket: Socket): string {
  const userId = socket.data.userId;
  if (!userId) {
    throw new Error("Usuário não autenticado");
  }
  return userId;
}
