import React, { useEffect, useState } from "react";
import { useMatch } from "../hooks/useMatch";
import { useAuth } from "../../auth";
import { socketService } from "../../../services/socket.service";

interface MatchLobbyProps {
  matchId: string;
  onGameStart?: () => void;
  onLeave?: () => void;
}

export const MatchLobby: React.FC<MatchLobbyProps> = ({
  matchId,
  onGameStart,
  onLeave,
}) => {
  const {
    state: { user },
  } = useAuth();
  const {
    state: { preparationData, matchMapData, isLoading, error },
    getPreparationData,
    loadMatch,
    requestMapData,
    requestMatchState,
    setPlayerReady,
  } = useMatch();

  const [isReady, setIsReady] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Carregar dados ao montar
  useEffect(() => {
    const loadData = async () => {
      try {
        await getPreparationData(matchId);
      } catch (err) {
        console.error("Erro ao carregar dados do lobby:", err);
      }
    };

    loadData();
  }, [matchId, getPreparationData]);

  // Listener para quando o jogo começar
  useEffect(() => {
    const handleMatchStarted = () => {
      onGameStart?.();
    };

    socketService.on("match:started", handleMatchStarted);

    return () => {
      socketService.off("match:started", handleMatchStarted);
    };
  }, [onGameStart]);

  // Listeners para atualizações em tempo real
  useEffect(() => {
    const handlePreparationStarted = () => {
      // Atualiza dados e garante que o host também seja redirecionado ao mapa
      getPreparationData(matchId).catch(console.error);
      loadMatch(matchId).catch(console.error);
      requestMapData(matchId).catch(console.error);
      requestMatchState(matchId).catch(console.error);
    };

    const handlePlayerReadyUpdate = () => {
      getPreparationData(matchId).catch(console.error);
    };

    socketService.on("match:preparation_started", handlePreparationStarted);
    socketService.on("match:player_ready_update", handlePlayerReadyUpdate);

    return () => {
      socketService.off("match:preparation_started", handlePreparationStarted);
      socketService.off("match:player_ready_update", handlePlayerReadyUpdate);
    };
  }, [matchId, getPreparationData]);

  // Atualizar estado de pronto
  useEffect(() => {
    if (preparationData) {
      setIsReady(preparationData.isReady);
    }
  }, [preparationData]);

  const handleReady = async () => {
    setLocalError(null);
    try {
      await setPlayerReady(matchId);
      setIsReady(true);
    } catch (err: any) {
      setLocalError(err.message || "Erro ao marcar como pronto");
    }
  };

  const displayError = localError || error;

  const getPlayerStatusIcon = (isPlayerReady: boolean) => {
    return isPlayerReady ? "✅" : "⏳";
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho com botão sair */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-torch-glow rounded-full animate-pulse shadow-torch"></div>
          <span className="text-parchment-aged text-sm">
            Aguardando guerreiros...
          </span>
        </div>
        <button
          onClick={onLeave}
          className="px-4 py-2 bg-gradient-to-b from-war-crimson to-war-blood 
                     border-2 border-metal-iron rounded-lg
                     hover:from-war-ember hover:to-war-crimson
                     text-parchment-light font-semibold text-sm transition-all"
        >
          Abandonar
        </button>
      </div>

      {/* Erro */}
      {displayError && (
        <div className="p-3 bg-war-blood/20 border-2 border-war-crimson rounded-lg">
          <p className="text-war-ember text-sm flex items-center gap-2">
            <span>⚠️</span> {displayError}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !preparationData ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-3 border-war-crimson rounded-full animate-spin border-t-transparent"></div>
            <div
              className="absolute inset-2 border-2 border-torch-glow rounded-full animate-spin border-b-transparent"
              style={{ animationDirection: "reverse" }}
            ></div>
          </div>
          <p className="text-parchment-dark mt-4">Preparando acampamento...</p>
        </div>
      ) : (
        <>
          {/* Cards dos Jogadores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchMapData?.players.map((player) => {
              const isCurrentUser =
                player.id === user?.id ||
                player.playerIndex === preparationData?.playerIndex;

              const playerName =
                (player as any).username ||
                (player as any).name ||
                (player as any).userName ||
                (player as any).playerName ||
                (isCurrentUser && user?.username) ||
                "Guerreiro";

              return (
                <div
                  key={player.id}
                  className={`relative bg-gradient-to-b from-citadel-granite to-citadel-carved 
                              border-3 rounded-xl p-4 shadow-stone-raised
                              ${
                                isCurrentUser
                                  ? "border-metal-gold shadow-torch"
                                  : "border-metal-iron"
                              }`}
                >
                  {/* Rebites */}
                  <div className="absolute top-2 left-2 w-2 h-2 bg-metal-iron rounded-full"></div>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-metal-iron rounded-full"></div>

                  {/* Conteúdo */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-metal-iron shadow-stone-inset flex items-center justify-center"
                      style={{ backgroundColor: player.playerColor }}
                    >
                      <span className="text-lg">⚔️</span>
                    </div>
                    <div>
                      <p
                        className="text-parchment-light font-bold"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        {playerName}
                      </p>
                      <p className="text-parchment-dark text-xs">
                        {player.playerIndex === 0
                          ? "👑 Anfitrião"
                          : "⚔️ Desafiante"}
                      </p>
                    </div>
                    {isCurrentUser && (
                      <span className="ml-auto bg-metal-gold/20 text-metal-gold text-xs px-2 py-1 rounded border border-metal-gold/30">
                        Você
                      </span>
                    )}
                  </div>

                  <div className="text-parchment-aged text-sm mb-3">
                    Reino:{" "}
                    <span className="text-parchment-light">
                      {player.kingdomName}
                    </span>
                  </div>

                  {/* Status de Pronto */}
                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                      player.isReady
                        ? "bg-green-900/20 border-green-600/50 text-green-400"
                        : "bg-torch-dim/20 border-torch-warm/30 text-torch-warm"
                    }`}
                  >
                    <span>{getPlayerStatusIcon(player.isReady)}</span>
                    <span className="text-sm font-semibold">
                      {player.isReady ? "Pronto para Batalha" : "Preparando..."}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Aguardando oponente */}
            {matchMapData && matchMapData.players.length < 2 && (
              <div className="bg-citadel-slate/30 rounded-xl border-2 border-dashed border-metal-iron/50 p-6 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-3 animate-pulse">👤</div>
                  <p className="text-parchment-dark">Aguardando oponente...</p>
                  <p className="text-metal-steel text-xs mt-1">
                    O inimigo está a caminho
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status da Partida */}
          <div className="bg-citadel-slate/30 border-2 border-metal-iron/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  matchMapData?.status === "PREPARATION"
                    ? "bg-torch-glow animate-pulse"
                    : matchMapData?.status === "ACTIVE"
                    ? "bg-green-500"
                    : "bg-metal-steel"
                }`}
              ></div>
              <span className="text-parchment-aged text-sm">
                {matchMapData?.status === "WAITING" && "Reunindo tropas"}
                {matchMapData?.status === "PREPARATION" && "Fase de preparação"}
                {matchMapData?.status === "ACTIVE" && "Batalha em andamento"}
                {matchMapData?.status === "FINISHED" && "Batalha encerrada"}
              </span>
            </div>
          </div>

          {/* Info de Preparação */}
          {preparationData && (
            <div className="bg-metal-bronze/10 border-2 border-metal-bronze/50 rounded-lg p-4">
              <h3 className="text-metal-gold text-sm font-semibold mb-2 flex items-center gap-2">
                <span>🏗️</span> Fase de Preparação
              </h3>
              <div className="text-parchment-aged text-sm space-y-1">
                <p>
                  Construções gratuitas:{" "}
                  <span className="text-metal-gold font-bold">
                    {preparationData.freeBuildingsRemaining}
                  </span>
                </p>
                {preparationData.capital && (
                  <p>
                    Capital:{" "}
                    <span className="text-parchment-light">
                      {preparationData.capital.name}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Botão Pronto */}
          <button
            onClick={handleReady}
            disabled={isReady || isLoading}
            className={`group relative w-full px-6 py-4 rounded-lg transition-all 
                        flex items-center justify-center gap-2 border-3
                        ${
                          isReady
                            ? "bg-gradient-to-b from-green-700 to-green-800 border-green-600 cursor-not-allowed"
                            : "bg-gradient-to-b from-war-crimson to-war-blood border-metal-iron shadow-forge-glow hover:from-war-ember hover:to-war-crimson active:animate-stone-press"
                        }`}
          >
            {/* Rebites */}
            <div className="absolute top-1 left-1 w-2 h-2 bg-metal-iron rounded-full"></div>
            <div className="absolute top-1 right-1 w-2 h-2 bg-metal-iron rounded-full"></div>
            <div className="absolute bottom-1 left-1 w-2 h-2 bg-metal-iron rounded-full"></div>
            <div className="absolute bottom-1 right-1 w-2 h-2 bg-metal-iron rounded-full"></div>

            {isLoading ? (
              <span className="text-parchment-light font-bold flex items-center gap-2">
                <div className="animate-spin w-5 h-5 border-2 border-parchment-light border-t-transparent rounded-full"></div>
                Preparando...
              </span>
            ) : isReady ? (
              <span className="text-parchment-light font-bold flex items-center gap-2">
                ✅ Pronto para Batalha!
              </span>
            ) : (
              <span
                className="text-parchment-light font-bold tracking-wider"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                ⚔️ ESTOU PRONTO!
              </span>
            )}
          </button>

          {/* Dica */}
          <p className="text-parchment-dark/60 text-xs text-center">
            A batalha começará quando todos os guerreiros estiverem prontos
          </p>
        </>
      )}
    </div>
  );
};
