import React from "react";
import { useConnection } from "../core";

/**
 * Overlay que mostra quando está reconectando ao servidor
 */
export const ReconnectingOverlay: React.FC = () => {
  const { isReconnecting, reconnectAttempt, error } = useConnection();

  if (!isReconnecting && !error) {
    return null;
  }

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-slate-800 rounded-2xl border-2 border-purple-500/50 p-8 max-w-md w-full mx-4 shadow-2xl">
        {error && reconnectAttempt > 10 ? (
          // Falha após muitas tentativas
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">
              Falha na Reconexão
            </h2>
            <p className="text-slate-300 mb-6">
              Não conseguimos reconectar ao servidor após várias tentativas.
            </p>
            <button
              onClick={handleReload}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-lg transition-all duration-300 hover:scale-105"
            >
              Recarregar Página
            </button>
          </div>
        ) : (
          // Reconectando
          <div className="text-center">
            {/* Spinner */}
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <h2 className="text-2xl font-bold text-purple-300 mb-2">
              Reconectando...
            </h2>
            <p className="text-slate-400 mb-4">
              Sua conexão foi perdida. Tentando reconectar...
            </p>

            {reconnectAttempt > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-300">
                  Tentativa {reconnectAttempt}
                </span>
              </div>
            )}

            <div className="mt-6 text-xs text-slate-500">
              <p>Aguarde enquanto restabelecemos a conexão...</p>
              <p className="mt-1">Seu progresso foi salvo no servidor.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
