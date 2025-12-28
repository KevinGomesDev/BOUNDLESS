import React from "react";

interface ConnectionStatusProps {
  isConnected: boolean;
  error: string | null;
}

/**
 * Componente que exibe o status de conexão com o servidor
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  error,
}) => {
  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-2xl border-2 border-blue-500/30 p-6 hover:border-blue-500/60 transition-all duration-300">
        <h3 className="text-lg sm:text-xl font-bold text-blue-300 mb-4 flex items-center gap-2">
          🌐 Status de Conexão
        </h3>
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          ></div>
          <span
            className={`font-semibold ${
              isConnected ? "text-green-400" : "text-red-400"
            }`}
          >
            {isConnected ? "✅ Conectado" : "❌ Desconectado"}
          </span>
        </div>
        {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
      </div>
    </div>
  );
};
