import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<Function>> = new Map();

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
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.socket.on("connect", () => {
        console.log("[Socket] Conectado ao servidor:", this.socket?.id);
        this.reconnectAttempts = 0;
        this.emit("socket:connected", { socketId: this.socket?.id });
        resolve();
      });

      this.socket.on("disconnect", () => {
        console.log("[Socket] Desconectado do servidor");
        this.emit("socket:disconnected", {});
      });

      this.socket.on("error", (error) => {
        console.error("[Socket] Erro:", error);
        this.emit("socket:error", { error });
        reject(error);
      });

      this.socket.on("connect_error", (error) => {
        this.reconnectAttempts++;
        console.warn(
          `[Socket] Erro de conexão (${this.reconnectAttempts}/${this.maxReconnectAttempts}):`,
          error
        );
      });
    });
  }

  /**
   * Desconecta do servidor
   */
  disconnect(): void {
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
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
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
   * Retorna a instância do socket (para casos especiais)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton
export const socketService = new SocketService();
