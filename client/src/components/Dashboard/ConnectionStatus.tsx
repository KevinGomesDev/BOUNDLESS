import React from "react";

interface ConnectionStatusProps {
  isConnected: boolean;
  error: string | null;
}

/**
 * Componente de Status - Estilo Cidadela de Pedra
 * Mostra se as muralhas estão protegidas
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  error,
}) => {
  return (
    <div className="space-y-3">
      {/* Indicador de Conexão */}
      <div className="flex items-center gap-3 p-3 bg-citadel-slate/50 rounded-lg border border-metal-iron/30">
        <div
          className={`relative w-4 h-4 rounded-full ${
            isConnected ? "bg-green-500" : "bg-war-crimson"
          }`}
        >
          {isConnected && (
            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-50"></div>
          )}
        </div>
        <div>
          <p
            className={`font-semibold text-sm ${
              isConnected ? "text-green-400" : "text-war-ember"
            }`}
          >
            {isConnected ? "Muralhas Seguras" : "Fortaleza Vulnerável"}
          </p>
          <p className="text-parchment-dark text-xs">
            {isConnected ? "Conexão estabelecida" : "Reconectando..."}
          </p>
        </div>
      </div>

      {/* Erro se houver */}
      {error && (
        <div className="p-3 bg-war-blood/20 border border-war-crimson rounded-lg">
          <p className="text-war-ember text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </p>
        </div>
      )}
    </div>
  );
};
