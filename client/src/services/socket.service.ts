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
        resolve();
        return;
      }

      this.socket = io(url, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
        transports: ["websocket", "polling"],
      });

      this.socket.on("connect", () => {
        this.reconnectAttempts = 0;
        this.lastPongTime = Date.now();
        this.startHeartbeat();
        this.startPing();
        resolve();
      });

      this.socket.on("disconnect", (_reason) => {
        this.stopHeartbeat();
        this.stopPing();
      });

      this.socket.on("error", (error) => {
        reject(error);
      });

      this.socket.on("connect_error", (error) => {
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error);
        }
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
      return;
    }
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

      this.socket.emit(event, data, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
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

    // Reset lastPongTime when starting ping to avoid stale values
    this.lastPongTime = Date.now();

    // Listener para pong do servidor
    if (this.socket) {
      this.socket.on("pong", () => {
        this.lastPongTime = Date.now();
      });
    }

    // Envia primeiro ping imediatamente
    if (this.socket?.connected) {
      this.socket.emit("ping");
    }

    // Envia ping periodicamente
    this.pingInterval = setInterval(() => {
      const timeSinceLastPong = Date.now() - this.lastPongTime;

      if (timeSinceLastPong > this.PING_TIMEOUT) {
        console.warn("[Socket] Ping timeout detectado, forçando reconexão...", {
          timeSinceLastPong,
          timeout: this.PING_TIMEOUT,
        });
        this.forceReconnect();
        return;
      }

      if (this.socket?.connected) {
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

  /**
   * Emite um evento e aguarda resposta em eventos de sucesso/erro
   * Lida automaticamente com cleanup de listeners e timeout
   */
  waitForResponse<T>(
    emitEvent: string,
    emitData: any,
    successEvent: string,
    errorEvent: string,
    timeoutMs: number = 10000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout>;
      let isResolved = false;

      const cleanup = () => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeoutId);
        this.off(successEvent, successHandler);
        this.off(errorEvent, errorHandler);
      };

      const successHandler = (data: T) => {
        cleanup();
        resolve(data);
      };

      const errorHandler = (data: { message: string; code?: string }) => {
        cleanup();
        reject(new Error(data.message));
      };

      this.on(successEvent, successHandler);
      this.on(errorEvent, errorHandler);

      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error("Timeout na operação"));
      }, timeoutMs);

      this.emit(emitEvent, emitData);
    });
  }

  /**
   * Emite um evento e aguarda resposta em múltiplos eventos possíveis
   * Útil quando há vários eventos de resposta possíveis (ex: session:active | session:none)
   *
   * @param emitEvent - Evento a ser emitido
   * @param emitData - Dados do evento
   * @param responseEvents - Objeto com eventos e seus handlers de transformação
   * @param timeoutMs - Timeout em milissegundos (default: 10000)
   *
   * @example
   * const result = await socketService.waitForMultipleResponses(
   *   "session:check",
   *   { userId },
   *   {
   *     "session:active": (data) => ({ hasSession: true, session: data }),
   *     "session:none": () => ({ hasSession: false, session: null }),
   *   },
   *   5000
   * );
   */
  waitForMultipleResponses<T>(
    emitEvent: string,
    emitData: any,
    responseEvents: Record<string, (data: any) => T>,
    timeoutMs: number = 10000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout>;
      let isResolved = false;
      const handlers: Map<string, (data: any) => void> = new Map();

      const cleanup = () => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeoutId);
        handlers.forEach((handler, event) => {
          this.off(event, handler);
        });
        this.off("error", errorHandler);
      };

      const errorHandler = (data: { message: string; code?: string }) => {
        cleanup();
        reject(new Error(data.message));
      };

      // Registrar handlers para cada evento de resposta
      Object.entries(responseEvents).forEach(([event, transformer]) => {
        const handler = (data: any) => {
          cleanup();
          resolve(transformer(data));
        };
        handlers.set(event, handler);
        this.on(event, handler);
      });

      this.on("error", errorHandler);

      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error("Timeout na operação"));
      }, timeoutMs);

      this.emit(emitEvent, emitData);
    });
  }
}

// Singleton
export const socketService = new SocketService();
