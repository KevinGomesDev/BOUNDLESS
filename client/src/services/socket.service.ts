import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private listeners: Map<string, Set<Function>> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private lastPongTime: number = Date.now();
  private readonly HEARTBEAT_INTERVAL = 5000; // 5 segundos
  private readonly PING_INTERVAL = 15000; // 15 segundos
  private readonly PING_TIMEOUT = 30000; // 30 segundos sem resposta = reconectar

  /**
   * Retorna informações de debug do socket
   */
  getDebugInfo(): {
    id: string | null;
    connected: boolean;
    listenersCount: number;
  } {
    return {
      id: this.socket?.id || null,
      connected: this.socket?.connected || false,
      listenersCount: this.listeners.size,
    };
  }

  /**
   * Conecta ao servidor de socket
   */
  connect(url: string = "http://localhost:3000"): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        console.log(
          "[Socket] ⚠️ Já está conectado, reutilizando socket:",
          this.socket.id
        );
        resolve();
        return;
      }

      console.log("[Socket] 🔌 Iniciando conexão com:", url);

      this.socket = io(url, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
        transports: ["websocket", "polling"],
      });

      this.socket.on("connect", () => {
        console.log(
          "%c[Socket] ✅ CONECTADO",
          "color: #22c55e; font-weight: bold; font-size: 14px;",
          "\n🆔 Socket ID:",
          this.socket?.id
        );
        this.reconnectAttempts = 0;
        this.lastPongTime = Date.now();
        this.startHeartbeat();
        this.startPing();
        resolve();
      });

      this.socket.on("disconnect", (reason) => {
        console.log(
          "%c[Socket] ❌ DESCONECTADO",
          "color: #ef4444; font-weight: bold;",
          "\n📝 Motivo:",
          reason
        );
        this.stopHeartbeat();
        this.stopPing();
      });

      this.socket.on("error", (error) => {
        console.error("[Socket] 💥 Erro:", error);
        reject(error);
      });

      this.socket.on("connect_error", (error) => {
        this.reconnectAttempts++;
        console.warn(
          `[Socket] ⚠️ Erro de conexão (${this.reconnectAttempts}/${this.maxReconnectAttempts}):`,
          error.message
        );
      });
    });
  }

  /**
   * Desconecta do servidor
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.stopPing();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Emite um evento para o servidor
   */
  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      console.warn(`[Socket] Tentativa de emitir '${event}' sem conexão`);
      return;
    }
    console.log(
      `%c[Socket] ⬆️ EMIT: ${event}`,
      "color: #22c55e; font-weight: bold;",
      "\n📦 Payload:",
      data
    );
    this.socket.emit(event, data);
  }

  /**
   * Emite um evento e aguarda resposta
   */
  emitAsync<T = any>(event: string, data?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error("Socket não está conectado"));
        return;
      }

      console.log(
        `%c[Socket] ⬆️ EMIT (async): ${event}`,
        "color: #22c55e; font-weight: bold;",
        "\n📦 Payload:",
        data
      );

      this.socket.emit(event, data, (response: any) => {
        if (response?.error) {
          console.log(
            `%c[Socket] ❌ RESPONSE ERROR: ${event}`,
            "color: #ef4444; font-weight: bold;",
            "\n📦 Error:",
            response.error
          );
          reject(new Error(response.error));
        } else {
          console.log(
            `%c[Socket] ✅ RESPONSE: ${event}`,
            "color: #3b82f6; font-weight: bold;",
            "\n📦 Data:",
            response
          );
          resolve(response);
        }
      });
    });
  }

  /**
   * Escuta um evento do servidor
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());

      // Registra o listener no socket
      if (this.socket) {
        this.socket.on(event, (data: any) => {
          console.log(
            `%c[Socket] ⬇️ RECEIVE: ${event}`,
            "color: #a855f7; font-weight: bold;",
            "\n📦 Data:",
            data
          );
          const callbacks = this.listeners.get(event);
          if (callbacks) {
            callbacks.forEach((cb) => cb(data));
          }
        });
      }
    }

    const callbacks = this.listeners.get(event)!;
    callbacks.add(callback);
  }

  /**
   * Remove o listener de um evento
   */
  off(event: string, callback?: Function): void {
    const callbacks = this.listeners.get(event);

    if (!callback) {
      // Remove todos os callbacks do evento
      this.listeners.delete(event);
      this.socket?.off(event);
      return;
    }

    if (callbacks) {
      callbacks.delete(callback);
      // Se não há mais callbacks, limpa completamente
      if (callbacks.size === 0) {
        this.listeners.delete(event);
        this.socket?.off(event);
      }
    }
  }

  /**
   * Escuta um evento apenas uma vez
   */
  once(event: string, callback: Function): void {
    const wrappedCallback = (data: any) => {
      callback(data);
      this.off(event, wrappedCallback);
    };
    this.on(event, wrappedCallback);
  }

  /**
   * Inicia o heartbeat periódico
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.emit("heartbeat", { timestamp: Date.now() });
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Para o heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Inicia o sistema de ping/pong
   */
  private startPing(): void {
    this.stopPing();

    // Listener para pong do servidor
    if (this.socket) {
      this.socket.on("pong", () => {
        this.lastPongTime = Date.now();
        console.log("[Socket] 🏓 Pong recebido");
      });
    }

    // Envia ping periodicamente
    this.pingInterval = setInterval(() => {
      const timeSinceLastPong = Date.now() - this.lastPongTime;

      if (timeSinceLastPong > this.PING_TIMEOUT) {
        console.warn(
          `[Socket] ⚠️ Sem resposta há ${Math.round(
            timeSinceLastPong / 1000
          )}s. Forçando reconexão...`
        );
        this.forceReconnect();
        return;
      }

      if (this.socket?.connected) {
        console.log("[Socket] 🏓 Enviando ping...");
        this.socket.emit("ping");
      }
    }, this.PING_INTERVAL);
  }

  /**
   * Para o sistema de ping
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.socket) {
      this.socket.off("pong");
    }
  }

  /**
   * Força uma reconexão manual
   */
  private forceReconnect(): void {
    console.log("[Socket] 🔄 Forçando reconexão...");
    this.stopHeartbeat();
    this.stopPing();

    if (this.socket) {
      this.socket.disconnect();
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, 1000);
    }
  }

  /**
   * Retorna a instância do socket (para casos especiais)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton
export const socketService = new SocketService();
