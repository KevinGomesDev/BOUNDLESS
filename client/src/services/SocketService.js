// src/services/SocketService.js
import { io } from "socket.io-client";

const URL = "http://localhost:3000"; // URL do seu Backend

class SocketService {
  constructor() {
    this.socket = null;
  }

  // Inicia a conexão
  connect() {
    if (this.socket) return; // Já conectado

    this.socket = io(URL);

    this.socket.on("connect", () => {
      console.log("🟢 Conectado ao Backend! ID:", this.socket.id);
    });

    this.socket.on("disconnect", () => {
      console.log("🔴 Desconectado do Backend.");
    });

    this.socket.on("error", (data) => {
      console.error("⚠ Erro do Server:", data);
    });
  }

  // Envia dados para o servidor (Ex: criar conta, mover tropa)
  emit(event, data) {
    if (!this.socket) {
      console.error("Socket não inicializado!");
      return;
    }
    this.socket.emit(event, data);
  }

  // Escuta eventos do servidor (Ex: partida começou, ataque recebido)
  on(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  // Para de escutar um evento (Útil quando muda de cena para não duplicar lógica)
  off(event) {
    if (!this.socket) return;
    this.socket.off(event);
  }

  once(event, callback) {
    if (!this.socket) return;
    this.socket.once(event, callback);
  }

  // Retorna o ID do socket (útil para debug)
  getId() {
    return this.socket ? this.socket.id : null;
  }
}

// Exporta uma instância ÚNICA (Singleton)
export default new SocketService();
