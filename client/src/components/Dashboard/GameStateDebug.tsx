import React from "react";
import { useAuth } from "../../features/auth";
import { useKingdom } from "../../features/kingdom";
import { useMatch } from "../../features/match";
import { useConnection } from "../../core";

/**
 * Pergaminhos de Debug - Estilo Cidadela de Pedra
 * Exibe o estado completo do jogo em formato de tomo antigo
 */
export const GameStateDebug: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
  } = useAuth();
  const {
    kingdoms,
    currentKingdom,
    isLoading: isKingdomLoading,
    error: kingdomError,
  } = useKingdom();
  const {
    currentMatch,
    openMatches,
    isLoading: isMatchLoading,
    error: matchError,
  } = useMatch();
  const { isConnected, error: connectionError } = useConnection();

  const gameState = {
    connection: { isConnected, error: connectionError },
    auth: { user, isAuthenticated, isLoading: isAuthLoading, error: authError },
    kingdom: {
      kingdoms,
      currentKingdom,
      isLoading: isKingdomLoading,
      error: kingdomError,
    },
    match: {
      currentMatch,
      openMatches,
      isLoading: isMatchLoading,
      error: matchError,
    },
  };

  return (
    <div className="space-y-2">
      {/* Conteúdo do Pergaminho */}
      <div className="bg-citadel-obsidian rounded-lg border border-metal-iron/50 overflow-hidden">
        <div className="bg-gradient-to-r from-citadel-slate to-citadel-obsidian px-3 py-2 border-b border-metal-iron/30">
          <span className="text-parchment-dark text-xs tracking-wide">
            📜 Registros do Reino
          </span>
        </div>
        <div className="p-3 overflow-auto max-h-64">
          <pre className="text-xs text-metal-steel font-mono whitespace-pre-wrap break-words">
            {JSON.stringify(gameState, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
